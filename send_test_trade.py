import requests

# Send a test trade signal
trade = {
    "symbol": "AAPL",
    "action": "buy",
    "quantity": 1,
    "price": 150.00,
    "strategy": "momentum",
    "ai_confidence": 85,
    "reasoning": "Testing supervisor approval flow"
}

# Submit trade to supervisor
response = requests.post(
    "http://localhost:8001/api/supervisor/submit-trade",
    json=trade
)
print(f"Submit trade status: {response.status_code}")
if response.status_code == 200:
    print(f"Response: {response.json()}")
else:
    print(f"Error: {response.text}")