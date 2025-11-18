export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  githubId?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  repositoryUrl?: string
  userId: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  fileCount?: number
  analysisResults?: AnalysisResult[]
}

export interface AnalysisResult {
  id: string
  projectId: string
  filePath: string
  language: string
  issues: CodeIssue[]
  suggestions: CodeSuggestion[]
  metrics: CodeMetrics
  createdAt: string
}

export interface CodeIssue {
  id: string
  type: 'bug' | 'security' | 'performance' | 'style' | 'complexity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  line: number
  column?: number
  endLine?: number
  endColumn?: number
  code?: string
}

export interface CodeSuggestion {
  id: string
  type: 'refactor' | 'optimization' | 'modernization' | 'cleanup'
  title: string
  description: string
  originalCode: string
  suggestedCode: string
  line: number
  endLine: number
  reasoning: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface CodeMetrics {
  linesOfCode: number
  complexity: number
  maintainabilityIndex: number
  technicalDebt: number
  dependencies: string[]
  duplicateCode: number
}

export interface Review {
  id: string
  projectId: string
  userId: string
  status: 'in_progress' | 'completed'
  comments: ReviewComment[]
  createdAt: string
  updatedAt: string
}

export interface ReviewComment {
  id: string
  reviewId: string
  userId: string
  filePath: string
  line: number
  content: string
  createdAt: string
  user?: User
}

export interface ChatMessage {
  id: string
  projectId: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface DependencyNode {
  id: string
  name: string
  version?: string
  dependencies: string[]
  size?: number
}

export interface FileTree {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: FileTree[]
  size?: number
  language?: string
}
