#!/bin/bash
# Quick Start Development Script
# This script helps you set up and run the project locally

echo "🚀 AI Traffic Violation Detector - Quick Start"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ from nodejs.org"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ from python.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Python version: $(python --version)"
echo ""

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local command=$3
    
    echo "🔧 Starting $service_name..."
    cd "$service_path"
    eval "$command" &
    SERVICE_PID=$!
    echo "✅ $service_name started (PID: $SERVICE_PID)"
    echo ""
}

# Setup Backend
echo "📦 Setting up Backend..."
cd backend
npm install > /dev/null 2>&1
if [ -f .env ]; then
    echo "✅ Backend .env found"
else
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi
cd ..
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend
npm install > /dev/null 2>&1
if [ -f .env ]; then
    echo "✅ Frontend .env found"
else
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi
cd ..
echo ""

# Setup AI Service
echo "📦 Setting up AI Service..."
cd ai_service
if [ -d venv ]; then
    echo "✅ Python virtual environment found"
else
    echo "📝 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment and install requirements
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    ./venv/Scripts/activate
else
    # macOS/Linux
    source venv/bin/activate
fi

pip install -q -r requirements.txt > /dev/null 2>&1

if [ -f .env ]; then
    echo "✅ AI Service .env found"
else
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi
cd ..
echo ""

echo "================================================"
echo "✅ Setup Complete!"
echo ""
echo "📝 To start the services, open 3 terminals and run:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm start"
echo ""
echo "Terminal 2 - AI Service:"
echo "  cd ai_service"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "  ./venv/Scripts/activate"
else
    echo "  source venv/bin/activate"
fi
echo "  python app.py"
echo ""
echo "Terminal 3 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌐 Then open: http://localhost:5173"
echo ""
echo "📖 For more details, see LOCAL_DEVELOPMENT_GUIDE.md"
echo "================================================"
