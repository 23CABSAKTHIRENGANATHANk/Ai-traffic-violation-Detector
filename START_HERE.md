# 🚀 START HERE - Visual Quick Start

## ⚡ The Fastest Way (30 seconds to start)

### Step 1: Copy This Command
```
powershell -ExecutionPolicy Bypass -File ".\quick-start.ps1"
```

### Step 2: Paste in PowerShell
- Open PowerShell in project folder
- Right-click → Paste
- Press Enter

### Step 3: Wait (2-5 minutes)
The script automatically:
- Installs all packages
- Creates virtual environments
- Sets up `.env` files
- Shows completion message

### Step 4: Open 3 Separate PowerShell Windows

**Window 1 - Run Backend:**
```
cd backend
npm start
```

**Window 2 - Run AI Service:**
```
cd ai_service
.\venv\Scripts\Activate.ps1
python app.py
```

**Window 3 - Run Frontend:**
```
cd frontend  
npm run dev
```

### Step 5: Open Browser
```
http://localhost:5173
```

---

## ✅ What You'll See

### Frontend Loads
- Beautiful UI with tabs
- Upload, Admin, Challans, Dashboard

### Backend Running (Port 3000)
- Server running on port 3000 ✓

### AI Service Running (Port 8000)
- Uvicorn running on http://0.0.0.0:8000 ✓

---

## 🎯 Test It Works

1. Click **"Live"** tab → Upload page loads ✓
2. Click **"Admin"** tab → Admin panel loads ✓
3. Click **"Challans"** tab → Challans page loads ✓
4. Click **"Dashboard"** tab → Dashboard loads ✓
5. Browser console → No red errors ✓

---

## 📊 Status Check

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | Should load |
| Backend | http://localhost:3000/api | Should respond |
| AI | http://localhost:8000/docs | Should load |

---

## 🐛 If Something Goes Wrong

### Error: "quick-start.ps1 not found"
- Make sure you're in the right folder:
```
e:\project\project\Ai-traffic-violation-Detector--main
```

### Error: "Module not found"
```powershell
cd backend
rm -r node_modules
npm install
cd ..
```

### Error: "Port already in use"
- Close other terminals using those ports
- Or change ports in code

### Error: "Python not found"
- Install Python from python.org
- Restart PowerShell

---

## 📚 Need More Help?

- **QUICK_START_GUIDE.md** - Full guide with all options
- **LOCAL_DEVELOPMENT_GUIDE.md** - Detailed troubleshooting
- **ERRORS_FIXED_SUMMARY.md** - What was fixed

---

## ⏱️ Timeline

```
Run script:        2-5 minutes
Open 3 windows:    1 minute
Start services:    1 minute
Load browser:      30 seconds
──────────────────────────
Total:             ~10 minutes  ⏰
```

---

## 🎉 You're Done!

Your AI Traffic Violation System is running locally.

**Next Steps:**
1. Upload a test video (any MP4/AVI)
2. Check violations in Admin panel
3. Generate challan PDF
4. When ready → Deploy to Vercel (see VERCEL_DEPLOYMENT_GUIDE.md)

---

## 🔑 Key Commands

```powershell
# Everything at once:
powershell -ExecutionPolicy Bypass -File ".\quick-start.ps1"

# Then in 3 terminals:
cd backend && npm start
cd ai_service && .\venv\Scripts\Activate.ps1 && python app.py
cd frontend && npm run dev
```

---

## ✨ What's Working

✅ Video upload  
✅ Real-time processing  
✅ Violation detection  
✅ Admin dashboard  
✅ PDF generation  
✅ Statistics tracking  

---

**Ready? Run the command above and enjoy! 🚀**

For detailed help, see QUICK_START_GUIDE.md
