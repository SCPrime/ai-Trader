# One-Screen Deploy Runbook

## Prerequisites (5 min)
```bash
# Generate API token (copy this)
openssl rand -hex 32

# Create Redis on Render
# → New Redis → Virginia → Copy Internal URL
```

---

## Render Backend (10 min)

**Dashboard**: https://dashboard.render.com/ → New Web Service

| Field | Value |
|-------|-------|
| Repo | `SCPrime/ai-Trader` |
| Branch | `feat/option-a-cloud-backend` |
| Root | `backend/` |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Region | Virginia (US East) |

**Environment Variables**:
```
API_TOKEN=<paste token from above>
LIVE_TRADING=false
ALLOW_ORIGIN=https://ai-trader-snowy.vercel.app
REDIS_URL=<paste Redis internal URL>
```

**Verify**:
```bash
curl https://<your-render-app>.onrender.com/api/health | jq .
# Expect: {"status":"healthy","redis":"connected",...}
```

---

## Vercel Frontend (5 min)

**Dashboard**: https://vercel.com/dashboard → ai-trader-snowy project

### Settings → Git
- Production Branch: `feat/option-a-cloud-backend`
- Root Directory: `frontend/`

### Settings → Environment Variables (Server-only)
```
BACKEND_API_BASE_URL=https://<your-render-app>.onrender.com
API_TOKEN=<same token from above>
```

### Deployments → Redeploy
- Click latest deployment → Redeploy
- Wait 2-5 min

**Verify**:
```bash
curl https://ai-trader-snowy.vercel.app/api/proxy/api/health | jq .
# Expect: {"status":"healthy","redis":"connected",...}
```

---

## Acceptance (5 min)

### Browser
1. Open: https://ai-trader-snowy.vercel.app
2. Should see **4 buttons** (not static page)
3. DevTools → Network tab
4. Click each button:
   - Health → JSON
   - Settings → JSON
   - Positions → JSON
   - Execute (Dry) → JSON with `dryRun:true`
5. Click Execute (Dry) again → Should return `duplicate:true`

### Terminal
```bash
RID="test-$(date +%s)"
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .

# Second request - expect duplicate:true
curl -s -X POST -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Vercel shows static page | Settings → Git → Verify branch + root, then redeploy |
| Proxy returns 404 | Vercel root must be `frontend/` with trailing slash |
| Backend 502 | Check Render logs, verify `requirements.txt` in `backend/` |
| Redis disconnected | Check `REDIS_URL` in Render env vars |
| CORS errors | `ALLOW_ORIGIN` must exactly match Vercel URL (no trailing slash) |
| 401/403 errors | `API_TOKEN` must be identical in Render and Vercel |

---

## Maintenance Mode (Optional)

To hide UI during deployment:

**Vercel env**: `MAINTENANCE_MODE=true`

**frontend/middleware.ts**:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true' &&
      !request.nextUrl.pathname.startsWith('/api/proxy')) {
    return new NextResponse('Under maintenance', { status: 503 });
  }
  return NextResponse.next();
}
```

Remove `MAINTENANCE_MODE` env var when ready.

---

**Total Time**: 25 minutes
**Cost**: $0 (free tiers) or $17/month (production)