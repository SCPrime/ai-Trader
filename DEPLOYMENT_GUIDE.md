# 🚀 AI Trader - Complete Deployment Guide

## Status: ✅ Ready to Deploy

All code is committed and pushed to GitHub main branch.

---

## 📋 Prerequisites

- GitHub account with `SCPrime/ai-Trader` repository
- Render.com account (free tier)
- Vercel account (already configured)

---

## 🎯 Step-by-Step Deployment

### **STEP 1: Deploy Backend to Render** ⏱️ 5-7 minutes

1. **Go to Render Dashboard**
   - Open: https://dashboard.render.com/select-repo?type=web
   - Sign in with GitHub

2. **Create New Web Service**
   - Click **"New +"** → **"Web Service"**
   - Select repository: **`SCPrime/ai-Trader`**
   - Click **"Connect"**

3. **Configure Service Settings**
   ```
   Name:              ai-trader-backend
   Region:            Oregon (US West)
   Branch:            main
   Root Directory:    backend
   Runtime:           Python 3
   Build Command:     pip install -r requirements.txt
   Start Command:     uvicorn app.main:app --host 0.0.0.0 --port $PORT
   Instance Type:     Free
   ```

4. **Environment Variables** (Add these manually if not auto-populated)
   ```
   API_TOKEN              = AKF6WG4GNJZWOSMX03EE
   ALPACA_API_KEY         = PKZOA0NRY3QYX6N04X7E
   ALPACA_SECRET_KEY      = 2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe
   ALLOW_ORIGIN           = https://ai-trader-snowy.vercel.app
   LIVE_TRADING           = false
   ```

5. **Deploy**
   - Click **"Create Web Service"**
   - Wait for build to complete (~3-5 minutes)
   - Look for "Live" status with a green checkmark

6. **Copy Your Backend URL**
   - At the top of the page, you'll see: `https://ai-trader-backend.onrender.com`
   - **Copy this URL** - you'll need it for Step 2

---

### **STEP 2: Update Vercel Environment Variable** ⏱️ 2 minutes

Run this command in your terminal (replace `YOUR_RENDER_URL` with the URL from Step 1):

```bash
cd frontend
npx vercel env rm BACKEND_API_BASE_URL production
echo "YOUR_RENDER_URL" | npx vercel env add BACKEND_API_BASE_URL production
```

**Example:**
```bash
cd frontend
npx vercel env rm BACKEND_API_BASE_URL production
echo "https://ai-trader-backend.onrender.com" | npx vercel env add BACKEND_API_BASE_URL production
```

---

### **STEP 3: Redeploy Frontend** ⏱️ 2-3 minutes

```bash
npx vercel --prod
```

Wait for deployment to complete. You'll see a URL like:
```
https://ai-trader-snowy.vercel.app
```

---

## ✅ Verification

### Test Backend Deployment

```bash
# Replace with your actual Render URL
curl https://ai-trader-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T...",
  "uptime": 123.45
}
```

### Test AI Recommendations Endpoint

```bash
curl https://ai-trader-backend.onrender.com/api/ai/recommendations \
  -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE"
```

Should return mock stock recommendations.

### Test Account Endpoint

```bash
curl https://ai-trader-backend.onrender.com/api/account \
  -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE"
```

Should return Alpaca account mock data.

### Test Frontend

1. Open: https://ai-trader-snowy.vercel.app
2. Click on **"AI RECS"** wedge
3. Click **"Generate Recommendations"**
4. Should see real data from backend (no more 404 errors!)

---

## 🔧 Configuration Details

### Backend Endpoints Available

- `GET /api/health` - Health check
- `GET /api/settings` - App settings
- `GET /api/account` - Alpaca account info
- `GET /api/portfolio/positions` - Portfolio positions
- `GET /api/ai/recommendations` - AI trading recommendations
- `GET /api/market/conditions` - Market conditions
- `GET /api/screening/opportunities` - Trading opportunities
- `POST /api/trading/execute` - Execute trades (dry run by default)

### Environment Variables Explained

| Variable | Purpose | Value |
|----------|---------|-------|
| `API_TOKEN` | Frontend-to-backend authentication | Secure token for API calls |
| `ALPACA_API_KEY` | Alpaca paper trading API key | For future live data integration |
| `ALPACA_SECRET_KEY` | Alpaca paper trading secret | For future live data integration |
| `ALLOW_ORIGIN` | CORS configuration | Frontend URL for security |
| `LIVE_TRADING` | Trading mode | `false` = paper trading only |

---

## 🎉 Success Indicators

✅ **Backend deployed successfully** when you see:
- "Live" status in Render dashboard
- `/api/health` endpoint returns 200 OK
- No error logs in Render logs

✅ **Frontend connected successfully** when:
- No 404 errors in browser console
- AI Recommendations load without errors
- Morning Routine shows real data
- All 10 wedges function properly

---

## 🐛 Troubleshooting

### Backend Build Fails
- Check Render logs for Python errors
- Verify `requirements.txt` has all dependencies
- Ensure Python version is 3.9+

### Frontend Can't Connect to Backend
- Verify `BACKEND_API_BASE_URL` in Vercel matches Render URL exactly
- Check CORS `ALLOW_ORIGIN` matches Vercel URL
- Verify `API_TOKEN` matches in both frontend and backend

### 404 Errors in Production
- Clear browser cache
- Verify frontend redeployed after env var changes
- Check Network tab in browser DevTools for actual URLs being called

---

## 📊 Monitoring

### Render Dashboard
- View logs: https://dashboard.render.com
- Monitor uptime and performance
- Free tier: 750 hours/month (enough for 24/7 uptime)

### Vercel Dashboard
- View deployments: https://vercel.com/dashboard
- Monitor frontend performance
- Check serverless function logs

---

## 🔄 Future Updates

When you push to `main` branch:
1. **Backend**: Render auto-deploys (wait ~3-5 min)
2. **Frontend**: Vercel auto-deploys (wait ~2-3 min)

Both platforms watch the `main` branch and deploy automatically.

---

## 📞 Support

If deployment fails:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Project → Deployments → Logs
3. Verify all environment variables are set correctly
4. Ensure latest code is pushed to GitHub main branch

---

## 🎯 Current Deployment Status

- ✅ **Code**: Committed and pushed to `main` branch
- ✅ **Backend Config**: `render.yaml` configured with all settings
- ✅ **Requirements**: `requirements.txt` includes all dependencies
- ✅ **Frontend Config**: Environment variables ready in Vercel
- ⏳ **Pending**: Manual deployment via Render dashboard
- ⏳ **Pending**: Update Vercel env var with Render URL
- ⏳ **Pending**: Frontend redeploy

**Latest Commits:**
- `4c692eb` - Config: Update render.yaml for main branch deployment
- `bea7f26` - Feat: Add /api/account endpoint with Alpaca account mock data
- `3d14dc3` - Fix: Add python-dotenv to requirements.txt

---

**🚀 Ready to deploy! Follow Steps 1-3 above.**
