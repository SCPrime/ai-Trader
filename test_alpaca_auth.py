#!/usr/bin/env python3
"""Test Alpaca authentication."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Environment variables:")
print(f"ALPACA_API_KEY: {os.getenv('ALPACA_API_KEY', 'NOT SET')[:10]}...")
print(f"ALPACA_SECRET_KEY: {os.getenv('ALPACA_SECRET_KEY', 'NOT SET')[:10]}...")
print(f"ALPACA_PAPER_TRADING: {os.getenv('ALPACA_PAPER_TRADING', 'NOT SET')}")

# Test direct Alpaca-py initialization
try:
    from alpaca.trading.client import TradingClient

    client = TradingClient(
        api_key=os.getenv('ALPACA_API_KEY'),
        secret_key=os.getenv('ALPACA_SECRET_KEY'),
        paper=os.getenv('ALPACA_PAPER_TRADING', 'true').lower() == 'true'
    )

    # Test connection
    account = client.get_account()
    print(f"✅ Alpaca connection successful!")
    print(f"Account ID: {account.id}")
    print(f"Cash: ${account.cash}")
    print(f"Portfolio Value: ${account.portfolio_value}")

except Exception as e:
    print(f"❌ Alpaca connection failed: {e}")