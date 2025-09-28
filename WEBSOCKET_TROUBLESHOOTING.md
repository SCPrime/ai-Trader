# WebSocket Connection Troubleshooting Guide

## Current Status: ✅ WORKING
Both WebSocket endpoints are functioning correctly:
- Main WebSocket: `ws://localhost:8001/ws`
- AI Chat WebSocket: `ws://localhost:8001/ws/ai-chat`

## Common Connection Issues & Fixes

### 1. **Backend Not Running with WebSocket Support**

**Problem**: WebSocket connection fails with "Connection refused" or similar errors.

**Check**:
```bash
# Verify server is running
curl http://localhost:8001/api/health

# Check if port 8001 is listening
netstat -ano | findstr :8001
```

**Fix**:
```bash
# Restart the server
python complete_api.py
```

**Verification**: Server should show WebSocket endpoints in startup logs.

### 2. **Wrong Protocol (ws:// vs wss://)**

**Problem**: Mixed content errors or connection failures in HTTPS contexts.

**Current Implementation** (✅ Correctly implemented):
```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
```

**Manual Test**:
```javascript
// For local development (HTTP)
let ws = new WebSocket("ws://localhost:8001/ws");

// For production (HTTPS)
let ws = new WebSocket("wss://yourdomain.com/ws");
```

### 3. **Incorrect WebSocket Path**

**Current Endpoints** (✅ Correctly defined):
- Backend: `@app.websocket("/ws")` → Frontend: `/ws`
- Backend: `@app.websocket("/ws/ai-chat")` → Frontend: `/ws/ai-chat`

**Common Mistakes**:
- Using `/api/ws` when backend defines `/ws`
- Missing leading `/` in path
- Case sensitivity issues

**Fix**: Update frontend to match backend route exactly.

### 4. **Proxy/Firewall Issues**

**Problem**: WebSocket connections stripped by proxy or blocked by firewall.

**Check**:
```bash
# Test direct connection
telnet localhost 8001
```

**Common Solutions**:
- Configure proxy to allow WebSocket upgrade headers
- Add firewall exception for port 8001
- Use different port if 8001 is blocked

### 5. **Browser Security Restrictions**

**Problem**: Browser blocks WebSocket connections due to security policies.

**Solutions**:
- Ensure HTTPS when required
- Check browser console for CORS errors
- Verify WebSocket protocol matches page protocol

### 6. **Server Configuration Issues**

**Check FastAPI/Uvicorn Configuration**:
```python
# Ensure WebSocket imports are present
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect

# Verify WebSocket endpoint definition
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # ... rest of implementation
```

## Testing Commands

### Python Test
```bash
python test_websocket.py
```

### Browser Console Test
```javascript
// Main WebSocket
let ws = new WebSocket("ws://localhost:8001/ws");
ws.onopen = () => console.log("WebSocket connected");
ws.onerror = (e) => console.error("WebSocket error:", e);
ws.onmessage = (msg) => console.log("WebSocket message:", msg.data);

// AI Chat WebSocket
let aiWs = new WebSocket("ws://localhost:8001/ws/ai-chat");
aiWs.onopen = () => console.log("AI Chat WebSocket connected");
```

### Browser Test Page
Open `test_websocket_browser.html` for interactive testing.

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Server not running | Start server with `python complete_api.py` |
| `404 Not Found` | Wrong path | Check endpoint path matches backend route |
| `Mixed content` | HTTP/HTTPS mismatch | Use correct protocol (ws/wss) |
| `WebSocket connection failed` | Network/firewall | Check network connectivity and firewall |
| `Invalid frame header` | Protocol mismatch | Ensure using WebSocket protocol, not HTTP |

## Current Working Configuration

**Backend (FastAPI)**:
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Sends market data every 5 seconds

@app.websocket("/ws/ai-chat")
async def ai_chat_websocket(websocket: WebSocket):
    await websocket.accept()
    # Bidirectional AI chat
```

**Frontend (JavaScript)**:
```javascript
// Auto-detects protocol and constructs correct URL
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
const ws = new WebSocket(wsUrl);
```

## Monitoring & Debugging

**Backend Logs**: Check console output when connections are made/lost.

**Browser DevTools**:
- Network tab shows WebSocket connections
- Console shows connection events and errors

**Connection Status**: Dashboard shows real-time connection status.

---

*Last Updated: 2025-09-28*
*Status: All WebSocket connections verified working*