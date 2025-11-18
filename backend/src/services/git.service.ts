import simpleGit, { SimpleGit } from 'simple-git'
import { promises as fs } from 'fs'
import path from 'path'
import { AppError } from '../middleware/errorHandler.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export class GitService {
  private git: SimpleGit

  constructor() {
    this.git = simpleGit()
  }

  async cloneRepository(repoUrl: string, projectId: string): Promise<string> {
    try {
      const localPath = path.join(UPLOAD_DIR, projectId)

      // Ensure upload directory exists
      await fs.mkdir(UPLOAD_DIR, { recursive: true })

      // Clone repository
      await this.git.clone(repoUrl, localPath, ['--depth', '1'])

      return localPath
    } catch (error: any) {
      console.error('Git clone error:', error)
      throw new AppError(400, `Failed to clone repository: ${error.message}`)
    }
  }

  async getFileTree(localPath: string): Promise<FileTreeNode> {
    try {
      const name = path.basename(localPath)
      const stats = await fs.stat(localPath)

      if (stats.isDirectory()) {
        const children: FileTreeNode[] = []
        const entries = await fs.readdir(localPath)

        for (const entry of entries) {
          // Skip hidden files and node_modules
          if (entry.startsWith('.') || entry === 'node_modules') {
            continue
          }

          const entryPath = path.join(localPath, entry)
          const child = await this.getFileTree(entryPath)
          children.push(child)
        }

        return {
          path: localPath,
          name,
          type: 'directory',
          children: children.sort((a, b) => {
            // Directories first, then alphabetical
            if (a.type === 'directory' && b.type !== 'directory') return -1
            if (a.type !== 'directory' && b.type === 'directory') return 1
            return a.name.localeCompare(b.name)
          }),
        }
      } else {
        return {
          path: localPath,
          name,
          type: 'file',
          size: stats.size,
          language: this.getLanguageFromPath(localPath),
        }
      }
    } catch (error: any) {
      console.error('File tree error:', error)
      throw new AppError(500, `Failed to read file tree: ${error.message}`)
    }
  }

  async getFileContent(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error: any) {
      console.error('File read error:', error)
      throw new AppError(404, `File not found: ${error.message}`)
    }
  }

  async countFiles(localPath: string): Promise<number> {
    let count = 0

    async function countRecursive(dirPath: string) {
      const entries = await fs.readdir(dirPath)

      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') {
          continue
        }

        const entryPath = path.join(dirPath, entry)
        const stats = await fs.stat(entryPath)

        if (stats.isDirectory()) {
          await countRecursive(entryPath)
        } else {
          count++
        }
      }
    }

    await countRecursive(localPath)
    return count
  }

  async getAllCodeFiles(localPath: string): Promise<string[]> {
    const files: string[] = []
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c',
      '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
    ]

    async function scanRecursive(dirPath: string) {
      const entries = await fs.readdir(dirPath)

      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') {
          continue
        }

        const entryPath = path.join(dirPath, entry)
        const stats = await fs.stat(entryPath)

        if (stats.isDirectory()) {
          await scanRecursive(entryPath)
        } else {
          const ext = path.extname(entry)
          if (codeExtensions.includes(ext)) {
            files.push(entryPath)
          }
        }
      }
    }

    await scanRecursive(localPath)
    return files
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
    }
    return langMap[ext] || 'plaintext'
  }

  async deleteProject(localPath: string): Promise<void> {
    try {
      await fs.rm(localPath, { recursive: true, force: true })
    } catch (error: any) {
      console.error('Delete project error:', error)
    }
  }
}

export interface FileTreeNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  size?: number
  language?: string
}
