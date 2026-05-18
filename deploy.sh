#!/bin/bash
# Quick deployment script for AI Traffic Violation Detector

set -e

echo "🚀 AI Traffic Violation Detector - Deployment Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    print_success "Node.js: $(node --version)"
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm: $(npm --version)"
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git: $(git --version | cut -d' ' -f3)"
    
    if ! command -v vercel &> /dev/null; then
        print_info "Vercel CLI not installed. Installing..."
        npm install -g vercel
    fi
    print_success "Vercel CLI installed"
    
    echo ""
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f ".env.local" ]; then
        print_info "Creating .env.local from template..."
        cp .env.example .env.local
        print_info "Edit .env.local with your configuration"
    else
        print_success ".env.local already exists"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Backend
    if [ -d "backend" ]; then
        print_info "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # Frontend
    if [ -d "frontend" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    echo ""
}

# Build frontend
build_frontend() {
    print_info "Building frontend..."
    cd frontend
    npm run build
    cd ..
    print_success "Frontend built successfully"
    echo ""
}

# Deploy backend
deploy_backend() {
    print_info "Deploying backend to Vercel..."
    cd backend
    vercel --prod
    cd ..
    print_success "Backend deployed"
    echo ""
}

# Deploy frontend
deploy_frontend() {
    print_info "Deploying frontend to Vercel..."
    cd frontend
    vercel --prod
    cd ..
    print_success "Frontend deployed"
    echo ""
}

# Deploy full stack
deploy_full() {
    print_info "Deploying full stack to Vercel..."
    vercel --prod
    print_success "Full stack deployed"
    echo ""
}

# Main menu
show_menu() {
    echo "Select deployment option:"
    echo "========================="
    echo "1) Check prerequisites"
    echo "2) Setup environment"
    echo "3) Install dependencies"
    echo "4) Build frontend"
    echo "5) Deploy backend to Vercel"
    echo "6) Deploy frontend to Vercel"
    echo "7) Deploy full stack to Vercel"
    echo "8) Full deployment (steps 1-7)"
    echo "9) Exit"
    echo ""
    read -p "Enter your choice (1-9): " choice
}

# Main script
case "$1" in
    "check")
        check_prerequisites
        ;;
    "setup")
        setup_environment
        ;;
    "install")
        install_dependencies
        ;;
    "build")
        build_frontend
        ;;
    "deploy-backend")
        deploy_backend
        ;;
    "deploy-frontend")
        deploy_frontend
        ;;
    "deploy-full")
        deploy_full
        ;;
    "deploy-all")
        check_prerequisites
        setup_environment
        install_dependencies
        build_frontend
        deploy_backend
        deploy_frontend
        print_success "🎉 Full deployment complete!"
        ;;
    *)
        # Interactive mode
        while true; do
            show_menu
            case $choice in
                1)
                    check_prerequisites
                    ;;
                2)
                    setup_environment
                    ;;
                3)
                    install_dependencies
                    ;;
                4)
                    build_frontend
                    ;;
                5)
                    deploy_backend
                    ;;
                6)
                    deploy_frontend
                    ;;
                7)
                    deploy_full
                    ;;
                8)
                    check_prerequisites
                    setup_environment
                    install_dependencies
                    build_frontend
                    deploy_backend
                    deploy_frontend
                    print_success "🎉 Full deployment complete!"
                    ;;
                9)
                    print_info "Exiting..."
                    exit 0
                    ;;
                *)
                    print_error "Invalid choice. Please try again."
                    ;;
            esac
        done
        ;;
esac

echo ""
print_success "Done!"
