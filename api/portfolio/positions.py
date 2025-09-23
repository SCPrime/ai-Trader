#!/usr/bin/env python3
"""
Vercel serverless function for portfolio positions
"""

import json
from datetime import datetime
import random

def handler(request):
    """Handle portfolio positions requests"""

    try:
        # Simulate portfolio positions data
        positions = [
            {
                "symbol": "AAPL",
                "type": "Stock",
                "quantity": 10,
                "avg_price": 150.00,
                "current_price": 152.30,
                "market_value": 1523.00,
                "day_pnl": 23.00,
                "day_pnl_percent": 1.53,
                "total_pnl_percent": 1.53,
                "strategy": "AI Strategy 1"
            },
            {
                "symbol": "TSLA",
                "type": "Call Option",
                "quantity": 2,
                "avg_price": 5.20,
                "current_price": 6.10,
                "market_value": 1220.00,
                "day_pnl": 180.00,
                "day_pnl_percent": 17.31,
                "total_pnl_percent": 17.31,
                "strategy": "Options Income",
                "strike": 250,
                "expiry": "2025-10-15"
            },
            {
                "symbol": "SPY",
                "type": "Iron Condor",
                "quantity": 1,
                "avg_price": 2.50,
                "current_price": 1.80,
                "market_value": 180.00,
                "day_pnl": -70.00,
                "day_pnl_percent": -28.0,
                "total_pnl_percent": -28.0,
                "strategy": "Multi-leg Strategy",
                "legs": [
                    {"type": "Call", "strike": 450, "action": "sell"},
                    {"type": "Call", "strike": 460, "action": "buy"},
                    {"type": "Put", "strike": 440, "action": "sell"},
                    {"type": "Put", "strike": 430, "action": "buy"}
                ]
            }
        ]

        portfolio_summary = {
            "total_value": 12923.00,
            "day_pnl": 133.00,
            "unrealized_pnl": 85.20,
            "realized_pnl": 47.80,
            "buying_power": 7824.30,
            "win_rate": 78.5,
            "active_positions": len(positions),
            "options_premium": 245.75
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                "success": True,
                "positions": positions,
                "summary": portfolio_summary,
                "last_updated": datetime.now().isoformat()
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
        }