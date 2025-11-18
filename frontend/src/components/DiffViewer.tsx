import { useState } from 'react'
import { CodeSuggestion } from '@/types'
import * as Diff from 'diff'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface DiffViewerProps {
  originalCode: string
  suggestions: CodeSuggestion[]
  language: string
}

export default function DiffViewer({
  originalCode,
  suggestions,
  language,
}: DiffViewerProps) {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(
    suggestions[0]?.id || null
  )

  const selectedSuggestion = suggestions.find(
    (s) => s.id === selectedSuggestionId
  )

  if (!selectedSuggestion) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No suggestions available for diff view</p>
      </div>
    )
  }

  const diff = Diff.diffLines(
    selectedSuggestion.originalCode,
    selectedSuggestion.suggestedCode
  )

  return (
    <div className="h-full flex flex-col">
      {/* Suggestion Selector */}
      {suggestions.length > 1 && (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
          <select
            value={selectedSuggestionId || ''}
            onChange={(e) => setSelectedSuggestionId(e.target.value)}
            className="input"
          >
            {suggestions.map((suggestion) => (
              <option key={suggestion.id} value={suggestion.id}>
                {suggestion.title} (Line {suggestion.line})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Diff Display */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {selectedSuggestion.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedSuggestion.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Original Code */}
          <div>
            <div className="bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-t-lg">
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Original
              </span>
            </div>
            <div className="border border-t-0 border-red-200 dark:border-red-800 rounded-b-lg overflow-hidden">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '0.875rem',
                }}
                showLineNumbers
              >
                {selectedSuggestion.originalCode}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Suggested Code */}
          <div>
            <div className="bg-green-100 dark:bg-green-900/20 px-4 py-2 rounded-t-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Suggested
              </span>
            </div>
            <div className="border border-t-0 border-green-200 dark:border-green-800 rounded-b-lg overflow-hidden">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '0.875rem',
                }}
                showLineNumbers
              >
                {selectedSuggestion.suggestedCode}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Unified Diff */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
            Unified Diff
          </h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono">
              {diff.map((part, index) => (
                <div
                  key={index}
                  className={
                    part.added
                      ? 'bg-green-900/30 text-green-300'
                      : part.removed
                      ? 'bg-red-900/30 text-red-300'
                      : 'text-gray-300'
                  }
                >
                  {part.added ? '+ ' : part.removed ? '- ' : '  '}
                  {part.value}
                </div>
              ))}
            </pre>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Reasoning:</strong> {selectedSuggestion.reasoning}
          </p>
        </div>
      </div>
    </div>
  )
}
