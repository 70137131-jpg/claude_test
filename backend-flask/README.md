# Flask Backend - AI Code Review Platform

This is the Python/Flask backend implementation, optimized for Vercel serverless deployment.

## Features

- ✅ RESTful API with Flask
- ✅ JWT Authentication
- ✅ SQLAlchemy ORM with PostgreSQL
- ✅ Claude AI Integration
- ✅ Git Repository Analysis
- ✅ Vercel Serverless Compatible

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
python app.py
```

The API will be available at `http://localhost:5000`

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/github` - GitHub OAuth callback

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/github` - Create from GitHub URL
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/analysis` - Get analysis results
- `GET /api/projects/:id/files` - Get file tree
- `GET /api/projects/:id/files/content` - Get file content
- `POST /api/projects/:id/analyze` - Trigger analysis

### AI
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/chat/stream` - Stream chat response
- `POST /api/ai/explain` - Explain code
- `POST /api/ai/suggestions` - Get refactoring suggestions

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews/:id/comments` - Add comment to review
- `PATCH /api/reviews/:id/complete` - Mark review as complete

## Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key
ANTHROPIC_API_KEY=your-anthropic-api-key
CORS_ORIGIN=http://localhost:5173
```

Optional:
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
REDIS_URL=redis://localhost:6379
```

## Database Setup

```bash
# Quick setup (recommended for development)
python create_tables.py

# Or use Flask-Migrate for production
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Or use one-liner
python -c "from app import db; db.create_all()"
```

## Project Structure

```
backend-flask/
├── api/                  # API routes
│   ├── auth_routes.py   # Authentication endpoints
│   ├── project_routes.py # Project management
│   ├── ai_routes.py     # AI features
│   └── review_routes.py # Code reviews
├── models/              # Database models
│   └── models.py       # SQLAlchemy models
├── services/           # Business logic
│   ├── ai_service.py  # Claude API integration
│   ├── git_service.py # Git operations
│   └── queue_service.py # Background jobs
├── utils/             # Utilities
├── app.py            # Flask application
├── requirements.txt  # Python dependencies
└── vercel.json      # Vercel configuration
```

## Differences from Node.js Backend

### Advantages
- ✅ Native Python for data analysis
- ✅ Better Vercel serverless support
- ✅ Simpler deployment
- ✅ Same functionality as Node.js version

### Limitations
- ⚠️ WebSocket support limited in serverless
- ⚠️ Background jobs need external queue service
- ⚠️ 60-second execution timeout on Vercel

### Recommendations

For production, consider:
1. **Frontend on Vercel** (excellent CDN)
2. **Backend on Railway/Heroku** (better for long-running tasks)
3. **Database on Supabase** (managed Postgres)

## Testing

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest
```

## Deployment Options

### 1. Vercel (Serverless)
```bash
vercel --prod
```

### 2. Heroku
```bash
heroku create your-app-name
git push heroku main
```

### 3. Railway
```bash
railway up
```

### 4. Docker
```bash
docker build -t ai-code-review-backend .
docker run -p 5000:5000 ai-code-review-backend
```

## Contributing

See main [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT License - see [LICENSE](../LICENSE)
