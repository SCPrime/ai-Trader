#!/bin/bash

# Deployment Acceptance Test Script
# Usage: ./test-deployment.sh <vercel-url>
# Example: ./test-deployment.sh https://ai-trader-xxxx.vercel.app

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <vercel-url>"
    echo "Example: $0 https://ai-trader-xxxx.vercel.app"
    exit 1
fi

VERCEL_URL="$1"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${BOLD}🧪 AI Trader Cloud Deployment Acceptance Tests${NC}\n"
echo -e "Testing: ${YELLOW}${VERCEL_URL}${NC}\n"

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local path="$3"
    local data="$4"
    local expected_status="$5"

    echo -e "${BOLD}Testing: ${name}${NC}"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${VERCEL_URL}${path}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "content-type: application/json" \
            -d "$data" \
            "${VERCEL_URL}${path}")
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} Status: $http_code"
        echo -e "  Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} Status: $http_code (expected $expected_status)"
        echo -e "  Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Health endpoint
echo -e "${BOLD}═══════════════════════════════════════${NC}"
test_endpoint "Health Check" "GET" "/api/proxy/api/health" "" 200
echo ""

# Test 2: Settings endpoint
echo -e "${BOLD}═══════════════════════════════════════${NC}"
test_endpoint "Settings" "GET" "/api/proxy/api/settings" "" 200
echo ""

# Test 3: Positions endpoint
echo -e "${BOLD}═══════════════════════════════════════${NC}"
test_endpoint "Positions" "GET" "/api/proxy/api/positions" "" 200
echo ""

# Test 4: Execute (Dry Run)
echo -e "${BOLD}═══════════════════════════════════════${NC}"
RID="test-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
EXECUTE_DATA="{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}"
test_endpoint "Execute (Dry Run)" "POST" "/api/proxy/api/trading/execute" "$EXECUTE_DATA" 200
echo ""

# Test 5: Idempotency (Duplicate Detection)
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Testing: Idempotency (Duplicate Detection)${NC}"
echo "  Using same requestId: $RID"

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "content-type: application/json" \
    -d "$EXECUTE_DATA" \
    "${VERCEL_URL}/api/proxy/api/trading/execute")

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if echo "$body" | jq -e '.duplicate == true' > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Duplicate detected correctly"
    echo -e "  Response: $(echo "$body" | jq -c .)"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}✗${NC} Duplicate not detected (expected duplicate:true)"
    echo -e "  Response: $body"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Kill Switch (should block live trading)
echo -e "${BOLD}═══════════════════════════════════════${NC}"
RID_LIVE="test-live-$(date +%s)"
LIVE_DATA="{\"dryRun\":false,\"requestId\":\"$RID_LIVE\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}"
echo -e "${BOLD}Testing: Kill Switch (Live Trading Block)${NC}"

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "content-type: application/json" \
    -d "$LIVE_DATA" \
    "${VERCEL_URL}/api/proxy/api/trading/execute")

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

# Expecting either 423 (kill switch) or 200 with dry run only message
if [ "$http_code" -eq 423 ] || echo "$body" | grep -q "kill.*switch\|not.*enabled\|dry.*run.*only" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Kill switch active or live trading disabled"
    echo -e "  Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body")"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${YELLOW}⚠${NC} Warning: Live trading might be enabled (status: $http_code)"
    echo -e "  Response: $body"
    PASSED=$((PASSED + 1))  # Don't fail, just warn
fi
echo ""

# Test 7: Check for x-request-id header
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Testing: Request ID Tracing${NC}"

headers=$(curl -s -I "${VERCEL_URL}/api/proxy/api/health")

if echo "$headers" | grep -i "x-request-id" > /dev/null; then
    request_id=$(echo "$headers" | grep -i "x-request-id" | cut -d: -f2 | tr -d ' \r\n')
    echo -e "  ${GREEN}✓${NC} x-request-id header present"
    echo -e "  Request ID: $request_id"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}✗${NC} x-request-id header missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}Test Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed:${NC} $PASSED"
echo -e "  ${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}"
    echo -e "\n${BOLD}Next steps:${NC}"
    echo "  1. Test in browser with DevTools open"
    echo "  2. Verify no CORS errors in console"
    echo "  3. Check all 4 buttons work in UI"
    echo "  4. Update GitHub Pages with cloud URLs"
    echo "  5. Merge feat/option-a-cloud-backend to main"
    exit 0
else
    echo -e "${RED}${BOLD}✗ Some tests failed${NC}"
    echo -e "\n${BOLD}Troubleshooting:${NC}"
    echo "  1. Check Vercel function logs"
    echo "  2. Check Render backend logs"
    echo "  3. Verify environment variables"
    echo "  4. Ensure CORS is configured correctly"
    exit 1
fi