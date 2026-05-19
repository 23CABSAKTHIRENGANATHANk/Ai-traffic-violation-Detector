# Quick Deployment to Vercel - 5 Steps

## Step 1: Update Your Local Dependencies
```bash
# Terminal in project root
cd backend
npm ci

cd ../frontend
npm ci

cd ../ai_service
pip install -r requirements.txt

cd ..
```

## Step 2: Connect to Vercel
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy
```

## Step 3: Configure Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=traffic_violations
AI_SERVICE_URL=https://your-ai-service.vercel.app
```

## Step 4: Set Production Domain
After deployment completes:
- Note your deployment URLs
- Update `AI_SERVICE_URL` to point to deployed AI service
- Update frontend API calls to point to deployed backend
- Trigger a redeployment

## Step 5: Verify Deployment
```bash
# Test endpoints
curl https://your-backend.vercel.app/
curl https://your-ai-service.vercel.app/
```

Expected responses:
- Backend: `{"status": "ok"}`
- AI Service: `{"status": "healthy", "ready": true}`

## What Was Fixed

✅ **npm versions stabilized** - No more version conflicts
✅ **Python dependencies pinned** - FastAPI and uvicorn stable versions
✅ **Model size optimized** - Auto-downloads instead of bundled
✅ **Build process improved** - Using `npm ci` for reproducible builds
✅ **Deployment config optimized** - Memory, timeouts, runtime settings

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Deployment fails with npm error | Check backend/package.json - versions are now pinned |
| AI service won't start | First request takes 30-60s to download model - wait |
| 404 on video upload | Verify AI_SERVICE_URL environment variable |
| Database connection error | Check DATABASE_URL and network settings |
| Function timeout | Increase maxDuration in vercel.json |

## Next Steps

1. Test each endpoint locally first
2. Deploy backend first, then AI service, then frontend
3. Monitor Vercel Analytics for performance
4. Set up error tracking and alerts
5. Configure custom domain

For detailed information, see: [VERCEL_FIXES_COMPLETE.md](VERCEL_FIXES_COMPLETE.md)
