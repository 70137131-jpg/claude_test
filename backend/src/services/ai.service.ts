import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import { AppError } from '../middleware/errorHandler.js'

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

export class AIService {
  private anthropic: Anthropic

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async generateSuggestions(
    filePath: string,
    content: string,
    language: string
  ): Promise<CodeSuggestion[]> {
    try {
      const prompt = `You are a senior software engineer reviewing code. Analyze the following ${language} code and provide specific, actionable refactoring suggestions.

For each suggestion:
1. Identify the exact code block to refactor
2. Provide the improved version
3. Explain why the change improves the code
4. Classify the suggestion type (refactor/optimization/modernization/cleanup)

Code to analyze:
\`\`\`${language}
${content}
\`\`\`

Respond in JSON format as an array of suggestions:
[
  {
    "type": "refactor",
    "title": "Brief title",
    "description": "What to improve",
    "originalCode": "Code to replace",
    "suggestedCode": "Improved code",
    "line": 10,
    "endLine": 15,
    "reasoning": "Why this is better"
  }
]`

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : ''

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return []
      }

      const suggestions = JSON.parse(jsonMatch[0])

      return suggestions.map((s: any, index: number) => ({
        id: `suggestion-${index}`,
        type: s.type || 'refactor',
        title: s.title,
        description: s.description,
        originalCode: s.originalCode,
        suggestedCode: s.suggestedCode,
        line: s.line,
        endLine: s.endLine,
        reasoning: s.reasoning,
        status: 'pending',
      }))
    } catch (error: any) {
      console.error('AI suggestion error:', error)
      return [] // Return empty array on error
    }
  }

  async chatCompletion(
    message: string,
    context?: string
  ): Promise<string> {
    try {
      const systemPrompt = 'You are an expert software engineer assistant. Help users understand and improve their code. Be concise and practical.'

      const userMessage = context
        ? `Context:\n${context}\n\nQuestion: ${message}`
        : message

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      })

      return response.content[0].type === 'text'
        ? response.content[0].text
        : 'I apologize, but I could not generate a response.'
    } catch (error: any) {
      console.error('AI chat error:', error)
      throw new AppError(500, 'AI chat failed')
    }
  }

  async streamChatCompletion(
    message: string,
    context?: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const systemPrompt = 'You are an expert software engineer assistant. Help users understand and improve their code. Be concise and practical.'

      const userMessage = context
        ? `Context:\n${context}\n\nQuestion: ${message}`
        : message

      const stream = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: true,
      })

      for await (const messageStreamEvent of stream) {
        if (
          messageStreamEvent.type === 'content_block_delta' &&
          messageStreamEvent.delta.type === 'text_delta'
        ) {
          onChunk(messageStreamEvent.delta.text)
        }
      }
    } catch (error: any) {
      console.error('AI stream error:', error)
      throw new AppError(500, 'AI streaming failed')
    }
  }

  async explainCode(code: string, language: string): Promise<string> {
    try {
      const prompt = `Explain what this ${language} code does in simple terms:

\`\`\`${language}
${code}
\`\`\`

Provide a clear, concise explanation suitable for someone learning to code.`

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      return message.content[0].type === 'text'
        ? message.content[0].text
        : 'Could not explain the code.'
    } catch (error: any) {
      console.error('Code explanation error:', error)
      throw new AppError(500, 'Code explanation failed')
    }
  }
}
