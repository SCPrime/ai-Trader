import requests
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path('.env'))

APCA_API_KEY_ID = os.getenv("APCA_API_KEY_ID")
APCA_API_SECRET_KEY = os.getenv("APCA_API_SECRET_KEY")

headers = {
    "APCA-API-KEY-ID": APCA_API_KEY_ID,
    "APCA-API-SECRET-KEY": APCA_API_SECRET_KEY
}

print("=" * 60)
print("ALPACA DATA FRESHNESS & SUBSCRIPTION TEST")
print("=" * 60)

# Test 1: Check latest trade for AAPL
print("\n[1] Testing Latest Trade Data for AAPL:")
print("-" * 60)
try:
    response = requests.get(
        "https://data.alpaca.markets/v2/stocks/AAPL/trades/latest",
        headers=headers
    )
    if response.status_code == 200:
        data = response.json()
        trade_time = datetime.fromisoformat(data['trade']['t'].replace('Z', '+00:00'))
        from datetime import timezone
        current_time = datetime.now(timezone.utc)
        delay_minutes = (current_time - trade_time).total_seconds() / 60

        print(f"[OK] Latest AAPL trade time: {data['trade']['t']}")
        print(f"   Current UTC time: {current_time.isoformat()}")
        print(f"   Data delay: {delay_minutes:.1f} minutes")
        print(f"   Trade price: ${data['trade']['p']}")
        print(f"   Trade size: {data['trade']['s']} shares")

        if delay_minutes < 1:
            print("   [REALTIME] Data is REAL-TIME")
        elif delay_minutes < 15:
            print("   [SLIGHT DELAY] Data has slight delay (< 15 min)")
        else:
            print(f"   [DELAYED] Data is delayed by {delay_minutes:.0f} minutes")
    else:
        print(f"[ERROR] Status: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"[ERROR] Error fetching trade data: {e}")

# Test 2: Check account subscription level
print("\n[2] Testing Account Subscription Level:")
print("-" * 60)
try:
    response = requests.get(
        "https://paper-api.alpaca.markets/v2/account",
        headers=headers
    )
    if response.status_code == 200:
        account = response.json()
        print(f"[OK] Account Number: {account.get('account_number')}")
        print(f"   Account Status: {account.get('status')}")
        print(f"   Crypto Status: {account.get('crypto_status')}")
        print(f"   Pattern Day Trader: {account.get('pattern_day_trader')}")
        print(f"   Trading Blocked: {account.get('trading_blocked')}")
        print(f"   Portfolio Value: ${float(account.get('portfolio_value', 0)):,.2f}")
        print(f"   Buying Power: ${float(account.get('buying_power', 0)):,.2f}")
    else:
        print(f"[ERROR] Status: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"[ERROR] Error fetching account: {e}")

# Test 3: Check latest quote for stocks under $4
print("\n[3] Testing Latest Quotes for Stocks Under $4:")
print("-" * 60)
symbols = ["TLRY", "PLUG", "BBD"]
for symbol in symbols:
    try:
        response = requests.get(
            f"https://data.alpaca.markets/v2/stocks/{symbol}/quotes/latest",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            quote_time = datetime.fromisoformat(data['quote']['t'].replace('Z', '+00:00'))
            from datetime import timezone
            current_time = datetime.now(timezone.utc)
            delay_minutes = (current_time - quote_time).total_seconds() / 60

            bid = data['quote']['bp']
            ask = data['quote']['ap']
            spread = ask - bid
            spread_pct = (spread / ask) * 100 if ask > 0 else 0

            print(f"\n{symbol}:")
            print(f"  Quote time: {data['quote']['t']}")
            print(f"  Delay: {delay_minutes:.1f} minutes")
            print(f"  Bid: ${bid:.2f}")
            print(f"  Ask: ${ask:.2f}")
            print(f"  Spread: ${spread:.3f} ({spread_pct:.2f}%)")

            if delay_minutes < 15:
                print(f"  [RECENT] Recent data")
            else:
                print(f"  [STALE] Stale data ({delay_minutes:.0f} min old)")
        else:
            print(f"\n{symbol}: [ERROR] Error {response.status_code}")
    except Exception as e:
        print(f"\n{symbol}: [ERROR] Error: {e}")

# Test 4: Check data feed subscription
print("\n[4] Checking Data Feed Subscription:")
print("-" * 60)
print("Note: Paper trading accounts typically have:")
print("  • IEX feed (15-minute delayed)")
print("  • SIP feed requires paid subscription")
print("\nTo check your subscription, visit:")
print("  https://app.alpaca.markets/paper/dashboard/overview")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
