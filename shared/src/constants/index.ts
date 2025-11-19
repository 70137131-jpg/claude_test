// API Configuration
export const API_ROUTES = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    GITHUB: '/api/auth/github',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  PROJECTS: {
    LIST: '/api/projects',
    CREATE_GITHUB: '/api/projects/github',
    CREATE_UPLOAD: '/api/projects/upload',
    GET: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
    ANALYSIS: (id: string) => `/api/projects/${id}/analysis`,
    ANALYZE: (id: string) => `/api/projects/${id}/analyze`,
    FILES: (id: string) => `/api/projects/${id}/files`,
    FILE_CONTENT: (id: string) => `/api/projects/${id}/files/content`,
  },
  AI: {
    CHAT: '/api/ai/chat',
    CHAT_STREAM: '/api/ai/chat/stream',
    EXPLAIN: '/api/ai/explain',
    SUGGESTIONS: '/api/ai/suggestions',
  },
  REVIEWS: {
    LIST: '/api/reviews',
    CREATE: '/api/reviews',
    GET: (id: string) => `/api/reviews/${id}`,
    COMPLETE: (id: string) => `/api/reviews/${id}/complete`,
    COMMENTS: (id: string) => `/api/reviews/${id}/comments`,
  },
};

// Language Support
export const SUPPORTED_LANGUAGES = {
  javascript: { ext: ['.js', '.jsx'], name: 'JavaScript' },
  typescript: { ext: ['.ts', '.tsx'], name: 'TypeScript' },
  python: { ext: ['.py'], name: 'Python' },
  java: { ext: ['.java'], name: 'Java' },
  go: { ext: ['.go'], name: 'Go' },
  rust: { ext: ['.rs'], name: 'Rust' },
  cpp: { ext: ['.cpp', '.cc', '.cxx', '.hpp', '.h'], name: 'C++' },
  c: { ext: ['.c', '.h'], name: 'C' },
  csharp: { ext: ['.cs'], name: 'C#' },
  ruby: { ext: ['.rb'], name: 'Ruby' },
  php: { ext: ['.php'], name: 'PHP' },
  swift: { ext: ['.swift'], name: 'Swift' },
  kotlin: { ext: ['.kt', '.kts'], name: 'Kotlin' },
} as const;

// File Size Limits
export const FILE_SIZE_LIMITS = {
  MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILE_SIZE_FOR_ANALYSIS: 1024 * 1024, // 1MB
} as const;

// Analysis Thresholds
export const ANALYSIS_THRESHOLDS = {
  COMPLEXITY: {
    LOW: 10,
    MEDIUM: 20,
    HIGH: 30,
  },
  MAINTAINABILITY: {
    GOOD: 65,
    MODERATE: 40,
    POOR: 0,
  },
  TECHNICAL_DEBT: {
    LOW: 8, // hours
    MEDIUM: 24,
    HIGH: 72,
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_PROJECT: 'joinProject',
  LEAVE_PROJECT: 'leaveProject',
  FILE_SELECTED: 'fileSelected',
  CURSOR_POSITION: 'cursorPosition',
  NEW_COMMENT: 'newComment',
  ANALYSIS_PROGRESS: 'analysisProgress',
  ANALYSIS_COMPLETE: 'analysisComplete',
} as const;

// Default Pagination
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AI: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },
} as const;
