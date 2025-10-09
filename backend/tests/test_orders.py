from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
HEAD = {"Authorization": "Bearer change-me"}

def test_duplicate_idempotency():
    body = {"dryRun": True, "requestId": "abc", "orders":[{"symbol":"AAPL","side":"buy","qty":1}]}
    r1 = client.post("/api/trading/execute", json=body, headers=HEAD)
    r2 = client.post("/api/trading/execute", json=body, headers=HEAD)
    assert r1.status_code == 200
    assert r2.json().get("duplicate") is True