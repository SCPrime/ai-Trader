#!/usr/bin/env python3
"""
Complete AI Trading Bot Setup - Simplified Version
"""

import os

print("="*60)
print("CREATING AI TRADING BOT FILES")
print("="*60)

# Create trading engine fix
with open('trading_engine_fixed.py', 'w') as f:
    f.write("""
from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce

class TradingEngine:
    def __init__(self):
        self.client = TradingClient(
            api_key=os.getenv('ALPACA_PAPER_API_KEY'),
            secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
            paper=True
        )
    
    def is_available(self):
        return True
    
    async def execute_trade(self, trade_id, symbol, action, quantity, **kwargs):
        order_request = MarketOrderRequest(
            symbol=symbol,
            qty=quantity,
            side=OrderSide.BUY if action.lower()=='buy' else OrderSide.SELL,
            time_in_force=TimeInForce.DAY
        )
        order = self.client.submit_order(order_request)
        return {"success": True, "order_id": order.id}
""")
print("Created: trading_engine_fixed.py")

# Create main runner
with open('run_bot.py', 'w') as f:
    f.write("""
print("AI Trading Bot Ready!")
print("1. Start supervisor on port 8001")
print("2. Run your strategies")
print("3. Check portfolio_summary.py")
""")
print("Created: run_bot.py")

print("\n" + "="*60)
print("SETUP COMPLETE!")
print("Files created successfully")