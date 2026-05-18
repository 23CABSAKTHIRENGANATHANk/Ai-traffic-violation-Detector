# Setup Guide for AI Traffic Violation Detector

This guide covers deploying the full stack AI Traffic Violation Detection system on Vercel and Hugging Face.

## 🏗️ Project Structure

```
.
├── frontend/           # React + Vite frontend
├── backend/            # Node.js Express API
├── ai_service/         # Python FastAPI AI service (for Hugging Face)
└── docker-compose.yml  # Local development setup
```

## 📋 Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 12+
- Python 3.8+ (for AI service)
- Vercel CLI: `npm install -g vercel`
- Git & GitHub account
- Hugging Face account (for AI deployment)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd Ai-traffic-violation-Detector--main
```

### 2. Environment Setup

Create `.env.local` at project root:

```env
# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:8000

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/traffic_violations
NODE_ENV=development

# AI Service
PYTHONUNBUFFERED=1
```

### 3. Start Services

#### Option A: Using Docker Compose

```bash
docker-compose up -d
```

#### Option B: Manual Setup

**Backend:**
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**AI Service (Python):**
```bash
cd ai_service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8000
```

---

## 🌐 Vercel Deployment

### Frontend Deployment

```bash
cd frontend
vercel --prod
```

**Configure in Vercel Dashboard:**
- Environment Variables:
  - `VITE_API_URL`: Your backend API URL
  - `VITE_AI_SERVICE_URL`: Hugging Face space URL

### Backend Deployment

```bash
cd backend
vercel --prod
```

**Configure in Vercel Dashboard:**
- Environment Variables:
  - `DATABASE_URL`: PostgreSQL connection string
  - `AI_SERVICE_URL`: Hugging Face space URL
  - `NODE_ENV`: production

### Root Monorepo Deployment

```bash
vercel --prod
```

---

## 🤗 Hugging Face Deployment

### Step 1: Create Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create New Space"
3. Choose "Space Settings"
   - Name: `ai-traffic-detector`
   - License: MIT
   - Visibility: Public
   - Space SDK: Docker

### Step 2: Deploy AI Service

```bash
cd ai_service

# Create git remote (in your HF space)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/ai-traffic-detector

# Push to HF
git push hf main
```

### Step 3: Configure

**Create `.env` in ai_service:**
```env
HF_SPACE=1
API_PORT=7860
DEBUG=0
```

**Dockerfile (already included):**
- Uses Python 3.9
- Exposes port 7860
- Auto-reloads on changes

---

## 🗄️ Database Setup

### PostgreSQL Connection

```bash
# Create database
createdb traffic_violations

# Run migrations
psql traffic_violations < backend/database/init.sql

# Run additional migrations
psql traffic_violations < backend/database/migrations.sql
```

### Environment Variables

Set in Vercel:
```
DATABASE_URL=postgresql://user:password@host:5432/traffic_violations
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=traffic_violations
```

### Using Supabase (Recommended)

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → URI
4. Copy connection string
5. Set `DATABASE_URL` in Vercel

---

## 🔑 API Endpoints

### Violations Management

**GET** `/api/violations`
- Fetch all violations with optional filters
- Query params: `status`, `violation_type`, `vehicle_type`, `search`, `limit`, `offset`

**POST** `/api/violations`
- Create new violation record

**GET** `/api/violations/:id`
- Fetch specific violation

**PATCH** `/api/violations/:id`
- Update violation (status, notes, etc.)

**DELETE** `/api/violations/:id`
- Delete violation

**POST** `/api/violations/:id`
- Generate Challan PDF

### Admin Dashboard

**GET** `/admin/violations`
- Advanced filtering for admin
- Includes review status

---

## 📊 Admin Dashboard Features

- ✅ Real-time violation tracking
- ✅ Advanced filtering (type, status, vehicle, location)
- ✅ Bulk challan generation
- ✅ PDF exports (CSV, JSON)
- ✅ Pagination & sorting
- ✅ Demo mode for testing
- ✅ Live data sync every 15 seconds

---

## 🎯 Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Connect PostgreSQL database (Supabase recommended)
- [ ] Deploy AI service to Hugging Face
- [ ] Test all API endpoints
- [ ] Enable CORS properly
- [ ] Setup monitoring/logging
- [ ] Configure backup strategy
- [ ] Test PDF generation
- [ ] Verify email notifications (if applicable)
- [ ] Load testing for scale

---

## 🐛 Troubleshooting

### API Connection Issues
```bash
# Check backend logs
vercel logs --prod

# Test locally first
curl http://localhost:3000/api/violations
```

### Database Connection Failed
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### AI Service Not Responding
```bash
# Check Hugging Face space status
# Visit: https://huggingface.co/spaces/YOUR_USERNAME/ai-traffic-detector

# Check local
curl http://localhost:8000/health
```

### Vercel Build Fails
```bash
# Clear cache and rebuild
vercel --prod --force

# Check build logs in Vercel dashboard
```

---

## 📱 Deployment URLs

Once deployed:

- **Frontend**: `https://your-domain.vercel.app`
- **Backend**: `https://api-your-domain.vercel.app`
- **AI Service**: `https://huggingface.co/spaces/YOUR_USERNAME/ai-traffic-detector`

---

## 🚨 Important Notes

1. **Environment Variables**: Never commit `.env.local` - use Vercel secrets
2. **Database**: Keep backups of production database
3. **Rate Limiting**: Consider adding rate limiting for APIs
4. **CORS**: Configure CORS headers properly for production
5. **SSL/TLS**: Vercel handles this automatically
6. **Monitoring**: Use Vercel Analytics & Logs for monitoring

---

## 📞 Support

For issues:
1. Check logs: `vercel logs --prod`
2. Review error messages in browser console
3. Check GitHub issues
4. Contact support

---

**Last Updated**: May 2024
**Version**: 1.0.0
