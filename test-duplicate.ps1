# Test duplicate request ID detection
param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,

    [Parameter(Mandatory=$true)]
    [string]$ApiToken
)

Write-Host "`n=== Testing Duplicate Request ID Detection ===" -ForegroundColor Cyan
Write-Host "Backend: $BackendUrl`n" -ForegroundColor Yellow

$requestId = [guid]::NewGuid().ToString()
$executeUrl = "$BackendUrl/api/trading/execute"

$body = @{
    dryRun = $true
    requestId = $requestId
    orders = @(
        @{
            symbol = "SPY"
            side = "buy"
            qty = 1
            type = "market"
        }
    )
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type" = "application/json"
}

Write-Host "Request ID: $requestId" -ForegroundColor Gray
Write-Host ""

# First request
Write-Host "First request..." -ForegroundColor White
try {
    $response1 = Invoke-RestMethod -Uri $executeUrl -Method Post -Headers $headers -Body $body
    Write-Host "  Response: $($response1 | ConvertTo-Json -Compress)" -ForegroundColor Green

    if ($response1.accepted -eq $true -and $response1.duplicate -ne $true) {
        Write-Host "  PASS - First request accepted" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - First request should be accepted" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Wait a moment
Start-Sleep -Milliseconds 500

# Second request (same ID)
Write-Host "Second request (same ID)..." -ForegroundColor White
try {
    $response2 = Invoke-RestMethod -Uri $executeUrl -Method Post -Headers $headers -Body $body
    Write-Host "  Response: $($response2 | ConvertTo-Json -Compress)" -ForegroundColor Green

    if ($response2.duplicate -eq $true -and $response2.accepted -eq $false) {
        Write-Host "  PASS - Duplicate correctly detected!" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - Second request should be marked as duplicate" -ForegroundColor Red
        Write-Host "    Expected: duplicate=true, accepted=false" -ForegroundColor Red
        Write-Host "    Got: duplicate=$($response2.duplicate), accepted=$($response2.accepted)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All Tests Passed ===" -ForegroundColor Green
Write-Host "Idempotency is working correctly!" -ForegroundColor Green
