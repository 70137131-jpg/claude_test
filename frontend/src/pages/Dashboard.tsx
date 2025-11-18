import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import toast from 'react-hot-toast'
import {
  Plus,
  Github,
  Upload,
  Folder,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react'

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [projectName, setProjectName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<'github' | 'zip'>('github')

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const createFromGithubMutation = useMutation({
    mutationFn: projectService.createProjectFromGithub,
    onSuccess: (project) => {
      toast.success('Project created successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowUploadModal(false)
      setRepoUrl('')
      navigate(`/project/${project.id}`)
    },
    onError: () => {
      toast.error('Failed to create project')
    },
  })

  const uploadProjectMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) =>
      projectService.uploadProject(file, name),
    onSuccess: (project) => {
      toast.success('Project uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowUploadModal(false)
      setUploadFile(null)
      setProjectName('')
      navigate(`/project/${project.id}`)
    },
    onError: () => {
      toast.error('Failed to upload project')
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      toast.success('Project deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      toast.error('Failed to delete project')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadMode === 'github') {
      createFromGithubMutation.mutate(repoUrl)
    } else if (uploadFile && projectName) {
      uploadProjectMutation.mutate({ file: uploadFile, name: projectName })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'analyzing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and analyze your code repositories
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Project</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first project
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {project.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Are you sure you want to delete this project?')) {
                      deleteProjectMutation.mutate(project.id)
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(project.status)}
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {project.status}
                  </span>
                </div>
                {project.fileCount && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {project.fileCount} files
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Project
            </h2>

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setUploadMode('github')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  uploadMode === 'github'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Github className="h-6 w-6 mx-auto mb-2" />
                <span className="block text-sm font-medium">GitHub</span>
              </button>
              <button
                onClick={() => setUploadMode('zip')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  uploadMode === 'zip'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Upload className="h-6 w-6 mx-auto mb-2" />
                <span className="block text-sm font-medium">ZIP File</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {uploadMode === 'github' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="input"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Project"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ZIP File
                    </label>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="input"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createFromGithubMutation.isPending ||
                    uploadProjectMutation.isPending
                  }
                  className="flex-1 btn btn-primary"
                >
                  {createFromGithubMutation.isPending ||
                  uploadProjectMutation.isPending
                    ? 'Creating...'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
