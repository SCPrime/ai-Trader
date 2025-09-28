import requests
import json

base_url = "http://localhost:8001"

print("Testing error handling and edge cases...")
print("=" * 60)

# Test edge cases
edge_cases = [
    ("/api/quote/INVALID_SYMBOL", "Invalid symbol"),
    ("/api/chart/", "Empty symbol"),
    ("/api/options/chain/", "Empty symbol for options"),
    ("/api/nonexistent", "Non-existent endpoint"),
]

for endpoint, description in edge_cases:
    try:
        resp = requests.get(base_url + endpoint)
        print(f"\n{description}: {endpoint}")
        print(f"  Status: {resp.status_code}")

        if resp.status_code == 200:
            try:
                data = resp.json()
                print(f"  Response: {str(data)[:150]}...")
            except json.JSONDecodeError:
                print(f"  Raw: {resp.text[:100]}...")
        else:
            print(f"  Error: {resp.text[:150]}...")

    except Exception as e:
        print(f"  Exception: {e}")

# Test POST endpoints with invalid data
print(f"\n{'='*60}")
print("Testing POST endpoints with invalid data...")

post_tests = [
    ("/api/stock/buy", {"invalid": "data"}),
    ("/api/ai/chat", {"message": "test"}),
]

for endpoint, data in post_tests:
    try:
        resp = requests.post(base_url + endpoint, json=data)
        print(f"\nPOST {endpoint}: {resp.status_code}")
        if resp.status_code == 200:
            print(f"  Response: {resp.json()}")
        else:
            print(f"  Error: {resp.text[:150]}...")
    except Exception as e:
        print(f"  Exception: {e}")

print(f"\n{'='*60}")
print("Error handling test complete!")