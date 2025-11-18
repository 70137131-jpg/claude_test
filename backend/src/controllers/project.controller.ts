import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { GitService } from '../services/git.service.js'
import { addAnalysisJob } from '../services/queue.service.js'
import { AppError } from '../middleware/errorHandler.js'
import path from 'path'
import AdmZip from 'adm-zip'
import { promises as fs } from 'fs'

const createFromGithubSchema = z.object({
  repoUrl: z.string().url(),
})

const gitService = new GitService()

export const getProjects = async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  })

  res.json(projects)
}

export const getProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  res.json(project)
}

export const createProjectFromGithub = async (req: AuthRequest, res: Response) => {
  const { repoUrl } = createFromGithubSchema.parse(req.body)

  // Extract project name from repo URL
  const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'project'

  // Create project record
  const project = await prisma.project.create({
    data: {
      name: repoName,
      repositoryUrl: repoUrl,
      userId: req.user!.id,
      status: 'PENDING',
    },
  })

  // Clone repository
  try {
    const localPath = await gitService.cloneRepository(repoUrl, project.id)

    // Update project with local path
    await prisma.project.update({
      where: { id: project.id },
      data: { localPath },
    })

    // Add to analysis queue
    await addAnalysisJob(project.id, localPath)

    res.status(201).json(project)
  } catch (error) {
    // Delete project if clone fails
    await prisma.project.delete({ where: { id: project.id } })
    throw error
  }
}

export const uploadProject = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No file uploaded')
  }

  const { name } = req.body

  if (!name) {
    throw new AppError(400, 'Project name is required')
  }

  // Create project record
  const project = await prisma.project.create({
    data: {
      name,
      userId: req.user!.id,
      status: 'PENDING',
    },
  })

  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const projectPath = path.join(uploadDir, project.id)

    // Extract ZIP file
    const zip = new AdmZip(req.file.buffer)
    zip.extractAllTo(projectPath, true)

    // Update project with local path
    await prisma.project.update({
      where: { id: project.id },
      data: { localPath: projectPath },
    })

    // Add to analysis queue
    await addAnalysisJob(project.id, projectPath)

    res.status(201).json(project)
  } catch (error) {
    // Delete project if extraction fails
    await prisma.project.delete({ where: { id: project.id } })
    throw error
  }
}

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  // Delete local files
  if (project.localPath) {
    await gitService.deleteProject(project.localPath)
  }

  // Delete from database (cascades to analysis results)
  await prisma.project.delete({ where: { id } })

  res.json({ message: 'Project deleted successfully' })
}

export const getAnalysisResults = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  const results = await prisma.analysisResult.findMany({
    where: { projectId: id },
    orderBy: { filePath: 'asc' },
  })

  // Parse JSON fields
  const parsedResults = results.map(result => ({
    ...result,
    issues: JSON.parse(result.issues as string),
    suggestions: JSON.parse(result.suggestions as string),
    metrics: JSON.parse(result.metrics as string),
  }))

  res.json(parsedResults)
}

export const getFileTree = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project || !project.localPath) {
    throw new AppError(404, 'Project not found')
  }

  const fileTree = await gitService.getFileTree(project.localPath)

  res.json(fileTree)
}

export const getFileContent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { path: filePath } = req.query

  if (!filePath || typeof filePath !== 'string') {
    throw new AppError(400, 'File path is required')
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project || !project.localPath) {
    throw new AppError(404, 'Project not found')
  }

  const fullPath = path.join(project.localPath, filePath)

  // Security check: ensure file is within project directory
  const resolvedPath = path.resolve(fullPath)
  const resolvedProjectPath = path.resolve(project.localPath)

  if (!resolvedPath.startsWith(resolvedProjectPath)) {
    throw new AppError(403, 'Access denied')
  }

  const content = await gitService.getFileContent(fullPath)

  res.json({ content })
}

export const triggerAnalysis = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!project || !project.localPath) {
    throw new AppError(404, 'Project not found')
  }

  // Add to analysis queue
  await addAnalysisJob(project.id, project.localPath)

  res.json({ message: 'Analysis started' })
}
