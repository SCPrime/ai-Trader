#!/bin/bash
echo "☁️  Deploying to Vercel"
echo "====================="

# Safety checks
echo "⚠️  DEPLOYMENT CHECKLIST:"
echo -n "✓ Is FORCE_PAPER_TRADING=true in vercel.json? "
grep -q '"FORCE_PAPER_TRADING": "true"' vercel.json && echo "YES" || echo "NO - FIX THIS!"

echo -n "✓ Are you using paper API endpoints? "
grep -q 'paper-api.alpaca.markets' src/config_manager.py && echo "YES" || echo "NO - FIX THIS!"

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    npm i -g vercel
fi

# Deploy
vercel --prod