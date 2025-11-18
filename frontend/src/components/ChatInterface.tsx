import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { aiService } from '@/services/aiService'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { ChatMessage } from '@/types'

interface ChatInterfaceProps {
  projectId: string
  selectedFile: string | null
}

export default function ChatInterface({
  projectId,
  selectedFile,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        projectId,
        userId: 'current-user',
        role: 'user',
        content: msg,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Use streaming
      let fullResponse = ''
      await aiService.streamChat(projectId, msg, (chunk) => {
        fullResponse += chunk
        setStreamingMessage(fullResponse)
      })

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        projectId,
        userId: 'ai',
        role: 'assistant',
        content: fullResponse,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setStreamingMessage('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    chatMutation.mutate(message)
    setMessage('')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h3>
        </div>
        {selectedFile && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Context: {selectedFile}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">
              Ask me anything about your code!
              <br />
              I can explain functions, suggest improvements, or answer questions.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex space-x-2 max-w-[80%] ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-primary-600'
                    : 'bg-gray-600'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
              </div>
            </div>
          </div>
        )}

        {chatMutation.isPending && !streamingMessage && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 input"
            disabled={chatMutation.isPending}
          />
          <button
            type="submit"
            disabled={chatMutation.isPending || !message.trim()}
            className="btn btn-primary"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
