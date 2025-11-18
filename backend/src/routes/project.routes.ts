import { Router } from 'express'
import multer from 'multer'
import * as projectController from '../controllers/project.controller.js'
import { authenticate } from '../middleware/auth.js'
import { apiLimiter } from '../middleware/rateLimit.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true)
    } else {
      cb(new Error('Only ZIP files are allowed'))
    }
  },
})

// All routes require authentication
router.use(authenticate)
router.use(apiLimiter)

// Project CRUD
router.get('/', asyncHandler(projectController.getProjects))
router.get('/:id', asyncHandler(projectController.getProject))
router.post('/github', asyncHandler(projectController.createProjectFromGithub))
router.post('/upload', upload.single('file'), asyncHandler(projectController.uploadProject))
router.delete('/:id', asyncHandler(projectController.deleteProject))

// Analysis
router.get('/:id/analysis', asyncHandler(projectController.getAnalysisResults))
router.post('/:id/analyze', asyncHandler(projectController.triggerAnalysis))

// Files
router.get('/:id/files', asyncHandler(projectController.getFileTree))
router.get('/:id/files/content', asyncHandler(projectController.getFileContent))

export default router
