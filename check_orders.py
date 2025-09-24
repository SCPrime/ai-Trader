from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient

client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

# Get recent orders
orders = client.get_orders()

print("Recent Orders:")
print("=" * 50)
for order in orders[:5]:  # Show last 5 orders
    print(f"Symbol: {order.symbol}")
    print(f"Quantity: {order.qty}")
    print(f"Side: {order.side}")
    print(f"Status: {order.status}")
    print(f"Filled Qty: {order.filled_qty}")
    print(f"Order ID: {order.id}")
    print("-" * 50)
    