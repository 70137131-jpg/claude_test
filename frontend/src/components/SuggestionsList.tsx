import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CodeSuggestion } from '@/types'
import { Check, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface SuggestionsListProps {
  suggestions: CodeSuggestion[]
  projectId: string
}

export default function SuggestionsList({
  suggestions,
  projectId,
}: SuggestionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      // API call would go here
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Suggestion accepted!')
      queryClient.invalidateQueries({ queryKey: ['analysis', projectId] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      // API call would go here
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Suggestion rejected!')
      queryClient.invalidateQueries({ queryKey: ['analysis', projectId] })
    },
  })

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <Lightbulb className="h-12 w-12 mb-4" />
        <p>No suggestions for this file</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        AI Suggestions ({suggestions.length})
      </h3>

      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    suggestion.type === 'refactor'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : suggestion.type === 'optimization'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : suggestion.type === 'modernization'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {suggestion.type}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Line {suggestion.line}-{suggestion.endLine}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {suggestion.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {suggestion.description}
              </p>
            </div>

            {suggestion.status === 'pending' && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => acceptMutation.mutate(suggestion.id)}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                  title="Accept"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => rejectMutation.mutate(suggestion.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Reject"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              setExpandedId(expandedId === suggestion.id ? null : suggestion.id)
            }
            className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 mt-3"
          >
            {expandedId === suggestion.id ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Hide details</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Show details</span>
              </>
            )}
          </button>

          {expandedId === suggestion.id && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reasoning:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestion.reasoning}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Code:
                </p>
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  {suggestion.originalCode}
                </SyntaxHighlighter>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggested Code:
                </p>
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  {suggestion.suggestedCode}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
