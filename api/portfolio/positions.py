#!/usr/bin/env python3
"""
Vercel serverless function for portfolio positions
"""

import json
from datetime import datetime
import random
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle portfolio positions requests"""
        try:
            # Generate demo positions including multi-leg strategies
            positions = [
                {
                    "symbol": "AAPL",
                    "type": "Stock",
                    "quantity": 100,
                    "avg_price": 150.00,
                    "current_price": 155.30,
                    "market_value": 15530.00,
                    "day_pnl": 530.00,
                    "day_pnl_percent": 3.53,
                    "total_pnl_percent": 3.53,
                    "strategy": "Long Stock"
                },
                {
                    "symbol": "SPY",
                    "type": "Iron Condor",
                    "quantity": 2,
                    "avg_price": 3.50,
                    "current_price": 2.10,
                    "market_value": 420.00,
                    "day_pnl": -280.00,
                    "day_pnl_percent": -40.0,
                    "total_pnl_percent": -40.0,
                    "strategy": "Iron Condor Strategy",
                    "legs": [
                        {"type": "Call", "strike": 450, "action": "sell", "quantity": 2, "premium": 1.20},
                        {"type": "Call", "strike": 460, "action": "buy", "quantity": 2, "premium": 0.60},
                        {"type": "Put", "strike": 440, "action": "sell", "quantity": 2, "premium": 1.10},
                        {"type": "Put", "strike": 430, "action": "buy", "quantity": 2, "premium": 0.50}
                    ]
                },
                {
                    "symbol": "TSLA",
                    "type": "Bull Call Spread",
                    "quantity": 5,
                    "avg_price": 2.50,
                    "current_price": 3.80,
                    "market_value": 1900.00,
                    "day_pnl": 650.00,
                    "day_pnl_percent": 52.0,
                    "total_pnl_percent": 52.0,
                    "strategy": "Bull Call Spread",
                    "legs": [
                        {"type": "Call", "strike": 250, "action": "buy", "quantity": 5, "premium": 8.50},
                        {"type": "Call", "strike": 270, "action": "sell", "quantity": 5, "premium": 6.00}
                    ]
                }
            ]

            portfolio_summary = {
                "total_value": 17850.00,
                "day_pnl": 900.00,
                "unrealized_pnl": 900.00,
                "realized_pnl": 0.00,
                "buying_power": 25000.00,
                "win_rate": 66.7,
                "active_positions": len(positions),
                "options_premium": 1250.00
            }

            response_data = {
                "success": True,
                "positions": positions,
                "summary": portfolio_summary,
                "last_updated": datetime.now().isoformat()
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()