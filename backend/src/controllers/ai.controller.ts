import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { AIService } from '../services/ai.service.js'
import { GitService } from '../services/git.service.js'
import { AppError } from '../middleware/errorHandler.js'
import path from 'path'

const chatSchema = z.object({
  projectId: z.string(),
  message: z.string().min(1),
  context: z.string().optional(),
})

const explainSchema = z.object({
  code: z.string().min(1),
  language: z.string(),
})

const aiService = new AIService()
const gitService = new GitService()

export const chat = async (req: AuthRequest, res: Response) => {
  const { projectId, message, context } = chatSchema.parse(req.body)

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  // Get AI response
  const response = await aiService.chatCompletion(message, context)

  // Save chat message
  await prisma.chatMessage.create({
    data: {
      projectId,
      userId: req.user!.id,
      role: 'USER',
      content: message,
    },
  })

  await prisma.chatMessage.create({
    data: {
      projectId,
      userId: req.user!.id,
      role: 'ASSISTANT',
      content: response,
    },
  })

  res.json({
    role: 'assistant',
    content: response,
  })
}

export const streamChat = async (req: AuthRequest, res: Response) => {
  const { projectId, message, context } = chatSchema.parse(req.body)

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  let fullResponse = ''

  try {
    await aiService.streamChatCompletion(message, context, (chunk) => {
      fullResponse += chunk
      res.write(`data: ${chunk}\n\n`)
    })

    res.write('data: [DONE]\n\n')

    // Save chat messages
    await prisma.chatMessage.create({
      data: {
        projectId,
        userId: req.user!.id,
        role: 'USER',
        content: message,
      },
    })

    await prisma.chatMessage.create({
      data: {
        projectId,
        userId: req.user!.id,
        role: 'ASSISTANT',
        content: fullResponse,
      },
    })

    res.end()
  } catch (error) {
    res.write(`data: [ERROR]\n\n`)
    res.end()
  }
}

export const explainCode = async (req: AuthRequest, res: Response) => {
  const { code, language } = explainSchema.parse(req.body)

  const explanation = await aiService.explainCode(code, language)

  res.json({ explanation })
}

export const getSuggestions = async (req: AuthRequest, res: Response) => {
  const { projectId, filePath } = req.body

  if (!projectId || !filePath) {
    throw new AppError(400, 'Project ID and file path are required')
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: req.user!.id,
    },
  })

  if (!project || !project.localPath) {
    throw new AppError(404, 'Project not found')
  }

  const fullPath = path.join(project.localPath, filePath)

  // Security check
  const resolvedPath = path.resolve(fullPath)
  const resolvedProjectPath = path.resolve(project.localPath)

  if (!resolvedPath.startsWith(resolvedProjectPath)) {
    throw new AppError(403, 'Access denied')
  }

  // Get file content
  const content = await gitService.getFileContent(fullPath)
  const language = gitService['getLanguageFromPath'](fullPath)

  // Generate suggestions
  const suggestions = await aiService.generateSuggestions(
    fullPath,
    content,
    language
  )

  res.json(suggestions)
}
