import { Router } from 'express'
import * as aiController from '../controllers/ai.controller.js'
import { authenticate } from '../middleware/auth.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// All routes require authentication
router.use(authenticate)
router.use(aiLimiter)

router.post('/chat', asyncHandler(aiController.chat))
router.post('/chat/stream', asyncHandler(aiController.streamChat))
router.post('/explain', asyncHandler(aiController.explainCode))
router.post('/suggestions', asyncHandler(aiController.getSuggestions))

export default router
