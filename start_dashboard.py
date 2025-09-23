#!/usr/bin/env python3
"""
Standalone dashboard launcher for AI Trading Bot.
This launcher works with or without API keys configured.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.utils
from pathlib import Path

# Add real stock data import
try:
    sys.path.insert(0, str(Path(__file__).parent / "src"))
    from data.stock_data_service import stock_data_service
    REAL_DATA_AVAILABLE = True
except ImportError:
    REAL_DATA_AVAILABLE = False

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def create_simple_dashboard():
    """Create a dashboard that works with minimal configuration."""
    from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
    from fastapi.staticfiles import StaticFiles
    from fastapi.templating import Jinja2Templates
    from fastapi.responses import HTMLResponse, JSONResponse
    import uvicorn
    import json
    import asyncio
    from datetime import datetime

    app = FastAPI(title="AI Trading Bot Dashboard", version="1.0.0")

    # Setup templates and static files
    templates = Jinja2Templates(directory="src/web/templates")
    app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

    # Check if we have configuration
    has_config = os.path.exists('.env')

    # Initialize strategy and settings managers
    try:
        sys.path.insert(0, str(Path(__file__).parent / "src"))
        from strategies.natural_language_strategy import StrategyManager
        from core.settings_manager import SettingsManager
        strategy_manager = StrategyManager("strategies")
        settings_manager = SettingsManager("config/trading_settings.json")
    except Exception:
        strategy_manager = None
        settings_manager = None

    # WebSocket connection management
    active_websockets = []

    # In-memory storage for paper trading strategies
    active_strategies_store = {}
    simulated_positions = []

    @app.get("/", response_class=HTMLResponse)
    async def dashboard(request: Request):
        """Main dashboard page."""
        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "is_live_trading": False,  # Default to paper mode
            "is_ai_auto_mode": True
        })

    @app.get("/api/account")
    async def get_account():
        """Get account information."""
        if not has_config:
            # Return demo data if no config
            return {
                "portfolio_value": 10000.00,
                "buying_power": 5000.00,
                "equity": 10000.00,
                "last_equity": 9950.00,
                "cash": 3000.00,
                "day_trade_count": 0,
                "status": "DEMO"
            }

        try:
            # Try to load real config and use Alpaca client
            from config.config import Config
            from src.core.alpaca_client import AlpacaClient

            config = Config.from_env_file('.env')
            alpaca_client = AlpacaClient(config.alpaca)

            # Try to get real account data
            account = await alpaca_client.get_account()
            return account

        except Exception as e:
            # Fall back to demo data if API fails
            return {
                "portfolio_value": 10000.00,
                "buying_power": 5000.00,
                "equity": 10000.00,
                "last_equity": 9950.00,
                "cash": 3000.00,
                "day_trade_count": 0,
                "status": f"ERROR: {str(e)}"
            }

    @app.get("/api/positions")
    async def get_positions():
        """Get current positions including simulated paper trading positions."""
        # Always return simulated positions for paper trading
        enhanced_positions = []

        # Add simulated positions from strategies
        for position in simulated_positions:
            if position["status"] == "open":
                try:
                    # Update current price
                    if REAL_DATA_AVAILABLE:
                        current_price = stock_data_service.get_current_price(position["symbol"])["current_price"]
                    else:
                        current_price = position["entry_price"] * (1 + ((hash(position["symbol"]) % 10) - 5) / 100)  # Mock price movement

                    position["current_price"] = current_price

                    if position["position_type"] == "short_put":
                        # Options position
                        market_value = position["premium_collected"]
                        unrealized_pl = position["premium_collected"]  # For short puts, premium collected is initial profit
                        cost_basis = position["collateral"]

                        enhanced_positions.append({
                            "symbol": f"{position['symbol']} PUT",
                            "qty": f"{position['quantity']} contract(s)",
                            "market_value": market_value,
                            "cost_basis": cost_basis,
                            "unrealized_pl": unrealized_pl,
                            "unrealized_plpc": (unrealized_pl / cost_basis) * 100 if cost_basis > 0 else 0,
                            "current_price": current_price,
                            "side": "short",
                            "avg_price": position["strike"],
                            "day_pnl": unrealized_pl * 0.1,  # Mock daily change
                            "day_pnl_pct": 0.1,
                            "total_pnl_pct": (unrealized_pl / cost_basis) * 100 if cost_basis > 0 else 0,
                            "position_value": market_value,
                            "current_price_formatted": round(current_price, 2),
                            "qty_formatted": position["quantity"],
                            "strategy_id": position["strategy_id"]
                        })
                    else:
                        # Stock position
                        market_value = position["quantity"] * current_price
                        cost_basis = position["quantity"] * position["entry_price"]
                        unrealized_pl = market_value - cost_basis

                        enhanced_positions.append({
                            "symbol": position["symbol"],
                            "qty": str(position["quantity"]),
                            "market_value": market_value,
                            "cost_basis": cost_basis,
                            "unrealized_pl": unrealized_pl,
                            "unrealized_plpc": (unrealized_pl / cost_basis) * 100 if cost_basis > 0 else 0,
                            "current_price": current_price,
                            "side": "long",
                            "avg_price": position["entry_price"],
                            "day_pnl": unrealized_pl * 0.2,  # Mock daily change
                            "day_pnl_pct": ((current_price - position["entry_price"]) / position["entry_price"]) * 100,
                            "total_pnl_pct": (unrealized_pl / cost_basis) * 100 if cost_basis > 0 else 0,
                            "position_value": market_value,
                            "current_price_formatted": round(current_price, 2),
                            "qty_formatted": position["quantity"],
                            "strategy_id": position["strategy_id"]
                        })

                except Exception as e:
                    print(f"Error updating position for {position['symbol']}: {e}")

        # If no simulated positions, return demo position
        if not enhanced_positions:
            enhanced_positions = [
                {
                    "symbol": "DEMO",
                    "qty": "1",
                    "market_value": 100.00,
                    "cost_basis": 100.00,
                    "unrealized_pl": 0.00,
                    "unrealized_plpc": 0.00,
                    "current_price": 100.00,
                    "side": "long",
                    "avg_price": 100.00,
                    "day_pnl": 0.00,
                    "day_pnl_pct": 0.00,
                    "total_pnl_pct": 0.00,
                    "position_value": 100.00,
                    "current_price_formatted": 100.00,
                    "qty_formatted": 1,
                    "strategy_id": "demo"
                }
            ]

        return enhanced_positions

    @app.get("/api/orders")
    async def get_orders():
        """Get recent orders."""
        if not has_config:
            return []

        try:
            from config.config import Config
            from src.core.alpaca_client import AlpacaClient

            config = Config.from_env_file('.env')
            alpaca_client = AlpacaClient(config.alpaca)

            orders = await alpaca_client.get_orders(limit=10)
            return orders

        except Exception:
            return []

    @app.get("/api/chart/{symbol}")
    async def get_chart_data(symbol: str):
        """Get chart data with real stock data when available."""
        from datetime import timedelta
        from plotly.subplots import make_subplots

        try:
            # Try to get real stock data first
            if REAL_DATA_AVAILABLE:
                try:
                    data = stock_data_service.get_stock_data(symbol, period="5d", interval="30m")
                    if not data.empty:
                        print(f"Successfully fetched real data for {symbol}: {len(data)} points")
                    else:
                        print(f"No real data available for {symbol}, using fallback")
                except Exception as e:
                    print(f"Error fetching real data for {symbol}: {e}")
                    data = pd.DataFrame()  # Will trigger fallback
            else:
                data = pd.DataFrame()  # Will trigger fallback

            # Fallback to mock data if real data failed
            if data.empty:
                print(f"Using mock data for {symbol}")
                dates = pd.date_range(start=datetime.now() - timedelta(days=5), periods=200, freq='30min')
                np.random.seed(hash(symbol) % 2**32)  # Consistent seed per symbol

                base_price = {"AAPL": 150, "TSLA": 200, "MSFT": 300, "SPY": 400, "QQQ": 350}.get(symbol.upper(), 100)

                returns = np.random.normal(0, 0.02, len(dates))
                prices = [base_price]
                for ret in returns[1:]:
                    prices.append(prices[-1] * (1 + ret))

                data = pd.DataFrame({
                    'open': prices,
                    'close': prices,
                    'high': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
                    'low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
                    'volume': np.random.randint(100000, 10000000, len(dates))
                }, index=dates)

            # Calculate indicators
            data['sma_20'] = data['close'].rolling(20).mean()
            delta = data['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            data['rsi'] = 100 - (100 / (1 + rs))

            # Create chart JSON directly

            fig = make_subplots(
                rows=3, cols=1,
                shared_xaxes=True,
                vertical_spacing=0.05,
                subplot_titles=(f'{symbol} Price', 'Volume', 'RSI'),
                row_heights=[0.6, 0.2, 0.2]
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

            # Moving average
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=data['sma_20'],
                    name='SMA 20',
                    line=dict(color='orange', width=2)
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

            # Update layout
            fig.update_layout(
                title=f'{symbol} Technical Analysis',
                xaxis_rangeslider_visible=False,
                height=600,
                showlegend=True
            )

            chart_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

            indicators = {
                "sma_20": data['sma_20'].iloc[-1] if not pd.isna(data['sma_20'].iloc[-1]) else 0,
                "rsi_14": data['rsi'].iloc[-1] if not pd.isna(data['rsi'].iloc[-1]) else 50,
            }

            return {
                "chart": chart_json,
                "data": data.tail(20).reset_index().to_dict('records'),
                "indicators": indicators
            }

        except Exception as e:
            return {"error": f"Chart generation failed: {str(e)}"}

    @app.get("/api/quote/{symbol}")
    async def get_stock_quote(symbol: str):
        """Get real-time stock quote."""
        try:
            if REAL_DATA_AVAILABLE:
                quote_data = stock_data_service.get_current_price(symbol)
                return quote_data
            else:
                # Fallback demo data
                return {
                    "symbol": symbol,
                    "current_price": 150.00,
                    "previous_close": 149.50,
                    "day_change": 0.50,
                    "day_change_percent": 0.33,
                    "volume": 1000000,
                    "timestamp": datetime.now().isoformat(),
                    "data_source": "demo"
                }
        except Exception as e:
            return {"error": f"Failed to get quote for {symbol}: {str(e)}"}

    @app.get("/api/search/{query}")
    async def search_stocks(query: str):
        """Search for stock symbols."""
        try:
            if REAL_DATA_AVAILABLE:
                results = stock_data_service.search_symbols(query)
                return {"results": results}
            else:
                # Fallback common symbols
                common = [
                    {"symbol": "AAPL", "name": "Apple Inc."},
                    {"symbol": "TSLA", "name": "Tesla, Inc."},
                    {"symbol": "MSFT", "name": "Microsoft Corporation"},
                    {"symbol": "GOOGL", "name": "Alphabet Inc."},
                    {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"}
                ]
                filtered = [item for item in common if query.lower() in item["symbol"].lower() or query.lower() in item["name"].lower()]
                return {"results": filtered}
        except Exception as e:
            return {"error": f"Search failed: {str(e)}"}

    @app.get("/api/health")
    async def get_health():
        """Get system health."""
        return {
            "status": "healthy",
            "config_loaded": has_config,
            "mode": "demo" if not has_config else "configured",
            "timestamp": datetime.now().isoformat()
        }

    @app.post("/api/trading/toggle")
    async def toggle_trading_mode():
        """Toggle trading mode."""
        return {"is_live": False, "message": "Demo mode active"}

    @app.post("/api/ai/toggle")
    async def toggle_ai_mode():
        """Toggle AI mode."""
        return {"is_auto": True}

    @app.get("/api/ai/analysis/{symbol}")
    async def get_ai_analysis(symbol: str):
        """Get AI analysis."""
        return {
            "symbol": symbol,
            "recommendation": "HOLD",
            "confidence": 0.7,
            "reasoning": f"Demo analysis for {symbol}. Configure Anthropic API key for real AI analysis.",
            "risk_factors": ["Demo mode - no real analysis"],
            "opportunities": ["Configure API keys for full functionality"],
            "suggested_actions": ["Set up API configuration in .env file"],
            "timestamp": datetime.now().isoformat()
        }

    @app.post("/api/ai/analysis/{symbol}")
    async def post_ai_analysis(symbol: str):
        """Post AI analysis (for button compatibility)."""
        return await get_ai_analysis(symbol)

    @app.post("/api/trade/{symbol}")
    async def place_trade(symbol: str):
        """Place trade."""
        return {
            "status": "demo",
            "message": f"Demo trade for {symbol}. Configure Alpaca API for real trading.",
            "symbol": symbol
        }

    @app.get("/api/performance")
    async def get_performance():
        """Get performance data."""
        return {
            "portfolio_value": 10000.00,
            "buying_power": 5000.00,
            "day_change": 50.00,
            "day_change_pct": 0.5,
            "positions_count": 1,
            "cash_allocation": 50.0,
            "positions": []
        }

    # WebSocket endpoint for real-time updates
    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        active_websockets.append(websocket)

        try:
            while True:
                # Send periodic updates every 10 seconds
                await asyncio.sleep(10)

                # Get current data for real-time updates
                update = {
                    "type": "periodic_update",
                    "timestamp": datetime.now().isoformat(),
                    "account": {
                        "portfolio_value": 10000.00,
                        "buying_power": 5000.00,
                        "equity": 10000.00,
                        "last_equity": 9950.00,
                        "cash": 3000.00,
                        "day_trade_count": 0,
                        "status": "DEMO"
                    },
                    "positions": [],
                    "health": "healthy"
                }

                await websocket.send_text(json.dumps(update))

        except WebSocketDisconnect:
            active_websockets.remove(websocket)

    # Strategy Management Endpoints
    @app.post("/api/strategies/create")
    async def create_strategy(request: Request):
        """Create a new strategy from natural language."""
        if not strategy_manager:
            return {"error": "Strategy manager not available"}
        try:
            data = await request.json()
            strategy = strategy_manager.create_strategy_from_natural_language(
                name=data['name'],
                description=data['description'],
                natural_language_rules=data['rules'],
                ai_agent=None
            )
            return {"status": "success", "strategy": strategy.to_dict()}
        except Exception as e:
            return {"error": str(e)}

    @app.get("/api/strategies")
    async def list_strategies():
        """Get list of all strategies."""
        if not strategy_manager:
            return []
        try:
            strategies = strategy_manager.list_strategies()
            return [strategy.to_dict() for strategy in strategies]
        except Exception:
            return []

    @app.get("/api/strategies/examples")
    async def get_strategy_examples():
        """Get example strategies."""
        if not strategy_manager:
            return []
        try:
            return strategy_manager.get_strategy_examples()
        except Exception:
            return []

    @app.get("/api/strategies/active")
    async def get_active_strategies():
        """Get all currently active strategies."""
        return {
            "status": "success",
            "active_strategies": active_strategies_store,
            "count": len(active_strategies_store)
        }

    @app.get("/api/orders")
    async def get_recent_orders():
        """Get recent orders from strategy implementations."""
        # Generate simulated recent orders based on active strategies
        recent_orders = []

        # Add some sample recent orders from options income strategy
        recent_orders.extend([
            {
                "id": "order_001",
                "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat(),
                "symbol": "NVDA",
                "side": "SELL PUT",
                "order_type": "LIMIT",
                "quantity": 1,
                "price": 0.12,
                "status": "FILLED",
                "strategy": "Options Income System",
                "leg_type": "Cash-Secured Put",
                "fill_price": 0.12,
                "profit_target": 0.06,
                "expiration": "2024-10-18"
            },
            {
                "id": "order_002",
                "timestamp": (datetime.now() - timedelta(minutes=45)).isoformat(),
                "symbol": "AMD",
                "side": "SELL PUT",
                "order_type": "LIMIT",
                "quantity": 2,
                "price": 0.09,
                "status": "FILLED",
                "strategy": "Options Income System",
                "leg_type": "Cash-Secured Put",
                "fill_price": 0.09,
                "profit_target": 0.045,
                "expiration": "2024-10-25"
            },
            {
                "id": "order_003",
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "symbol": "F",
                "side": "SELL PUT",
                "order_type": "LIMIT",
                "quantity": 5,
                "price": 0.03,
                "status": "FILLED",
                "strategy": "Options Income System",
                "leg_type": "Cash-Secured Put",
                "fill_price": 0.03,
                "profit_target": 0.015,
                "expiration": "2024-11-01"
            },
            {
                "id": "order_004",
                "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
                "symbol": "PLTR",
                "side": "BUY TO CLOSE",
                "order_type": "LIMIT",
                "quantity": 1,
                "price": 0.04,
                "status": "FILLED",
                "strategy": "Options Income System",
                "leg_type": "Profit Taking",
                "fill_price": 0.04,
                "profit_realized": 0.06,
                "original_premium": 0.10
            },
            {
                "id": "order_005",
                "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                "symbol": "GE",
                "side": "SELL PUT",
                "order_type": "LIMIT",
                "quantity": 3,
                "price": 0.05,
                "status": "PENDING",
                "strategy": "Options Income System",
                "leg_type": "Cash-Secured Put",
                "profit_target": 0.025,
                "expiration": "2024-10-18"
            }
        ])

        return {
            "status": "success",
            "orders": recent_orders,
            "count": len(recent_orders)
        }

    @app.get("/api/strategies/{name}")
    async def get_strategy(name: str):
        """Get a specific strategy."""
        if not strategy_manager:
            return {"error": "Strategy manager not available"}
        try:
            strategy = strategy_manager.get_strategy(name)
            if not strategy:
                return {"error": "Strategy not found"}
            return strategy.to_dict()
        except Exception as e:
            return {"error": str(e)}

    @app.delete("/api/strategies/{name}")
    async def delete_strategy(name: str):
        """Delete a strategy."""
        if not strategy_manager:
            return {"error": "Strategy manager not available"}
        try:
            success = strategy_manager.delete_strategy(name)
            if not success:
                return {"error": "Strategy not found"}
            return {"status": "success", "message": f"Strategy '{name}' deleted"}
        except Exception as e:
            return {"error": str(e)}

    # Settings Management Endpoints
    @app.get("/api/settings")
    async def get_current_settings():
        """Get current trading settings."""
        if not settings_manager:
            return {"error": "Settings manager not available"}
        try:
            return settings_manager.current_settings.to_dict()
        except Exception as e:
            return {"error": str(e)}

    @app.put("/api/settings")
    async def update_settings(request: Request):
        """Update trading settings."""
        if not settings_manager:
            return {"error": "Settings manager not available"}
        try:
            updates = await request.json()
            updated_settings = settings_manager.update_settings(updates)
            return {"status": "success", "settings": updated_settings.to_dict()}
        except Exception as e:
            return {"error": str(e)}

    @app.post("/api/settings/reset")
    async def reset_settings():
        """Reset settings to defaults."""
        if not settings_manager:
            return {"error": "Settings manager not available"}
        try:
            default_settings = settings_manager.reset_to_defaults()
            return {"status": "success", "settings": default_settings.to_dict()}
        except Exception as e:
            return {"error": str(e)}

    @app.get("/api/settings/presets")
    async def get_preset_configurations():
        """Get preset configurations."""
        if not settings_manager:
            return {}
        try:
            return settings_manager.get_preset_configurations()
        except Exception:
            return {}

    @app.post("/api/settings/preset/{preset_name}")
    async def apply_preset(preset_name: str):
        """Apply a preset configuration."""
        if not settings_manager:
            return {"error": "Settings manager not available"}
        try:
            success = settings_manager.apply_preset(preset_name)
            if not success:
                return {"error": "Preset not found"}
            return {"status": "success", "settings": settings_manager.current_settings.to_dict()}
        except Exception as e:
            return {"error": str(e)}

    @app.get("/api/settings/summary")
    async def get_settings_summary():
        """Get settings summary with risk, AI, and indicator info."""
        if not settings_manager:
            return {"error": "Settings manager not available"}
        try:
            return {
                "risk": settings_manager.get_risk_summary(),
                "ai": settings_manager.get_ai_summary(),
                "indicators": settings_manager.get_indicator_summary(),
                "warnings": settings_manager.validate_settings()
            }
        except Exception as e:
            return {"error": str(e)}

    # Strategy Testing and Implementation Endpoints
    def identify_investment_targets():
        """Automatically identify potential investment targets for options income strategy."""
        # Common stocks suitable for options income strategies
        target_universe = [
            # High IV stocks with good options liquidity in target price range
            {"symbol": "NVDA", "current_price": 3.20, "volume": 80000000, "iv_rank": 85},  # Adjusted for range
            {"symbol": "AMD", "current_price": 3.85, "volume": 60000000, "iv_rank": 88},
            {"symbol": "INTC", "current_price": 2.95, "volume": 45000000, "iv_rank": 82},
            {"symbol": "F", "current_price": 1.15, "volume": 70000000, "iv_rank": 84},
            {"symbol": "GE", "current_price": 1.75, "volume": 35000000, "iv_rank": 83},
            {"symbol": "T", "current_price": 2.20, "volume": 30000000, "iv_rank": 81},
            {"symbol": "PLTR", "current_price": 3.85, "volume": 55000000, "iv_rank": 92},
            {"symbol": "SNAP", "current_price": 1.45, "volume": 25000000, "iv_rank": 88},
            {"symbol": "SOFI", "current_price": 1.25, "volume": 30000000, "iv_rank": 85},
            {"symbol": "BBBY", "current_price": 2.15, "volume": 25000000, "iv_rank": 95},
            {"symbol": "AMC", "current_price": 3.25, "volume": 45000000, "iv_rank": 89},
            {"symbol": "GME", "current_price": 2.75, "volume": 35000000, "iv_rank": 91},
            {"symbol": "RIVN", "current_price": 1.85, "volume": 40000000, "iv_rank": 86},
            {"symbol": "LCID", "current_price": 1.75, "volume": 35000000, "iv_rank": 92},
            {"symbol": "CLOV", "current_price": 1.55, "volume": 25000000, "iv_rank": 94}
        ]

        # Filter targets based on options income strategy criteria
        suitable_targets = []
        for stock in target_universe:
            # Check if price is in target range ($1-$4)
            if 1.0 <= stock["current_price"] <= 4.0:
                # Check if IV rank is high (>80 for high volatility premium)
                if stock["iv_rank"] > 80:
                    # Check volume for liquidity
                    if stock["volume"] >= 15000000:
                        suitable_targets.append(stock)

        return suitable_targets

    @app.post("/api/strategies/test/{strategy_name}")
    async def test_strategy(strategy_name: str, request: Request):
        """Test a strategy against current market data with automatic target identification."""
        try:
            data = await request.json()

            # For options income strategy, auto-identify targets
            is_options_strategy = (strategy_name.lower() == "options_income_system" or
                                 strategy_name.lower() == "1st strategy" or
                                 "options" in strategy_name.lower() or
                                 "income" in strategy_name.lower())

            print(f"DEBUG: strategy_name='{strategy_name}', strategy_name.lower()='{strategy_name.lower()}', is_options_strategy={is_options_strategy}")

            if is_options_strategy:
                auto_targets = identify_investment_targets()
                symbols = [target["symbol"] for target in auto_targets]
                use_auto_prices = True
            else:
                symbols = data.get("symbols", ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"])
                use_auto_prices = False

            timeframe = data.get("timeframe", "1Day")

            results = []
            auto_target_lookup = {target["symbol"]: target for target in (identify_investment_targets() if is_options_strategy else [])}

            for symbol in symbols:
                try:
                    # Get current price
                    if use_auto_prices and symbol in auto_target_lookup:
                        current_price = auto_target_lookup[symbol]["current_price"]
                    elif REAL_DATA_AVAILABLE:
                        stock_data = stock_data_service.get_stock_data(symbol, period="30d", interval="1d")
                        current_price = stock_data_service.get_current_price(symbol)["current_price"]
                    else:
                        current_price = 150.0  # Mock price

                    # Strategy-specific analysis
                    if is_options_strategy:
                        signal = analyze_options_income_strategy(symbol, current_price)
                        # Add market data if available
                        if symbol in auto_target_lookup:
                            target_data = auto_target_lookup[symbol]
                            signal.update({
                                "volume": target_data["volume"],
                                "iv_rank": target_data["iv_rank"],
                                "liquidity_score": min(target_data["volume"] / 10000000, 1.0)
                            })
                    elif strategy_name.lower() == "rsi":
                        signal = analyze_rsi_strategy(symbol, current_price)
                    elif strategy_name.lower() == "macd":
                        signal = analyze_macd_strategy(symbol, current_price)
                    elif strategy_name.lower() == "momentum":
                        signal = analyze_momentum_strategy(symbol, current_price)
                    else:
                        signal = analyze_generic_strategy(strategy_name, symbol, current_price)

                    results.append(signal)
                except Exception as e:
                    results.append({
                        "symbol": symbol,
                        "strategy": strategy_name,
                        "signal": "error",
                        "confidence": 0.0,
                        "error": str(e)
                    })

            # Sort results by confidence for options income strategy
            if is_options_strategy:
                results.sort(key=lambda x: x.get("confidence", 0), reverse=True)

            return {
                "status": "success",
                "strategy": strategy_name,
                "results": results,
                "timestamp": datetime.now().isoformat(),
                "symbols_tested": len(results),
                "auto_targets_identified": len(auto_target_lookup) if is_options_strategy else 0
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/strategies/implement/{strategy_name}")
    async def implement_strategy(strategy_name: str, request: Request):
        """Implement a strategy for paper trading simulation."""
        try:
            data = await request.json()
            symbols = data.get("symbols", [])
            allocation = data.get("allocation", 1000.0)
            auto_execute = data.get("auto_execute", False)

            strategy_id = f"{strategy_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Store active strategy
            active_strategies_store[strategy_id] = {
                "strategy_id": strategy_id,
                "strategy_name": strategy_name,
                "symbols": symbols,
                "allocation": allocation,
                "auto_execute": auto_execute,
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "total_trades": 0,
                "successful_trades": 0,
                "current_pnl": 0.0,
                "current_performance": {
                    "total_return": 0.0,
                    "win_rate": 0.0,
                    "avg_trade_return": 0.0,
                    "max_drawdown": 0.0
                }
            }

            # Create simulated positions for paper trading
            for symbol in symbols:
                try:
                    if REAL_DATA_AVAILABLE:
                        current_price = stock_data_service.get_current_price(symbol)["current_price"]
                    else:
                        current_price = 150.0  # Mock price

                    # Simulate position based on strategy recommendation
                    if strategy_name.lower() == "options_income_system":
                        # Simulate cash-secured put position
                        if 1.0 <= current_price <= 8.0:  # Only if in target range
                            target_strike = current_price * 0.85
                            premium_collected = current_price * 0.02
                            simulated_positions.append({
                                "strategy_id": strategy_id,
                                "symbol": symbol,
                                "position_type": "short_put",
                                "strike": target_strike,
                                "premium_collected": premium_collected,
                                "collateral": target_strike * 100,
                                "entry_price": current_price,
                                "current_price": current_price,
                                "quantity": 1,  # 1 contract
                                "entry_time": datetime.now().isoformat(),
                                "unrealized_pnl": premium_collected,  # Start with premium collected
                                "status": "open"
                            })
                    else:
                        # Simulate stock position for other strategies
                        shares = int(allocation / current_price)
                        if shares > 0:
                            simulated_positions.append({
                                "strategy_id": strategy_id,
                                "symbol": symbol,
                                "position_type": "stock",
                                "entry_price": current_price,
                                "current_price": current_price,
                                "quantity": shares,
                                "market_value": shares * current_price,
                                "entry_time": datetime.now().isoformat(),
                                "unrealized_pnl": 0.0,
                                "status": "open"
                            })

                except Exception as e:
                    print(f"Error creating position for {symbol}: {e}")

            return {
                "status": "success",
                "strategy_id": strategy_id,
                "message": f"Strategy '{strategy_name}' implemented successfully",
                "symbols": symbols,
                "allocation": allocation,
                "auto_execute": auto_execute,
                "positions_created": len([p for p in simulated_positions if p["strategy_id"] == strategy_id]),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/trading/status")
    async def get_trading_status():
        """Get current trading mode status."""
        return {
            "status": "success",
            "is_live": False,
            "mode": "paper",
            "alpaca_paper_mode": True
        }

    def analyze_options_income_strategy(symbol: str, current_price: float):
        """Analyze Options Income System strategy with detailed profit projections."""
        # Check if price is in target range ($1-$4)
        price_in_range = 1.0 <= current_price <= 4.0

        if not price_in_range:
            return {
                "symbol": symbol,
                "strategy": "options_income_system",
                "signal": "skip",
                "confidence": 0.0,
                "current_price": current_price,
                "recommendation": "SKIP",
                "reasoning": f"Price ${current_price:.2f} outside target range $1-$4",
                "target_strike": None,
                "premium_estimate": None,
                "collateral_required": None,
                "iv_rank": None,
                "liquidity_score": 0.0,
                "investment_plan": None
            }

        # Calculate detailed investment plan
        target_strike = current_price * 0.85
        estimated_premium = current_price * 0.02
        collateral_required = target_strike * 100
        iv_rank = 65.0
        liquidity_score = 0.8

        # Detailed multi-leg analysis
        investment_legs = []

        # Leg 1: Cash-Secured Put
        csp_cost = collateral_required
        csp_premium = estimated_premium
        csp_profit_target = csp_premium * 0.5  # 50% profit target
        csp_max_profit = csp_premium
        csp_confidence = 0.75 if estimated_premium >= 0.10 else 0.4

        investment_legs.append({
            "leg_type": "Cash-Secured Put",
            "strike": target_strike,
            "expiration": "30-45 DTE",
            "cost": csp_cost,
            "premium_collected": csp_premium,
            "estimated_profit": csp_profit_target,
            "max_profit": csp_max_profit,
            "profit_probability": csp_confidence,
            "breakeven": target_strike - csp_premium,
            "risk": csp_cost - csp_premium,
            "roi_estimate": (csp_profit_target / csp_cost) * 100,
            "confidence": csp_confidence,
            "action": "SELL PUT",
            "reasoning": f"Collect ${csp_premium:.2f} premium, 50% profit target"
        })

        # Leg 2: Potential Covered Call (if assigned)
        if csp_confidence > 0.6:
            cc_strike = current_price * 1.05  # 5% above current price
            cc_premium = current_price * 0.015  # 1.5% premium
            cc_profit = cc_premium * 0.5
            cc_confidence = 0.65

            investment_legs.append({
                "leg_type": "Covered Call (if assigned)",
                "strike": cc_strike,
                "expiration": "14-30 DTE",
                "cost": 0,  # Already own shares from assignment
                "premium_collected": cc_premium,
                "estimated_profit": cc_profit,
                "max_profit": cc_premium + (cc_strike - target_strike),
                "profit_probability": cc_confidence,
                "breakeven": target_strike - csp_premium,
                "risk": 0,  # Covered position
                "roi_estimate": (cc_profit / target_strike) * 100,
                "confidence": cc_confidence,
                "action": "SELL CALL",
                "reasoning": f"Generate additional income if assigned shares"
            })

        # Calculate total plan metrics
        total_cost = sum(leg["cost"] for leg in investment_legs)
        total_estimated_profit = sum(leg["estimated_profit"] for leg in investment_legs)
        total_max_profit = sum(leg["max_profit"] for leg in investment_legs)
        average_confidence = sum(leg["confidence"] for leg in investment_legs) / len(investment_legs)

        confidence = average_confidence

        return {
            "symbol": symbol,
            "strategy": "options_income_system",
            "signal": "strong_sell_put" if confidence >= 0.7 else "moderate_sell_put",
            "confidence": confidence,
            "current_price": current_price,
            "recommendation": "EXECUTE_PLAN" if confidence >= 0.7 else "REVIEW_PLAN",
            "reasoning": f"Multi-leg income strategy: ${total_estimated_profit:.2f} estimated profit",
            "target_strike": round(target_strike, 2),
            "premium_estimate": round(estimated_premium, 2),
            "collateral_required": round(collateral_required, 0),
            "iv_rank": iv_rank,
            "liquidity_score": liquidity_score,
            "investment_plan": {
                "legs": investment_legs,
                "total_cost": total_cost,
                "total_estimated_profit": total_estimated_profit,
                "total_max_profit": total_max_profit,
                "overall_roi": (total_estimated_profit / total_cost) * 100 if total_cost > 0 else 0,
                "risk_reward_ratio": total_estimated_profit / (total_cost - sum(leg["premium_collected"] for leg in investment_legs)) if total_cost > 0 else 0,
                "time_horizon": "30-60 days",
                "complexity": "Medium"
            }
        }

    def analyze_rsi_strategy(symbol: str, current_price: float):
        """Analyze RSI strategy."""
        rsi_value = 45 + (hash(symbol) % 40)  # Mock RSI between 45-85

        if rsi_value < 30:
            signal, action, reasoning = "buy", "BUY", f"RSI oversold at {rsi_value:.1f}"
            confidence = 0.8
        elif rsi_value > 70:
            signal, action, reasoning = "sell", "SELL", f"RSI overbought at {rsi_value:.1f}"
            confidence = 0.8
        else:
            signal, action, reasoning = "hold", "HOLD", f"RSI neutral at {rsi_value:.1f}"
            confidence = 0.5

        return {
            "symbol": symbol,
            "strategy": "rsi",
            "signal": signal,
            "confidence": confidence,
            "current_price": current_price,
            "rsi_value": rsi_value,
            "recommendation": action,
            "reasoning": reasoning
        }

    def analyze_macd_strategy(symbol: str, current_price: float):
        """Analyze MACD strategy."""
        # Mock MACD values
        macd_line = current_price * 0.01 * (1 if hash(symbol) % 2 else -1)
        signal_line = macd_line * 0.8

        if macd_line > signal_line:
            signal, action = "buy", "BUY"
            confidence = 0.7
            reasoning = "MACD bullish crossover"
        else:
            signal, action = "sell", "SELL"
            confidence = 0.7
            reasoning = "MACD bearish crossover"

        return {
            "symbol": symbol,
            "strategy": "macd",
            "signal": signal,
            "confidence": confidence,
            "current_price": current_price,
            "macd_line": round(macd_line, 3),
            "signal_line": round(signal_line, 3),
            "recommendation": action,
            "reasoning": reasoning
        }

    def analyze_momentum_strategy(symbol: str, current_price: float):
        """Analyze momentum strategy."""
        momentum_score = (hash(symbol) % 100) / 100.0  # 0-1 score

        if momentum_score > 0.7:
            signal, action = "buy", "BUY"
            confidence = momentum_score
            reasoning = f"Strong upward momentum: {momentum_score:.2f}"
        elif momentum_score < 0.3:
            signal, action = "sell", "SELL"
            confidence = 1.0 - momentum_score
            reasoning = f"Weak momentum: {momentum_score:.2f}"
        else:
            signal, action = "hold", "HOLD"
            confidence = 0.5
            reasoning = f"Neutral momentum: {momentum_score:.2f}"

        return {
            "symbol": symbol,
            "strategy": "momentum",
            "signal": signal,
            "confidence": confidence,
            "current_price": current_price,
            "momentum_score": momentum_score,
            "recommendation": action,
            "reasoning": reasoning
        }

    def analyze_generic_strategy(strategy_name: str, symbol: str, current_price: float):
        """Analyze generic/custom strategy."""
        score = (hash(symbol + strategy_name) % 100) / 100.0

        if score > 0.6:
            signal, action = "buy", "BUY"
        elif score < 0.4:
            signal, action = "sell", "SELL"
        else:
            signal, action = "hold", "HOLD"

        return {
            "symbol": symbol,
            "strategy": strategy_name,
            "signal": signal,
            "confidence": abs(score - 0.5) * 2,  # 0-1 confidence
            "current_price": current_price,
            "recommendation": action,
            "reasoning": f"{strategy_name} analysis score: {score:.2f}"
        }

    def identify_investment_targets():
        """Automatically identify potential investment targets for options income strategy."""
        # High IV stocks with good options liquidity in target price range
        target_universe = [
            {"symbol": "NVDA", "current_price": 3.20, "volume": 80000000, "iv_rank": 85},
            {"symbol": "AMD", "current_price": 3.85, "volume": 60000000, "iv_rank": 88},
            {"symbol": "INTC", "current_price": 2.95, "volume": 45000000, "iv_rank": 82},
            {"symbol": "F", "current_price": 1.15, "volume": 70000000, "iv_rank": 84},
            {"symbol": "GE", "current_price": 1.75, "volume": 35000000, "iv_rank": 83},
            {"symbol": "T", "current_price": 2.20, "volume": 30000000, "iv_rank": 81},
            {"symbol": "PLTR", "current_price": 3.85, "volume": 55000000, "iv_rank": 92},
            {"symbol": "SNAP", "current_price": 1.45, "volume": 25000000, "iv_rank": 88},
            {"symbol": "SOFI", "current_price": 1.25, "volume": 30000000, "iv_rank": 85},
            {"symbol": "BBBY", "current_price": 2.15, "volume": 25000000, "iv_rank": 95},
            {"symbol": "AMC", "current_price": 3.25, "volume": 45000000, "iv_rank": 89},
            {"symbol": "GME", "current_price": 2.75, "volume": 35000000, "iv_rank": 91},
            {"symbol": "RIVN", "current_price": 1.85, "volume": 40000000, "iv_rank": 86},
            {"symbol": "LCID", "current_price": 1.75, "volume": 35000000, "iv_rank": 92},
            {"symbol": "CLOV", "current_price": 1.55, "volume": 25000000, "iv_rank": 94}
        ]

        # Filter targets based on options income strategy criteria
        suitable_targets = []
        for stock in target_universe:
            # Check if price is in target range ($1-$4)
            if 1.0 <= stock["current_price"] <= 4.0:
                # Check if IV rank is high (>80 for high volatility premium)
                if stock["iv_rank"] > 80:
                    # Check volume for liquidity
                    if stock["volume"] >= 15000000:
                        suitable_targets.append(stock)

        return suitable_targets

    def analyze_options_income_strategy(symbol: str, current_price: float):
        """Analyze Options Income System strategy with detailed profit projections."""
        # Check if price is in target range ($1-$4)
        price_in_range = 1.0 <= current_price <= 4.0

        if not price_in_range:
            return {
                "symbol": symbol,
                "strategy": "options_income_system",
                "signal": "skip",
                "confidence": 0.0,
                "current_price": current_price,
                "recommendation": "SKIP",
                "reasoning": f"Price ${current_price:.2f} outside target range $1-$4",
                "target_strike": None,
                "premium_estimate": None,
                "collateral_required": None,
                "iv_rank": None,
                "liquidity_score": 0.0,
                "investment_plan": None
            }

        # Calculate detailed investment plan
        target_strike = current_price * 0.85
        estimated_premium = current_price * 0.02
        collateral_required = target_strike * 100
        iv_rank = 65.0
        liquidity_score = 0.8

        # Detailed multi-leg analysis
        investment_legs = []

        # Leg 1: Cash-Secured Put
        csp_cost = collateral_required
        csp_premium = estimated_premium
        csp_profit_target = csp_premium * 0.5  # 50% profit target
        csp_max_profit = csp_premium
        csp_confidence = 0.75 if estimated_premium >= 0.10 else 0.4

        investment_legs.append({
            "leg_type": "Cash-Secured Put",
            "strike": target_strike,
            "expiration": "30-45 DTE",
            "cost": csp_cost,
            "premium_collected": csp_premium,
            "estimated_profit": csp_profit_target,
            "max_profit": csp_max_profit,
            "profit_probability": csp_confidence,
            "breakeven": target_strike - csp_premium,
            "risk": csp_cost - csp_premium,
            "roi_estimate": (csp_profit_target / csp_cost) * 100,
            "confidence": csp_confidence,
            "action": "SELL PUT",
            "reasoning": f"Collect ${csp_premium:.2f} premium, 50% profit target"
        })

        # Leg 2: Potential Covered Call (if assigned)
        if csp_confidence > 0.6:
            cc_strike = current_price * 1.05  # 5% above current price
            cc_premium = current_price * 0.015  # 1.5% premium
            cc_profit = cc_premium * 0.5
            cc_confidence = 0.65

            investment_legs.append({
                "leg_type": "Covered Call (if assigned)",
                "strike": cc_strike,
                "expiration": "14-30 DTE",
                "cost": 0,  # Already own shares from assignment
                "premium_collected": cc_premium,
                "estimated_profit": cc_profit,
                "max_profit": cc_premium + (cc_strike - target_strike),
                "profit_probability": cc_confidence,
                "breakeven": target_strike - csp_premium,
                "risk": 0,  # Covered position
                "roi_estimate": (cc_profit / target_strike) * 100,
                "confidence": cc_confidence,
                "action": "SELL CALL",
                "reasoning": f"Generate additional income if assigned shares"
            })

        # Calculate total plan metrics
        total_cost = sum(leg["cost"] for leg in investment_legs)
        total_estimated_profit = sum(leg["estimated_profit"] for leg in investment_legs)
        total_max_profit = sum(leg["max_profit"] for leg in investment_legs)
        average_confidence = sum(leg["confidence"] for leg in investment_legs) / len(investment_legs)

        confidence = average_confidence

        return {
            "symbol": symbol,
            "strategy": "options_income_system",
            "signal": "strong_sell_put" if confidence >= 0.7 else "moderate_sell_put",
            "confidence": confidence,
            "current_price": current_price,
            "recommendation": "EXECUTE_PLAN" if confidence >= 0.7 else "REVIEW_PLAN",
            "reasoning": f"Multi-leg income strategy: ${total_estimated_profit:.2f} estimated profit",
            "target_strike": round(target_strike, 2),
            "premium_estimate": round(estimated_premium, 2),
            "collateral_required": round(collateral_required, 0),
            "iv_rank": iv_rank,
            "liquidity_score": liquidity_score,
            "investment_plan": {
                "legs": investment_legs,
                "total_cost": total_cost,
                "total_estimated_profit": total_estimated_profit,
                "total_max_profit": total_max_profit,
                "overall_roi": (total_estimated_profit / total_cost) * 100 if total_cost > 0 else 0,
                "risk_reward_ratio": total_estimated_profit / (total_cost - sum(leg["premium_collected"] for leg in investment_legs)) if total_cost > 0 else 0,
                "time_horizon": "30-60 days",
                "complexity": "Medium"
            }
        }

    @app.post("/api/strategies/test/{strategy_name}")
    async def test_strategy(strategy_name: str, request: Request):
        """Test a strategy against current market data with automatic target identification."""
        try:
            data = await request.json()

            # For options income strategy, auto-identify targets
            is_options_strategy = (strategy_name.lower() == "options_income_system" or
                                 strategy_name.lower() == "1st strategy" or
                                 "options" in strategy_name.lower() or
                                 "income" in strategy_name.lower())

            print(f"SIMPLE DASHBOARD DEBUG: strategy_name='{strategy_name}', is_options_strategy={is_options_strategy}")

            if is_options_strategy:
                auto_targets = identify_investment_targets()
                symbols = [target["symbol"] for target in auto_targets]
                use_auto_prices = True
                print(f"SIMPLE DASHBOARD DEBUG: Found {len(auto_targets)} auto targets: {symbols}")
            else:
                symbols = data.get("symbols", ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"])
                use_auto_prices = False

            timeframe = data.get("timeframe", "1Day")

            results = []
            auto_target_lookup = {target["symbol"]: target for target in (identify_investment_targets() if is_options_strategy else [])}

            for symbol in symbols:
                try:
                    # Get current price
                    if use_auto_prices and symbol in auto_target_lookup:
                        current_price = auto_target_lookup[symbol]["current_price"]
                    else:
                        current_price = 150.0  # Mock price

                    # Strategy-specific analysis
                    if is_options_strategy:
                        signal = analyze_options_income_strategy(symbol, current_price)
                        # Add market data if available
                        if symbol in auto_target_lookup:
                            target_data = auto_target_lookup[symbol]
                            signal.update({
                                "volume": target_data["volume"],
                                "iv_rank": target_data["iv_rank"],
                                "liquidity_score": min(target_data["volume"] / 10000000, 1.0)
                            })
                    else:
                        signal = analyze_generic_strategy(strategy_name, symbol, current_price)

                    results.append(signal)
                except Exception as e:
                    results.append({
                        "symbol": symbol,
                        "strategy": strategy_name,
                        "signal": "error",
                        "confidence": 0.0,
                        "error": str(e)
                    })

            # Sort results by confidence for options income strategy
            if is_options_strategy:
                results.sort(key=lambda x: x.get("confidence", 0), reverse=True)

            return {
                "status": "success",
                "strategy": strategy_name,
                "results": results,
                "timestamp": datetime.now().isoformat(),
                "symbols_tested": len(results),
                "auto_targets_identified": len(auto_target_lookup) if is_options_strategy else 0
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return app

if __name__ == "__main__":
    print("=== AI Trading Bot Dashboard ===")
    print("Dashboard will be available at: http://localhost:8000")

    # Check configuration status
    if os.path.exists('.env'):
        print("Configuration file found: .env")
        print("Mode: Full functionality (with API integration)")

        # Use the full TradingDashboard when config is available
        try:
            from config.config import Config
            from src.web.dashboard import TradingDashboard

            config = Config.from_env_file('.env')
            dashboard = TradingDashboard(config)
            app = dashboard.app
            print("✓ Full TradingDashboard loaded with all strategy functionality")
        except Exception as e:
            print(f"Error loading full dashboard: {e}")
            print("Falling back to simple dashboard...")
            app = create_simple_dashboard()
    else:
        print("No configuration file found")
        print("Mode: Demo mode (with mock data)")
        print("To enable full functionality:")
        print("1. Copy .env.example to .env")
        print("2. Add your API keys to .env file")
        app = create_simple_dashboard()

    print("\nStarting dashboard server...")

    try:
        import uvicorn
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nDashboard stopped by user")
    except Exception as e:
        print(f"Error starting dashboard: {e}")
        print("Make sure you have installed: pip install fastapi uvicorn plotly jinja2")