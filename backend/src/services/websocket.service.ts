import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

const activeUsers = new Map<string, Set<string>>() // projectId -> Set<userId>

export function setupWebSocket(io: Server) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication error'))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string
      }
      socket.userId = decoded.userId
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`)

    // Join project room
    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`)

      // Add user to active users
      if (!activeUsers.has(projectId)) {
        activeUsers.set(projectId, new Set())
      }
      activeUsers.get(projectId)!.add(socket.userId!)

      // Notify others
      io.to(`project:${projectId}`).emit('user-joined', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      })

      // Send current active users
      socket.emit('active-users', Array.from(activeUsers.get(projectId)!))
    })

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`)

      // Remove user from active users
      activeUsers.get(projectId)?.delete(socket.userId!)

      // Notify others
      io.to(`project:${projectId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      })
    })

    // Cursor position updates
    socket.on('cursor-update', (data: {
      projectId: string
      filePath: string
      line: number
      column: number
    }) => {
      socket.to(`project:${data.projectId}`).emit('cursor-moved', {
        userId: socket.userId,
        ...data,
      })
    })

    // File selection updates
    socket.on('file-select', (data: {
      projectId: string
      filePath: string
    }) => {
      socket.to(`project:${data.projectId}`).emit('file-selected', {
        userId: socket.userId,
        ...data,
      })
    })

    // Comment added
    socket.on('comment-added', (data: {
      projectId: string
      comment: any
    }) => {
      io.to(`project:${data.projectId}`).emit('new-comment', data.comment)
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)

      // Remove from all project rooms
      activeUsers.forEach((users, projectId) => {
        if (users.has(socket.userId!)) {
          users.delete(socket.userId!)

          io.to(`project:${projectId}`).emit('user-left', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
          })
        }
      })
    })
  })

  console.log('✅ WebSocket server initialized')
}
