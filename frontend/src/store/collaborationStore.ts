import { create } from 'zustand'
import { User } from '@/types'

interface ActiveUser extends User {
  cursor?: { line: number; column: number }
  selectedFile?: string
}

interface CollaborationState {
  activeUsers: ActiveUser[]
  isConnected: boolean
  setActiveUsers: (users: ActiveUser[]) => void
  addUser: (user: ActiveUser) => void
  removeUser: (userId: string) => void
  updateUserCursor: (userId: string, cursor: { line: number; column: number }) => void
  setConnected: (connected: boolean) => void
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  activeUsers: [],
  isConnected: false,
  setActiveUsers: (users) => set({ activeUsers: users }),
  addUser: (user) =>
    set((state) => ({ activeUsers: [...state.activeUsers, user] })),
  removeUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.id !== userId),
    })),
  updateUserCursor: (userId, cursor) =>
    set((state) => ({
      activeUsers: state.activeUsers.map((u) =>
        u.id === userId ? { ...u, cursor } : u
      ),
    })),
  setConnected: (connected) => set({ isConnected: connected }),
}))
