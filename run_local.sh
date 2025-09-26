#!/bin/bash
echo "🏠 Starting LOCAL Paper Trading Bot"
echo "==================================="

export ENVIRONMENT=local
export FORCE_PAPER_TRADING=true

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Create .env with your PAPER trading keys"
    exit 1
fi

# Start locally
echo "Starting on http://localhost:8002"
python main.py dashboard