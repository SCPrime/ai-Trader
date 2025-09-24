from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient

print("Loading API keys...")
api_key = os.getenv('ALPACA_PAPER_API_KEY')
secret_key = os.getenv('ALPACA_PAPER_SECRET_KEY')

if not api_key or not secret_key:
    print("ERROR: API keys not found in .env file")
else:
    print("Connecting to Alpaca...")
    client = TradingClient(
        api_key=api_key,
        secret_key=secret_key,
        paper=True
    )
    
    account = client.get_account()
    print('=' * 50)
    print('YOUR ALPACA PAPER ACCOUNT:')
    print('=' * 50)
    print(f'Account #: {account.account_number}')
    print(f'Status: {account.status}')
    print(f'Cash: ${float(account.cash):,.2f}')
    print(f'Buying Power: ${float(account.buying_power):,.2f}')
    print('=' * 50)
    