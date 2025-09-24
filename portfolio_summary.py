from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient
from datetime import datetime

client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

# Get account
account = client.get_account()

# Get all orders from today
orders = client.get_orders()

# Get all positions
positions = client.get_all_positions()

print("📊 TRADING SUMMARY")
print("=" * 60)
print(f"Account Value: ${float(account.portfolio_value):,.2f}")
print(f"Cash: ${float(account.cash):,.2f}")
print(f"Buying Power: ${float(account.buying_power):,.2f}")

print("\n📈 POSITIONS:")
print("-" * 60)
if positions:
    for pos in positions:
        print(f"{pos.symbol}: {pos.qty} shares @ ${float(pos.avg_entry_price):.2f}")
        print(f"  Current Value: ${float(pos.market_value):.2f}")
        print(f"  P/L: ${float(pos.unrealized_pl):.2f}")
else:
    print("No positions yet")

print("\n📝 RECENT ORDERS:")
print("-" * 60)
for order in orders[:5]:
    print(f"{order.symbol}: {order.side} {order.qty} - Status: {order.status}")