# PowerShell deployment script for AI Traffic Violation Detector
# Usage: .\deploy.ps1 or .\deploy.ps1 -Action deploy-all

param(
    [string]$Action = "interactive"
)

# Colors
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $GREEN
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $RED
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $YELLOW
}

function Check-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Error "Node.js is not installed. Please install from https://nodejs.org"
        exit 1
    }
    Write-Success "Node.js: $(node --version)"
    
    # Check npm
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npm) {
        Write-Error "npm is not installed"
        exit 1
    }
    Write-Success "npm: $(npm --version)"
    
    # Check Git
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) {
        Write-Error "Git is not installed"
        exit 1
    }
    Write-Success "Git installed"
    
    # Check/Install Vercel CLI
    $vercel = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercel) {
        Write-Info "Installing Vercel CLI..."
        npm install -g vercel
    }
    Write-Success "Vercel CLI ready"
    
    Write-Host ""
}

function Setup-Environment {
    Write-Info "Setting up environment..."
    
    if (-not (Test-Path ".env.local")) {
        Write-Info "Creating .env.local from template..."
        Copy-Item ".env.example" ".env.local"
        Write-Info "Edit .env.local with your configuration"
    }
    else {
        Write-Success ".env.local already exists"
    }
    
    Write-Host ""
}

function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    # Backend
    if (Test-Path "backend") {
        Write-Info "Installing backend dependencies..."
        Set-Location backend
        npm install
        Set-Location ..
        Write-Success "Backend dependencies installed"
    }
    
    # Frontend
    if (Test-Path "frontend") {
        Write-Info "Installing frontend dependencies..."
        Set-Location frontend
        npm install
        Set-Location ..
        Write-Success "Frontend dependencies installed"
    }
    
    Write-Host ""
}

function Build-Frontend {
    Write-Info "Building frontend..."
    Set-Location frontend
    npm run build
    Set-Location ..
    Write-Success "Frontend built successfully"
    Write-Host ""
}

function Deploy-Backend {
    Write-Info "Deploying backend to Vercel..."
    Set-Location backend
    vercel --prod
    Set-Location ..
    Write-Success "Backend deployed"
    Write-Host ""
}

function Deploy-Frontend {
    Write-Info "Deploying frontend to Vercel..."
    Set-Location frontend
    vercel --prod
    Set-Location ..
    Write-Success "Frontend deployed"
    Write-Host ""
}

function Deploy-Full {
    Write-Info "Deploying full stack to Vercel..."
    vercel --prod
    Write-Success "Full stack deployed"
    Write-Host ""
}

function Show-Menu {
    Write-Host "Select deployment option:" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "1) Check prerequisites"
    Write-Host "2) Setup environment"
    Write-Host "3) Install dependencies"
    Write-Host "4) Build frontend"
    Write-Host "5) Deploy backend to Vercel"
    Write-Host "6) Deploy frontend to Vercel"
    Write-Host "7) Deploy full stack to Vercel"
    Write-Host "8) Full deployment (all steps)"
    Write-Host "9) Exit"
    Write-Host ""
    $choice = Read-Host "Enter your choice (1-9)"
    return $choice
}

# Main script logic
switch ($Action) {
    "check" {
        Check-Prerequisites
    }
    "setup" {
        Setup-Environment
    }
    "install" {
        Install-Dependencies
    }
    "build" {
        Build-Frontend
    }
    "deploy-backend" {
        Deploy-Backend
    }
    "deploy-frontend" {
        Deploy-Frontend
    }
    "deploy-full" {
        Deploy-Full
    }
    "deploy-all" {
        Check-Prerequisites
        Setup-Environment
        Install-Dependencies
        Build-Frontend
        Deploy-Backend
        Deploy-Frontend
        Write-Success "🎉 Full deployment complete!"
    }
    "interactive" {
        # Interactive mode
        $running = $true
        while ($running) {
            $choice = Show-Menu
            
            switch ($choice) {
                "1" { Check-Prerequisites }
                "2" { Setup-Environment }
                "3" { Install-Dependencies }
                "4" { Build-Frontend }
                "5" { Deploy-Backend }
                "6" { Deploy-Frontend }
                "7" { Deploy-Full }
                "8" {
                    Check-Prerequisites
                    Setup-Environment
                    Install-Dependencies
                    Build-Frontend
                    Deploy-Backend
                    Deploy-Frontend
                    Write-Success "🎉 Full deployment complete!"
                }
                "9" {
                    Write-Info "Exiting..."
                    $running = $false
                }
                default {
                    Write-Error "Invalid choice. Please try again."
                }
            }
        }
    }
    default {
        Write-Error "Unknown action: $Action"
        Write-Host "Usage: .\deploy.ps1 [check|setup|install|build|deploy-backend|deploy-frontend|deploy-full|deploy-all|interactive]"
        exit 1
    }
}

Write-Host ""
Write-Success "Done!"
