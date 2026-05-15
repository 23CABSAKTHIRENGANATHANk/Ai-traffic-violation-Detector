@echo off
echo ============================================================
echo   AI TRAFFIC VIOLATION DETECTION SYSTEM
echo   Quick Start Script
echo ============================================================
echo.

echo Checking if services are already running...
netstat -ano | findstr ":3000 :5173 :8000" > nul
if %errorlevel% == 0 (
    echo.
    echo [SUCCESS] Services are already running!
    echo.
    echo   Frontend:   http://localhost:5173
    echo   Backend:    http://localhost:3000
    echo   AI Service: http://localhost:8000
    echo.
    echo Open http://localhost:5173 in your browser to use the app!
    echo.
    pause
    exit /b 0
)

echo.
echo Starting all services...
echo.

echo [1/3] Starting Backend (Node.js)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Frontend (React)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Starting AI Service (Python)...
start "AI Service" cmd /k "cd ai_service && python app.py"
timeout /t 5 /nobreak > nul

echo.
echo ============================================================
echo   ALL SERVICES STARTED!
echo ============================================================
echo.
echo   Frontend:   http://localhost:5173
echo   Backend:    http://localhost:3000  
echo   AI Service: http://localhost:8000
echo.
echo   Open http://localhost:5173 in your browser!
echo.
echo   Press any key to close this window...
echo   (The services will keep running in separate windows)
echo ============================================================
pause > nul
