#\!/bin/bash
# Final cleanup script for AI Trading Bot
echo "🧹 AI Trading Bot - Final Cleanup & Maintenance"
echo "================================================"
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
echo "✅ Cleanup complete\!"
