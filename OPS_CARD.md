# AI Trader Operations Card

## Quick Reference

**Live URLs**:
- Frontend UI: `https://ai-trader-snowy.vercel.app`
- Backend API: `https://<your-render-app>.onrender.com`

**Emergency Contact**: (Your team contact info here)

---

## UI Overview

### Main Dashboard

When you open the UI, you'll see:
- **Title**: "AI Trading Control Panel"
- **4 Action Buttons**: Health, Settings, Positions, Execute (Dry Run)
- **JSON Response Panel**: Shows API responses below buttons

### The 4 Buttons

#### 1. 🟢 Health
**What it does**: Checks if the backend and all services are running

**Success response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "redis": "connected",
  "kill_switch": {
    "enabled": false,
    "message": "Trading is allowed"
  }
}
```

**What to check**:
- `redis`: Should be `"connected"` (if disconnected, idempotency won't work)
- `kill_switch.enabled`: Should be `false` for normal operation

**When to use**: Start of every shift, after deployments, when investigating issues

---

#### 2. ⚙️ Settings
**What it does**: Shows current trading configuration

**Success response**:
```json
{
  "max_position_size": 10000,
  "risk_per_trade": 0.02,
  "max_open_positions": 5,
  "live_trading_enabled": false
}
```

**What to check**:
- `live_trading_enabled`: Should be `false` unless you've explicitly enabled live trading
- `max_position_size`: Maximum $ per position
- `max_open_positions`: Maximum number of concurrent positions

**When to use**: Before enabling live trading, when reviewing risk limits

---

#### 3. 📊 Positions
**What it does**: Shows all current open positions

**Success response**:
```json
{
  "positions": [
    {
      "symbol": "AAPL",
      "qty": 10,
      "side": "long",
      "entry_price": 150.00,
      "current_price": 152.50,
      "unrealized_pl": 25.00,
      "unrealized_pl_pct": 1.67
    }
  ],
  "total_value": 1525.00,
  "total_pl": 25.00
}
```

**What to check**:
- Number of positions vs `max_open_positions`
- P&L per position and total
- Any positions with large unrealized losses

**When to use**: Throughout the day, before market close, when monitoring performance

---

#### 4. 🚀 Execute (Dry Run)
**What it does**: Simulates executing a trade WITHOUT actually placing it

**Test request** (the button sends this):
```json
{
  "dryRun": true,
  "requestId": "test-<timestamp>",
  "orders": [
    {
      "symbol": "AAPL",
      "side": "buy",
      "qty": 1
    }
  ]
}
```

**Success response**:
```json
{
  "status": "success",
  "dryRun": true,
  "orders": [
    {
      "symbol": "AAPL",
      "side": "buy",
      "qty": 1,
      "simulated_price": 152.50,
      "message": "Dry run: would place order"
    }
  ],
  "requestId": "test-1234567890"
}
```

**Duplicate request response** (if you click twice with same requestId):
```json
{
  "duplicate": true,
  "original_timestamp": "2025-01-15T10:30:00Z",
  "message": "Request already processed"
}
```

**What to check**:
- `dryRun: true` confirms no real order was placed
- `duplicate: true` on second click proves idempotency is working

**When to use**: Testing before live trading, verifying idempotency works, troubleshooting

---

## Response Panel

### Reading JSON Responses

The panel below the buttons shows:
- **Green background**: Success (2xx status)
- **Red background**: Error (4xx/5xx status)
- **Formatted JSON**: Pretty-printed for readability

### Common Response Headers

Check browser DevTools → Network tab to see:
- `x-request-id`: Unique ID for tracing this request in logs
- `x-ratelimit-remaining`: How many requests you have left this minute
- `x-ratelimit-reset`: When your rate limit resets (Unix timestamp)

---

## Emergency Procedures

### 🚨 Kill Switch Activation

**When to use**: Stop ALL trading immediately (bug detected, market crash, etc.)

**How to activate**:
1. SSH into Render backend or use Render dashboard
2. Set environment variable: `KILL_SWITCH_ENABLED=true`
3. Restart the service (or it auto-restarts)
4. Verify: Click **Health** button, check `kill_switch.enabled: true`

**Effect**:
- All trading API calls return `423 Locked`
- Dry run still works (for testing)
- Existing positions are NOT auto-closed (you must close manually)

**To deactivate**:
1. Set `KILL_SWITCH_ENABLED=false` in Render
2. Restart service
3. Verify: Click **Health** button, check `kill_switch.enabled: false`

---

### 🔥 Backend Down

**Symptoms**:
- All buttons return 502 (Bad Gateway) or timeout
- Health button fails

**Check**:
1. Render dashboard → Service Logs
2. Look for recent crashes, out-of-memory, or startup errors

**Fix**:
- If Redis disconnected: Check `REDIS_URL` env var, restart Redis service
- If out of memory: Upgrade Render plan or reduce worker count
- If code error: Check logs, fix bug, redeploy

---

### 🌐 Frontend Down

**Symptoms**:
- Can't load `https://ai-trader-snowy.vercel.app`
- Buttons don't appear

**Check**:
1. Vercel dashboard → Deployments
2. Check latest deployment status

