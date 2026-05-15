# 🚀 Quick Start - How to Run the Project

## ⚡ Fastest Way to Start (Choose Your Terminal)

### **Option 1: PowerShell (Windows 10/11)** ⭐ RECOMMENDED FOR WINDOWS
```powershell
# Navigate to project root first
cd e:\project\project\Ai-traffic-violation-Detector--main

# Run the PowerShell setup script
.\quick-start.ps1
```

### **Option 2: Command Prompt (cmd.exe)**
```cmd
cd e:\project\project\Ai-traffic-violation-Detector--main
quick-start.bat
```

### **Option 3: Git Bash / WSL (Windows Linux)**
```bash
cd /path/to/Ai-traffic-violation-Detector--main
bash quick-start.sh
```

### **Option 4: Manual Setup (No Script)**
See section below

---

## 🎯 If PowerShell Script Fails

**PowerShell cannot run unsigned scripts by default.** Use one of these solutions:

### Solution 1: Allow Script Execution (Temporary)
```powershell
# Run ONCE in PowerShell as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run:
```powershell
.\quick-start.ps1
```

### Solution 2: Run Using Bypass Flag
```powershell
PowerShell -ExecutionPolicy Bypass -File quick-start.ps1
```

### Solution 3: Use Command Prompt Instead
```cmd
# Open Command Prompt (cmd.exe) instead
cd path\to\project
quick-start.bat
```

### Solution 4: Manual Setup (Guaranteed to Work)
Follow the manual steps below.

---

## 🔧 Manual Setup (Step by Step)

### Step 1: Setup Backend
```powershell
cd backend
npm install
copy .env.example .env
# Edit .env if needed (defaults work for local testing)
```

### Step 2: Setup Frontend
```powershell
cd ../frontend
npm install
copy .env.example .env
# Edit .env if needed (defaults work for local testing)
```

### Step 3: Setup AI Service
```powershell
cd ../ai_service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

### Step 4: Run All Services

**Open 3 separate PowerShell windows** and run each:

**Window 1 - Backend:**
```powershell
cd backend
npm start
# Should show: "Server running on port 3000"
```

**Window 2 - AI Service:**
```powershell
cd ai_service
.\venv\Scripts\Activate.ps1
python app.py
# Should show: "Uvicorn running on http://0.0.0.0:8000"
```

**Window 3 - Frontend:**
```powershell
cd frontend
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 5: Open Browser
```
http://localhost:5173
```

---

## ✅ Verify It's Working

After starting all services:

1. **Frontend loads** → http://localhost:5173 ✓
2. **Upload page works** → Click "Live" tab ✓
3. **Admin panel loads** → Click "Admin" tab ✓
4. **No red errors** in browser console ✓

---

## 🐛 Troubleshooting

### Error: "Port 3000/5173/8000 already in use"
```powershell
# Kill the process using the port
# Kill process on port 3000:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or change the port in the code:
# Backend: backend/src/index.js -> PORT = 3001
# Frontend: frontend/vite.config.js -> edit the port
# AI Service: ai_service/app.py -> port 8001
```

### Error: "Module not found"
```powershell
# Backend
cd backend
rm -r node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -r node_modules package-lock.json
npm install

# AI Service
cd ../ai_service
pip install --upgrade pip
pip install -r requirements.txt
```

### Error: "Python not found"
- Install Python from https://python.org
- Make sure to check "Add Python to PATH" during installation
- Restart terminal after installation

### Error: "Node not found"
- Install Node.js from https://nodejs.org
- Choose LTS version
- Restart terminal after installation

### AI Service takes forever to start
- First run downloads YOLO model (~150MB)
- This is normal, wait 2-3 minutes
- Subsequent runs will be faster

---

## 📝 Environment Variables (.env files)

All `.env.example` files are already in place. Copy them to `.env` and they work with defaults:

```bash
# Backend
cd backend
copy .env.example .env

# Frontend
cd ../frontend
copy .env.example .env

# AI Service
cd ../ai_service
copy .env.example .env
```

**For local testing, defaults work perfectly!**

---

## 🚀 What Happens After Running Scripts

### Backend (port 3000)
- Starts Express server
- Creates mock database with sample violations
- Listens for API requests

### Frontend (port 5173)
- Starts Vite dev server
- Hot-reload enabled (auto-updates when you save)
- Shows beautiful UI for video upload

### AI Service (port 8000)
- Starts FastAPI server
- Downloads YOLO model (first time only)
- Ready to process videos

---

## 🎯 Next Actions

### To Upload a Video:
1. Go to http://localhost:5173/live
2. Select a video file (any MP4 or AVI)
3. Click "ANALYZE & GENERATE"
4. Wait for processing
5. See live stream with annotations

### To View Violations:
1. Go to http://localhost:5173/admin
2. See detected violations
3. Click "Generate Challan" to create PDF

### To Check Dashboard:
1. Go to http://localhost:5173/dashboard
2. View statistics and trends

---

## 📚 For More Help

- **LOCAL_DEVELOPMENT_GUIDE.md** - Detailed setup and troubleshooting
- **VERCEL_DEPLOYMENT_GUIDE.md** - Deploy to production
- **API_DOCUMENTATION.md** - API endpoints reference

---

## 💡 Pro Tips

1. **Keep services running** - All 3 must run simultaneously
2. **Check console errors** - Browser console shows actual errors
3. **Git Bash is easiest** - Handles file paths better than PowerShell
4. **Use Command Prompt for batch files** - Simpler than PowerShell
5. **Test locally first** - Before deploying to production

---

## ⏱️ Expected Startup Times

- Backend: 2-3 seconds
- Frontend: 5-10 seconds  
- AI Service: 30-60 seconds (first time longer due to model download)

**Total: ~1-2 minutes** ⏰

---

**Ready? Pick your terminal and start the scripts!** 🎉

For step-by-step deployment to Vercel, see **VERCEL_DEPLOYMENT_GUIDE.md**
