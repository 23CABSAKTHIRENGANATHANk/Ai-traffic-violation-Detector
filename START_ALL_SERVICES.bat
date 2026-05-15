@echo off
setlocal EnableDelayedExpansion
echo ============================================================
echo   AI TRAFFIC VIOLATION DETECTION SYSTEM
echo   Starting All Services...
echo ============================================================
echo.

set "ROOT=%~dp0"
set "VENV_PYTHON=%ROOT%ai_service\venv\Scripts\python.exe"
set "SYSTEM_PYTHON=python"

REM Check if venv python exists
if exist "%VENV_PYTHON%" (
    set "PYTHON_CMD=%VENV_PYTHON%"
    echo [OK] Found virtualenv Python: %VENV_PYTHON%
) else (
    set "PYTHON_CMD=%SYSTEM_PYTHON%"
    echo [WARN] Virtualenv not found, using system Python
)

echo.
echo [1/3] Starting Backend (Node.js on port 3000)...
start "Backend Server - Port 3000" cmd /k "cd /d "%ROOT%backend" && node src/index.js"
timeout /t 3 /nobreak > nul

echo [2/3] Starting AI Service (Python FastAPI on port 8000)...
start "AI Service - Port 8000" cmd /k "cd /d "%ROOT%ai_service" && "%PYTHON_CMD%" app.py"
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend (React Vite on port 5173)...
start "Frontend - Port 5173" cmd /k "cd /d "%ROOT%frontend" && npm run dev"
timeout /t 4 /nobreak > nul

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
echo   Each service is running in its own window.
echo   Close those windows to stop the services.
echo ============================================================
pause > nul