**Fix**:
- If build failed: Check Vercel build logs for errors
- If runtime error: Check Vercel function logs
- Redeploy from Vercel dashboard

---

### ⚠️ Rate Limit Hit

**Symptoms**:
- Buttons return `429 Too Many Requests`
- Response: `"Rate limit exceeded"`

**What happened**: You made >60 requests in 1 minute from your IP

**Fix**: Wait 60 seconds, then try again

**To check remaining**: DevTools → Network → Response Headers → `x-ratelimit-remaining`

---

### 🔐 Authentication Failure

**Symptoms**:
- Buttons return `401 Unauthorized` or `403 Forbidden`

**What happened**:
- `API_TOKEN` mismatch between Render and Vercel
- Token missing in Vercel environment

**Fix**:
1. Generate new token: `openssl rand -hex 32`
2. Set in Render: `API_TOKEN=<new-token>`
3. Set in Vercel (Server-only): `API_TOKEN=<new-token>`
4. Redeploy both services

---

## Monitoring Best Practices

### Daily Routine

**Market Open** (9:30 AM ET):
1. Click **Health** → Verify `redis: connected`, `kill_switch.enabled: false`
2. Click **Settings** → Verify `live_trading_enabled` matches your intent
3. Click **Positions** → Review overnight positions

**During Market Hours**:
- Check **Positions** every 30-60 minutes
- Monitor P&L per position
- Watch for any positions hitting risk limits

**Market Close** (4:00 PM ET):
1. Click **Positions** → Record final P&L
2. Click **Settings** → Consider disabling `live_trading_enabled` for overnight

### Weekly Tasks

**Monday Morning**:
- Review last week's P&L (from **Positions** history)
- Check Render logs for any errors/warnings
- Verify Redis is still connected

**Friday Afternoon**:
- Decide if leaving positions open over weekend
- Consider setting `live_trading_enabled: false` until Monday

---

## Log Locations

### Backend Logs (Render)
- **Location**: Render Dashboard → Service → Logs
- **What to look for**:
  - `ERROR` lines (red)
  - `WARNING` lines (yellow)
  - Request IDs matching frontend errors

### Frontend Logs (Vercel)
- **Location**: Vercel Dashboard → Project → Logs → Filter: "API Routes"
- **What to look for**:
  - 500/502 errors (backend unreachable)
  - 401/403 errors (auth issues)
  - Rate limit warnings

### Browser Console
- **Location**: DevTools → Console
- **What to look for**:
  - CORS errors (shouldn't happen if deployed correctly)
  - Network errors (red in Network tab)
  - JavaScript errors

---

## Testing Checklist

Use this before enabling live trading:

- [ ] **Health** button returns `"status": "healthy"`
- [ ] **Health** shows `"redis": "connected"`
- [ ] **Health** shows `"kill_switch.enabled": false`
- [ ] **Settings** shows `"live_trading_enabled": false` (for now)
- [ ] **Positions** returns data (even if empty array)
- [ ] **Execute (Dry)** returns `"dryRun": true`
- [ ] Click **Execute (Dry)** twice → Second returns `"duplicate": true`
- [ ] DevTools → Network → All calls go to `/api/proxy/...`
- [ ] DevTools → Network → No CORS errors
- [ ] DevTools → Network → No 404/500 errors
- [ ] Response headers include `x-request-id`
- [ ] Response headers include `x-ratelimit-remaining`

**If all checkboxes pass**: System is ready for live trading (after enabling in Settings)

---

## Enabling Live Trading

**⚠️ DANGER ZONE**: This allows real money to be traded.

### Prerequisites

1. All items in **Testing Checklist** above must pass
2. Paper trading has been successful for at least 1 week
3. Risk limits are configured appropriately
4. Kill switch has been tested and works

### Steps

1. **In Backend** (Render Dashboard):
   - Set `LIVE_TRADING=true`
   - Restart service

2. **Verify**:
   - Click **Health** → Check `kill_switch` is disabled
   - Click **Settings** → Verify `live_trading_enabled: true`

3. **Test with small order**:
   - Execute 1 share of a liquid stock (e.g., SPY)
   - Verify order appears in brokerage account
   - Check **Positions** button shows the position

4. **Monitor closely**:
   - Check positions every 15 minutes for first day
   - Watch for any unexpected behavior
   - Keep kill switch instructions handy

### To Disable

1. Set `LIVE_TRADING=false` in Render
2. Restart service
3. Verify **Settings** shows `live_trading_enabled: false`

---

## Contact & Escalation

**For bugs/issues**: (Your issue tracking system)
**For urgent outages**: (Your on-call contact)
**For questions**: (Your team Slack/chat)

---

## Useful Commands

### Generate API Token
```bash
openssl rand -hex 32
```

### Test Health Endpoint (Terminal)
```bash
curl -s https://ai-trader-snowy.vercel.app/api/proxy/api/health | jq .
```

### Test Idempotency (Terminal)
```bash
RID="test-$(date +%s)"
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .

# Run again - should return duplicate:true
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .
```

### Check Rate Limit
```bash
curl -I https://ai-trader-snowy.vercel.app/api/proxy/api/health | grep -i ratelimit
```

---

**Last Updated**: 2025-01-15
**Version**: 1.0
**Maintained By**: (Your name/team)