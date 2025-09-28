import requests
import json

base_url = "http://localhost:8001"
endpoints = [
    "/api/account",
    "/api/positions",
    "/api/orders",
    "/api/chart/AAPL",
    "/api/quote/AAPL",
    "/api/options/chain/AAPL",
    "/api/strategies",
    "/api/settings",
    "/api/health"
]

print("Testing endpoint data validation...")
print("=" * 70)

for ep in endpoints:
    try:
        resp = requests.get(base_url + ep)
        print(f"\n{ep}: {resp.status_code}")

        if resp.status_code == 200:
            try:
                data = resp.json()
                print(f"  Response type: {type(data)}")
                if isinstance(data, dict):
                    print(f"  Keys: {list(data.keys())}")
                    # Check for common issues
                    for key, value in data.items():
                        if value is None:
                            print(f"  WARNING: {key} is None")
                elif isinstance(data, list):
                    print(f"  List length: {len(data)}")
                    if len(data) > 0:
                        print(f"  First item keys: {list(data[0].keys()) if isinstance(data[0], dict) else 'Not a dict'}")
                print(f"  Sample: {str(data)[:200]}...")
            except json.JSONDecodeError:
                print(f"  ERROR: Invalid JSON response")
                print(f"  Raw response: {resp.text[:200]}...")
        else:
            print(f"  Error response: {resp.text[:200]}")

    except Exception as e:
        print(f"{ep}: FAILED - {e}")

print("\n" + "=" * 70)
print("Data validation complete!")