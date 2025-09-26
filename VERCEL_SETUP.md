# Vercel Environment Setup

## 1. Install Vercel CLI
```bash
npm i -g vercel
```

## 2. Login to Vercel
```bash
vercel login
```

## 3. Environment Variables to Set in Vercel Dashboard

### Required Trading API Keys
```
ALPACA_API_KEY_ID=PKZOA0NRY3QYX6N04X7E
ALPACA_API_SECRET_KEY=2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe
APCA_API_BASE_URL=https://paper-api.alpaca.markets
```

### Required AI API Keys
```
ANTHROPIC_API_KEY=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
```

### Optional AI Fallback
```
OPENAI_API_KEY=your_openai_key_here
```

### Safety Settings (Auto-set by vercel.json)
```
ENVIRONMENT=production
FORCE_PAPER_TRADING=true
```

## 4. Set Environment Variables (CLI Method)

### Option A: Use Our Automated Script
```bash
# Automatically sets all required environment variables
./setup_vercel_env.sh
```

### Option B: Manual CLI Commands
```bash
# Required trading keys (PAPER ONLY)
vercel env add ALPACA_API_KEY_ID
# Enter: PKZOA0NRY3QYX6N04X7E

vercel env add ALPACA_API_SECRET_KEY
# Enter: 2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe

vercel env add APCA_API_BASE_URL
# Enter: https://paper-api.alpaca.markets

# AI API keys
vercel env add ANTHROPIC_API_KEY
# Enter: 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

# Safety flags (REQUIRED)
vercel env add FORCE_PAPER_TRADING
# Enter: true

vercel env add ENVIRONMENT
# Enter: production

vercel env add TRADING_MODE
# Enter: paper
```

## 5. Deploy Command
```bash
# Manual deployment
vercel --prod

# Or use our automated script with safety checks
./deploy_vercel.sh          # Linux/Mac
powershell deploy_vercel.ps1 # Windows
```

## 5. Environment Variables Setup in Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" section
4. Add each variable:
   - Name: `ALPACA_API_KEY_ID`
   - Value: `PKZOA0NRY3QYX6N04X7E`
   - Environment: Production, Preview, Development

Repeat for all variables above.

## 6. Verification

After deployment, verify:
- ✅ Dashboard loads at your-app.vercel.app
- ✅ AI chat responds at your-app.vercel.app/ai-chat-enhanced
- ✅ Paper trading mode confirmed
- ✅ No real trading capabilities exposed

## 7. Important Security Notes

- ⚠️ **ONLY USE PAPER TRADING KEYS**
- ⚠️ Never add live trading credentials
- ⚠️ `FORCE_PAPER_TRADING=true` is hardcoded in vercel.json
- ⚠️ All environments default to paper trading mode

## 8. Testing Your Deployment

Try these URLs after deployment:
- `https://your-app.vercel.app/` - Main dashboard
- `https://your-app.vercel.app/ai-chat-enhanced` - AI chat
- `https://your-app.vercel.app/api/ai-query?query=test` - API test

## 9. Common Issues

**Build Fails**: Check all environment variables are set
**AI Not Responding**: Verify ANTHROPIC_API_KEY is correct
**Trading Errors**: Confirm paper trading keys are valid

## 10. Monitoring

Vercel provides:
- Real-time function logs
- Performance analytics
- Error tracking
- Usage metrics

Access these in your Vercel dashboard under your project.