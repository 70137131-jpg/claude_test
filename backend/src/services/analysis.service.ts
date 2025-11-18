import { promises as fs } from 'fs'
import path from 'path'

export interface CodeIssue {
  id: string
  type: 'bug' | 'security' | 'performance' | 'style' | 'complexity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  line: number
  column?: number
  endLine?: number
  endColumn?: number
  code?: string
}

export interface CodeMetrics {
  linesOfCode: number
  complexity: number
  maintainabilityIndex: number
  technicalDebt: number
  dependencies: string[]
  duplicateCode: number
}

export class AnalysisService {
  async analyzeFile(filePath: string, language: string): Promise<{
    issues: CodeIssue[]
    metrics: CodeMetrics
  }> {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    const issues = await this.detectIssues(content, lines, language)
    const metrics = await this.calculateMetrics(content, lines, language)

    return { issues, metrics }
  }

  private async detectIssues(
    content: string,
    lines: string[],
    language: string
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = []

    // Simple pattern-based analysis (in production, use proper AST analysis)
    const patterns = {
      // Security issues
      eval: {
        pattern: /eval\(/g,
        type: 'security' as const,
        severity: 'critical' as const,
        message: 'Use of eval() is a security risk',
      },
      sqlInjection: {
        pattern: /query\([^)]*\+[^)]*\)/g,
        type: 'security' as const,
        severity: 'high' as const,
        message: 'Possible SQL injection vulnerability',
      },
      // Performance issues
      nestedLoops: {
        pattern: /for\s*\([^)]*\)[^{]*{[^}]*for\s*\(/g,
        type: 'performance' as const,
        severity: 'medium' as const,
        message: 'Nested loops may cause performance issues',
      },
      // Complexity issues
      longFunction: {
        threshold: 50,
        type: 'complexity' as const,
        severity: 'medium' as const,
        message: 'Function is too long and should be refactored',
      },
      // Style issues
      console: {
        pattern: /console\.(log|error|warn)/g,
        type: 'style' as const,
        severity: 'low' as const,
        message: 'Console statement should be removed in production',
      },
    }

    // Check each line
    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Check patterns
      Object.entries(patterns).forEach(([key, rule]) => {
        if ('pattern' in rule) {
          const matches = line.match(rule.pattern)
          if (matches) {
            issues.push({
              id: `${key}-${lineNumber}`,
              type: rule.type,
              severity: rule.severity,
              message: rule.message,
              line: lineNumber,
              code: line.trim(),
            })
          }
        }
      })
    })

    // Check function length
    const functionMatches = content.matchAll(/function\s+\w+\s*\([^)]*\)\s*{/g)
    for (const match of functionMatches) {
      const startIndex = match.index!
      const startLine = content.substring(0, startIndex).split('\n').length

      // Find matching closing brace (simplified)
      const endMatch = content.indexOf('}', startIndex)
      const endLine = content.substring(0, endMatch).split('\n').length

      const functionLength = endLine - startLine
      if (functionLength > 50) {
        issues.push({
          id: `long-func-${startLine}`,
          type: 'complexity',
          severity: 'medium',
          message: `Function is ${functionLength} lines long and should be refactored`,
          line: startLine,
          endLine,
        })
      }
    }

    return issues
  }

  private async calculateMetrics(
    content: string,
    lines: string[],
    language: string
  ): Promise<CodeMetrics> {
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length

    // Calculate cyclomatic complexity (simplified)
    const complexity = this.calculateComplexity(content)

    // Calculate maintainability index (simplified formula)
    const halsteadVolume = Math.log2(linesOfCode + 1) * 10
    const maintainabilityIndex = Math.max(
      0,
      (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
    )

    // Extract dependencies (simplified)
    const dependencies = this.extractDependencies(content, language)

    // Estimate technical debt in hours
    const technicalDebt = Math.floor(complexity / 10)

    // Check for duplicate code (simplified - would use proper duplicate detection in production)
    const duplicateCode = 0

    return {
      linesOfCode,
      complexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      technicalDebt,
      dependencies,
      duplicateCode,
    }
  }

  private calculateComplexity(content: string): number {
    // Simplified cyclomatic complexity calculation
    let complexity = 1 // Base complexity

    const patterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\?\s*[^:]+:/g, // Ternary operators
      /&&/g,
      /\|\|/g,
    ]

    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    })

    return complexity
  }

  private extractDependencies(content: string, language: string): string[] {
    const dependencies: Set<string> = new Set()

    if (language === 'javascript' || language === 'typescript') {
      // import statements
      const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g)
      for (const match of importMatches) {
        dependencies.add(match[1])
      }

      // require statements
      const requireMatches = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)
      for (const match of requireMatches) {
        dependencies.add(match[1])
      }
    } else if (language === 'python') {
      const importMatches = content.matchAll(/^import\s+(\w+)/gm)
      for (const match of importMatches) {
        dependencies.add(match[1])
      }

      const fromMatches = content.matchAll(/^from\s+(\w+)\s+import/gm)
      for (const match of fromMatches) {
        dependencies.add(match[1])
      }
    }

    return Array.from(dependencies)
  }
}
