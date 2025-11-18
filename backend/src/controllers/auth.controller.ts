import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = registerSchema.parse(req.body)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new AppError(400, 'User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  })

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  res.status(201).json({ user, token })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.password) {
    throw new AppError(401, 'Invalid credentials')
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid credentials')
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  })
}

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      githubId: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  res.json(user)
}

export const githubCallback = async (req: Request, res: Response) => {
  const { code } = req.body

  if (!code) {
    throw new AppError(400, 'GitHub code is required')
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new AppError(400, 'Failed to get GitHub access token')
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const githubUser = await userResponse.json()

    // Get user email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const emails = await emailResponse.json()
    const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { githubId: githubUser.id.toString() },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id.toString(),
          avatar: githubUser.avatar_url,
        },
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        githubId: user.githubId,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    throw new AppError(500, 'GitHub authentication failed')
  }
}
