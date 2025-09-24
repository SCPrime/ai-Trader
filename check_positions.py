from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient

client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

# Get all positions
positions = client.get_all_positions()

if positions:
    print("Your Current Positions:")
    print("=" * 50)
    for position in positions:
        print(f"Symbol: {position.symbol}")
        print(f"Shares: {position.qty}")
        print(f"Value: ${float(position.market_value):.2f}")
        print(f"Profit/Loss: ${float(position.unrealized_pl):.2f}")
        print("-" * 50)
else:
    print("No open positions")
    