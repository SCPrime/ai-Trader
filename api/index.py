#!/usr/bin/env python3
"""
Vercel-compatible entry point for AI Trading Bot Dashboard
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Set environment variables for Vercel
os.environ.setdefault("PYTHONPATH", str(project_root))

try:
    import json
    from datetime import datetime

    def handler(request):
        """Main handler for dashboard and routing"""

        # Handle root path - return dashboard HTML
        if request.path == "/" or request.path == "/index.html":
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache'
                },
                'body': get_dashboard_html()
            }

        # Handle health check
        if request.path == "/health":
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat()
                })
            }

        # Default fallback
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({"error": "Not found"})
        }

    def get_dashboard_html():
        """Return the complete dashboard HTML"""
        return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Trading Bot Dashboard</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Main Dashboard Component
        function Dashboard() {
            const [aiEnabled, setAiEnabled] = useState(false);
            const [mode, setMode] = useState('paper');
            const [portfolioData, setPortfolioData] = useState({
                value: 10000,
                change: 250,
                changePercent: 2.5,
                buyingPower: 7824.30,
                positions: 8,
                dayPnL: 125.50
            });

            return (
                <div className="min-h-screen bg-gray-900">
                    {/* Top Navigation */}
                    <TopBar
                        aiEnabled={aiEnabled}
                        setAiEnabled={setAiEnabled}
                        mode={mode}
                        setMode={setMode}
                    />

                    {/* Summary Cards */}
                    <div className="p-6">
                        <SummaryCards portfolioData={portfolioData} />

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            {/* Left Column - Chart and Positions */}
                            <div className="lg:col-span-2 space-y-6">
                                <PriceChart />
                                <PortfolioPositions />
                            </div>

                            {/* Right Column - Trading Controls */}
                            <div className="space-y-6">
                                <QuickTrade />
                                <StrategyCreator />
                                <TradingControls />
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PerformanceMetrics />
                            <RecentOrders />
                        </div>
                    </div>
                </div>
            );
        }

        // Top Bar Component
        function TopBar({ aiEnabled, setAiEnabled, mode, setMode }) {
            return (
                <div className="bg-gray-800 border-b border-gray-700 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold">🤖 AI Trading Bot</h1>
                            <div className="flex items-center space-x-2">
                                <span>AI Trading Bot</span>
                                <button
                                    onClick={() => setAiEnabled(!aiEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        aiEnabled ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        aiEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-sm ${
                                    mode === 'paper' ? 'bg-green-600' : 'bg-blue-600'
                                }`}>
                                    {mode === 'paper' ? 'Paper Trading' : 'Manual'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="text-sm">Disconnected</span>
                            </div>
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-sm"></i>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Summary Cards Component
        function SummaryCards({ portfolioData }) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-600 p-4 rounded-lg">
                        <div className="text-sm opacity-90">Portfolio Value</div>
                        <div className="text-2xl font-bold">${portfolioData.value.toLocaleString()}</div>
                        <div className="text-sm">+{portfolioData.changePercent}% (${portfolioData.change})</div>
                    </div>

                    <div className="bg-green-600 p-4 rounded-lg">
                        <div className="text-sm opacity-90">Buying Power</div>
                        <div className="text-2xl font-bold">${portfolioData.buyingPower.toLocaleString()}</div>
                        <div className="text-sm">Available Cash</div>
                    </div>

                    <div className="bg-teal-600 p-4 rounded-lg">
                        <div className="text-sm opacity-90">Active Positions</div>
                        <div className="text-2xl font-bold">{portfolioData.positions}</div>
                        <div className="text-sm">Open Trades</div>
                    </div>

                    <div className="bg-yellow-600 p-4 rounded-lg">
                        <div className="text-sm opacity-90">System Health</div>
                        <div className="text-xl font-bold">All Systems</div>
                        <div className="text-sm">Operational</div>
                    </div>
                </div>
            );
        }

        // Price Chart Component
        function PriceChart() {
            const [symbol, setSymbol] = useState('AAPL');

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Price Chart</h3>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                                placeholder="Symbol"
                            />
                            <button className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700">
                                Load
                            </button>
                        </div>
                    </div>

                    <div className="h-64 bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-gray-400">Chart for {symbol} - Loading...</span>
                    </div>

                    <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Technical Indicators</h4>
                        <div className="text-sm text-gray-400">No indicators available</div>
                    </div>
                </div>
            );
        }

        // Quick Trade Component
        function QuickTrade() {
            const [tradeSymbol, setTradeSymbol] = useState('AAPL');
            const [quantity, setQuantity] = useState('10');
            const [orderType, setOrderType] = useState('Market');

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Quick Trade</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1">Symbol</label>
                            <input
                                type="text"
                                value={tradeSymbol}
                                onChange={(e) => setTradeSymbol(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Order Type</label>
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            >
                                <option>Market</option>
                                <option>Limit</option>
                                <option>Stop</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
                                ↑ Buy
                            </button>
                            <button className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                                ↓ Sell
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Strategy Creator Component
        function StrategyCreator() {
            const [strategyName, setStrategyName] = useState('');
            const [description, setDescription] = useState('');
            const [rules, setRules] = useState('');

            const testStrategy = async () => {
                try {
                    const response = await fetch('/api/strategy/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ strategy_name: strategyName || '1st Strategy' })
                    });
                    const data = await response.json();
                    alert('Strategy tested! Found ' + (data.results ? data.results.length : 0) + ' opportunities.');
                } catch (error) {
                    alert('Error testing strategy: ' + error.message);
                }
            };

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">🗨️ AI Strategy Creator</h3>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Strategy Name"
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <input
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <textarea
                            placeholder="Natural Language Rules (e.g., Buy AAPL when RSI drops below 30...)"
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={testStrategy}
                                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                            >
                                + Test Strategy
                            </button>
                            <button className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700">
                                Load Examples
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Trading Controls Component
        function TradingControls() {
            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">⚙️ Trading Control Center</h3>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-blue-400 font-semibold mb-2">Risk Management</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <label>Position Size (%)</label>
                                    <input type="number" defaultValue="5" className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm" />
                                </div>
                                <div>
                                    <label>Stop Loss (%)</label>
                                    <input type="number" defaultValue="10" className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-green-400 font-semibold mb-2">Trading Behavior</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <label>Max Positions</label>
                                    <input type="number" defaultValue="10" className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm" />
                                </div>
                                <div>
                                    <label>Max Daily Trades</label>
                                    <input type="number" defaultValue="5" className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-700">
                                Save Settings
                            </button>
                            <button className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700">
                                Validate
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Portfolio Positions Component
        function PortfolioPositions() {
            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Portfolio Positions Snapshot</h3>
                        <button className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700">
                            Refresh
                        </button>
                    </div>

                    <div className="text-center py-8 text-gray-400">
                        No positions loaded
                    </div>
                </div>
            );
        }

        // Performance Metrics Component
        function PerformanceMetrics() {
            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">Day P&L</div>
                            <div className="text-green-400 font-semibold">+$125.50</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Win Rate</div>
                            <div className="text-green-400 font-semibold">78.5%</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Unrealized P&L</div>
                            <div className="text-green-400 font-semibold">+$85.20</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Options Premium</div>
                            <div className="text-blue-400 font-semibold">$245.75</div>
                        </div>
                    </div>
                </div>
            );
        }

        // Recent Orders Component
        function RecentOrders() {
            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                    <div className="text-center py-4 text-gray-400">
                        No recent orders
                    </div>
                </div>
            );
        }

        // Render the app
        ReactDOM.render(<Dashboard />, document.getElementById('root'));
    </script>
</body>
</html>"""

    # This will be the FastAPI app for backward compatibility
    from fastapi import FastAPI, Request
    from fastapi.responses import HTMLResponse, JSONResponse

    app = FastAPI(
        title="AI Trading Bot Dashboard",
        description="Options Income Strategy Dashboard",
        version="1.0.0"
    )

    # Mount static files
    try:
        static_path = project_root / "src" / "web" / "static"
        if static_path.exists():
            app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
    except Exception:
        pass

    # Templates
    try:
        templates_path = project_root / "src" / "web" / "templates"
        if templates_path.exists():
            templates = Jinja2Templates(directory=str(templates_path))
        else:
            templates = None
    except Exception:
        templates = None

    @app.get("/", response_class=HTMLResponse)
    async def dashboard(request: Request):
        """Main dashboard page"""
        if templates:
            return templates.TemplateResponse("dashboard.html", {"request": request})
        else:
            return HTMLResponse("""
            <html>
                <head>
                    <title>AI Trading Bot Dashboard</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body>
                    <div class="container mt-5">
                        <h1>🤖 AI Trading Bot Dashboard</h1>
                        <div class="alert alert-success">
                            <h4>✅ Successfully Deployed!</h4>
                            <p>Your AI Trading Bot is running on Vercel!</p>
                            <p><strong>Features:</strong></p>
                            <ul>
                                <li>Options Income Strategy Analysis</li>
                                <li>Multi-leg Investment Opportunities</li>
                                <li>Real-time Portfolio Calculations</li>
                                <li>Strategy Universe with High-IV Stocks</li>
                            </ul>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5>Strategy Test</h5>
                                    </div>
                                    <div class="card-body">
                                        <button class="btn btn-primary" onclick="testStrategy()">Test 1st Strategy</button>
                                        <div id="strategyResults" class="mt-3"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5>System Status</h5>
                                    </div>
                                    <div class="card-body">
                                        <p>Status: <span class="badge bg-success">Online</span></p>
                                        <p>Deployment: <span class="badge bg-info">Vercel</span></p>
                                        <p>Time: <span id="currentTime"></span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
                    <script>
                        function testStrategy() {
                            fetch('/api/strategy/test', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({strategy_name: '1st Strategy'})
                            })
                            .then(response => response.json())
                            .then(data => {
                                document.getElementById('strategyResults').innerHTML =
                                    '<div class="alert alert-info">Strategy tested successfully! Found ' +
                                    (data.results ? data.results.length : 0) + ' investment opportunities.</div>';
                            })
                            .catch(error => {
                                document.getElementById('strategyResults').innerHTML =
                                    '<div class="alert alert-danger">Error: ' + error.message + '</div>';
                            });
                        }

                        function updateTime() {
                            document.getElementById('currentTime').textContent = new Date().toLocaleString();
                        }
                        updateTime();
                        setInterval(updateTime, 1000);
                    </script>
                </body>
            </html>
            """)

    @app.post("/api/strategy/test")
    async def test_strategy(request: Request):
        """Test strategy endpoint"""
        try:
            body = await request.json()
            strategy_name = body.get("strategy_name", "Unknown")

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

            return JSONResponse({
                "success": True,
                "strategy_name": strategy_name,
                "results": investment_legs,
                "total_potential_profit": round(sum(leg["estimated_profit"] for leg in investment_legs), 2),
                "timestamp": datetime.now().isoformat()
            })

        except Exception as e:
            return JSONResponse({
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, status_code=500)

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    # Vercel requires the app to be available as 'app'
    # This is the entry point for Vercel

except Exception as e:
    # Fallback minimal app if imports fail
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.get("/")
    async def root():
        return JSONResponse({
            "message": "AI Trading Bot - Import Error",
            "error": str(e),
            "status": "partial"
        })

# This is required for Vercel
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)