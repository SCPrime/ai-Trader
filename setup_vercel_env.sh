#!/bin/bash
echo "🔧 Setting up Vercel Environment Variables"
echo "=========================================="

echo "⚠️  IMPORTANT: Only use PAPER trading keys!"
echo ""

# Required trading API keys
echo "Setting up Alpaca Paper Trading keys..."
vercel env add ALPACA_API_KEY_ID production << EOF
PKZOA0NRY3QYX6N04X7E
EOF

vercel env add ALPACA_API_SECRET_KEY production << EOF
2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe
EOF

vercel env add APCA_API_BASE_URL production << EOF
https://paper-api.alpaca.markets
EOF

# AI API keys
echo "Setting up AI API keys..."
vercel env add ANTHROPIC_API_KEY production << EOF
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
EOF

# Safety flags (REQUIRED)
echo "Setting up safety flags..."
vercel env add FORCE_PAPER_TRADING production << EOF
true
EOF

vercel env add ENVIRONMENT production << EOF
production
EOF

vercel env add TRADING_MODE production << EOF
paper
EOF

echo ""
echo "✅ Environment variables configured!"
echo "🚀 Ready to deploy with: vercel --prod"
echo ""
echo "⚠️  SAFETY REMINDER: All trading is PAPER ONLY"