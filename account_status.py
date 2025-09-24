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

account = client.get_account()
clock = client.get_clock()

print("Account Status:")
print("=" * 50)
print(f"Buying Power: ${float(account.buying_power):,.2f}")
print(f"Cash: ${float(account.cash):,.2f}")
print(f"Portfolio Value: ${float(account.portfolio_value):,.2f}")
print("")
print(f"Market is: {'OPEN' if clock.is_open else 'CLOSED'}")
print(f"Next Open: {clock.next_open}")
print(f"Next Close: {clock.next_close}")