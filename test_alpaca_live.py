# test_alpaca_live.py
import os
from dotenv import load_dotenv
from alpaca.trading.client import TradingClient

load_dotenv()

api_key = os.getenv('APCA_API_KEY_ID')
api_secret = os.getenv('APCA_API_SECRET_KEY')

print(f"API Key: {api_key}")
print(f"API Secret: {api_secret[:10]}..." if api_secret else "API Secret: None")

if not api_key or not api_secret:
    print("ERROR: Environment variables not loaded correctly!")
    exit(1)

try:
    client = TradingClient(api_key, api_secret, paper=True)
    account = client.get_account()
    print("SUCCESS: Connected to Alpaca!")
    print(f"Account Value: ${account.portfolio_value}")
    print(f"Available Cash: ${account.cash}")
    print(f"Buying Power: ${account.buying_power}")
except Exception as e:
    print(f"ERROR: Failed to connect to Alpaca: {e}")
    print("Please verify your API keys are correct and account is activated")