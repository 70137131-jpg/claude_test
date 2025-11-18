import { useState } from 'react'
import { FileTree } from '@/types'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import clsx from 'clsx'

interface FileTreeViewProps {
  tree: FileTree
  onFileSelect?: (path: string) => void
  selectedFile?: string | null
  level?: number
}

export default function FileTreeView({
  tree,
  onFileSelect,
  selectedFile,
  level = 0,
}: FileTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)

  const handleClick = () => {
    if (tree.type === 'directory') {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect?.(tree.path)
    }
  }

  return (
    <div>
      <div
        className={clsx(
          'flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
          selectedFile === tree.path && 'bg-primary-100 dark:bg-primary-900/30',
          level > 0 && 'ml-4'
        )}
        onClick={handleClick}
      >
        {tree.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <Folder className="h-4 w-4 text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="h-4 w-4 text-blue-500" />
          </>
        )}
        <span className="text-sm text-gray-900 dark:text-white">{tree.name}</span>
      </div>

      {tree.type === 'directory' && isExpanded && tree.children && (
        <div>
          {tree.children.map((child, index) => (
            <FileTreeView
              key={index}
              tree={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
