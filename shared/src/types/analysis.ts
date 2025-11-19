export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IssueType {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  COMPLEXITY = 'complexity',
  STYLE = 'style',
  BUG = 'bug',
  MAINTAINABILITY = 'maintainability',
}

export interface CodeIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  rule?: string;
}

export interface CodeSuggestion {
  title: string;
  description: string;
  originalCode: string;
  suggestedCode: string;
  line: number;
  endLine?: number;
  reasoning: string;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  linesOfCode: number;
  commentLines: number;
  functions: number;
  classes: number;
  dependencies: string[];
  technicalDebt: number; // in hours
}

export interface AnalysisResult {
  id: string;
  projectId: string;
  filePath: string;
  language: string;
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
  createdAt: Date;
}

export interface AnalysisResultCreateInput {
  projectId: string;
  filePath: string;
  language: string;
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
}
