import api from './api'
import { CodeSuggestion, ChatMessage } from '@/types'

export const aiService = {
  // Get AI suggestions for a file
  getSuggestions: async (
    projectId: string,
    filePath: string
  ): Promise<CodeSuggestion[]> => {
    const response = await api.post(`/ai/suggestions`, {
      projectId,
      filePath,
    })
    return response.data
  },

  // Chat with AI about code
  chat: async (
    projectId: string,
    message: string,
    context?: string
  ): Promise<ChatMessage> => {
    const response = await api.post(`/ai/chat`, {
      projectId,
      message,
      context,
    })
    return response.data
  },

  // Stream AI response
  streamChat: async (
    projectId: string,
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(`${api.defaults.baseURL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ projectId, message }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          onChunk(data)
        }
      }
    }
  },

  // Explain code
  explainCode: async (code: string, language: string): Promise<string> => {
    const response = await api.post(`/ai/explain`, {
      code,
      language,
    })
    return response.data.explanation
  },
}
