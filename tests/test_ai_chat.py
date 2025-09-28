import requests
import json

base_url = "http://localhost:8001"

print("Testing AI chat endpoint...")
print("=" * 50)

# Test with correct format
test_data = {
    "message": "What's the market outlook for AAPL?",
    "context": {"symbol": "AAPL"}
}

try:
    resp = requests.post(base_url + "/api/ai/chat", json=test_data)
    print(f"POST /api/ai/chat: {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        print(f"Response: {data}")
    else:
        print(f"Error: {resp.text}")

except Exception as e:
    print(f"Exception: {e}")

print("=" * 50)