# AI-Powered Code Review & Refactoring Platform

A comprehensive full-stack application that analyzes codebases and provides intelligent AI-powered suggestions for code improvements.

## Features

### Frontend
- **Dashboard**: Upload repositories via GitHub URL or ZIP file
- **Code Viewer**: Syntax-highlighted split-pane editor showing original vs suggested improvements
- **Interactive Diff View**: Accept/reject suggestions with one click
- **Metrics Visualizations**: Complexity graphs, dependency trees, technical debt scores
- **Real-time Collaboration**: Multiple users reviewing the same codebase via WebSockets
- **AI Chat Interface**: Ask questions about code and get intelligent explanations

### Backend
- **Git Integration**: Clone and parse repository structures
- **Static Analysis Engine**: Detect code smells, security vulnerabilities, performance issues
- **AI Integration**: Claude API for generating refactoring suggestions
- **Job Queue**: Background processing for large codebases
- **REST API**: Full CRUD operations for projects, reviews, and comments
- **Authentication**: JWT-based auth with GitHub OAuth

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Monaco Editor for code editing
- React Query for data fetching
- Zustand for state management
- Socket.io for real-time features
- D3.js for visualizations

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- Redis for caching
- Bull for job queues
- Socket.io for WebSockets
- Claude API integration

### DevOps
- Docker & Docker Compose
- GitHub Actions for CI/CD
- Jest for testing
- Playwright for E2E tests

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-code-review-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env` files in both frontend and backend directories:

**backend/.env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/code_review_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
ANTHROPIC_API_KEY="your-anthropic-api-key"
PORT=3001
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 4. Start the databases with Docker

```bash
npm run docker:up
```

### 5. Run database migrations

```bash
cd backend
npx prisma migrate dev
cd ..
```

### 6. Start the development servers

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Development

### Running tests

```bash
npm run test
```

### Building for production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── backend/           # Express backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── prisma/
│   └── package.json
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration
└── package.json       # Root package.json
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
