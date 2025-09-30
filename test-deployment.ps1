# AI-Trader Deployment Smoke Test
# Run after Vercel deployment to verify all endpoints

param(
    [Parameter(Mandatory=$true)]
    [string]$VercelDomain,

    [Parameter(Mandatory=$false)]
    [switch]$TestDuplicate
)

Write-Host "`n=== AI-Trader Deployment Smoke Test ===" -ForegroundColor Cyan
Write-Host "Vercel Domain: $VercelDomain`n" -ForegroundColor Yellow

$tests = @(
    @{
        Name = "Backend Health (Direct)"
        Url = "https://ai-trader-86a1.onrender.com/api/health"
        ExpectedStatus = 200
    },
    @{
        Name = "Frontend Proxy to Backend Health"
        Url = "https://$VercelDomain/api/proxy/api/health"
        ExpectedStatus = 200
    },
    @{
        Name = "Frontend Root (Next.js)"
        Url = "https://$VercelDomain/"
        ExpectedStatus = 200
    }
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "Testing: $($test.Name)" -ForegroundColor White
    Write-Host "  URL: $($test.Url)" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method Get -UseBasicParsing -ErrorAction Stop

        if ($response.StatusCode -eq $test.ExpectedStatus) {
            Write-Host "  PASS - Status: $($response.StatusCode)" -ForegroundColor Green

            if ($test.Url -like "*/health") {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "    Status: $($json.status)" -ForegroundColor Gray
                if ($json.time) { Write-Host "    Time: $($json.time)" -ForegroundColor Gray }
                if ($json.version) { Write-Host "    Version: $($json.version)" -ForegroundColor Gray }
            }

            $passed++
        } else {
            Write-Host "  FAIL - Expected $($test.ExpectedStatus), got $($response.StatusCode)" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

if ($TestDuplicate) {
    Write-Host "=== Testing Duplicate Request ID Protection ===" -ForegroundColor Cyan
    Write-Host ""

    $requestId = [guid]::NewGuid().ToString()
    $testUrl = "https://$VercelDomain/api/proxy/api/trading/execute"

    Write-Host "Testing: Duplicate Request ID Protection" -ForegroundColor White
    Write-Host "  Request ID: $requestId" -ForegroundColor Gray
    Write-Host ""

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

    $headers = @{ "Content-Type" = "application/json" }

    Write-Host "  First request..." -ForegroundColor Gray
    $response1 = Invoke-WebRequest -Uri $testUrl -Method Post -Headers $headers -Body $body -UseBasicParsing -ErrorAction Stop
    $json1 = $response1.Content | ConvertFrom-Json

    if ($response1.StatusCode -eq 200 -and $json1.accepted -eq $true) {
        Write-Host "    First request accepted" -ForegroundColor Green

        Start-Sleep -Milliseconds 500
        Write-Host "  Second request (same ID)..." -ForegroundColor Gray

        $response2 = Invoke-WebRequest -Uri $testUrl -Method Post -Headers $headers -Body $body -UseBasicParsing -ErrorAction Stop
        $json2 = $response2.Content | ConvertFrom-Json

        if ($json2.duplicate -eq $true -and $json2.accepted -eq $false) {
            Write-Host "    Duplicate detected correctly!" -ForegroundColor Green
            Write-Host "      Response: duplicate=$($json2.duplicate), accepted=$($json2.accepted)" -ForegroundColor Gray
            $passed++
        } else {
            Write-Host "    Duplicate not detected" -ForegroundColor Red
            Write-Host "      Expected: duplicate=true, accepted=false" -ForegroundColor Red
            Write-Host "      Got: duplicate=$($json2.duplicate), accepted=$($json2.accepted)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "    First request failed with status $($response1.StatusCode)" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
    Write-Host "`nAll tests passed! Deployment is healthy." -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Check Vercel settings and environment variables." -ForegroundColor Red
    exit 1
}
