from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient

# Initialize Alpaca client
def get_trading_client():
    return TradingClient(
        api_key=os.getenv('ALPACA_PAPER_API_KEY'),
        secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
        paper=True
    )

# Test function to verify connection
if __name__ == "__main__":
    client = get_trading_client()
    account = client.get_account()
    print(f"Trading client ready!")
    print(f"Account: {account.account_number}")
    print(f"Cash available: ${float(account.cash):,.2f}")
    