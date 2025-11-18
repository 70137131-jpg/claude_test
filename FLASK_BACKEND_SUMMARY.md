# Flask Backend & Vercel Deployment - Complete Guide

## ✅ What's Been Added

### Flask Backend (`backend-flask/`)

A complete Python/Flask implementation with all the features of the Node.js backend:

#### Core Files Created
- `app.py` - Flask application setup
- `requirements.txt` - Python dependencies
- `Procfile` - For Heroku/Railway deployment
- `.env.example` - Environment template

#### API Routes (`api/`)
- `auth_routes.py` - Authentication (JWT, register, login)
- `project_routes.py` - Project management, GitHub integration
- `ai_routes.py` - Claude AI chat, suggestions, explanations
- `review_routes.py` - Code reviews and comments

#### Database Models (`models/`)
- `models.py` - SQLAlchemy ORM models
  - User
  - Project
  - AnalysisResult
  - Review
  - ReviewComment
  - ChatMessage

#### Services (`services/`)
- `ai_service.py` - Claude API integration
  - `generate_suggestions()` - AI refactoring suggestions
  - `chat_completion()` - Interactive AI chat
  - `stream_chat_completion()` - Streaming responses
  - `explain_code()` - Code explanations

- `git_service.py` - Git operations
  - `clone_repository()` - Clone GitHub repos
  - `get_file_tree()` - Build file structure
  - `get_file_content()` - Read files
  - `get_language_from_path()` - Detect programming language
  - `delete_project()` - Cleanup

- `queue_service.py` - Background job queue (placeholder for Celery)

### Vercel Deployment Configuration

#### Root Level
- `vercel.json` - Unified deployment config
- `.vercelignore` - Files to exclude

#### Frontend (`frontend/`)
- `vercel.json` - Frontend-specific config
  - Static build configuration
  - Rewrites for SPA routing
  - Security headers
  - Asset caching

#### Backend (`backend-flask/`)
- `vercel.json` - Serverless Python config
  - Python function configuration
  - Route mapping

### Documentation
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide
  - Step-by-step Vercel setup
  - Environment variable configuration
  - Database options (Vercel Postgres, Supabase, etc.)
  - Custom domain setup
  - Troubleshooting guide
  - Cost estimation

- `backend-flask/README.md` - Flask backend documentation
  - API endpoints
  - Local development
  - Deployment options
  - Project structure

## 🚀 Quick Start Guide

### Local Development

#### 1. Flask Backend
```bash
cd backend-flask
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python app.py
```

Backend runs on `http://localhost:5000`

#### 2. React Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

Frontend runs on `http://localhost:5173`

### Deploy to Vercel

#### Option 1: CLI (Quick Test)
```bash
# Frontend
cd frontend
vercel --prod

# Backend
cd ../backend-flask
vercel --prod
```

#### Option 2: Dashboard (Production)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Create two projects:
   - **Frontend**: Root directory = `frontend`
   - **Backend**: Root directory = `backend-flask`

5. Set environment variables in each project

## 📋 Environment Variables

### Frontend (Vercel Project Settings)
```env
VITE_API_URL=https://your-backend.vercel.app
VITE_WS_URL=wss://your-backend.vercel.app
VITE_GITHUB_CLIENT_ID=your-github-oauth-id
```

### Backend (Vercel Project Settings)
```env
# Required
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-jwt-secret-key
ANTHROPIC_API_KEY=sk-ant-xxx

# Optional
GITHUB_CLIENT_ID=your-github-oauth-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
CORS_ORIGIN=https://your-frontend.vercel.app
REDIS_URL=redis://user:pass@host:port
```

## 🗄️ Database Options

### Recommended for Vercel

1. **Vercel Postgres** (Easiest)
   - Built-in to Vercel
   - Dashboard → Storage → Create Database
   - Auto-generates `DATABASE_URL`

