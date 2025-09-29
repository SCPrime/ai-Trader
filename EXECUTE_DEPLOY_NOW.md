# Execute Cloud Deployment NOW

## Status Check ✅

**Code**: Ready on `feat/option-a-cloud-backend` branch
**Proof**: https://github.com/SCPrime/ai-Trader/tree/feat/option-a-cloud-backend

**Current Problem**:
- Vercel is building the wrong target (static page, not the Next.js app)
- Render is not configured yet
- Result: Proxy returns 404, homepage is static

**After this guide**: Both services will be live and working.

---

## Step 1: Generate Shared API Token

```bash
openssl rand -hex 32
```

**Copy this value** - you'll use it in both Render and Vercel.

Example output: `a1b2c3d4e5f6...` (64 characters)

---

## Step 2: Set Up Redis (5 minutes)

### Option A: Render Key-Value (Recommended)

1. Go to https://dashboard.render.com/
2. Click **New +** → **Redis**
3. Configure:
   - **Name**: `ai-trader-redis`
   - **Region**: `Virginia (US East)`
   - **Plan**: `Free` (0.1 GB)
4. Click **Create Redis**
5. Wait for "Available" status (1-2 minutes)
6. **Copy the Internal Redis URL**:
   - Format: `redis://red-xxxxx:6379`
   - Click the copy icon next to "Internal Redis URL"

### Option B: Upstash (Alternative)

1. Go to https://console.upstash.com/
2. Click **Create Database**
3. Region: `us-east-1`
4. Copy the Redis URL with password

**Save this URL** - you'll use it in Render backend config.

---

## Step 3: Deploy Backend to Render (10 minutes)

### A. Create Web Service

1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. **Connect Repository**:
   - If not connected: Click **Connect GitHub** → Authorize → Select `SCPrime/ai-Trader`
   - If already connected: Select `SCPrime/ai-Trader` from list

### B. Configure Service

**Basic Settings**:
- **Name**: `ai-trader-backend`
- **Region**: `Virginia (US East)`
- **Branch**: `feat/option-a-cloud-backend` ⚠️ **CRITICAL: Not main!**
- **Root Directory**: `backend/` ⚠️ **CRITICAL: Include trailing slash!**
- **Runtime**: `Python 3`

**Build & Deploy**:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type**:
- **Plan**: `Starter` (or `Free` for testing)

### C. Environment Variables

Click **Advanced** → **Add Environment Variable** (add these 4):

| Key | Value | Notes |
|-----|-------|-------|
| `API_TOKEN` | `<paste token from Step 1>` | Must match Vercel |
| `LIVE_TRADING` | `false` | Keeps trading disabled |
| `ALLOW_ORIGIN` | `https://ai-trader-snowy.vercel.app` | Your Vercel URL |
| `REDIS_URL` | `<paste Redis URL from Step 2>` | From Render KV or Upstash |

### D. Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes)
3. **Copy your Render URL** from the top of the page:
   - Format: `https://ai-trader-backend-xxxx.onrender.com`
   - You'll need this for Vercel config

### E. Verify Backend

```bash
curl -s https://ai-trader-backend-xxxx.onrender.com/api/health | jq .
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T...",
  "redis": "connected",
  "kill_switch": {
    "enabled": false
  }
}
```

If `redis: "disconnected"`, check your `REDIS_URL` env var.

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

### A. Go to Your Project

