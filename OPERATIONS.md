# AI Trader Operations Card

**Production Environment** | Last verified: 2025-09-30

---

## 🌐 Live URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://ai-trader-snowy.vercel.app | Main UI (Next.js) |
| **Backend** | https://ai-trader-86a1.onrender.com | FastAPI service |
| **Proxy Health** | https://ai-trader-snowy.vercel.app/api/proxy/api/health | End-to-end check |

---

## 🚦 Health Checks (30 seconds)

### Quick browser checks
1. **Proxy Health**: https://ai-trader-snowy.vercel.app/api/proxy/api/health
   ✅ Expect: `{"status":"ok", "time":"..."}`

2. **Backend Direct**: https://ai-trader-86a1.onrender.com/api/health
   ✅ Expect: `{"status":"ok", "time":"...", "redis":{...}}`

3. **Frontend Root**: https://ai-trader-snowy.vercel.app/
   ✅ Expect: AI Trader Dashboard UI

### Automated smoke test (PowerShell)
```powershell
cd C:\Users\SSaint-Cyr\Documents\source\ai-Trader
.\test-deployment.ps1 -VercelDomain "ai-trader-snowy.vercel.app" -TestDuplicate
```

**Expected output**: 4/4 tests passing
- Backend health ✅
- Proxy health ✅
- Frontend root ✅
- Duplicate detection ✅

---

## 🧯 Emergency Controls

### Kill-Switch (Halt All Live Trading)

**Enable kill-switch** (blocks all live orders):
```bash
curl -X POST "https://ai-trader-snowy.vercel.app/api/proxy/api/admin/kill" \
  -H "content-type: application/json" -d "true"
```

**Disable kill-switch** (resume trading):
```bash
curl -X POST "https://ai-trader-snowy.vercel.app/api/proxy/api/admin/kill" \
  -H "content-type: application/json" -d "false"
```

**Verify status**:
```bash
curl "https://ai-trader-snowy.vercel.app/api/proxy/api/settings"
# Look for: "tradingHalted": true/false
```

### Safety Net
- **LIVE_TRADING=false** (Render env var): All executes become dry-runs regardless of request
- **Kill-switch=true**: Blocks live executes even if LIVE_TRADING=true
- **Both layers must be green** for live orders to execute

---

## 🔄 Deploy & Update

### Frontend (Vercel)
**Auto-deploy**: Push to `main` → Vercel builds automatically

**Manual deploy** (from laptop):
```bash
cd frontend
vercel --prod
```

**Check deployment**:
Vercel → Projects → ai-trader → Deployments → latest should be "Ready"

### Backend (Render)
**Auto-deploy**: Push to `main` → Render builds automatically

**Manual redeploy**:
Render → your service → Manual Deploy → Deploy latest commit

**Check logs**:
Render → Logs → look for "Application startup complete"

---

## 🧪 Test Execution Flow (Dry-Run)

### Single dry-run order
```bash
curl -X POST "https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute" \
  -H "content-type: application/json" \
  -d '{
    "dryRun": true,
    "requestId": "test-'$(date +%s)'",
    "orders": [
      {"symbol": "SPY", "side": "buy", "qty": 1, "type": "market"}
    ]
  }'
```

**Expected**: `{"accepted": true, "dryRun": true, "orders": [...]}`

### Test duplicate protection
```bash
# First request (same ID)
REQ_ID="dup-test-123"
curl -X POST "https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute" \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$REQ_ID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}"

# Second request (same ID) - should be rejected
curl -X POST "https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute" \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$REQ_ID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}"
```

**Expected second response**: `{"accepted": false, "duplicate": true}`

---

## 🔐 Security Checklist

- ✅ **No public API tokens**: All secrets server-side only
- ✅ **Proxy auth**: Frontend → Vercel proxy → Render backend (token injected server-side)
- ✅ **CORS locked**: Backend accepts only from Vercel domain
- ✅ **Rate limiting**: 60 req/min per IP at proxy layer
- ✅ **Idempotency**: 600s window (in-memory, upgradeable to Redis)
- ✅ **Kill-switch**: Independent safety layer
- ✅ **CSP headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

### Environment Variables (DO NOT COMMIT)

**Vercel** (Production):
```
BACKEND_API_BASE_URL=https://ai-trader-86a1.onrender.com
API_TOKEN=<secret-token>
```

