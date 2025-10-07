# 🎯 AI-Trader Quick Start Guide

**Last Updated:** October 7, 2025

---

## 🚀 **Access Your Application**

### **Production URLs:**
- **Frontend:** https://ai-trader-snowy.vercel.app
- **Backend:** Check [Render Dashboard](https://dashboard.render.com/)
- **API Docs:** `https://your-backend-url.onrender.com/docs`

---

## ⚡ **Quick Commands**

### **Local Development:**
```bash
# Start Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Start Frontend
cd frontend
npm run dev
```

### **Testing:**
```bash
# Run Frontend Tests
cd frontend
npm run test:ci

# Run Specific Test
npm test -- telemetry.test.ts
```

### **Deployment:**
```bash
# Deploy Everything (auto-deploy on push)
git add .
git commit -m "your message"
git push origin main
```

---

## 📊 **View Telemetry Data**

### **In the App:**
1. Go to https://ai-trader-snowy.vercel.app
2. Click Settings (⚙️ icon)
3. Navigate to "Telemetry & Logging" tab

### **Via API:**
```bash
# Get recent events
curl https://your-backend-url.onrender.com/api/telemetry/events

# Get statistics
curl https://your-backend-url.onrender.com/api/telemetry/stats

# Export all data
curl https://your-backend-url.onrender.com/api/telemetry/export
```

---

## 🔑 **Important Credentials**

### **API Token:**
```
AKF6WG4GNJZWOSMX03EE
```

### **Alpaca Paper Trading:**
- **API Key:** `PKZOA0NRY3QYX6N04X7E`
- **Secret:** `2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe`
- **Dashboard:** https://app.alpaca.markets/paper/dashboard/overview

---

## ✅ **Verify Deployment**

### **1. Check Backend:**
```bash
curl https://your-backend-url.onrender.com/api/health
# Should return: {"status":"ok","time":"..."}
```

### **2. Check Account Data:**
```bash
curl https://your-backend-url.onrender.com/api/portfolio/account \
  -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE"
```

### **3. Test Frontend:**
1. Visit https://ai-trader-snowy.vercel.app
2. Should load without errors
3. All 10 workflows should be functional

---

## 🎛️ **Owner Controls**

### **Settings Panel:**
- **User Management** - Activate/suspend users
- **Trading Mode** - Toggle paper ↔ live
- **Theme** - Customize colors
- **Permissions** - Manage user access
- **Telemetry** - View analytics
- **Emergency Kill Switch** - Halt all trading

### **Toggle Trading Mode:**
⚠️ **Currently in PAPER MODE (safe)**

To enable live trading:
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select `ai-trader-backend`
3. Environment → Edit `LIVE_TRADING` → Set to `true`
4. Redeploy

---

## 🐛 **Common Issues**

### **Frontend not loading?**
- Check Vercel deployment status
- Verify environment variables in Vercel
- Check browser console for errors

### **Backend not responding?**
- Check Render deployment logs
- Verify service is running
- Test health endpoint

### **Telemetry not tracking?**
- Verify `NEXT_PUBLIC_ENABLE_TELEMETRY=true` in Vercel
- Check browser console for `[Telemetry]` messages
- Ensure backend `/api/telemetry` endpoint is accessible

---

## 📈 **What's Deployed**

### **Completed Features:**
✅ Full telemetry system with analytics
✅ Real Alpaca API integration (paper mode)
✅ User management and permissions
✅ Trading journal and risk dashboard
✅ AI-powered recommendations
✅ Market screening and analysis
✅ 10 complete workflows
✅ Testing framework (Jest)
✅ Production deployment

### **Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** FastAPI, Python 3.11
- **APIs:** Alpaca (trading), OpenAI (AI features)
- **Deployment:** Vercel (frontend), Render (backend)
- **Testing:** Jest, React Testing Library

---

## 🎯 **Next Actions**

### **1. Verify Deployments (5 min)**
- Check Render dashboard for backend status
- Check Vercel dashboard for frontend status
- Test the production app

### **2. Test Telemetry (10 min)**
- Click around the app
- Check Settings → Telemetry tab
- Verify events are being tracked

### **3. Test Alpaca Integration (10 min)**
- View account data in Active Positions
- Try executing a test trade (paper mode)
- Check Alpaca dashboard for order

### **4. Monitor (ongoing)**
- Check telemetry daily
- Export data weekly
- Monitor error rates

---

## 🔗 **Important Links**

### **Dashboards:**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Render Dashboard](https://dashboard.render.com/)
- [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview)

### **Documentation:**
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)
- [API Documentation](https://your-backend-url.onrender.com/docs)

### **Source Code:**
- [GitHub Repository](https://github.com/SCPrime/ai-Trader)

---

## 💡 **Pro Tips**

1. **Always test in paper mode first**
2. **Check telemetry before making changes**
3. **Use git branches for new features**
4. **Export telemetry data weekly**
5. **Monitor Alpaca account daily**

---

## 🆘 **Need Help?**

### **Check logs:**
```bash
# Render (backend)
View in dashboard → Logs tab

# Vercel (frontend)
View in dashboard → Deployments → [latest] → Logs
```

### **Debug locally:**
```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

---

**Status:** ✅ Production Ready
**Mode:** Paper Trading (Safe)
**Next Review:** Check deployment status in 5 minutes
