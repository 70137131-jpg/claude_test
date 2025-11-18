import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import projectRoutes from './routes/project.routes.js'
import aiRoutes from './routes/ai.routes.js'
import reviewRoutes from './routes/review.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupWebSocket } from './services/websocket.service.js'
import { setupJobQueue } from './services/queue.service.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/reviews', reviewRoutes)

// Error handling
app.use(errorHandler)

// Setup WebSocket
setupWebSocket(io)

// Setup job queue
setupJobQueue().catch(console.error)

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket server running`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})
