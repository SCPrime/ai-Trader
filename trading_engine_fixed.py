
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
