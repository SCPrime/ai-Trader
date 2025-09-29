from fastapi.testclient import TestClient
from backend.app.main import app
client = TestClient(app)
def test_health(): assert client.get("/api/health").status_code == 200