import uvicorn
import os
import sys
sys.path.append(os.path.dirname(__file__))
from trading_api import app

if __name__ == "__main__":
    # Ensure we're in paper trading mode
    os.environ['TRADING_MODE'] = 'PAPER'

    print("[LAUNCH] Starting Enhanced Trading API...")
    print("[MODE] Paper Trading")
    print("[URL] http://localhost:8001")
    print("[DOCS] http://localhost:8001/docs")

    # Run the enhanced API
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001  # Use different port to avoid conflict
    )