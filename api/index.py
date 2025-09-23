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
    from fastapi import FastAPI, Request, HTTPException
    from fastapi.staticfiles import StaticFiles
    from fastapi.templating import Jinja2Templates
    from fastapi.responses import HTMLResponse, JSONResponse
    import uvicorn
    from datetime import datetime
    import json
    import random

    # Create FastAPI app
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