import { create } from 'zustand'
import { Project, AnalysisResult } from '@/types'

interface ProjectState {
  currentProject: Project | null
  selectedFile: string | null
  analysisResults: AnalysisResult[]
  setCurrentProject: (project: Project) => void
  setSelectedFile: (filePath: string | null) => void
  setAnalysisResults: (results: AnalysisResult[]) => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  selectedFile: null,
  analysisResults: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  setSelectedFile: (filePath) => set({ selectedFile: filePath }),
  setAnalysisResults: (results) => set({ analysisResults: results }),
  clearProject: () =>
    set({ currentProject: null, selectedFile: null, analysisResults: [] }),
}))
