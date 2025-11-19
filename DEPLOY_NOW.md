# Quick Deployment Guide to Vercel

## 🚀 Deploy in 5 Minutes

### Prerequisites
- Vercel account (free): https://vercel.com/signup
- Your repository on GitHub

### Method 1: Vercel Dashboard (Recommended - Easiest)

#### Step 1: Deploy Frontend
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select this repository
4. Configure:
   - **Project Name**: `ai-code-review-frontend`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   VITE_WS_URL=wss://your-backend.vercel.app
   ```
   (You'll update this after deploying backend)
6. Click "Deploy"

#### Step 2: Deploy Backend
1. Go to https://vercel.com/new again
2. Import the same repository
3. Configure:
   - **Project Name**: `ai-code-review-backend`
   - **Root Directory**: `backend-flask`
   - **Framework Preset**: Other
4. Add Environment Variables:
   ```
   DATABASE_URL=your_postgres_url
   SECRET_KEY=your_secret_key_here
   ANTHROPIC_API_KEY=your_anthropic_key
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   FLASK_ENV=production
   ```
5. Click "Deploy"

#### Step 3: Update Frontend Environment
1. Copy your backend URL from Vercel (e.g., `https://ai-code-review-backend.vercel.app`)
2. Go to Frontend Project → Settings → Environment Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy frontend

### Method 2: Vercel CLI

If you have a Vercel token:

```bash
# Set your token
export VERCEL_TOKEN=your_token_here

# Deploy frontend
cd frontend
vercel --token $VERCEL_TOKEN --prod

# Deploy backend
cd ../backend-flask
vercel --token $VERCEL_TOKEN --prod
```

## Required Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.vercel.app
VITE_WS_URL=wss://your-backend.vercel.app
```

### Backend (.env)
```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security (Required)
SECRET_KEY=your-long-random-secret-key

# AI Integration (Required)
ANTHROPIC_API_KEY=sk-ant-...

# CORS (Required)
CORS_ORIGIN=https://your-frontend.vercel.app

# Environment
FLASK_ENV=production
```

## Database Options for Vercel

### Option 1: Vercel Postgres (Easiest)
1. Go to Vercel Dashboard → Storage
2. Create Postgres Database
3. Copy connection string
4. Add to backend `DATABASE_URL`

### Option 2: Supabase (Free Tier)
1. Create account: https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use connection pooler)
5. Add to backend `DATABASE_URL`

### Option 3: Neon (Serverless Postgres)
1. Create account: https://neon.tech
2. Create new project
3. Copy connection string
4. Add to backend `DATABASE_URL`

## Get API Keys

### Anthropic API Key
1. Go to: https://console.anthropic.com
2. Create account/login
3. Go to API Keys
4. Create new key
5. Copy to `ANTHROPIC_API_KEY`

### Generate Secret Key
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Testing Your Deployment

### Test Frontend
```bash
curl https://your-frontend.vercel.app
```

### Test Backend
```bash
# Health check
curl https://your-backend.vercel.app/health

# Should return: {"status":"ok","message":"Flask backend is running"}
```

## Troubleshooting

### Build Errors
- Check Vercel deployment logs
- Ensure all dependencies are in `package.json`/`requirements.txt`
- Verify Node version is 18+ (set in vercel.json)

### CORS Errors
- Ensure `CORS_ORIGIN` exactly matches frontend URL
- Include `https://` protocol
- No trailing slash

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- For Supabase, use connection pooler URL

### API Key Errors
- Verify `ANTHROPIC_API_KEY` is valid
- Check API key has sufficient credits

## What's Next?

After deployment:
1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Enable Vercel Analytics
4. ✅ Set up monitoring/logging
5. ✅ Configure automatic deployments for git pushes

## Vercel Project URLs

Once deployed, your URLs will be:
- Frontend: `https://ai-code-review-frontend.vercel.app`
- Backend: `https://ai-code-review-backend.vercel.app`

You can also add custom domains in Project Settings → Domains

## Cost

**Vercel Free (Hobby) Plan includes:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hrs serverless function execution
- ✅ Automatic HTTPS
- ✅ Preview deployments for PRs

This is plenty for testing and small production use!

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Main Project Docs: [README.md](./README.md)
- Detailed Guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
