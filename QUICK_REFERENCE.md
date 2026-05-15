# 🚀 Quick Reference Guide

## ⚡ Quick Start (5 minutes)

### Local Development
```bash
# 1. Start all services
docker-compose up

# 2. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000/api
# AI Service: http://localhost:8000
```

---

## 🔑 Key Endpoints

### Frontend Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | Main dashboard |
| `/live` | Video upload & detection |
| `/admin` | Admin management |
| `/analytics` | Analytics dashboard |
| `/challans` | View generated challans |
| `/settings` | System configuration |

### Backend API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/violations/record` | Record violation |
| GET | `/api/violations` | List violations |
| POST | `/api/violations/{id}/challan` | Generate challan |
| GET | `/api/analytics` | Get analytics |
| GET | `/api/admin/violations` | Admin violations list |
| PATCH | `/api/admin/violations` | Update violation status |
| GET | `/api/config/settings` | Get settings |
| PUT | `/api/config/settings` | Update settings |

### AI Service API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/detect` | Upload video |
| GET | `/video_feed` | Stream processing |
| GET | `/violations` | Get detected violations |

---

## 🔧 Common Tasks

### Add a New Violation Type

1. **Backend** - Add to fine amounts (`backend/lib/utils.js`):
```javascript
const FINES = {
  'NEW_VIOLATION': 3500
};
```

2. **AI Service** - Add detection logic (`ai_service/app.py`):
```python
if condition_for_violation:
    detected_violations.append("NEW_VIOLATION")
```

3. **Frontend** - Update colors (`frontend/src/pages/Admin.jsx`):
```javascript
const VIOLATION_COLORS = {
  'NEW_VIOLATION': { bg: 'bg-blue-500/15', text: 'text-blue-400' }
};
```

### Deploy Frontend Update

```bash
cd frontend
npm run build
vercel deploy
```

### Deploy Backend Update

```bash
cd backend
npm install
vercel deploy
```

### Update Settings

1. Modify `backend/api/config/settings.js` defaults
2. Access at `/settings` page to override
3. Or use API:
```bash
curl -X PUT http://localhost:3000/api/config/settings \
  -H "Content-Type: application/json" \
  -d '{"settings": {...}}'
```

---

## 🐛 Debugging

### Enable Debug Logs
```bash
# AI Service
DEBUG=* python ai_service/app.py

# Backend
DEBUG=* npm start
```

### Common Issues

**Issue**: Video not processing
```bash
# Check AI service logs
# Verify video file exists in uploads folder
# Check file format is supported
```

**Issue**: Violations not showing
```bash
# Verify database connection
# Check backend logs for errors
# Verify AI service is running
```

**Issue**: Challan not generating
```bash
# Check evidence image path
# Verify pdfkit is installed
# Check disk space
```

---

## 📊 Database

### Key Tables
- `violations` - Detected violations
- `challans` - Generated challans
- `users` - User accounts (if implemented)

### Common Queries

**Count violations by type**:
```sql
SELECT violation_type, COUNT(*) 
FROM violations 
GROUP BY violation_type;
```

**Get pending violations**:
```sql
SELECT * FROM violations 
WHERE status = 'PENDING' 
ORDER BY timestamp DESC;
```

**Calculate total fines**:
```sql
SELECT SUM(fines) FROM violations 
WHERE status = 'APPROVED';
```

---

## 🔐 Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@localhost/dbname
BACKEND_API_URL=http://localhost:3000/api/violations/record
NODE_ENV=production
```

### Frontend
```env
VITE_API_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:8000
```

### AI Service
```env
BACKEND_API_URL=http://localhost:3000/api/violations/record
MODEL_PATH=./ai_service/yolov8n.pt
```

---

## 📱 Testing API Responses

### Test Violation Recording
```bash
curl -X POST http://localhost:3000/api/violations/record \
  -H "Content-Type: application/json" \
  -d '{
    "video_id":"test",
    "violation_type":"OVERSPEEDING",
    "speed":85,
    "vehicle_plate":"TN38AB1234",
    "timestamp":"2024-05-15T10:00:00Z",
    "confidence":0.95,
    "vehicle_type":"CAR",
    "evidence_image_path":"test.jpg"
  }' | jq
```

### Test Analytics
```bash
curl http://localhost:3000/api/analytics | jq '.violations_by_type'
```

### Test Settings
```bash
curl http://localhost:3000/api/config/settings | jq '.fine_amounts'
```

---

## 📈 Performance Tuning

### Frontend
- Enable code splitting: Already done with Vite
- Optimize images: Use WebP format
- Cache charts: Memoize components

### Backend
- Add database indexes on frequently queried fields
- Implement query caching
- Use connection pooling

### AI Service
- Reduce frame processing resolution for speed
- Skip frames for real-time processing
- Use GPU acceleration if available

---

## 🔄 Continuous Integration

### Pre-push Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] No unused imports
- [ ] Code formatted
- [ ] Comments added for complex logic

### Pre-deployment Checklist
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Environment variables set
- [ ] Database backups created
- [ ] Health checks passing

---

## 📚 File Structure

```
project-root/
├── backend/                    # Node.js backend
│   ├── api/                   # API endpoints
│   ├── lib/                   # Utilities
│   ├── database/              # DB schema
│   └── package.json
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── config/           # Configuration
│   │   └── App.jsx
│   └── package.json
├── ai_service/               # Python AI service
│   ├── app.py               # Main FastAPI app
│   ├── util.py              # Utilities
│   └── requirements.txt
└── docker-compose.yml       # Docker setup
```

---

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Vercel backend
vercel rollback

# Vercel frontend
vercel rollback
```

### Database Recovery
```bash
# Restore from backup
pg_restore -d dbname < backup.sql

# Or use Vercel's Postgres recovery
# (if using Vercel Postgres)
```

### Cache Clear
```bash
# Frontend: Manual refresh
localStorage.clear()

# Backend: Restart service
docker-compose restart backend

# AI Service: Restart
docker-compose restart ai_service
```

---

## 💡 Tips & Tricks

### Speed up local development
```bash
# Use hot reload
npm run dev  # in frontend and backend

# Skip docker for frontend
npm run dev  # then open http://localhost:5173
```

### Generate test data
```bash
# Use test_system.py
python test_system.py

# Or manually POST to violations endpoint
```

### Monitor production
```bash
# Vercel logs
vercel logs

# HuggingFace logs
# View in Space settings

# Docker logs
docker-compose logs -f
```

---

## 📞 Getting Help

### Resources
- **API Docs**: `API_DOCUMENTATION.md`
- **Deployment**: `COMPLETE_DEPLOYMENT_GUIDE.md`
- **Testing**: `TESTING_GUIDE.md`
- **Enhancement**: `ENHANCEMENT_SUMMARY.md`

### Debug Mode
1. Enable verbose logging
2. Check error messages
3. Review database state
4. Verify configuration
5. Check service status

### Quick Fixes
- Restart service: `docker-compose restart [service]`
- Clear cache: `localStorage.clear()`
- Reset settings: `/settings` → Reset
- View logs: `docker-compose logs -f [service]`

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Database connected
- [ ] Environment variables set
- [ ] API endpoints working
- [ ] Analytics dashboard functional
- [ ] Admin panel working
- [ ] Settings page functional
- [ ] Challan generation tested
- [ ] Video upload tested
- [ ] Error handling verified
- [ ] Security headers added
- [ ] CORS configured
- [ ] Logs configured
- [ ] Monitoring enabled

---

**Last Updated**: May 15, 2024
**Status**: ✅ Production Ready
