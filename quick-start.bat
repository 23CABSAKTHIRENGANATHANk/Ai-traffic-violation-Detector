@echo off
setlocal enabledelayedexpansion
REM Quick Start Development Script for Windows
REM This script helps you set up and run the project locally
REM Usage: Run this from Command Prompt (cmd.exe), not PowerShell

echo.
echo 🚀 AI Traffic Violation Detector - Quick Start
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16+ from nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js version: %%i
for /f "tokens=*" %%i in ('python --version') do echo ✅ Python version: %%i
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend
call npm install >nul 2>&1
if exist ".env" (
    echo ✅ Backend .env found
) else (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env >nul 2>&1
)
cd ..
echo.

REM Setup Frontend
echo 📦 Setting up Frontend...
cd frontend
call npm install >nul 2>&1
if exist ".env" (
    echo ✅ Frontend .env found
) else (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env >nul 2>&1
)
cd ..
echo.

REM Setup AI Service
echo 📦 Setting up AI Service...
cd ai_service
if exist "venv" (
    echo ✅ Python virtual environment found
) else (
    echo 📝 Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt >nul 2>&1

if exist ".env" (
    echo ✅ AI Service .env found
) else (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env >nul 2>&1
)
cd ..
echo.

echo ================================================
echo ✅ Setup Complete!
echo.
echo 📝 To start the services, open 3 command prompts and run:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm start
echo.
echo Terminal 2 - AI Service:
echo   cd ai_service
echo   venv\Scripts\activate.bat
echo   python app.py
echo.
echo Terminal 3 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo 🌐 Then open: http://localhost:5173
echo.
echo 📖 For more details, see LOCAL_DEVELOPMENT_GUIDE.md
echo ================================================
echo.
pause
