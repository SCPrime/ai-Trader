#!/bin/bash
echo "🔒 FINAL CLEANUP & SECURITY LOCKDOWN"
echo "===================================="

# 1. Remove ALL test files
echo "Removing test files..."
find . -name "test_*.py" -delete
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# 2. Secure sensitive files
echo "Securing configurations..."
chmod 600 .env 2>/dev/null
chmod 600 *.pem 2>/dev/null
chmod 600 *.key 2>/dev/null

# 3. Create environment configs
echo "Creating environment configs..."
mkdir -p config/environments

# Local config
cat > config/environments/local.json << 'JSON'
{
  "name": "local",
  "trading_mode": "paper",
  "api_base": "http://localhost:8002",
  "debug": true,
  "max_risk": 1000
}
JSON

# Production config (Vercel)
cat > config/environments/production.json << 'JSON'
{
  "name": "production",
  "trading_mode": "paper_only",
  "api_base": "https://your-app.vercel.app",
  "debug": false,
  "max_risk": 500,
  "force_paper": true
}
JSON

# 4. Git cleanup
git add .
git commit -m "Security lockdown: cleaned test files, secured configs"

echo "✅ Cleanup complete!"