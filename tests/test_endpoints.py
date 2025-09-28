import requests

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

print("Testing API endpoints...")
print("=" * 50)

for ep in endpoints:
    try:
        resp = requests.get(base_url + ep)
        print(f"{ep}: {resp.status_code}")
        if resp.status_code != 200:
            print(f"  Response: {resp.text[:100]}")
    except Exception as e:
        print(f"{ep}: FAILED - {e}")

print("=" * 50)
print("Endpoint verification complete!")