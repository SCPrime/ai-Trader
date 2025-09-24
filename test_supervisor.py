# test_supervisor.py
import requests
import json

print("=== Testing Supervisor System ===\n")

# 1. Check supervisor status
print("1. Checking supervisor status:")
response = requests.get("http://localhost:8001/api/supervisor/status")
print(f"Status: {response.status_code}")
print(f"Data: {json.dumps(response.json(), indent=2)}\n")

# 2. Test changing mode to manual
print("2. Changing to manual mode:")
response = requests.post(
    "http://localhost:8001/api/supervisor/mode",
    json={"mode": "manual"}
)
print(f"Status: {response.status_code}")
print(f"Data: {json.dumps(response.json(), indent=2)}\n")

# 3. Check status again to confirm mode change
print("3. Checking status after mode change:")
response = requests.get("http://localhost:8001/api/supervisor/status")
print(f"Status: {response.status_code}")
print(f"Data: {json.dumps(response.json(), indent=2)}\n")

# 4. Test changing back to suggest mode
print("4. Changing back to suggest mode:")
response = requests.post(
    "http://localhost:8001/api/supervisor/mode",
    json={"mode": "suggest"}
)
print(f"Status: {response.status_code}")
print(f"Data: {json.dumps(response.json(), indent=2)}\n")

print("=== Supervisor Test Complete ===")

# Note: To test trade submission, we need to add a trade submission endpoint
# or integrate with the supervisor directly from the trading strategy