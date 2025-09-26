# Vercel Deployment Script for Windows PowerShell
Write-Host "☁️  Deploying to Vercel" -ForegroundColor Green
Write-Host "====================="

# Safety checks
Write-Host "⚠️  DEPLOYMENT CHECKLIST:" -ForegroundColor Yellow

# Check FORCE_PAPER_TRADING in vercel.json
$vercelContent = Get-Content "vercel.json" -Raw
if ($vercelContent -match '"FORCE_PAPER_TRADING": "true"') {
    Write-Host "✓ FORCE_PAPER_TRADING=true in vercel.json: YES" -ForegroundColor Green
} else {
    Write-Host "✗ FORCE_PAPER_TRADING=true in vercel.json: NO - FIX THIS!" -ForegroundColor Red
}

# Check paper API endpoints
$configContent = Get-Content "src/config_manager.py" -Raw
if ($configContent -match 'paper-api.alpaca.markets') {
    Write-Host "✓ Using paper API endpoints: YES" -ForegroundColor Green
} else {
    Write-Host "✗ Using paper API endpoints: NO - FIX THIS!" -ForegroundColor Red
}

Write-Host ""
$continue = Read-Host "Continue with deployment? (y/n)"
if ($continue -notmatch '^[Yy]$') {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 1
}

# Install Vercel CLI if needed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Blue
    npm install -g vercel
}

# Deploy
Write-Host "Starting production deployment..." -ForegroundColor Blue
vercel --prod