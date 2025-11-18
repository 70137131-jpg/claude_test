import api from './api'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authService = {
  // Login with email/password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  // GitHub OAuth
  githubLogin: async (code: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/github', { code })
    return response.data
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}
