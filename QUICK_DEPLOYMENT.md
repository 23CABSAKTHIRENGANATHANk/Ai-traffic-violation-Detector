# ⚡ QUICK DEPLOYMENT REFERENCE

## 🚀 One-Command Deployment

### Deploy Everything to Vercel

```powershell
# PowerShell - Deploy Backend
cd backend
git add .
git commit -m "Deploy: Production ready"
git push origin main  # Vercel auto-deploys

# PowerShell - Deploy Frontend
cd ../frontend
git add .
git commit -m "Deploy: Production ready"
git push origin main  # Vercel auto-deploys
```

### Deploy AI Service (HuggingFace)

```bash
# SSH into HuggingFace Spaces or push via git
git push huggingface main  # If using HuggingFace git remote
```

---

## ✅ Verification Commands

### Test Backend Locally
```bash
cd backend
npm start
# Server starts on http://localhost:3000
```

### Test Frontend Locally
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

### Test AI Service Locally
```bash
cd ai_service
python -m uvicorn app:app --reload
# Service starts on http://localhost:8000
```

---

## 📊 Endpoint Quick Reference

### Analytics
```
GET /api/analytics
Returns: {
  total_violations,
  violations_by_type,
  violations_by_vehicle_type,
  average_speed,
  status_breakdown,
  fine_amounts
}
```

### Settings
```
GET /api/config/settings
Returns: Full system configuration object
```

### Record Violation
```
POST /api/violations/record
Accepts: {
  vehicle_plate OR vehicle_number,
  violation_type,
  location,
  speed,
  ...
}
```

### Generate Challan
```
GET /api/violations/:id/challan
Returns: PDF challan file
```

### Admin Operations
```
GET    /api/admin/violations?status=pending&limit=10
PATCH  /api/admin/violations/:id?status=resolved
DELETE /api/admin/violations/:id
```

---

## 🔍 Monitoring After Deployment

### Check Vercel Logs
1. Go to https://vercel.com/dashboard
2. Select project (frontend or backend)
3. Click "Deployments" tab
4. Click latest deployment
5. View logs for errors

### Check HuggingFace Logs
1. Go to HuggingFace Spaces dashboard
2. Select AI Traffic Violation Detector
3. View "App info" → "Logs"

### Monitor API Health
```bash
# Test backend is responding
curl http://localhost:3000/api/analytics

# Test frontend is serving
curl http://localhost:5173

# Test AI service
curl http://localhost:8000/docs
```

---

## 🆘 Troubleshooting

### Frontend Build Fails
```
Solution: Delete node_modules and reinstall
cd frontend
rm -r node_modules
npm install
npm run build
```

### Backend Port Already in Use
```
Solution: Kill process on port 3000
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
```
Check environment variables:
- DATABASE_URL should point to your database
- Verify credentials are correct
- Test connection: npm run test:db
```

### CORS Issues
```
Solution: Check backend CORS configuration
In backend/src/index.js:
- Verify frontend URL is in CORS whitelist
- Update origin URL if changed
```

---

## 📋 Deployment Checklist

- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend has no vulnerabilities (`npm audit`)
- [ ] All environment variables set in Vercel
- [ ] Database is accessible from production
- [ ] AI service is running on HuggingFace
- [ ] Test video upload works end-to-end
- [ ] Challan generation produces PDF
- [ ] Analytics dashboard shows data
- [ ] Settings page is functional
- [ ] Admin panel filters work

---

## 🎯 Current Status

```
✅ Frontend: Ready to deploy
✅ Backend: Ready to deploy  
✅ AI Service: Ready to deploy
✅ Database: Connected and tested
✅ All Security: Vulnerabilities patched

🚀 READY FOR PRODUCTION
```

---

## 📞 Emergency Contacts

**If production goes down:**
1. Check Vercel deployment logs
2. Verify database connection
3. Check AI service health on HuggingFace
4. Review recent code changes
5. Rollback to previous deployment if needed

---

**Last Check**: All systems operational  
**Build Status**: ✅ PASSED  
**Ready to Deploy**: YES ✅
