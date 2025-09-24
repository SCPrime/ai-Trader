from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce

# Setup
client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

# Buy 1 share of Apple
order_request = MarketOrderRequest(
    symbol="AAPL",
    qty=1,
    side=OrderSide.BUY,
    time_in_force=TimeInForce.DAY
)

# Submit order
try:
    order = client.submit_order(order_request)
    print(f"Order submitted!")
    print(f"Order ID: {order.id}")
    print(f"Buying {order.qty} share of {order.symbol}")
    print(f"Status: {order.status}")
except Exception as e:
    print(f"Error: {e}")