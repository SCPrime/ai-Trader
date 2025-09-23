#!/usr/bin/env python3
"""
Demo script to run the trading dashboard with mock data.
This allows testing the dashboard without requiring API keys.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi import Request
import uvicorn
import json
import plotly.graph_objects as go
import plotly.utils
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def create_demo_dashboard():
    """Create a demo dashboard with mock data."""
    app = FastAPI(title="AI Trading Bot Dashboard - Demo", version="1.0.0")

    # Setup templates and static files
    templates = Jinja2Templates(directory="src/web/templates")
    app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def dashboard(request: Request):
        """Main dashboard page."""
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "is_live_trading": False,  # Demo always starts in paper mode
            "is_ai_auto_mode": True
        })

    @app.get("/api/account")
    async def get_account():
        """Get mock account information."""
        return {
            "portfolio_value": 50000.00,
            "buying_power": 25000.00,
            "equity": 50250.00,
            "last_equity": 49800.00,
            "cash": 15000.00,
            "day_trade_count": 2,
            "status": "ACTIVE"
        }

    @app.get("/api/positions")
    async def get_positions():
        """Get mock positions."""
        return [
            {
                "symbol": "AAPL",
                "qty": "10",
                "market_value": 1500.00,
                "cost_basis": 1450.00,
                "unrealized_pl": 50.00,
                "unrealized_plpc": 0.0345,
                "current_price": 150.00,
                "side": "long"
            },
            {
                "symbol": "TSLA",
                "qty": "5",
                "market_value": 1000.00,
                "cost_basis": 1050.00,
                "unrealized_pl": -50.00,
                "unrealized_plpc": -0.0476,
                "current_price": 200.00,
                "side": "long"
            },
            {
                "symbol": "MSFT",
                "qty": "8",
                "market_value": 2400.00,
                "cost_basis": 2320.00,
                "unrealized_pl": 80.00,
                "unrealized_plpc": 0.0345,
                "current_price": 300.00,
                "side": "long"
            }
        ]

    @app.get("/api/orders")
    async def get_orders():
        """Get mock orders."""
        return [
            {
                "id": "order_1",
                "created_at": (datetime.now() - timedelta(minutes=5)).isoformat(),
                "symbol": "AAPL",
                "qty": "10",
                "filled_qty": "10",
                "side": "buy",
                "status": "filled",
                "type": "market"
            },
            {
                "id": "order_2",
                "created_at": (datetime.now() - timedelta(minutes=15)).isoformat(),
                "symbol": "TSLA",
                "qty": "5",
                "filled_qty": "5",
                "side": "buy",
                "status": "filled",
                "type": "market"
            },
            {
                "id": "order_3",
                "created_at": (datetime.now() - timedelta(hours=1)).isoformat(),
                "symbol": "MSFT",
                "qty": "8",
                "filled_qty": "8",
                "side": "buy",
                "status": "filled",
                "type": "limit"
            }
        ]

    @app.get("/api/chart/{symbol}")
    async def get_chart_data(symbol: str):
        """Get mock chart data with indicators."""
        try:
            # Generate mock OHLCV data
            dates = pd.date_range(start=datetime.now() - timedelta(days=30), periods=500, freq='30min')
            np.random.seed(42)

            base_price = {"AAPL": 150, "TSLA": 200, "MSFT": 300, "SPY": 400}.get(symbol.upper(), 100)

            # Generate realistic price movement
            returns = np.random.normal(0, 0.02, len(dates))
            returns[0] = 0  # Start with no change

            prices = [base_price]
            for ret in returns[1:]:
                prices.append(prices[-1] * (1 + ret))

            # Create OHLCV data
            data = pd.DataFrame({
                'open': prices,
                'close': prices,
                'high': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
                'low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
                'volume': np.random.randint(100000, 1000000, len(dates))
            }, index=dates)

            # Calculate mock indicators
            # Simple moving averages
            data['sma_20'] = data['close'].rolling(20).mean()
            data['sma_50'] = data['close'].rolling(50).mean()

            # RSI
            delta = data['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            data['rsi'] = 100 - (100 / (1 + rs))

            # MACD
            ema_12 = data['close'].ewm(span=12).mean()
            ema_26 = data['close'].ewm(span=26).mean()
            data['macd'] = ema_12 - ema_26
            data['macd_signal'] = data['macd'].ewm(span=9).mean()
            data['macd_histogram'] = data['macd'] - data['macd_signal']

            # Bollinger Bands
            sma_20 = data['close'].rolling(20).mean()
            std_20 = data['close'].rolling(20).std()
            data['bb_upper'] = sma_20 + (std_20 * 2)
            data['bb_lower'] = sma_20 - (std_20 * 2)

            # Create chart
            chart_json = create_mock_chart(symbol, data)

            # Mock indicators for display
            indicators = {
                "sma_20": data['sma_20'].iloc[-1] if not pd.isna(data['sma_20'].iloc[-1]) else 0,
                "rsi_14": data['rsi'].iloc[-1] if not pd.isna(data['rsi'].iloc[-1]) else 50,
                "macd": {
                    "macd": data['macd'].iloc[-1] if not pd.isna(data['macd'].iloc[-1]) else 0,
                    "signal": data['macd_signal'].iloc[-1] if not pd.isna(data['macd_signal'].iloc[-1]) else 0
                },
                "bollinger_bands": {
                    "upper": data['bb_upper'].iloc[-1] if not pd.isna(data['bb_upper'].iloc[-1]) else 0,
                    "lower": data['bb_lower'].iloc[-1] if not pd.isna(data['bb_lower'].iloc[-1]) else 0
                }
            }

            return {
                "chart": chart_json,
                "data": data.tail(20).reset_index().to_dict('records'),
                "indicators": indicators
            }

        except Exception as e:
            return {"error": str(e)}

    def create_mock_chart(symbol: str, data: pd.DataFrame) -> str:
        """Create mock interactive chart."""
        # Create subplots
        fig = make_subplots(
            rows=4, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=(f'{symbol} Price', 'Volume', 'RSI', 'MACD'),
            row_heights=[0.5, 0.15, 0.15, 0.2]
        )

        # Candlestick chart
        fig.add_trace(
            go.Candlestick(
                x=data.index,
                open=data['open'],
                high=data['high'],
                low=data['low'],
                close=data['close'],
                name=symbol
            ),
            row=1, col=1
        )

        # SMA 20
        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['sma_20'],
                name='SMA 20',
                line=dict(color='orange', width=1)
            ),
            row=1, col=1
        )

        # Bollinger Bands
        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['bb_upper'],
                name='BB Upper',
                line=dict(color='gray', width=1, dash='dash'),
                showlegend=False
            ),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['bb_lower'],
                name='BB Lower',
                line=dict(color='gray', width=1, dash='dash'),
                fill='tonexty',
                fillcolor='rgba(128,128,128,0.1)',
                showlegend=False
            ),
            row=1, col=1
        )

        # Volume
        colors = ['red' if close < open else 'green'
                 for close, open in zip(data['close'], data['open'])]

        fig.add_trace(
            go.Bar(
                x=data.index,
                y=data['volume'],
                name='Volume',
                marker_color=colors,
                showlegend=False
            ),
            row=2, col=1
        )

        # RSI
        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['rsi'],
                name='RSI',
                line=dict(color='blue', width=2),
                showlegend=False
            ),
            row=3, col=1
        )

        # RSI levels
        fig.add_hline(y=70, line_dash="dash", line_color="red", row=3, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color="green", row=3, col=1)

        # MACD
        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['macd'],
                name='MACD',
                line=dict(color='blue', width=2),
                showlegend=False
            ),
            row=4, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=data.index,
                y=data['macd_signal'],
                name='Signal',
                line=dict(color='red', width=1),
                showlegend=False
            ),
            row=4, col=1
        )

        # MACD histogram
        colors = ['green' if val >= 0 else 'red' for val in data['macd_histogram']]
        fig.add_trace(
            go.Bar(
                x=data.index,
                y=data['macd_histogram'],
                name='Histogram',
                marker_color=colors,
                showlegend=False
            ),
            row=4, col=1
        )

        # Update layout
        fig.update_layout(
            title=f'{symbol} Technical Analysis - Demo Data',
            xaxis_rangeslider_visible=False,
            height=800,
            showlegend=True
        )

        fig.update_xaxes(type='date')

        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

    @app.post("/api/trading/toggle")
    async def toggle_trading_mode():
        """Mock toggle trading mode."""
        return {"is_live": False, "message": "Demo mode - always paper trading"}

    @app.post("/api/ai/toggle")
    async def toggle_ai_mode():
        """Mock toggle AI mode."""
        return {"is_auto": True}

    @app.get("/api/health")
    async def get_health():
        """Mock health status."""
        return {
            "status": "healthy",
            "checks": {
                "system_resources": {
                    "status": "healthy",
                    "message": "System resources healthy (Demo)",
                    "timestamp": datetime.now().isoformat()
                },
                "api_connection": {
                    "status": "healthy",
                    "message": "Demo mode - no API connection required",
                    "timestamp": datetime.now().isoformat()
                }
            },
            "performance": {
                "total_requests": 42,
                "overall_success_rate": 100.0,
                "avg_response_time_ms": 25.5
            }
        }

    @app.post("/api/trade/{symbol}")
    async def place_trade(symbol: str):
        """Mock trade placement."""
        return {
            "status": "simulated",
            "message": f"Demo trade placed for {symbol}",
            "symbol": symbol,
            "order_id": f"demo_order_{datetime.now().timestamp()}"
        }

    @app.get("/api/ai/analysis/{symbol}")
    async def get_ai_analysis(symbol: str):
        """Mock AI analysis."""
        recommendations = ["BUY", "SELL", "HOLD"]
        recommendation = np.random.choice(recommendations)
        confidence = np.random.uniform(0.6, 0.95)

        return {
            "symbol": symbol,
            "recommendation": recommendation,
            "confidence": confidence,
            "reasoning": f"Demo AI analysis for {symbol}. This is simulated analysis showing how the AI integration would work with real market data and Claude AI.",
            "risk_factors": ["Market volatility", "Sector rotation risk", "Demo data uncertainty"],
            "opportunities": ["Technical breakout potential", "Support level hold", "Demo upside scenario"],
            "suggested_actions": [
                f"Consider {recommendation.lower()} position",
                "Monitor support/resistance levels",
                "Set appropriate stop losses"
            ],
            "timestamp": datetime.now().isoformat()
        }

    @app.get("/api/performance")
    async def get_performance():
        """Mock performance data."""
        return {
            "portfolio_value": 50000.00,
            "buying_power": 25000.00,
            "day_change": 450.00,
            "day_change_pct": 0.9,
            "positions_count": 3,
            "cash_allocation": 30.0,
            "positions": [
                {"symbol": "AAPL", "allocation": 30.0},
                {"symbol": "TSLA", "allocation": 20.0},
                {"symbol": "MSFT", "allocation": 48.0}
            ]
        }

    return app


if __name__ == "__main__":
    print("Starting AI Trading Bot Dashboard Demo")
    print("Demo dashboard will be available at: http://localhost:8000")
    print("This demo uses mock data and doesn't require API keys")
    print("All trading features are simulated for demonstration purposes")
    print("\nFeatures demonstrated:")
    print("  - Interactive candlestick charts with technical indicators")
    print("  - Real-time portfolio monitoring")
    print("  - Paper/Live trading mode toggle")
    print("  - AI analysis simulation")
    print("  - Position and order management")
    print("\nStarting server...")

    app = create_demo_dashboard()

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )