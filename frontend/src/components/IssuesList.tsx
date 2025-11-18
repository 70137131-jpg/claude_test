import { useState } from 'react'
import { AnalysisResult, CodeIssue } from '@/types'
import { AlertCircle, AlertTriangle, Info, Bug, Shield, Zap } from 'lucide-react'
import clsx from 'clsx'

interface IssuesListProps {
  analysisResults: AnalysisResult[]
}

export default function IssuesList({ analysisResults }: IssuesListProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Flatten all issues
  const allIssues = analysisResults.flatMap((result) =>
    result.issues.map((issue) => ({
      ...issue,
      filePath: result.filePath,
    }))
  )

  // Filter issues
  const filteredIssues = allIssues.filter((issue) => {
    const severityMatch = filter === 'all' || issue.severity === filter
    const typeMatch = typeFilter === 'all' || issue.type === typeFilter
    return severityMatch && typeMatch
  })

  // Sort by severity
  const sortedIssues = filteredIssues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-5 w-5" />
      case 'security':
        return <Shield className="h-5 w-5" />
      case 'performance':
        return <Zap className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Issues ({filteredIssues.length})
        </h2>

        <div className="flex space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Types</option>
            <option value="bug">Bug</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="style">Style</option>
            <option value="complexity">Complexity</option>
          </select>
        </div>
      </div>

      {sortedIssues.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-4" />
          <p>No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedIssues.map((issue, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div
                  className={clsx(
                    'p-2 rounded',
                    issue.severity === 'critical' || issue.severity === 'high'
                      ? 'text-red-600'
                      : issue.severity === 'medium'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  )}
                >
                  {getIcon(issue.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        getSeverityColor(issue.severity)
                      )}
                    >
                      {issue.severity}
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize"
                    >
                      {issue.type}
                    </span>
                  </div>

                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {issue.message}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {issue.filePath}:{issue.line}
                    {issue.column && `:${issue.column}`}
                  </p>

                  {issue.code && (
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      <code>{issue.code}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
