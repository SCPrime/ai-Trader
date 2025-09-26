#!/bin/bash
echo "🤖 AI Trading Bot Startup"
echo "========================"
echo "Mode: PAPER TRADING (Safe Mode)"
echo ""

# Check for .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start the bot with logging
echo "Starting bot..."
python main.py run --paper --log-level INFO 2>&1 | tee logs/bot_$(date +%Y%m%d).log