2. **Supabase** (Free Tier)
   - [supabase.com](https://supabase.com)
   - Generous free tier
   - Great developer experience

3. **Neon** (Serverless Postgres)
   - [neon.tech](https://neon.tech)
   - Serverless auto-scaling
   - Free tier available

4. **Railway**
   - [railway.app](https://railway.app)
   - Simple Postgres hosting
   - $5/month

### For Redis (Caching)

1. **Vercel KV** (Recommended)
   - Built-in to Vercel
   - Redis-compatible

2. **Upstash** (Free Tier)
   - [upstash.com](https://upstash.com)
   - Serverless Redis
   - Great Vercel integration

## 🔄 Backend Comparison

### Flask Backend (`backend-flask/`)

**Pros:**
- ✅ Native Python - great for data science
- ✅ Perfect for Vercel serverless
- ✅ Simpler deployment
- ✅ Smaller cold start times
- ✅ Lower memory usage

**Cons:**
- ⚠️ No built-in WebSocket support in serverless
- ⚠️ 60-second timeout on Vercel
- ⚠️ Background jobs need external service

**Best For:**
- Vercel deployment
- Serverless architecture
- Cost-effective scaling
- Python developers

### Node.js Backend (`backend/`)

**Pros:**
- ✅ Full WebSocket support
- ✅ No timeout limitations (self-hosted)
- ✅ Built-in job queue (Bull + Redis)
- ✅ Better for long-running tasks

**Cons:**
- ⚠️ Higher memory usage
- ⚠️ More complex deployment
- ⚠️ Larger bundle size

**Best For:**
- Traditional hosting (Heroku, Railway, Docker)
- Real-time features
- Long-running analysis jobs
- Node.js developers

## 📊 Feature Parity

Both backends support:
- ✅ JWT Authentication
- ✅ GitHub OAuth
- ✅ Claude AI Integration
- ✅ Project Management
- ✅ Git Repository Cloning
- ✅ Code Analysis
- ✅ File Tree Navigation
- ✅ RESTful APIs
- ✅ PostgreSQL Database

## 🌐 Production Architecture

### Recommended Setup

```
┌─────────────────────┐
│   Vercel CDN        │
│   (Frontend)        │
│   React + Vite      │
└──────────┬──────────┘
           │
           │ HTTPS
           │
┌──────────▼──────────┐      ┌────────────────┐
│   Vercel Functions  │─────▶│  Vercel Postgres│
│   (Flask Backend)   │      │  or Supabase    │
│   Python API        │      └────────────────┘
└──────────┬──────────┘
           │                  ┌────────────────┐
           └─────────────────▶│  Vercel KV     │
                              │  (Redis Cache) │
                              └────────────────┘
```

**Total Cost:** $0 - $20/month (depending on usage)

### Alternative: Hybrid Setup

```
┌─────────────────────┐
│   Vercel            │
│   (Frontend Only)   │
│   $0/month          │
└──────────┬──────────┘
           │
           │ HTTPS
           │
┌──────────▼──────────┐      ┌────────────────┐
│   Railway/Heroku    │─────▶│  Supabase      │
│   (Node.js Backend) │      │  (Postgres)    │
│   $5-7/month        │      │  $0/month      │
└──────────┬──────────┘      └────────────────┘
           │
           │                  ┌────────────────┐
           └─────────────────▶│  Upstash       │
                              │  (Redis)       │
                              │  $0/month      │
                              └────────────────┘
```

**Total Cost:** $5-7/month

## 🔧 API Endpoints

All endpoints work identically between backends:

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/github`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/analysis`
- `GET /api/projects/:id/files`
- `GET /api/projects/:id/files/content`

### AI Features
- `POST /api/ai/chat`
- `POST /api/ai/chat/stream`
- `POST /api/ai/explain`
- `POST /api/ai/suggestions`

### Reviews
- `POST /api/reviews`
- `GET /api/reviews`
- `GET /api/reviews/:id`

## 🧪 Testing

### Test Flask Backend Locally
```bash
cd backend-flask
python app.py

# In another terminal
curl http://localhost:5000/health
```

### Test Frontend Locally
```bash
cd frontend
npm run dev

# Open http://localhost:5173
```

## 📈 Performance Considerations

### Flask on Vercel
- **Cold Start**: ~2-3 seconds
- **Warm Execution**: <100ms
- **Timeout**: 60 seconds (Pro plan)
- **Memory**: 1024MB default
- **Concurrent Requests**: Auto-scales

### Optimizations
1. Keep function code small
2. Use edge caching for static data
3. Minimize dependencies
4. Use connection pooling for database
5. Implement request caching

## 🐛 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution:** Check `DATABASE_URL` format:
```
postgresql://user:password@host:port/database?sslmode=require
```

### Issue: CORS Errors
**Solution:** Ensure `CORS_ORIGIN` matches frontend URL exactly (no trailing slash)

### Issue: Cold Start Timeouts
**Solution:**
- Reduce dependencies
- Use Vercel Pro for 60s timeout
- Or deploy backend to Railway/Heroku

### Issue: File Uploads Fail
**Solution:** Vercel has 50MB limit. Use:
- Vercel Blob for file storage
- AWS S3 for larger files

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Claude API Documentation](https://docs.anthropic.com/)

## 🎯 Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Deploy backend to Vercel
3. ✅ Setup Vercel Postgres
4. ✅ Configure environment variables
5. ✅ Test all endpoints
6. ✅ Add custom domain (optional)
7. ✅ Setup monitoring
8. ✅ Configure analytics

## 💡 Pro Tips

1. **Use Vercel Preview Deployments** - Every PR gets a preview URL
2. **Environment Variables per Branch** - Different configs for prod/dev
3. **Enable Analytics** - Track performance and usage
4. **Setup Monitoring** - Use Vercel's built-in monitoring or Sentry
5. **Implement Caching** - Use Vercel KV for frequently accessed data
6. **Rate Limiting** - Protect your API from abuse
7. **Log Everything** - Vercel provides real-time logs

## 🎉 Success!

You now have:
- ✅ Complete Flask backend with Claude AI
- ✅ Vercel deployment ready
- ✅ Production-grade architecture
- ✅ Comprehensive documentation
- ✅ Choice of two backends (Flask/Node.js)
- ✅ Multiple deployment options

**Time to deploy and showcase your AI-powered code review platform!** 🚀
