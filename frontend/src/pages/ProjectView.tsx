import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tantml:parameter>import { projectService } from '@/services/projectService'
import { useProjectStore } from '@/store/projectStore'
import {
  ArrowLeft,
  Play,
  Loader2,
  FileCode,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import MetricsOverview from '@/components/MetricsOverview'
import FileTreeView from '@/components/FileTreeView'
import IssuesList from '@/components/IssuesList'

export default function ProjectView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setCurrentProject, setAnalysisResults } = useProjectStore()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const { data: analysisResults = [], isLoading: analysisLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => projectService.getAnalysisResults(id!),
    enabled: !!id && project?.status === 'completed',
  })

  const { data: fileTree } = useQuery({
    queryKey: ['fileTree', id],
    queryFn: () => projectService.getFileTree(id!),
    enabled: !!id && project?.status === 'completed',
  })

  useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
    if (analysisResults) {
      setAnalysisResults(analysisResults)
    }
  }, [project, analysisResults, setCurrentProject, setAnalysisResults])

  const handleStartReview = () => {
    navigate(`/review/${id}`)
  }

  const handleTriggerAnalysis = async () => {
    if (id) {
      await projectService.triggerAnalysis(id)
    }
  }

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Project not found
        </h3>
      </div>
    )
  }

  const totalIssues = analysisResults.reduce(
    (sum, result) => sum + result.issues.length,
    0
  )
  const criticalIssues = analysisResults.reduce(
    (sum, result) =>
      sum + result.issues.filter((i) => i.severity === 'critical').length,
    0
  )

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Projects</span>
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          {project.status === 'pending' && (
            <button
              onClick={handleTriggerAnalysis}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Analysis</span>
            </button>
          )}
          {project.status === 'completed' && (
            <button
              onClick={handleStartReview}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FileCode className="h-4 w-4" />
              <span>Start Review</span>
            </button>
          )}
        </div>
      </div>

      {project.status === 'analyzing' && (
        <div className="card mb-8">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Analyzing codebase...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This may take a few minutes depending on the size of your project
              </p>
            </div>
          </div>
        </div>
      )}

      {project.status === 'failed' && (
        <div className="card mb-8 border-red-500">
          <div className="flex items-center space-x-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-red-600">
                Analysis failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There was an error analyzing your project. Please try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {project.status === 'completed' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Issues
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {totalIssues}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Critical
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {criticalIssues}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Files Analyzed
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {analysisResults.length}
                  </p>
                </div>
                <FileCode className="h-8 w-8 text-primary-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg. Complexity
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {analysisResults.length > 0
                      ? (
                          analysisResults.reduce(
                            (sum, r) => sum + r.metrics.complexity,
                            0
                          ) / analysisResults.length
                        ).toFixed(1)
                      : 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <MetricsOverview analysisResults={analysisResults} />
              <IssuesList analysisResults={analysisResults} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                File Structure
              </h2>
              {fileTree && <FileTreeView tree={fileTree} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
