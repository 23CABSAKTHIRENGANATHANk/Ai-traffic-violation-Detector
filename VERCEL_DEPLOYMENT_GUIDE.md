# 🚀 VERCEL DEPLOYMENT GUIDE - AI Traffic Violation Detector

This guide will walk you through deploying the AI Traffic Violation Detector system to production using Vercel and other cloud platforms.

## 📋 Architecture Overview

The system consists of 3 independent components:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│         Deployed on Vercel (Global CDN)                 │
│              vercel.com/new                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│               Backend (Node.js/Express)                  │
│      Deployed on Vercel Serverless Functions            │
│         /api/* routes auto-deployed                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│      AI Service (Python/FastAPI + YOLOv8)               │
│     Deploy on Railway, Render, or Hugging Face          │
│    (Vercel does NOT support Python/GPU services)        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Free tier sufficient
3. **Railway/Render Account** - For Python AI Service
4. **Environment Variables** - See `.env.example` files

---

## 📝 STEP 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
cd e:\project\project\Ai-traffic-violation-Detector--main

git init
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/Ai-traffic-violation-Detector.git
git push -u origin main
```

### 1.2 Update .gitignore

Ensure you have a proper `.gitignore` file:

```
# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
env/

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
uploads/
processed/

# OS
.DS_Store
Thumbs.db
```

---

## 🌐 STEP 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your GitHub repository
4. Choose **Framework: Vite**
5. Configure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend.vercel.app/api
     VITE_AI_SERVICE_URL=https://your-ai-service.com
     ```

### 2.2 Deploy

```bash
# In Vercel Dashboard:
1. Select "frontend" folder as root
2. Click "Deploy"
3. Copy your domain: https://your-traffic-app.vercel.app
```

**Your Frontend URL**: `https://your-traffic-app.vercel.app`

---

## 🔌 STEP 3: Deploy Backend to Vercel

### 3.1 Create Backend Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Create another **"New Project"**
3. Select the same GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     DB_HOST=your-postgres-host
     DB_PORT=5432
     DB_USER=postgres
     DB_PASSWORD=your_secure_password
     DB_NAME=traffic_db
     AI_SERVICE_URL=https://your-ai-service.com
     CORS_ORIGIN=https://your-traffic-app.vercel.app
     ```

### 3.2 Database Configuration

**Option A: Use Vercel PostgreSQL** (Recommended)
- In Vercel Dashboard → Settings → Storage
- Create PostgreSQL database
- Copy connection string to `DATABASE_URL`

**Option B: Use External Database** (Railway, AWS RDS, etc.)
- Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Backend URL**: `https://your-backend.vercel.app/api`

---

## 🤖 STEP 4: Deploy AI Service

### Option A: Deploy on Railway (Recommended for Python)

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. **Root directory**: `ai_service`
5. Configure **Environment Variables**:
   ```
   BACKEND_API_URL=https://your-backend.vercel.app/api/violations/record
   DEBUG=false
   UPLOAD_FOLDER=/tmp/uploads
   PROCESSED_FOLDER=/tmp/processed
   ```
6. Set **PORT**: 8000
7. Add `PORT=8000` to runtime

**AI Service URL**: `https://your-ai-service.railway.app`

### Option B: Deploy on Render

1. Go to [render.com](https://render.com)
2. Create **New Web Service**
3. Connect GitHub repository
4. Configure:
   - **Root directory**: `ai_service`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `python -m uvicorn app:app --host 0.0.0.0 --port 8000`
   - **Environment Variables** (same as Railway)

### Option C: Deploy on Hugging Face Spaces

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Create new Space → Docker
3. Upload `ai_service/` folder
4. Configure `Dockerfile` with your port and start command
5. Spaces will handle auto-scaling

---

## 🔄 STEP 5: Update Environment Variables

### 5.1 Frontend Environment

After getting backend and AI service URLs, update:

**Frontend Vercel Dashboard → Settings → Environment Variables**:

```
VITE_API_URL=https://your-backend.vercel.app/api
VITE_AI_SERVICE_URL=https://your-ai-service.railway.app
```

### 5.2 Backend Environment

**Backend Vercel Dashboard → Settings → Environment Variables**:

```
AI_SERVICE_URL=https://your-ai-service.railway.app
CORS_ORIGIN=https://your-traffic-app.vercel.app
```

---

## ✅ Testing Deployment

### 1. Test Frontend

```bash
# Visit your frontend URL
https://your-traffic-app.vercel.app

# Check console for API errors
```

### 2. Test Backend API

```bash
# Test base endpoint
curl https://your-backend.vercel.app/api/

# Test violations endpoint
curl https://your-backend.vercel.app/api/violations
```

### 3. Test AI Service

```bash
# Test health
curl https://your-ai-service.railway.app/health

# The upload video will call this
# POST https://your-ai-service.railway.app/detect
```

### 4. End-to-End Test

1. Open: `https://your-traffic-app.vercel.app/live`
2. Upload a test traffic video
3. Check if AI service receives and processes it
4. View results in Admin panel

---

## 🚨 Troubleshooting

### Frontend shows "AI Service Unavailable"

- [ ] Check AI Service URL in env variables
- [ ] Verify AI service is running (`https://your-ai-service.railway.app/health`)
- [ ] Check CORS headers in AI service
- [ ] Review browser console for errors

### Backend API returns 500 errors

- [ ] Check backend logs in Vercel Dashboard
- [ ] Verify database connection string
- [ ] Ensure `postgres` library is installed
- [ ] Check environment variables are set

### Video upload fails

- [ ] Check file size limit (default 500MB)
- [ ] Verify `BACKEND_API_URL` in AI service env
- [ ] Check AI service logs for processing errors
- [ ] Ensure `/tmp/uploads` and `/tmp/processed` have write permissions

### Challan PDF generation fails

- [ ] Verify `pdfkit` is installed in backend
- [ ] Check evidence image path exists
- [ ] Review error logs in backend

---

## 📊 Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] CORS headers configured
- [ ] Database is backed up
- [ ] Error logging enabled
- [ ] Rate limiting configured (prevent abuse)
- [ ] File upload size limits set
- [ ] API rate limiting enabled
- [ ] SSL certificates auto-renewed
- [ ] Monitoring and alerts configured
- [ ] Test video uploads work end-to-end

---

## 💰 Cost Estimates (Monthly)

| Component | Platform | Cost |
|-----------|----------|------|
| **Frontend** | Vercel | Free tier / $20 Pro |
| **Backend** | Vercel | Free tier / $10-50 |
| **AI Service** | Railway | $5-20 (depending on usage) |
| **Database** | Vercel Postgres | $15+ / Pay-as-you-go |
| **Total** | - | **Free - $100+** |

**Total Free Tier Estimate**: Can run completely free with usage limits.

---

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Database Access**: Use connection pooling
3. **API Keys**: Rotate regularly
4. **CORS**: Whitelist specific origins only
5. **Rate Limiting**: Prevent API abuse
6. **Input Validation**: Sanitize all uploads
7. **Logging**: Monitor for suspicious activity

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://railway.app/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **YOLOv8 Docs**: https://docs.ultralytics.com

---

## 🎯 Next Steps

1. Push code to GitHub
2. Deploy frontend to Vercel
3. Deploy backend to Vercel
4. Deploy AI service to Railway/Render
5. Update environment variables
6. Test the complete flow
7. Monitor logs and performance
8. Set up alerts for errors

**Estimated time: 30-45 minutes**

---

**Happy Deploying! 🚀**

Last updated: 2024
