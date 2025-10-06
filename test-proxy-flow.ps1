# Comprehensive proxy debugging script
# Tests the complete request flow: Frontend -> Next.js Proxy -> Backend

Write-Host "`n=== AI Trader Proxy Flow Test ===" -ForegroundColor Cyan
Write-Host "This script tests: Browser -> Next.js (port 3000) -> Proxy -> Backend (port 8000)`n"

# Check if servers are running
Write-Host "1. Checking server status..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $backend) {
    Write-Host "   ❌ Backend NOT running on port 8000" -ForegroundColor Red
    Write-Host "   → Start it with: cd backend; uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "   ✅ Backend running on port 8000" -ForegroundColor Green
}

if (-not $frontend) {
    Write-Host "   ❌ Frontend NOT running on port 3000" -ForegroundColor Red
    Write-Host "   → Start it with: cd frontend; npm run dev" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "   ✅ Frontend running on port 3000" -ForegroundColor Green
}

Write-Host "`n2. Testing direct backend access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend /api/health responds: $($response.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend /api/health failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Testing Next.js proxy routing..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proxy/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Proxy /api/proxy/health responds: $($response.StatusCode)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Proxy /api/proxy/health failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   → Check frontend console for proxy errors" -ForegroundColor Gray
    exit 1
}

Write-Host "`n4. Testing trading/execute endpoint..." -ForegroundColor Yellow
$body = @{
    dryRun = $true
    requestId = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    orders = @()
} | ConvertTo-Json

# Test direct backend call first
Write-Host "   a) Direct backend call to /api/trading/execute..." -ForegroundColor Gray
try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer test-token-12345"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/trading/execute" `
        -Method POST -Body $body -Headers $headers -TimeoutSec 5
    Write-Host "      ✅ Direct backend: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Direct backend failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "      → Authentication issue - check API_TOKEN in backend/.env" -ForegroundColor Gray
    }
}

# Test through proxy
Write-Host "   b) Through Next.js proxy to /api/proxy/trading/execute..." -ForegroundColor Gray
try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proxy/trading/execute" `
        -Method POST -Body $body -Headers $headers -TimeoutSec 5
    Write-Host "      ✅ Proxy call: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "      Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "      ❌ Proxy call failed: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "`n   DIAGNOSIS: 404 Error - Route not found" -ForegroundColor Red
        Write-Host "   Possible causes:" -ForegroundColor Yellow
        Write-Host "   1. Proxy file not extracting path correctly" -ForegroundColor Gray
        Write-Host "   2. Backend route mismatch" -ForegroundColor Gray
        Write-Host "   3. Next.js not serving API routes properly" -ForegroundColor Gray
    } elseif ($_.Exception.Response.StatusCode -eq 500) {
        Write-Host "`n   DIAGNOSIS: 500 Error - Server error" -ForegroundColor Red
        Write-Host "   Check backend logs for errors" -ForegroundColor Gray
    } elseif ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "`n   DIAGNOSIS: 405 Error - Not allowed by proxy" -ForegroundColor Red
        Write-Host "   Check ALLOW_POST list in proxy file" -ForegroundColor Gray
    }
}

Write-Host "`n5. Route mapping verification..." -ForegroundColor Yellow
Write-Host "   Expected flow:" -ForegroundColor Gray
Write-Host "   Browser: POST /api/proxy/trading/execute" -ForegroundColor Gray
Write-Host "   ↓" -ForegroundColor Gray
Write-Host "   Next.js extracts: 'trading/execute'" -ForegroundColor Gray
Write-Host "   ↓" -ForegroundColor Gray
Write-Host "   Proxy constructs: http://localhost:8000/api/trading/execute" -ForegroundColor Gray
Write-Host "   ↓" -ForegroundColor Gray
Write-Host "   Backend router matches: /api + /trading/execute" -ForegroundColor Gray

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
