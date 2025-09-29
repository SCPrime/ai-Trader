# Cloud Deployment Instructions

## Prerequisites
- GitHub repo: `SCPrime/ai-Trader`
- Branch: `feat/option-a-cloud-backend`
- Render account with access to the repo
- Vercel account with access to the repo

## Step 1: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect repository: `SCPrime/ai-Trader`
4. Configure:
   - **Name**: `ai-trader-backend` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `feat/option-a-cloud-backend`
   - **Root Directory**: `backend/`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (or paid for production)

5. **Environment Variables** (click "Advanced" or go to Environment tab):
   ```
   API_TOKEN=<generate-secure-token>
   LIVE_TRADING=false
   ALLOW_ORIGIN=https://<your-vercel-app>.vercel.app
   REDIS_URL=redis://localhost:6379
   ```

   **Important**:
   - Generate a strong `API_TOKEN` (use `openssl rand -hex 32`)
   - You'll add the correct `ALLOW_ORIGIN` after Vercel deployment
   - For production, use managed Redis (add Redis service in Render)

6. Click **Create Web Service**
7. Wait for deployment (5-10 minutes)
8. **Copy your Render URL**: `https://ai-trader-backend-xxxx.onrender.com`

### Verify Backend

```bash
curl -s https://ai-trader-backend-xxxx.onrender.com/api/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "redis": "connected",
  "kill_switch": {"enabled": false}
}
```

## Step 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import repository: `SCPrime/ai-Trader`
4. Configure:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend/`
   - **Build Command**: (leave default: `next build`)
   - **Output Directory**: (leave default)

5. **Environment Variables** (Server-side only):
   ```
   BACKEND_API_BASE_URL=https://ai-trader-backend-xxxx.onrender.com
   API_TOKEN=<same-token-as-render>
   ```

6. **Git Configuration**:
   - Click **Settings** → **Git**
   - **Production Branch**: `feat/option-a-cloud-backend`

7. Click **Deploy**
8. Wait for deployment (2-5 minutes)
9. **Copy your Vercel URL**: `https://ai-trader-xxxx.vercel.app`

## Step 3: Update CORS on Render

1. Go back to Render dashboard
2. Select your `ai-trader-backend` service
3. Go to **Environment** tab
4. Update `ALLOW_ORIGIN`:
   ```
   ALLOW_ORIGIN=https://ai-trader-xxxx.vercel.app
   ```
5. Save (this will trigger a redeploy)

## Step 4: Acceptance Testing

### Browser Testing (DevTools → Network)

1. Open: `https://ai-trader-xxxx.vercel.app`
2. Open DevTools → Network tab
3. Click each button:
   - **Health** → JSON response appears
   - **Settings** → JSON response appears
   - **Positions** → JSON response appears
   - **Execute (Dry)** → JSON response appears

4. Verify in Network tab:
   - All requests go to `/api/proxy/...` (NOT direct to Render)
   - No CORS errors
   - No 404/500 errors
   - No localhost URLs
   - Response headers include `x-request-id`

### Terminal Testing

Replace `<vercel-app>` with your actual Vercel URL:

```bash
# Test health endpoint
curl -s https://<vercel-app>.vercel.app/api/proxy/api/health | jq .

# Test idempotency (duplicate detection)
RID="test-duplicate-$(date +%s)"

# First request
curl -s -X POST \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://<vercel-app>.vercel.app/api/proxy/api/trading/execute | jq .

# Second request (same RID) - should return duplicate:true
curl -s -X POST \
  -H "content-type: application/json" \
  -d "{\"dryRun\":true,\"requestId\":\"$RID\",\"orders\":[{\"symbol\":\"AAPL\",\"side\":\"buy\",\"qty\":1}]}" \
  https://<vercel-app>.vercel.app/api/proxy/api/trading/execute | jq .
```

Expected second response:
```json
{
  "duplicate": true,
  "original_timestamp": "..."
}
```

## Step 5: Update Documentation

Update GitHub Pages or README to reference cloud URLs instead of localhost:

- **Live UI**: `https://<vercel-app>.vercel.app`
- **Backend API**: `https://<render-app>.onrender.com`

Remove any "Production Ready ✅" claims pointing to localhost.

## Architecture Summary

```
User Browser
    ↓
Vercel (Frontend + Proxy)
    ↓ [API_TOKEN auth, server-side]
Render (FastAPI Backend)
    ↓
Redis (Idempotency + Kill-Switch)
```

### Security Features Deployed

- ✅ Strict CORS to specific origins
- ✅ CSP + security headers
- ✅ Dual-token rotation capability
- ✅ Server-side token hiding (never exposed to browser)
- ✅ Redis idempotency (duplicate request detection)
- ✅ Kill-switch (emergency trading halt)
- ✅ Rate limiting (60 req/min per IP)
- ✅ Structured JSON logging
- ✅ Request ID tracing

## Troubleshooting

### Backend won't start
- Check Render logs: Dashboard → Service → Logs
- Verify `requirements.txt` exists in `backend/`
- Ensure `PORT` env var is not overridden

### Frontend proxy 404
- Verify `BACKEND_API_BASE_URL` env var is set correctly
- Check Vercel Function Logs: Dashboard → Project → Logs
- Ensure root directory is `frontend/`

### CORS errors
- Verify `ALLOW_ORIGIN` on Render matches Vercel URL exactly
- No trailing slashes
- Must be HTTPS

### Duplicate detection not working
- Verify Redis is connected (check `/api/health` response)
- Render Free tier: use `redis://localhost:6379` (ephemeral)
- Production: add managed Redis service

## Cost Estimate

- **Render Free Tier**: $0/month (backend sleeps after 15min inactivity)
- **Vercel Hobby**: $0/month (frontend always on)
- **Redis (managed)**: ~$5/month for production

Total: **$0-5/month** depending on Redis choice.

## Next Steps

After successful deployment:

1. [ ] Test all acceptance criteria above
2. [ ] Monitor Render logs for any errors
3. [ ] Set up Redis managed service for production
4. [ ] Configure custom domain (optional)
5. [ ] Set up monitoring/alerts (optional)
6. [ ] Merge `feat/option-a-cloud-backend` to `main`