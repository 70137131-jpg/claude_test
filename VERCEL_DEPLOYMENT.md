# Vercel Deployment Guide

This guide explains how to deploy the AI Code Review Platform to Vercel.

## Overview

The application consists of two parts:
1. **Frontend** - React application (deployed as static site)
2. **Backend** - Flask Python API (deployed as serverless functions)

## Prerequisites

1. [Vercel Account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
3. GitHub repository connected to Vercel
4. Environment variables configured

## Deployment Options

### Option 1: Deploy via Vercel CLI (Recommended for Testing)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy Frontend

```bash
cd frontend
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Which scope: Select your account
- Link to existing project: **N**
- Project name: `ai-code-review-frontend`
- Directory: `./`
- Override settings: **N**

#### 4. Deploy Backend (Flask)

```bash
cd ../backend-flask
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Which scope: Select your account
- Link to existing project: **N**
- Project name: `ai-code-review-backend`
- Directory: `./`
- Override settings: **N**

### Option 2: Deploy via Vercel Dashboard (Recommended for Production)

#### 1. Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository: `ai-code-review-platform`

#### 2. Configure Frontend Project

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### 3. Configure Backend Project

Create a separate project for the backend:

1. Import the same repository again
2. **Framework Preset**: Other
3. **Root Directory**: `backend-flask`
4. **Build Command**: (leave empty)
5. **Output Directory**: (leave empty)

## Environment Variables

### Frontend Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.vercel.app
VITE_WS_URL=wss://your-backend.vercel.app
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

### Backend Environment Variables

Set these in Vercel Dashboard → Backend Project → Settings → Environment Variables:

```
DATABASE_URL=your-postgres-connection-string
REDIS_URL=your-redis-connection-string
SECRET_KEY=your-secret-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
CORS_ORIGIN=https://your-frontend.vercel.app
FLASK_ENV=production
```

## Database Options for Vercel

Since Vercel serverless functions are stateless, you'll need external database services:

### Option 1: Vercel Postgres (Recommended)

1. Go to Vercel Dashboard → Storage
2. Create a new Postgres database
3. Copy the connection string
4. Add to backend environment variables as `DATABASE_URL`

### Option 2: External Postgres

Popular options:
- [Supabase](https://supabase.com/) - Free tier available
- [Neon](https://neon.tech/) - Serverless Postgres
- [Railway](https://railway.app/) - Postgres hosting
- [Amazon RDS](https://aws.amazon.com/rds/)

### Option 3: Vercel KV (Redis Alternative)

For caching and sessions:

1. Go to Vercel Dashboard → Storage
2. Create a new KV database
3. Add connection string to `REDIS_URL`

## Post-Deployment Configuration

### 1. Update Frontend API URL

After deploying the backend, update the frontend environment variable:

```bash
vercel env add VITE_API_URL production
# Enter: https://your-backend.vercel.app
```

### 2. Update Backend CORS

After deploying the frontend, update the backend CORS origin:

```bash
vercel env add CORS_ORIGIN production
# Enter: https://your-frontend.vercel.app
```

### 3. Redeploy Both Projects

After updating environment variables:

```bash
# Redeploy frontend
cd frontend
vercel --prod

# Redeploy backend
cd ../backend-flask
vercel --prod
```

## Custom Domain (Optional)

### Frontend Domain

1. Go to Vercel Dashboard → Frontend Project → Settings → Domains
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Configure DNS as instructed

### Backend Domain

1. Go to Vercel Dashboard → Backend Project → Settings → Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Configure DNS as instructed
4. Update frontend `VITE_API_URL` to use new domain

## Limitations & Considerations

### Vercel Serverless Limitations

1. **Execution Time**: Max 10 seconds (Hobby), 60 seconds (Pro)
2. **File Size**: Max 50MB deployment size
3. **Memory**: 1024MB (Hobby), 3008MB (Pro)
4. **No Persistent Storage**: Use external services for file uploads

### Workarounds

1. **Long-running Analysis**:
   - Use external job queue (e.g., AWS SQS, Google Cloud Tasks)
   - Or deploy backend to traditional hosting (Heroku, Railway)

2. **File Uploads**:
   - Use Vercel Blob storage
   - Or external storage (AWS S3, Cloudflare R2)

3. **WebSocket**:
   - Vercel doesn't support WebSockets well
   - Consider using Pusher, Ably, or Socket.io with Redis adapter

## Testing Deployment

### Test Frontend

```bash
curl https://your-frontend.vercel.app
```

### Test Backend

```bash
# Health check
curl https://your-backend.vercel.app/health

# Test API
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Project → Deployments
2. Click on a deployment
3. View function logs in real-time

### Analytics

Vercel provides built-in analytics:
- Page views
- Performance metrics
- Error tracking

Enable in: Project Settings → Analytics

## Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify all dependencies are in `package.json` or `requirements.txt`
3. Ensure build commands are correct

### Runtime Errors

1. Check function logs in Vercel Dashboard
2. Verify environment variables are set correctly
3. Check database connectivity

### CORS Issues

1. Verify `CORS_ORIGIN` matches frontend URL exactly
2. Include protocol (`https://`)
3. No trailing slash

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

Configure in: Project Settings → Git

## Cost Estimation

### Vercel Pricing

- **Hobby Plan**: Free
  - 100 GB bandwidth
  - 100 GB-hrs function execution
  - Unlimited deployments

- **Pro Plan**: $20/month
  - 1 TB bandwidth
  - 1000 GB-hrs function execution
  - Advanced features

## Alternative: Deploy Backend Separately

If Vercel serverless limitations are too restrictive for the backend:

1. Deploy frontend to Vercel (works great)
2. Deploy backend to:
   - **Heroku**: Easy Python deployment
   - **Railway**: Modern hosting platform
   - **Fly.io**: Global deployment
   - **AWS Elastic Beanstalk**: Scalable hosting
   - **DigitalOcean App Platform**: Simple PaaS

Then update `VITE_API_URL` to point to the separate backend.

## Recommended Production Setup

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
│  - React App    │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐     ┌──────────────┐
│  Railway/Heroku │────▶│  Supabase    │
│  (Backend)      │     │  (Postgres)  │
│  - Flask API    │     └──────────────┘
│  - Workers      │
└────────┬────────┘     ┌──────────────┐
         │              │  Upstash     │
         └─────────────▶│  (Redis)     │
                        └──────────────┘
```

This gives you:
- ✅ Fast global CDN for frontend (Vercel)
- ✅ Full server for backend (Railway/Heroku)
- ✅ Managed database (Supabase)
- ✅ Managed Redis (Upstash)
- ✅ WebSocket support
- ✅ Background jobs
- ✅ No serverless limitations

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

For application issues:
- See main [README.md](./README.md)
- Check [GitHub Issues](https://github.com/yourusername/ai-code-review-platform/issues)
