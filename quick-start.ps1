# Quick Start Development Script for PowerShell
# Usage: .\quick-start.ps1

Write-Host "`n"
Write-Host "AI Traffic Violation Detector - Quick Start" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js v16+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed. Please install Python 3.8+ from python.org" -ForegroundColor Red
    exit 1
}

Write-Host ("Node.js: " + (node --version)) -ForegroundColor Green
Write-Host ("Python: " + (python --version)) -ForegroundColor Green
Write-Host "`n"

# Setup Backend
Write-Host "Setting up Backend..." -ForegroundColor Yellow
cd backend
npm install --silent 2>&1 | Out-Null
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env -Force 2>&1 | Out-Null
    Write-Host "Created .env file" -ForegroundColor Cyan
}
cd ..
Write-Host "Backend setup complete`n" -ForegroundColor Green

# Setup Frontend
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
cd frontend
npm install --silent 2>&1 | Out-Null
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env -Force 2>&1 | Out-Null
    Write-Host "Created .env file" -ForegroundColor Cyan
}
cd ..
Write-Host "Frontend setup complete`n" -ForegroundColor Green

# Setup AI Service
Write-Host "Setting up AI Service..." -ForegroundColor Yellow
cd ai_service
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}
& ".\venv\Scripts\Activate.ps1"
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -q -r requirements.txt 2>&1 | Out-Null
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env -Force 2>&1 | Out-Null
    Write-Host "Created .env file" -ForegroundColor Cyan
}
cd ..
Write-Host "AI Service setup complete`n" -ForegroundColor Green

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "`nOpen 3 separate PowerShell windows:`n" -ForegroundColor Cyan
Write-Host "Window 1: cd backend && npm start" -ForegroundColor White
Write-Host "Window 2: cd ai_service && .\venv\Scripts\Activate.ps1 && python app.py" -ForegroundColor White
Write-Host "Window 3: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`nThen visit: http://localhost:5173`n" -ForegroundColor Cyan
Write-Host "See QUICK_START_GUIDE.md for help`n" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
