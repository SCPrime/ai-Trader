#!/usr/bin/env python3
"""Single entry point for the trading platform"""
import sys
import os
sys.path.insert(0, 'src')

from src.api.trading_api import app
import uvicorn

if __name__ == "__main__":
    print("Starting Trading Platform")
    print("Dashboard: http://localhost:8000")
    print("Paper Trading Mode Active")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)