# Proxy Troubleshooting Guide

This guide helps diagnose and fix `/api/proxy/trading/execute` errors (404/500/etc).

## Quick Diagnosis

Run the automated test:
```powershell
.\test-proxy-flow.ps1
```

This will identify exactly where the issue is in the request chain.

## Common Issues and Solutions

### 1. 404 Not Found

**Symptom**: Request returns 404 error

**Possible Causes**:

#### A. Backend not running or wrong port
```powershell
# Check what's listening
netstat -ano | findstr ":3000 :8000"
```

**Expected**:
- Port 3000: Next.js frontend
- Port 8000: FastAPI backend

**Solution**:
```powershell
# Start both services correctly
.\start-dev.ps1 -KillExisting
```

#### B. Backend running on port 3000 (conflicts with Next.js)
**Symptom**: Backend steals port 3000, proxy can't work

**Solution**:
1. Kill process on port 3000
2. Start backend on port 8000: `uvicorn app.main:app --reload --port 8000`
3. Start frontend on port 3000: `npm run dev`

#### C. Route not defined in proxy allowlist
**Check**: `frontend/pages/api/proxy/[...path].ts`

```typescript
const ALLOW_POST = new Set<string>([
  "trading/execute",  // Must be here!
  "settings",
  "admin/kill",
]);
```

### 2. 500 Internal Server Error

**Possible Causes**:

#### A. Backend error
**Check backend logs** for Python exceptions

#### B. Authentication failure
**Symptom**: Backend receives request but rejects with 401

**Solution**: Verify API_TOKEN matches in both files:
```powershell
# Check tokens match
Select-String -Path "backend\.env" -Pattern "API_TOKEN"
Select-String -Path "frontend\.env.local" -Pattern "API_TOKEN"
```

### 3. 502 Bad Gateway

**Possible Causes**:

#### A. Backend not responding
**Solution**: Restart backend
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

#### B. Network/firewall issue
**Solution**: Try direct backend call:
```powershell
curl http://localhost:8000/api/health
```

### 4. Request goes to wrong place

**Symptom**: Backend logs show request without `/api/` prefix

**Diagnosis**: Request is hitting backend directly, bypassing proxy

**Solution**:
1. Ensure frontend is on port 3000, backend on port 8000
2. Frontend must call `/api/proxy/*` not direct backend URL

## Request Flow Verification

### Expected Flow:
```
Browser
  ↓ POST http://localhost:3000/api/proxy/trading/execute
Next.js API Route (port 3000)
  ↓ Extracts path: "trading/execute"
  ↓ Checks ALLOW_POST list
  ↓ Constructs: http://localhost:8000/api/trading/execute
Proxy Handler
  ↓ Adds Authorization: Bearer <token>
  ↓ Forwards request
Backend (port 8000)
  ↓ Receives: POST /api/trading/execute
  ↓ Auth middleware validates token
  ↓ Router matches: /api + /trading/execute
Handler Function
```

### How to Verify Each Step:

1. **Check frontend logs** (terminal running `npm run dev`)
   - Should show `[PROXY]` logs with full request details

2. **Check backend logs** (terminal running uvicorn)
   - Should show: `INFO: 127.0.0.1:xxxx - "POST /api/trading/execute HTTP/1.1" 200 OK`

3. **Check browser network tab**
   - Request URL: `http://localhost:3000/api/proxy/trading/execute`
   - Status: 200
   - Response: JSON with `{"accepted": true, ...}`

## Configuration Checklist

### Backend (`backend/.env`):
```env
API_PORT=8000
API_TOKEN=<your-token>
ALLOW_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`):
```env
BACKEND_API_BASE_URL=http://127.0.0.1:8000
API_TOKEN=<same-token-as-backend>
```

### Proxy (`frontend/pages/api/proxy/[...path].ts`):
```typescript
const BACKEND = 'http://localhost:8000';  // Must match backend port!
const API_TOKEN = process.env.API_TOKEN!; // Must be set in .env.local
```

## Manual Testing

### 1. Test backend directly:
```powershell
curl -X POST http://localhost:8000/api/trading/execute `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <your-token>" `
  -d '{"dryRun":true,"requestId":"test-123","orders":[]}'
```

**Expected**: `{"accepted":true,"dryRun":true,"orders":[]}`

### 2. Test through proxy:
```powershell
curl -X POST http://localhost:3000/api/proxy/trading/execute `
  -H "Content-Type: application/json" `
  -d '{"dryRun":true,"requestId":"test-456","orders":[]}'
```

**Expected**: Same response as direct backend call

### 3. Test from browser console:
```javascript
fetch('/api/proxy/trading/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dryRun: true,
    requestId: 'browser-test-' + Date.now(),
    orders: []
  })
})
.then(r => r.json())
.then(console.log)
```

## Enhanced Logging

The proxy now includes detailed logging. Check your Next.js terminal for:

```
[PROXY] ====== New Request ======
[PROXY] Method: POST
[PROXY] Original URL: /api/proxy/trading/execute
[PROXY] Extracted path: "trading/execute"
[PROXY] Constructed URL: http://localhost:8000/api/trading/execute
[PROXY] Auth header: Bearer AKF6WG4G...
[PROXY] Backend: http://localhost:8000
[PROXY] Body: { "dryRun": true, ... }
[PROXY] Response status: 200
[PROXY] Response body: {"accepted":true,...}
[PROXY] ====== End Request ======
```

If you don't see these logs, the request isn't reaching the proxy.

## Emergency Reset

If nothing works:

```powershell
# Kill everything
.\start-dev.ps1 -KillExisting

# Or manually:
Get-Process | Where-Object {$_.MainWindowTitle -match "uvicorn|next"} | Stop-Process -Force

# Verify ports are free
netstat -ano | findstr ":3000 :8000"

# Start fresh
cd backend
uvicorn app.main:app --reload --port 8000

# In another terminal:
cd frontend
npm run dev
```

## Still Having Issues?

1. Run the diagnostic script: `.\test-proxy-flow.ps1`
2. Check the enhanced proxy logs in the Next.js terminal
3. Verify the exact error message and status code
4. Check if the issue is consistent or intermittent
5. Try the manual testing steps above to isolate the problem
