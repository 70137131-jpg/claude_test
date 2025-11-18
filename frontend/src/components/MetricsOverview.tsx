import { AnalysisResult } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface MetricsOverviewProps {
  analysisResults: AnalysisResult[]
}

export default function MetricsOverview({ analysisResults }: MetricsOverviewProps) {
  // Calculate complexity distribution
  const complexityData = analysisResults.map((result) => ({
    name: result.filePath.split('/').pop() || result.filePath,
    complexity: result.metrics.complexity,
    maintainability: result.metrics.maintainabilityIndex,
  })).slice(0, 10) // Top 10 most complex files

  // Calculate issue type distribution
  const issueTypes: Record<string, number> = {}
  analysisResults.forEach((result) => {
    result.issues.forEach((issue) => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1
    })
  })

  const issueTypeData = Object.entries(issueTypes).map(([type, count]) => ({
    name: type,
    value: count,
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Calculate average metrics
  const avgComplexity =
    analysisResults.reduce((sum, r) => sum + r.metrics.complexity, 0) /
    analysisResults.length
  const avgMaintainability =
    analysisResults.reduce((sum, r) => sum + r.metrics.maintainabilityIndex, 0) /
    analysisResults.length
  const totalTechnicalDebt = analysisResults.reduce(
    (sum, r) => sum + r.metrics.technicalDebt,
    0
  )

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Code Metrics Overview
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Avg. Complexity
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgComplexity.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Avg. Maintainability
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgMaintainability.toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Technical Debt
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalTechnicalDebt}h
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Complexity by File
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complexityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="complexity" fill="#0ea5e9" name="Complexity" />
              <Bar
                dataKey="maintainability"
                fill="#10b981"
                name="Maintainability"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Issue Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {issueTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
