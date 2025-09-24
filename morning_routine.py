from dotenv import load_dotenv
load_dotenv()
import os
from datetime import datetime
from alpaca.trading.client import TradingClient

client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

def morning_check():
    print("=" * 60)
    print("GOOD MORNING! Market Check")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    clock = client.get_clock()
    
    if clock.is_open:
        print("Market is OPEN")
    else:
        print("Market is CLOSED")
        print(f"Opens at: {clock.next_open}")
    
    account = client.get_account()
    print(f"\nAccount Status:")
    print(f"  Balance: ${float(account.portfolio_value):,.2f}")
    print(f"  Buying Power: ${float(account.buying_power):,.2f}")
    
    positions = client.get_all_positions()
    if positions:
        print(f"\nYou own {len(positions)} stocks:")
        for pos in positions:
            print(f"  {pos.symbol}: {pos.qty} shares")
    
    orders = client.get_orders()
    if orders:
        print(f"\n{len(orders)} orders pending")
    
    print("\nReady to trade!")

morning_check()