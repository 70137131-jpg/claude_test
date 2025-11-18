import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { useProjectStore } from '@/store/projectStore'
import Editor from '@monaco-editor/react'
import SplitPane from 'react-split-pane'
import FileTreeView from '@/components/FileTreeView'
import SuggestionsList from '@/components/SuggestionsList'
import DiffViewer from '@/components/DiffViewer'
import ChatInterface from '@/components/ChatInterface'
import { Loader2, Code, MessageSquare } from 'lucide-react'

export default function CodeReview() {
  const { id } = useParams<{ id: string }>()
  const { selectedFile, setSelectedFile } = useProjectStore()
  const [fileContent, setFileContent] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'diff'>('split')

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const { data: fileTree } = useQuery({
    queryKey: ['fileTree', id],
    queryFn: () => projectService.getFileTree(id!),
    enabled: !!id,
  })

  const { data: analysisResults = [] } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => projectService.getAnalysisResults(id!),
    enabled: !!id,
  })

  useEffect(() => {
    const loadFileContent = async () => {
      if (id && selectedFile) {
        try {
          const content = await projectService.getFileContent(id, selectedFile)
          setFileContent(content)
        } catch (error) {
          console.error('Failed to load file content:', error)
        }
      }
    }
    loadFileContent()
  }, [id, selectedFile])

  const currentFileAnalysis = analysisResults.find(
    (result) => result.filePath === selectedFile
  )

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    }
    return langMap[ext || ''] || 'plaintext'
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {project?.name} - Code Review
        </h1>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('split')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'split'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'diff'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Diff View
            </button>
          </div>

          <button
            onClick={() => setShowChat(!showChat)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{showChat ? 'Hide Chat' : 'Show Chat'}</span>
          </button>
        </div>
      </div>

      <div className="flex h-full space-x-4">
        {/* File Tree Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Files
          </h3>
          {fileTree ? (
            <FileTreeView
              tree={fileTree}
              onFileSelect={(path) => setSelectedFile(path)}
              selectedFile={selectedFile}
            />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex space-x-4">
          {/* Code Editor / Diff View */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {selectedFile ? (
              viewMode === 'split' ? (
                <SplitPane split="horizontal" defaultSize="60%">
                  <div className="h-full">
                    <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile}
                        </span>
                      </div>
                    </div>
                    <Editor
                      height="100%"
                      language={getLanguageFromPath(selectedFile)}
                      value={fileContent}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div className="h-full overflow-y-auto">
                    <SuggestionsList
                      suggestions={currentFileAnalysis?.suggestions || []}
                      projectId={id!}
                    />
                  </div>
                </SplitPane>
              ) : (
                <DiffViewer
                  originalCode={fileContent}
                  suggestions={currentFileAnalysis?.suggestions || []}
                  language={getLanguageFromPath(selectedFile)}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Code className="h-16 w-16 mb-4" />
                <p>Select a file to start reviewing</p>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-96">
              <ChatInterface projectId={id!} selectedFile={selectedFile} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
