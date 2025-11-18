# Contributing to AI Code Review Platform

Thank you for your interest in contributing to the AI Code Review Platform! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ai-code-review-platform.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start databases:
   ```bash
   npm run docker:up
   ```

4. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   cd ..
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript for all new code
- Follow the Airbnb React/JSX Style Guide
- Use functional components and hooks
- Write meaningful component and variable names
- Keep components small and focused
- Use Tailwind CSS for styling

### Backend (Node.js/TypeScript)

- Use TypeScript for all new code
- Follow RESTful API design principles
- Use async/await instead of callbacks
- Handle errors properly with try/catch
- Validate input data using Zod
- Write comprehensive error messages

## Testing

- Write unit tests for all new features
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Run tests before submitting PR

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test

# Run E2E tests
npx playwright test
```

## Commit Messages

Follow conventional commits format:

- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update documentation if you're changing functionality
3. Add tests for new features
4. Ensure all tests pass
5. Ensure the code lints without errors
6. Request review from maintainers

## Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Explain your reasoning
- Be open to feedback
- Respond to review comments promptly

## Questions?

Feel free to open an issue if you have questions or need help!
