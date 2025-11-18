import { Router } from 'express'
import * as reviewController from '../controllers/review.controller.js'
import { authenticate } from '../middleware/auth.js'
import { apiLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// All routes require authentication
router.use(authenticate)
router.use(apiLimiter)

router.post('/', asyncHandler(reviewController.createReview))
router.get('/', asyncHandler(reviewController.getReviews))
router.get('/:id', asyncHandler(reviewController.getReview))
router.post('/:id/comments', asyncHandler(reviewController.addComment))
router.patch('/:id/complete', asyncHandler(reviewController.completeReview))

export default router
