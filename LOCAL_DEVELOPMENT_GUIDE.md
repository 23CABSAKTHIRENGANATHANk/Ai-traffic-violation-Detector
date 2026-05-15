# 🔧 Local Development Setup Guide

This guide helps you set up and run the AI Traffic Violation Detector locally before deploying.

## 📦 System Requirements

- **Node.js**: v16+ (for frontend and backend)
- **Python**: 3.8+ (for AI service)
- **RAM**: 8GB+ (for YOLO model)
- **GPU**: Optional (NVIDIA GPU with CUDA for faster processing)
- **Database**: PostgreSQL 12+ (or use mock in-memory DB)

## 🚀 Setup Instructions

### 1. Clone Repository

```bash
# Navigate to project root
cd e:\project\project\Ai-traffic-violation-Detector--main

# Install git if needed
git init
```

### 2. Setup Backend

```bash
cd backend

# Install Node.js dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your settings (or leave defaults for local mock DB)
# For mock DB, you can use all default values

# Start backend (development mode with nodemon)
npm start

# Output should show: "Server running on port 3000"
```

### 3. Setup AI Service

```bash
cd ../ai_service

# Create Python virtual environment (Windows)
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (optional, defaults work fine)
copy .env.example .env

# Start AI service
python app.py

# Output should show: "Uvicorn running on http://0.0.0.0:8000"
```

### 4. Setup Frontend

```bash
cd ../frontend

# Install Node.js dependencies
npm install

# Create .env file (optional for local development)
copy .env.example .env

# Edit .env - for local testing, defaults work:
# VITE_API_URL=http://localhost:3000/api
# VITE_AI_SERVICE_URL=http://localhost:8000

# Start development server
npm run dev

# Output should show: "Local: http://localhost:5173"
```

## 🌐 Access the Application

Once all services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | User interface |
| **Backend API** | http://localhost:3000/api | REST API |
| **AI Service** | http://localhost:8000 | Video processing |
| **AI Docs** | http://localhost:8000/docs | FastAPI Swagger docs |

## 📝 Testing the System

### 1. Prepare a Test Video

- Use any MP4 or AVI video (recommended: 10-30 seconds)
- Can be traffic footage or any video with vehicles
- File size: less than 100MB

### 2. Test Upload

1. Open http://localhost:5173/live
2. Click "Select Traffic Video"
3. Choose your test video
4. Click "ANALYZE & GENERATE"
5. Watch the progress bar

### 3. View Live Stream

- The AI service will process the video
- A live stream with annotations should appear
- Wait for processing to complete (status: 100%)

### 4. Check Admin Panel

1. Open http://localhost:5173/admin
2. You should see detected violations
3. Each violation shows:
   - Vehicle type
   - Violation type
   - Speed detected
   - Confidence score
   - Evidence image

### 5. Generate Challan

1. In Admin panel, find a violation
2. Click "Generate Challan" button
3. A PDF should download with:
   - Violation details
   - Fine amount
   - Evidence image
   - Timestamp

### 6. View Challans

1. Open http://localhost:5173/challans
2. You should see approved violations
3. Download PDFs again if needed

### 7. Check Dashboard

1. Open http://localhost:5173/dashboard
2. View statistics:
   - Total violations detected
   - Pending reviews
   - Revenue generated
   - Violation trends

## 🐛 Troubleshooting

### AI Service Issues

**Error: "No module named 'ultralytics'"**
```bash
# Install missing dependencies
pip install ultralytics opencv-python
```

**Error: "CUDA not available" (GPU-related)**
```bash
# This is fine, YOLOv8 will use CPU
# Processing will be slower but still works
```

**Service won't start on port 8000**
```bash
# Check if port is in use
# Change port in ai_service/app.py:
# app.run(port=8001, debug=True)
```

### Backend Issues

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

**Port 3000 already in use**
```bash
# Change port in backend/src/index.js:
# const PORT = process.env.PORT || 3001
```

**Database connection error**
```bash
# This is expected if PostgreSQL not installed
# System uses in-memory mock database instead
# All data is reset when backend restarts
```

### Frontend Issues

**Blank page or console errors**
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

**"Cannot GET /api/violations"**
```bash
# Backend is not running
# Start backend: cd backend && npm start
```

**Videos not uploading**
```bash
# Check browser console for errors
# Verify AI service is running
# Check VITE_AI_SERVICE_URL in .env file
```

## 🔄 Restarting Services

If you make changes to code:

### Backend Changes
```bash
# Backend auto-reloads with nodemon
# Just save the file and browser will refresh
```

### AI Service Changes
```bash
# Stop the service: Ctrl+C
# Restart: python app.py
```

### Frontend Changes
```bash
# Frontend hot-reloads automatically
# Just save and browser updates instantly
```

## 📊 Test Data

The system comes with sample data:

**Sample Violations in Mock DB**:
1. Overspeeding: Vehicle TN38AB1234, speed 85 km/h
2. No Helmet: Motorcycle KA01HJ9988, confidence 88%

Use these to test the admin and challan features without uploading videos.

## 💾 Database

### Using Mock Database (Default)

- In-memory storage
- Data resets when backend restarts
- No PostgreSQL installation needed
- Perfect for testing

### Using PostgreSQL (Optional)

```bash
# Install PostgreSQL and create database
# Update backend/.env:
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=traffic_db

# Backend will use real database instead of mock
```

## 🚀 Performance Tips

### Faster Video Processing
- Use **GPU**: Install CUDA and enable GPU in YOLOv8
- Smaller videos: Process shorter clips first
- Lower resolution: Test with lower quality videos

### Better Development Experience
- Use **VS Code**: Install Python and REST Client extensions
- API Testing: Use Postman or Thunder Client
- Database: Use DBeaver for database visualization

## 📱 Testing on Different Devices

### Same Machine
- Frontend: http://localhost:5173
- Works perfectly for local testing

### Different Computer on Network
```bash
# Find your machine's IP
# Windows: ipconfig
# Mac/Linux: ifconfig

# Access from other computer:
# http://YOUR_IP:5173 (frontend)
# http://YOUR_IP:3000/api (backend)
# http://YOUR_IP:8000 (AI service)
```

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com
- **YOLOv8**: https://docs.ultralytics.com
- **React**: https://react.dev
- **Express.js**: https://expressjs.com

## ✅ Checklist Before Deployment

- [ ] All services start without errors
- [ ] Video upload and processing works
- [ ] Violations appear in admin panel
- [ ] Challan PDF generates correctly
- [ ] Dashboard shows statistics
- [ ] No console errors in browser
- [ ] API endpoints respond correctly
- [ ] Database operations work (or mock DB functioning)

---

**Happy developing! 🎉**

For deployment to production, see `VERCEL_DEPLOYMENT_GUIDE.md`
