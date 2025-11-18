import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'

const createReviewSchema = z.object({
  projectId: z.string(),
})

const createCommentSchema = z.object({
  filePath: z.string(),
  line: z.number(),
  content: z.string().min(1),
})

export const createReview = async (req: AuthRequest, res: Response) => {
  const { projectId } = createReviewSchema.parse(req.body)

  // Verify project ownership or access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: req.user!.id,
    },
  })

  if (!project) {
    throw new AppError(404, 'Project not found')
  }

  const review = await prisma.review.create({
    data: {
      projectId,
      userId: req.user!.id,
      status: 'IN_PROGRESS',
    },
  })

  res.status(201).json(review)
}

export const getReviews = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.query

  const where: any = {
    userId: req.user!.id,
  }

  if (projectId) {
    where.projectId = projectId
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      comments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(reviews)
}

export const getReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const review = await prisma.review.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
    include: {
      project: true,
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!review) {
    throw new AppError(404, 'Review not found')
  }

  res.json(review)
}

export const addComment = async (req: AuthRequest, res: Response) => {
  const { id: reviewId } = req.params
  const { filePath, line, content } = createCommentSchema.parse(req.body)

  // Verify review ownership
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId: req.user!.id,
    },
  })

  if (!review) {
    throw new AppError(404, 'Review not found')
  }

  const comment = await prisma.reviewComment.create({
    data: {
      reviewId,
      userId: req.user!.id,
      filePath,
      line,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  res.status(201).json(comment)
}

export const completeReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const review = await prisma.review.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!review) {
    throw new AppError(404, 'Review not found')
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: { status: 'COMPLETED' },
  })

  res.json(updatedReview)
}
