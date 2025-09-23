#!/usr/bin/env python3
"""
Vercel serverless function for health check
"""

import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle health check requests"""
        try:
            response_data = {
                "status": "healthy",
                "message": "AI Trading Bot Dashboard is operational on Vercel",
                "timestamp": datetime.now().isoformat(),
                "features": [
                    "Multi-leg Options Trading",
                    "AI Strategy Engine",
                    "Portfolio Management",
                    "Risk Management",
                    "Real-time Data"
                ]
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
                "status": "error",
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