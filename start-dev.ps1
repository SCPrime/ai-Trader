# Development Environment Startup Script
# Ensures both backend and frontend start correctly with proper configuration

param(
    [switch]$KillExisting = $false
)

Write-Host "`n=== AI Trader Development Startup ===" -ForegroundColor Cyan

# Kill existing processes if requested
if ($KillExisting) {
    Write-Host "`nKilling existing processes on ports 3000 and 8000..." -ForegroundColor Yellow

    $port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($port3000) {
        $pid = $port3000.OwningProcess
        Write-Host "  Killing process $pid on port 3000..." -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    $port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($port8000) {
        $pid = $port8000.OwningProcess
        Write-Host "  Killing process $pid on port 8000..." -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Check for port conflicts
Write-Host "`nChecking for port conflicts..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "  ⚠️  Port 3000 is already in use (PID: $($port3000.OwningProcess))" -ForegroundColor Red
    Write-Host "     Run this script with -KillExisting to kill existing processes" -ForegroundColor Gray
    exit 1
}

if ($port8000) {
    Write-Host "  ⚠️  Port 8000 is already in use (PID: $($port8000.OwningProcess))" -ForegroundColor Red
    Write-Host "     Run this script with -KillExisting to kill existing processes" -ForegroundColor Gray
    exit 1
}

Write-Host "  ✅ Ports 3000 and 8000 are available" -ForegroundColor Green

# Verify environment files exist
Write-Host "`nVerifying environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "  ❌ backend\.env not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "  ❌ frontend\.env.local not found" -ForegroundColor Red
    exit 1
}

# Check API_TOKEN matches
$backendToken = Select-String -Path "backend\.env" -Pattern "^API_TOKEN=(.+)$" | ForEach-Object { $_.Matches.Groups[1].Value }
$frontendToken = Select-String -Path "frontend\.env.local" -Pattern "^API_TOKEN=(.+)$" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($backendToken -ne $frontendToken) {
    Write-Host "  ⚠️  API_TOKEN mismatch between backend and frontend!" -ForegroundColor Red
    Write-Host "     Backend: $backendToken" -ForegroundColor Gray
    Write-Host "     Frontend: $frontendToken" -ForegroundColor Gray
    exit 1
}

Write-Host "  ✅ Environment files configured correctly" -ForegroundColor Green
Write-Host "  ✅ API_TOKEN matches: $backendToken" -ForegroundColor Green

# Start backend
Write-Host "`nStarting backend on port 8000..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; uvicorn app.main:app --reload --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 3

# Verify backend started
$backendRunning = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "  ✅ Backend started successfully on port 8000" -ForegroundColor Green
} else {
    Write-Host "  ❌ Backend failed to start" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host "`nStarting frontend on port 3000..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 5

# Verify frontend started
$frontendRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "  ✅ Frontend started successfully on port 3000" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host "`n=== Startup Complete ===" -ForegroundColor Cyan
Write-Host "`nServices:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`nTo test the proxy, run:" -ForegroundColor Yellow
Write-Host "  .\test-proxy-flow.ps1" -ForegroundColor Gray
Write-Host ""
