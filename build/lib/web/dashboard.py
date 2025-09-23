"""
Web-based trading dashboard.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import plotly.graph_objects as go
import plotly.utils
from plotly.subplots import make_subplots
import pandas as pd

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse

from ..core.alpaca_client import AlpacaClient
from ..data.data_manager import DataManager
from ..indicators.technical_indicators import TechnicalIndicators
from ..monitoring.health_checker import HealthChecker
from ..monitoring.performance_monitor import performance_monitor
from ..strategies.strategy_engine import StrategyEngine
from ..strategies.natural_language_strategy import StrategyManager
from ..core.settings_manager import SettingsManager
from ..ai.ai_agent import AIAgent
from config.config import Config


class TradingDashboard:
    """
    Main trading dashboard application.
    """

    def __init__(self, config: Config):
        """Initialize dashboard with configuration."""
        self.config = config
        self.app = FastAPI(title="AI Trading Bot Dashboard", version="1.0.0")
        self.templates = Jinja2Templates(directory="src/web/templates")

        # Initialize components
        self.alpaca_client = AlpacaClient(config.alpaca)
        self.data_manager = DataManager(config.trading.data_dir)
        self.health_checker = HealthChecker()
        self.strategy_engine = StrategyEngine()
        self.strategy_manager = StrategyManager("strategies")
        self.settings_manager = SettingsManager("config/trading_settings.json")
        self.ai_agent = (
            AIAgent(config.ai.anthropic_api_key, config.ai.model)
            if config.ai.anthropic_api_key
            else None
        )

        # State management
        self.is_live_trading = not config.alpaca.paper_trading
        self.is_ai_auto_mode = True
        self.active_websockets: List[WebSocket] = []

        # Setup routes
        self._setup_routes()
        self._setup_websockets()

        # Mount static files
        self.app.mount(
            "/static", StaticFiles(directory="src/web/static"), name="static"
        )

    def _setup_routes(self):
        """Setup API routes."""

        @self.app.get("/", response_class=HTMLResponse)
        async def dashboard(request: Request):
            """Main dashboard page."""
            return self.templates.TemplateResponse(
                "dashboard.html",
                {
                    "request": request,
                    "is_live_trading": self.is_live_trading,
                    "is_ai_auto_mode": self.is_ai_auto_mode,
                },
            )

        @self.app.get("/api/account")
        async def get_account():
            """Get account information."""
            try:
                account_info = await self.alpaca_client.get_account()
                return account_info
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/positions")
        async def get_positions():
            """Get current positions."""
            try:
                positions = await self.alpaca_client.get_positions()
                return positions
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/orders")
        async def get_orders():
            """Get recent orders."""
            try:
                orders = await self.alpaca_client.get_orders(limit=50)
                return orders
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/chart/{symbol}")
        async def get_chart_data(
            symbol: str, timeframe: str = "1Min", limit: int = 1000
        ):
            """Get chart data with indicators."""
            try:
                # Get market data
                end_time = datetime.now()
                start_time = end_time - timedelta(days=5)  # Adjust based on timeframe

                data = await self.alpaca_client.get_historical_data(
                    symbol, start_time, end_time, timeframe
                )

                if data.empty:
                    return {"error": "No data available"}

                # Calculate indicators
                indicators = TechnicalIndicators.calculate_all_indicators(data)

                # Create chart
                chart_json = self._create_interactive_chart(symbol, data, indicators)

                return {
                    "chart": chart_json,
                    "data": data.tail(100).to_dict("records"),  # Recent data for table
                    "indicators": {
                        name: (
                            result.values.iloc[-1]
                            if hasattr(result.values, "iloc")
                            else result.values.tail(1).iloc[0]
                        )
                        for name, result in indicators.items()
                    },
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/trading/toggle")
        async def toggle_trading_mode():
            """Toggle between paper and live trading."""
            try:
                self.is_live_trading = not self.is_live_trading
                # Note: This would require config update and service restart in production
                await self._broadcast_update(
                    {"type": "trading_mode_changed", "is_live": self.is_live_trading}
                )
                return {"is_live": self.is_live_trading}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/ai/toggle")
        async def toggle_ai_mode():
            """Toggle AI auto/manual mode."""
            try:
                self.is_ai_auto_mode = not self.is_ai_auto_mode
                await self._broadcast_update(
                    {"type": "ai_mode_changed", "is_auto": self.is_ai_auto_mode}
                )
                return {"is_auto": self.is_ai_auto_mode}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/performance")
        async def get_performance():
            """Get portfolio performance metrics."""
            try:
                # Get account data
                account = await self.alpaca_client.get_account()

                # Calculate performance metrics
                portfolio_value = float(account.get("portfolio_value", 0))
                buying_power = float(account.get("buying_power", 0))
                day_change = float(account.get("equity", 0)) - float(
                    account.get("last_equity", 0)
                )
                day_change_pct = (
                    day_change / float(account.get("last_equity", 1))
                ) * 100

                # Get positions for allocation chart
                positions = await self.alpaca_client.get_positions()

                return {
                    "portfolio_value": portfolio_value,
                    "buying_power": buying_power,
                    "day_change": day_change,
                    "day_change_pct": day_change_pct,
                    "positions_count": len(positions),
                    "cash_allocation": (
                        buying_power / portfolio_value * 100
                        if portfolio_value > 0
                        else 0
                    ),
                    "positions": positions,
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/health")
        async def get_health():
            """Get system health status."""
            try:
                health_results = await self.health_checker.run_all_checks()
                overall_status = self.health_checker.get_overall_health()

                return {
                    "status": overall_status.value,
                    "checks": {
                        name: {
                            "status": result.status.value,
                            "message": result.message,
                            "timestamp": result.timestamp.isoformat(),
                        }
                        for name, result in health_results.items()
                    },
                    "performance": performance_monitor.get_system_performance_summary(),
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/trade/{symbol}")
        async def place_trade(
            symbol: str, side: str, quantity: float, order_type: str = "market"
        ):
            """Place a trade order."""
            try:
                if not self.is_live_trading:
                    # Simulate trade in paper mode
                    return {
                        "status": "simulated",
                        "symbol": symbol,
                        "side": side,
                        "quantity": quantity,
                        "order_type": order_type,
                    }

                # Place actual trade
                order = await self.alpaca_client.place_order(
                    symbol=symbol, side=side, quantity=quantity, order_type=order_type
                )

                await self._broadcast_update({"type": "trade_placed", "order": order})

                return order
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/ai/analysis/{symbol}")
        async def get_ai_analysis(symbol: str):
            """Get AI analysis for a symbol."""
            try:
                if not self.ai_agent:
                    return {"error": "AI agent not configured"}

                # Get market data
                end_time = datetime.now()
                start_time = end_time - timedelta(hours=24)

                data = await self.alpaca_client.get_historical_data(
                    symbol, start_time, end_time, "1Hour"
                )

                if data.empty:
                    return {"error": "No market data available"}

                # Calculate indicators
                indicators = TechnicalIndicators.calculate_all_indicators(data)

                # Prepare data for AI
                latest_data = data.iloc[-1]
                market_data = {
                    "current_price": latest_data["close"],
                    "volume": latest_data["volume"],
                    "high_24h": data["high"].max(),
                    "low_24h": data["low"].min(),
                }

                technical_indicators = {}
                for name, result in indicators.items():
                    if hasattr(result.values, "iloc"):
                        technical_indicators[name] = result.values.iloc[-1]
                    else:
                        technical_indicators[name] = result.values.tail(1).iloc[0]

                # Get AI analysis
                analysis = await self.ai_agent.analyze_trade_opportunity(
                    symbol, market_data, technical_indicators
                )

                return {
                    "symbol": symbol,
                    "recommendation": analysis.recommendation,
                    "confidence": analysis.confidence,
                    "reasoning": analysis.reasoning,
                    "risk_factors": analysis.risk_factors,
                    "opportunities": analysis.opportunities,
                    "suggested_actions": analysis.suggested_actions,
                    "timestamp": analysis.timestamp.isoformat(),
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        # Natural Language Strategy Endpoints
        @self.app.post("/api/strategies/create")
        async def create_strategy(request: Request):
            """Create a new strategy from natural language."""
            try:
                data = await request.json()
                strategy = self.strategy_manager.create_strategy_from_natural_language(
                    name=data["name"],
                    description=data["description"],
                    natural_language_rules=data["rules"],
                    ai_agent=self.ai_agent,
                )
                return {"status": "success", "strategy": strategy.to_dict()}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/strategies")
        async def list_strategies():
            """Get list of all strategies."""
            try:
                strategies = self.strategy_manager.list_strategies()
                return [strategy.to_dict() for strategy in strategies]
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/strategies/{name}")
        async def get_strategy(name: str):
            """Get a specific strategy."""
            try:
                strategy = self.strategy_manager.get_strategy(name)
                if not strategy:
                    raise HTTPException(status_code=404, detail="Strategy not found")
                return strategy.to_dict()
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.delete("/api/strategies/{name}")
        async def delete_strategy(name: str):
            """Delete a strategy."""
            try:
                success = self.strategy_manager.delete_strategy(name)
                if not success:
                    raise HTTPException(status_code=404, detail="Strategy not found")
                return {"status": "success", "message": f"Strategy '{name}' deleted"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/strategies/examples")
        async def get_strategy_examples():
            """Get example strategies."""
            try:
                return self.strategy_manager.get_strategy_examples()
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        # Settings Management Endpoints
        @self.app.get("/api/settings")
        async def get_current_settings():
            """Get current trading settings."""
            try:
                return self.settings_manager.current_settings.to_dict()
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.put("/api/settings")
        async def update_settings(request: Request):
            """Update trading settings."""
            try:
                updates = await request.json()
                updated_settings = self.settings_manager.update_settings(updates)
                return {"status": "success", "settings": updated_settings.to_dict()}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/settings/reset")
        async def reset_settings():
            """Reset settings to defaults."""
            try:
                default_settings = self.settings_manager.reset_to_defaults()
                return {"status": "success", "settings": default_settings.to_dict()}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/settings/presets")
        async def get_preset_configurations():
            """Get preset configurations."""
            try:
                return self.settings_manager.get_preset_configurations()
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/settings/preset/{preset_name}")
        async def apply_preset(preset_name: str):
            """Apply a preset configuration."""
            try:
                success = self.settings_manager.apply_preset(preset_name)
                if not success:
                    raise HTTPException(status_code=404, detail="Preset not found")
                return {
                    "status": "success",
                    "settings": self.settings_manager.current_settings.to_dict(),
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/settings/summary")
        async def get_settings_summary():
            """Get settings summary with risk, AI, and indicator info."""
            try:
                return {
                    "risk": self.settings_manager.get_risk_summary(),
                    "ai": self.settings_manager.get_ai_summary(),
                    "indicators": self.settings_manager.get_indicator_summary(),
                    "warnings": self.settings_manager.validate_settings(),
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    def _setup_websockets(self):
        """Setup WebSocket connections for real-time updates."""

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            self.active_websockets.append(websocket)

            try:
                while True:
                    # Send periodic updates
                    await asyncio.sleep(5)

                    # Get current data
                    account = await self.alpaca_client.get_account()
                    positions = await self.alpaca_client.get_positions()

                    update = {
                        "type": "periodic_update",
                        "timestamp": datetime.now().isoformat(),
                        "account": account,
                        "positions": positions,
                        "health": self.health_checker.get_overall_health().value,
                    }

                    await websocket.send_text(json.dumps(update))

            except WebSocketDisconnect:
                self.active_websockets.remove(websocket)

    def _create_interactive_chart(
        self, symbol: str, data: pd.DataFrame, indicators: Dict[str, Any]
    ) -> str:
        """Create interactive chart with indicators."""

        # Create subplots
        fig = make_subplots(
            rows=4,
            cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=(f"{symbol} Price", "Volume", "RSI", "MACD"),
            row_heights=[0.5, 0.15, 0.15, 0.2],
        )

        # Candlestick chart
        fig.add_trace(
            go.Candlestick(
                x=data.index,
                open=data["open"],
                high=data["high"],
                low=data["low"],
                close=data["close"],
                name=symbol,
            ),
            row=1,
            col=1,
        )

        # Moving averages
        if "sma_20" in indicators:
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=indicators["sma_20"].values,
                    name="SMA 20",
                    line=dict(color="orange", width=1),
                ),
                row=1,
                col=1,
            )

        if "ema_12" in indicators:
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=indicators["ema_12"].values,
                    name="EMA 12",
                    line=dict(color="purple", width=1),
                ),
                row=1,
                col=1,
            )

        # Bollinger Bands
        if "bollinger_bands" in indicators:
            bb_data = indicators["bollinger_bands"].values
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=bb_data["upper"],
                    name="BB Upper",
                    line=dict(color="gray", width=1, dash="dash"),
                    showlegend=False,
                ),
                row=1,
                col=1,
            )
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=bb_data["lower"],
                    name="BB Lower",
                    line=dict(color="gray", width=1, dash="dash"),
                    fill="tonexty",
                    fillcolor="rgba(128,128,128,0.1)",
                    showlegend=False,
                ),
                row=1,
                col=1,
            )

        # Volume
        colors = [
            "red" if close < open else "green"
            for close, open in zip(data["close"], data["open"])
        ]

        fig.add_trace(
            go.Bar(
                x=data.index,
                y=data["volume"],
                name="Volume",
                marker_color=colors,
                showlegend=False,
            ),
            row=2,
            col=1,
        )

        # RSI
        if "rsi_14" in indicators:
            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=indicators["rsi_14"].values,
                    name="RSI",
                    line=dict(color="blue", width=2),
                    showlegend=False,
                ),
                row=3,
                col=1,
            )

            # RSI levels
            fig.add_hline(y=70, line_dash="dash", line_color="red", row=3, col=1)
            fig.add_hline(y=30, line_dash="dash", line_color="green", row=3, col=1)

        # MACD
        if "macd" in indicators:
            macd_data = indicators["macd"].values

            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=macd_data["macd"],
                    name="MACD",
                    line=dict(color="blue", width=2),
                    showlegend=False,
                ),
                row=4,
                col=1,
            )

            fig.add_trace(
                go.Scatter(
                    x=data.index,
                    y=macd_data["signal"],
                    name="Signal",
                    line=dict(color="red", width=1),
                    showlegend=False,
                ),
                row=4,
                col=1,
            )

            # MACD histogram
            colors = ["green" if val >= 0 else "red" for val in macd_data["histogram"]]
            fig.add_trace(
                go.Bar(
                    x=data.index,
                    y=macd_data["histogram"],
                    name="Histogram",
                    marker_color=colors,
                    showlegend=False,
                ),
                row=4,
                col=1,
            )

        # Update layout
        fig.update_layout(
            title=f"{symbol} Technical Analysis",
            xaxis_rangeslider_visible=False,
            height=800,
            showlegend=True,
            legend=dict(
                orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1
            ),
        )

        # Update x-axes
        fig.update_xaxes(type="date")

        # Convert to JSON
        return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

    async def _broadcast_update(self, message: Dict[str, Any]):
        """Broadcast update to all connected WebSocket clients."""
        if self.active_websockets:
            disconnected = []
            for websocket in self.active_websockets:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.append(websocket)

            # Remove disconnected websockets
            for ws in disconnected:
                self.active_websockets.remove(ws)

    async def start_background_tasks(self):
        """Start background monitoring tasks."""
        await self.health_checker.start_monitoring()

    async def stop_background_tasks(self):
        """Stop background monitoring tasks."""
        await self.health_checker.stop_monitoring()


def create_dashboard_app(config: Config) -> FastAPI:
    """Create and configure the dashboard application."""
    dashboard = TradingDashboard(config)
    return dashboard.app
