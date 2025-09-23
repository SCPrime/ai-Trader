#!/usr/bin/env python3
"""
Vercel serverless function for strategy testing
"""

import json
from datetime import datetime
import random
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for strategy testing"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

            # Parse JSON body
            try:
                request_data = json.loads(body)
            except json.JSONDecodeError:
                request_data = {}

            strategy_name = request_data.get("strategy_name", "Unknown")

            # Simulate options income strategy results
            investment_legs = []
            symbols = ["PLTR", "NOK", "SIRI", "SOFI", "NIO", "WISH", "CLOV", "BBBY", "AMC", "XPEV", "FCEL", "PLUG", "CCIV", "RIDE", "NKLA"]

            for i, symbol in enumerate(symbols[:10]):  # Limit to 10 for demo
                price = round(random.uniform(1.0, 4.0), 2)
                iv_rank = round(random.uniform(80, 95), 1)

                # Cash-Secured Put
                csp_strike = round(price * 0.95, 2)
                csp_premium = round(price * 0.05, 2)
                csp_profit = round(csp_premium * 0.5, 2)

                investment_legs.append({
                    "symbol": symbol,
                    "leg_type": "Cash-Secured Put",
                    "strike": csp_strike,
                    "expiration": "30-45 DTE",
                    "premium_collected": csp_premium,
                    "estimated_profit": csp_profit,
                    "confidence": round(random.uniform(75, 90), 1),
                    "iv_rank": iv_rank,
                    "current_price": price
                })

            response_data = {
                "success": True,
                "strategy_name": strategy_name,
                "results": investment_legs,
                "total_potential_profit": round(sum(leg["estimated_profit"] for leg in investment_legs), 2),
                "timestamp": datetime.now().isoformat()
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

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
            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()