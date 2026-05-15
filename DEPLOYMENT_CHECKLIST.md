# 🚀 Quick Start Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] Clone repository and install dependencies
- [ ] Create `.env` files in each folder (use `.env.example` as template)
- [ ] Run backend: `cd backend && npm start`
- [ ] Run AI service: `cd ai_service && python app.py`
- [ ] Run frontend: `cd frontend && npm run dev`
- [ ] Test upload flow at `http://localhost:5173/live`
- [ ] Check Admin panel for violations
- [ ] Generate and download a sample challan

## GitHub Setup

- [ ] Create GitHub repository
- [ ] Initialize git in project root
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit for deployment"`
- [ ] Push to GitHub: `git push -u origin main`
- [ ] Verify all files are on GitHub

## Frontend Deployment (Vercel)

- [ ] Go to vercel.com and sign in
- [ ] Click "Add New..." → "Project"
- [ ] Select your GitHub repository
- [ ] Select **Frontend folder as root**
- [ ] Framework: **Vite**
- [ ] Add Environment Variables:
  - `VITE_API_URL=https://your-backend.vercel.app/api`
  - `VITE_AI_SERVICE_URL=https://your-ai-service.railway.app`
- [ ] Click Deploy
- [ ] Wait for deployment (2-3 minutes)
- [ ] Note your Frontend URL
- [ ] Test: Visit your frontend URL and verify no console errors

## Backend Deployment (Vercel)

- [ ] Create new Vercel project
- [ ] Select same GitHub repository
- [ ] Select **Backend folder as root**
- [ ] Framework: **Node.js**
- [ ] Add Environment Variables:
  ```
  NODE_ENV=production
  AI_SERVICE_URL=https://your-ai-service.railway.app
  CORS_ORIGIN=https://your-frontend-url.vercel.app
  DB_HOST=your-db-host
  DB_USER=postgres
  DB_PASSWORD=your_password
  DB_NAME=traffic_db
  ```
- [ ] Click Deploy
- [ ] Note your Backend URL
- [ ] Test: `curl https://your-backend.vercel.app/api/violations`

## AI Service Deployment (Railway)

- [ ] Go to railway.app and sign in with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Root directory: **ai_service**
- [ ] Add Environment Variables:
  ```
  BACKEND_API_URL=https://your-backend.vercel.app/api/violations/record
  DEBUG=false
  UPLOAD_FOLDER=/tmp/uploads
  PROCESSED_FOLDER=/tmp/processed
  PORT=8000
  ```
- [ ] Click Deploy
- [ ] Note your AI Service URL
- [ ] Test: `curl https://your-ai-service.railway.app/health`

## Post-Deployment Setup

- [ ] Update Frontend env variables with final AI Service URL
- [ ] Update Backend env variables with final AI Service URL
- [ ] Trigger redeploy in Vercel Dashboard
- [ ] Test full flow: Upload → Process → Download challan
- [ ] Check Admin panel loads violations correctly
- [ ] Verify Challans page shows approved violations

## Final Testing

- [ ] Frontend loads: ✓ `https://your-app.vercel.app`
- [ ] Landing page displays: ✓
- [ ] Navigation works: ✓
- [ ] Upload page loads: ✓
- [ ] Admin panel loads: ✓
- [ ] Challans page loads: ✓
- [ ] Video upload works: ✓
- [ ] Violations appear in admin: ✓
- [ ] Challan PDF downloads: ✓
- [ ] Dashboard shows statistics: ✓

## Monitoring & Support

- [ ] Set up error notifications in Vercel
- [ ] Monitor AI service logs on Railway
- [ ] Set up database backups
- [ ] Document custom domain setup (optional)
- [ ] Share deployed URL with team

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "AI Service Unavailable" | Check AI Service URL in env vars and verify Railway deployment |
| Backend returns 500 | Check backend logs in Vercel, verify database connection |
| Upload fails | Check file size limits, verify AI service is running |
| CORS errors | Update CORS_ORIGIN in backend env variables |
| Videos not processing | Check AI service logs on Railway, verify GPU availability |
| Challan not generating | Verify pdfkit is installed, check image paths |

---

**Total Time: 30-45 minutes**

Good luck! 🎉
