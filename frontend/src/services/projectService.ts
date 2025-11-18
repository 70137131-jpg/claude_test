import api from './api'
import { Project, AnalysisResult, FileTree } from '@/types'

export const projectService = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects')
    return response.data
  },

  // Get project by ID
  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  // Create project from GitHub URL
  createProjectFromGithub: async (repoUrl: string): Promise<Project> => {
    const response = await api.post('/projects/github', { repoUrl })
    return response.data
  },

  // Upload project as ZIP
  uploadProject: async (file: File, name: string): Promise<Project> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)

    const response = await api.post('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`)
  },

  // Get project analysis results
  getAnalysisResults: async (projectId: string): Promise<AnalysisResult[]> => {
    const response = await api.get(`/projects/${projectId}/analysis`)
    return response.data
  },

  // Get file tree
  getFileTree: async (projectId: string): Promise<FileTree> => {
    const response = await api.get(`/projects/${projectId}/files`)
    return response.data
  },

  // Get file content
  getFileContent: async (projectId: string, filePath: string): Promise<string> => {
    const response = await api.get(`/projects/${projectId}/files/content`, {
      params: { path: filePath },
    })
    return response.data.content
  },

  // Trigger analysis
  triggerAnalysis: async (projectId: string): Promise<void> => {
    await api.post(`/projects/${projectId}/analyze`)
  },
}
