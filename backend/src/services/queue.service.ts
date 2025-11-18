import Queue from 'bull'
import Redis from 'ioredis'
import { prisma } from '../utils/prisma.js'
import { GitService } from './git.service.js'
import { AnalysisService } from './analysis.service.js'
import { AIService } from './ai.service.js'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis client for Bull
const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
})

// Create analysis queue
export const analysisQueue = new Queue('analysis', {
  redis: redisUrl,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
})

export interface AnalysisJob {
  projectId: string
  localPath: string
}

export async function setupJobQueue() {
  const gitService = new GitService()
  const analysisService = new AnalysisService()
  const aiService = new AIService()

  // Process analysis jobs
  analysisQueue.process(async (job) => {
    const { projectId, localPath } = job.data as AnalysisJob

    console.log(`Starting analysis for project ${projectId}`)

    try {
      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ANALYZING' },
      })

      // Get all code files
      const codeFiles = await gitService.getAllCodeFiles(localPath)
      console.log(`Found ${codeFiles.length} code files`)

      // Analyze each file
      const results = []
      for (const filePath of codeFiles) {
        const relativePath = filePath.replace(localPath + '/', '')
        const language = gitService['getLanguageFromPath'](filePath)

        console.log(`Analyzing ${relativePath}`)

        // Read file content
        const content = await gitService.getFileContent(filePath)

        // Run static analysis
        const { issues, metrics } = await analysisService.analyzeFile(
          filePath,
          language
        )

        // Generate AI suggestions (only for important files)
        let suggestions = []
        if (issues.length > 0 || metrics.complexity > 10) {
          try {
            suggestions = await aiService.generateSuggestions(
              filePath,
              content,
              language
            )
          } catch (error) {
            console.error(`Failed to generate AI suggestions for ${relativePath}:`, error)
          }
        }

        // Store analysis result
        const result = await prisma.analysisResult.create({
          data: {
            projectId,
            filePath: relativePath,
            language,
            issues: JSON.stringify(issues),
            suggestions: JSON.stringify(suggestions),
            metrics: JSON.stringify(metrics),
          },
        })

        results.push(result)

        // Update progress
        job.progress((results.length / codeFiles.length) * 100)
      }

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'COMPLETED',
          fileCount: codeFiles.length,
        },
      })

      console.log(`Completed analysis for project ${projectId}`)
      return { success: true, filesAnalyzed: codeFiles.length }
    } catch (error: any) {
      console.error(`Analysis failed for project ${projectId}:`, error)

      // Update project status to failed
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      })

      throw error
    }
  })

  // Event handlers
  analysisQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result)
  })

  analysisQueue.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error)
  })

  analysisQueue.on('progress', (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}%`)
  })

  console.log('✅ Job queue initialized')
}

export async function addAnalysisJob(projectId: string, localPath: string) {
  return await analysisQueue.add({ projectId, localPath })
}