1. Go to https://vercel.com/dashboard
2. Find your `ai-trader-snowy` project (or whatever it's named)
3. Click on the project name

### B. Update Git Configuration

1. Click **Settings** (top nav)
2. Click **Git** (left sidebar)
3. **Production Branch**:
   - Change from `main` to `feat/option-a-cloud-backend` ⚠️ **CRITICAL!**
4. **Root Directory**:
   - Click **Edit** next to Root Directory
   - Enter: `frontend/` ⚠️ **CRITICAL: Include trailing slash!**
   - Click **Save**

### C. Add Environment Variables

1. Click **Settings** → **Environment Variables** (left sidebar)
2. Add these 2 variables (both **Server-side only**, uncheck Production/Preview/Development or leave all checked):

| Key | Value | Environments |
|-----|-------|--------------|
| `BACKEND_API_BASE_URL` | `https://ai-trader-backend-xxxx.onrender.com` | All (or just Production) |
| `API_TOKEN` | `<same token from Step 1>` | All (or just Production) |

**Important**: Use the same `API_TOKEN` value from Step 1 (must match Render).

3. Click **Save** for each

### D. Redeploy

1. Go to **Deployments** tab (top nav)
2. Click **...** (3 dots) on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** (faster)
5. Click **Redeploy**
6. Wait for deployment (2-5 minutes)

### E. Verify Frontend

Once deployed, your Vercel URL: `https://ai-trader-snowy.vercel.app`

**Test in browser**:
1. Open `https://ai-trader-snowy.vercel.app`
2. You should see **4 buttons**: Health, Settings, Positions, Execute (Dry Run)
3. Click **Health** → JSON response should appear below

**If you still see the static page**:
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Check Vercel deployment logs for errors

---

## Step 5: Update CORS (2 minutes)

Now that both services are deployed, verify CORS:

1. Go back to **Render Dashboard** → `ai-trader-backend`
2. Click **Environment** (left sidebar)
3. Verify `ALLOW_ORIGIN` matches your Vercel URL **exactly**:
   - Should be: `https://ai-trader-snowy.vercel.app`
   - No trailing slash, no www, HTTPS only

If you had to change it:
4. Click **Save Changes**
5. Service will auto-restart (30 seconds)

---

## Step 6: Acceptance Tests (5 minutes)

### Browser Testing

1. Open https://ai-trader-snowy.vercel.app
2. Open DevTools (F12) → **Network** tab
3. Click each button and verify:

| Button | Expected Response | What to Check |
|--------|-------------------|---------------|
| **Health** | `{"status":"healthy",...}` | `redis:"connected"`, `kill_switch.enabled:false` |
| **Settings** | `{"max_position_size":...}` | `live_trading_enabled:false` |
| **Positions** | `{"positions":[...],...}` | May be empty array (ok) |
| **Execute (Dry)** | `{"status":"success","dryRun":true,...}` | `dryRun:true` |

4. Click **Execute (Dry)** again → Should return `{"duplicate":true,...}`

5. In Network tab, verify:
   - ✅ All requests go to `/api/proxy/...` (NOT directly to Render)
   - ✅ No CORS errors (no red)
   - ✅ No 404 errors
   - ✅ No 500 errors
   - ✅ Response headers include `x-request-id`

### Terminal Testing

```bash
# Test health (should return JSON)
curl -s https://ai-trader-snowy.vercel.app/api/proxy/api/health | jq .

# Test idempotency
RID="test-$(date +%s)"

# First request
curl -s -X POST \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .

# Second request (same RID) - should return duplicate:true
curl -s -X POST \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://ai-trader-snowy.vercel.app/api/proxy/api/trading/execute | jq .
```

### Automated Test Script

```bash
# From your repo root
./test-deployment.sh https://ai-trader-snowy.vercel.app
```

**Expected output**: All tests pass ✅

---

## Step 7: Update GitHub Pages (5 minutes)

### Option A: Update Content (Recommended)

1. Find your GitHub Pages source (usually `docs/` folder or `gh-pages` branch)
2. Replace the localhost instructions with:

```markdown
## 🌐 Live Deployment

- **Frontend**: https://ai-trader-snowy.vercel.app
- **Backend**: https://ai-trader-backend-xxxx.onrender.com

See [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) for deployment guide.
```

3. Commit and push
4. Wait 2-5 minutes for GitHub Pages to rebuild

### Option B: Disable GitHub Pages

1. Go to https://github.com/SCPrime/ai-Trader/settings/pages
2. Under **Source**, select **None**
3. Click **Save**

---

## Success Checklist

Mark these as you complete them:

### Deployment
- [ ] Redis created and URL copied
- [ ] Render backend deployed from `feat/option-a-cloud-backend` branch
- [ ] Render backend root directory is `backend/`
- [ ] Render environment variables set (API_TOKEN, REDIS_URL, ALLOW_ORIGIN, LIVE_TRADING)
- [ ] Render backend URL copied
- [ ] Vercel branch changed to `feat/option-a-cloud-backend`
- [ ] Vercel root directory changed to `frontend/`
- [ ] Vercel environment variables set (BACKEND_API_BASE_URL, API_TOKEN)
- [ ] Vercel redeployed

### Verification
- [ ] Backend health endpoint returns JSON with `redis:connected`
- [ ] Frontend shows 4 buttons (not static page)
- [ ] Health button returns JSON
- [ ] Settings button returns JSON
- [ ] Positions button returns JSON (or empty array)
- [ ] Execute (Dry) button returns JSON with `dryRun:true`
- [ ] Second Execute (Dry) click returns `duplicate:true`
- [ ] DevTools Network shows all requests to `/api/proxy/...`
- [ ] No CORS errors in browser console
- [ ] No 404/500 errors
- [ ] Response headers include `x-request-id`

### Documentation
- [ ] GitHub Pages updated or disabled

---

## Troubleshooting

### "Still seeing static page on Vercel"
1. Verify Settings → Git → Production Branch = `feat/option-a-cloud-backend`
2. Verify Settings → Git → Root Directory = `frontend/`
3. Clear browser cache (Ctrl+Shift+R)
4. Check Vercel deployment logs for errors

### "Proxy returns 404"
1. Verify Vercel root directory is `frontend/` (with trailing slash)
2. Verify Vercel is deploying from `feat/option-a-cloud-backend` branch
3. Check that `frontend/pages/api/proxy/[...path].ts` exists in the branch
4. Redeploy from Vercel dashboard

### "Backend returns 502/503"
1. Check Render logs: Dashboard → Service → Logs
2. Look for Python errors or startup failures
3. Verify `requirements.txt` exists in `backend/` directory
4. Check that start command is correct: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### "Redis disconnected"
1. Verify `REDIS_URL` is set in Render environment
2. Check that Redis service is "Available" (not stopped)
3. Test Redis connection from Render logs
4. For Render KV: use Internal Redis URL, not External

### "CORS errors"
1. Verify `ALLOW_ORIGIN` in Render exactly matches your Vercel URL
2. No trailing slash: `https://ai-trader-snowy.vercel.app` ✅
3. HTTPS required (not HTTP)
4. Restart Render service after changing `ALLOW_ORIGIN`

### "401/403 auth errors"
1. Verify `API_TOKEN` is identical in both Render and Vercel
2. Generate new token: `openssl rand -hex 32`
3. Set in both places
4. Redeploy both services

---

## After Success

Once all checkboxes are checked:

1. **Monitor for 24 hours**:
   - Check Render logs for errors
   - Check Vercel function logs
   - Test all buttons a few times throughout the day

2. **Optional: Add preview deployments**:
   - Update `ALLOW_ORIGIN` in Render to include preview URLs
   - Format: `https://ai-trader-snowy.vercel.app,https://ai-trader-*-scprime.vercel.app`

3. **Create Pull Request**:
   ```bash
   gh pr create \
     --title "feat: Cloud deployment with Render + Vercel" \
     --body "See DEPLOYMENT_CHECKLIST.md for acceptance criteria. All tests passing."
   ```

4. **Consider next steps**:
   - Upgrade Redis to paid plan (for persistence)
   - Set up monitoring/alerts
   - Configure custom domain
   - Enable live trading (after extensive paper trading)

---

## Cost Estimate

**Current setup** (with free tiers):
- Render Free: $0/month (backend sleeps after 15min inactivity)
- Vercel Hobby: $0/month (frontend always on)
- Redis Free: $0/month (ephemeral, 0.1 GB)

**Total: $0/month**

**Recommended production** (after testing):
- Render Starter: $7/month (backend always on)
- Vercel Hobby: $0/month
- Render Redis (Key-Value): $10/month (persistent, 1 GB)

**Total: $17/month**

---

## Links

- **Feature Branch**: https://github.com/SCPrime/ai-Trader/tree/feat/option-a-cloud-backend
- **Deployment Fixes Commit**: https://github.com/SCPrime/ai-Trader/commit/45f7c2b
- **Render Dashboard**: https://dashboard.render.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Vercel Site**: https://ai-trader-snowy.vercel.app

---

**Estimated Time**: 30-40 minutes total

**You are here**: Ready to execute Steps 1-7 above.

**After this guide**: Your cloud deployment will be live and operational.