**Render**:
```
API_TOKEN=<same-as-vercel>
LIVE_TRADING=false
ALLOW_ORIGIN=https://ai-trader-snowy.vercel.app
REDIS_URL=<optional-redis-connection-string>
```

---

## 🔧 Common Tasks

### View current settings
```bash
curl "https://ai-trader-snowy.vercel.app/api/proxy/api/settings"
```

### View positions
```bash
curl "https://ai-trader-snowy.vercel.app/api/proxy/api/positions"
```

### Check build status
- **Vercel**: https://vercel.com/scprimes-projects/ai-trader/deployments
- **Render**: https://dashboard.render.com → your service → Events

### Clear idempotency cache
**If using Redis**: Wait 10 minutes (TTL) or flush Redis
**If in-memory**: Restart Render service (Render → Manual Deploy)

---

## 📊 Monitoring Checklist

### Daily (automated)
- [ ] Run smoke test: `.\test-deployment.ps1 -VercelDomain "ai-trader-snowy.vercel.app" -TestDuplicate`
- [ ] Check Vercel deployment status: all green
- [ ] Check Render service status: "Live"

### Before going live
- [ ] Verify kill-switch works (enable → test live execute → expect 423)
- [ ] Verify LIVE_TRADING is correct (false for safety)
- [ ] Run duplicate detection test
- [ ] Check Redis connection (if enabled): `"redis": {"connected": true}`
- [ ] Confirm ALLOW_ORIGIN matches frontend domain

### During live trading window
- [ ] Kill-switch disabled (trading allowed)
- [ ] LIVE_TRADING=true on Render
- [ ] Monitor Render logs for errors
- [ ] Keep `.\test-deployment.ps1` ready to verify health

### After trading window
- [ ] Enable kill-switch (safety)
- [ ] Set LIVE_TRADING=false on Render
- [ ] Review logs for any failed orders
- [ ] Clear sensitive request IDs from cache (if needed)

---

## 🚨 Troubleshooting

| Symptom | Check | Fix |
|---------|-------|-----|
| Proxy returns 404 | Vercel Root Directory | Settings → Build & Deployment → Root Directory = `frontend` |
| Proxy returns 500 | Vercel env vars | Add `BACKEND_API_BASE_URL` and `API_TOKEN` |
| Backend returns 403 | CORS / Origin | Render → ALLOW_ORIGIN must match Vercel domain |
| TypeScript build fails | Dependencies | Ensure TS is in `dependencies`, not `devDependencies` |
| Duplicate not detected | Idempotency cache | Check backend logs; verify requestId is sent |
| Live order executes when kill=true | Kill-switch code | Check `backend/app/routers/orders.py` line ~29 |

### Get help fast
1. **Build logs**: Vercel → Deployments → click deployment → Build Logs
2. **Runtime logs**: Render → Logs (live tail)
3. **Test locally**: `cd backend && uvicorn app.main:app --reload`

---

## 📞 Key Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps | Spence | Deployment, infrastructure |
| Trading Ops | TBD | Live execution approval |
| Security | TBD | Token rotation, audits |

---

## 🔄 Everyday Workflow

1. **Make changes** in VS Code
2. **Commit & push** to `main`:
   ```bash
   git add .
   git commit -m "your message"
   git push origin main
   ```
3. **Wait for auto-deploy**: Vercel (~2 min) + Render (~3 min)
4. **Verify**: Run `.\test-deployment.ps1`

**For instant deploy** (frontend only):
```bash
cd frontend
vercel --prod
```

---

## 🎯 Production Readiness

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend build | ✅ | Next.js 14, TypeScript |
| Backend API | ✅ | FastAPI, idempotency, kill-switch |
| Proxy layer | ✅ | Rate limiting, auth injection |
| Health checks | ✅ | Automated smoke tests |
| Duplicate detection | ✅ | 600s TTL, in-memory (Redis-ready) |
| Kill-switch | ✅ | Tested, operational |
| CORS security | ✅ | Locked to Vercel domain |
| Secrets management | ✅ | Server-side only, no leaks |
| Monitoring | ⚠️ | Manual smoke tests (automate via cron/Actions) |
| Redis (optional) | 🔄 | In-memory works; Redis for multi-instance |

---

**Last Updated**: 2025-09-30
**Maintained By**: Spence
**Repo**: https://github.com/SCPrime/ai-Trader
