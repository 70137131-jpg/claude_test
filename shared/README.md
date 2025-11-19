# Shared Package

This package contains shared types, constants, and utilities used across the AI Code Review Platform.

## Structure

```
src/
├── types/          # TypeScript type definitions
│   ├── user.ts
│   ├── project.ts
│   ├── analysis.ts
│   ├── review.ts
│   ├── chat.ts
│   └── api.ts
├── constants/      # Shared constants
│   └── index.ts
└── utils/          # Utility functions
    ├── validation.ts
    └── format.ts
```

## Usage

### In Backend

```typescript
import { User, ProjectStatus, API_ROUTES } from '@ai-code-review/shared';
```

### In Frontend

```typescript
import { ApiResponse, CodeIssue, formatBytes } from '@ai-code-review/shared';
```

## Building

```bash
npm run build
```

## Development

```bash
npm run dev  # Watch mode
```
