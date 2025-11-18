import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/register', authLimiter, asyncHandler(authController.register))
router.post('/login', authLimiter, asyncHandler(authController.login))
router.post('/github', authLimiter, asyncHandler(authController.githubCallback))
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser))

export default router
