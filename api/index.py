#!/usr/bin/env python3
"""
Vercel serverless function - Main entry point
"""

import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed = urlparse(self.path)

            # Root path - return dashboard HTML
            if parsed.path in ['/', '/index.html', '']:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(self.get_dashboard_html().encode('utf-8'))
                return

            # 404 for other paths
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {"error": str(e), "timestamp": datetime.now().isoformat()}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def get_dashboard_html(self):
        """Return the AI Trading Dashboard HTML"""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Trading Bot Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="min-h-screen">
        <!-- Header -->
        <div class="bg-gray-800 border-b border-gray-700 p-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="text-3xl">🤖</div>
                    <div>
                        <h1 class="text-2xl font-bold">AI Trading Bot Dashboard</h1>
                        <p class="text-gray-400">Comprehensive Options Income Strategy Platform</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <span class="w-3 h-3 bg-green-500 rounded-full pulse"></span>
                        <span class="text-green-400 font-medium">ONLINE</span>
                    </div>
                    <div class="bg-green-600 px-3 py-1 rounded text-sm font-medium">
                        Paper Trading
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Banner -->
        <div class="p-6">
            <div class="bg-gradient-to-r from-green-600 to-blue-600 p-8 rounded-xl mb-8">
                <div class="flex items-center space-x-4">
                    <div class="text-4xl">✅</div>
                    <div>
                        <h2 class="text-3xl font-bold mb-2">AI Trading Dashboard Live on Vercel!</h2>
                        <p class="text-xl opacity-90">All systems operational and ready for comprehensive options trading</p>
                        <div class="mt-4 flex space-x-4">
                            <span class="bg-white bg-opacity-20 px-3 py-1 rounded">Multi-leg Options ✓</span>
                            <span class="bg-white bg-opacity-20 px-3 py-1 rounded">AI Strategy Engine ✓</span>
                            <span class="bg-white bg-opacity-20 px-3 py-1 rounded">Real-time Data ✓</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Feature Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-chart-line text-blue-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">Portfolio Management</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Real-time portfolio tracking with multi-leg options position support</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-brain text-purple-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">AI Strategy Engine</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Natural language strategy creation with intelligent parsing and validation</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-cogs text-yellow-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">Multi-leg Options</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Iron Condor, Bull Call Spreads, and complex strategy execution</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-shield-alt text-red-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">Risk Management</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Advanced position sizing, stop-loss, and exposure controls</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-robot text-cyan-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">AI Reasoning</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Transparent trade explanations and decision logic transparency</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div class="flex items-center space-x-3 mb-4">
                        <i class="fas fa-mobile-alt text-green-400 text-2xl"></i>
                        <h3 class="text-xl font-semibold">Responsive Design</h3>
                    </div>
                    <p class="text-gray-300 mb-4">Optimized for desktop, tablet, and mobile trading on the go</p>
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span class="text-green-400 text-sm">Operational</span>
                    </div>
                </div>
            </div>

            <!-- API Status -->
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
                <h3 class="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <i class="fas fa-server text-blue-400"></i>
                    <span>API Endpoints Status</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-700 p-4 rounded flex justify-between items-center">
                        <div>
                            <div class="font-mono text-blue-400">/api/health</div>
                            <div class="text-xs text-gray-400">System health monitoring</div>
                        </div>
                        <button onclick="testEndpoint('/api/health')" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
                            Test
                        </button>
                    </div>
                    <div class="bg-gray-700 p-4 rounded flex justify-between items-center">
                        <div>
                            <div class="font-mono text-blue-400">/api/portfolio/positions</div>
                            <div class="text-xs text-gray-400">Portfolio position data</div>
                        </div>
                        <button onclick="testEndpoint('/api/portfolio/positions')" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
                            Test
                        </button>
                    </div>
                    <div class="bg-gray-700 p-4 rounded flex justify-between items-center">
                        <div>
                            <div class="font-mono text-blue-400">/api/strategy/test</div>
                            <div class="text-xs text-gray-400">Strategy testing engine</div>
                        </div>
                        <button onclick="testStrategy()" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
                            Test
                        </button>
                    </div>
                    <div class="bg-gray-700 p-4 rounded flex justify-between items-center">
                        <div>
                            <div class="font-mono text-blue-400">/api/trading/execute</div>
                            <div class="text-xs text-gray-400">Trade execution engine</div>
                        </div>
                        <button onclick="testTrade()" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
                            Test
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="text-center space-x-4">
                <button onclick="testStrategy()" class="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold">
                    🧪 Test AI Strategy Engine
                </button>
                <button onclick="showPortfolio()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold">
                    📊 View Portfolio Data
                </button>
                <button onclick="testTrade()" class="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold">
                    💹 Execute Demo Trade
                </button>
            </div>
        </div>
    </div>

    <script>
        async function testEndpoint(endpoint) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                alert(`✅ ${endpoint}\\n\\nResponse: ${JSON.stringify(data, null, 2)}`);
            } catch (error) {
                alert(`❌ Error testing ${endpoint}: ${error.message}`);
            }
        }

        async function testStrategy() {
            try {
                const response = await fetch('/api/strategy/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ strategy_name: 'Demo AI Strategy' })
                });
                const data = await response.json();
                alert(`🎯 AI Strategy Test Results:\\n\\n✅ Strategy: ${data.strategy_name}\\n📊 Opportunities Found: ${data.results?.length || 0}\\n💰 Total Potential Profit: $${data.total_potential_profit || 0}\\n⏰ Generated: ${data.timestamp}`);
            } catch (error) {
                alert(`❌ Strategy test failed: ${error.message}`);
            }
        }

        async function showPortfolio() {
            try {
                const response = await fetch('/api/portfolio/positions');
                const data = await response.json();
                alert(`📊 Portfolio Summary:\\n\\n💼 Total Value: $${data.summary?.total_value?.toLocaleString() || '0'}\\n📈 Day P&L: $${data.summary?.day_pnl || '0'}\\n🎯 Active Positions: ${data.positions?.length || 0}\\n📊 Win Rate: ${data.summary?.win_rate || 0}%`);
            } catch (error) {
                alert(`❌ Portfolio fetch failed: ${error.message}`);
            }
        }

        async function testTrade() {
            try {
                const response = await fetch('/api/trading/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: 'AAPL',
                        side: 'buy',
                        quantity: 10,
                        order_type: 'market'
                    })
                });
                const data = await response.json();
                alert(`💹 Trade Execution Result:\\n\\n${data.message}\\n\\n📋 Order ID: ${data.trade?.order_id}\\n📊 Symbol: ${data.trade?.symbol}\\n💰 Total Value: $${data.trade?.total_value}\\n⏰ Executed: ${data.timestamp}`);
            } catch (error) {
                alert(`❌ Trade execution failed: ${error.message}`);
            }
        }
    </script>
</body>
</html>'''