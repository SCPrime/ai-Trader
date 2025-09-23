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

        # Strategy management
        self._active_strategies = {}
        self._strategy_results = {}
        self._strategy_trades = {}

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
            """Get current positions with enhanced data."""
            try:
                positions = await self.alpaca_client.get_positions()

                # Enhance position data with additional calculations
                enhanced_positions = []
                for pos in positions:
                    # Calculate additional metrics
                    avg_price = pos['cost_basis'] / pos['qty'] if pos['qty'] != 0 else 0
                    day_pnl = pos['change_today'] * pos['qty']
                    day_pnl_pct = ((pos['current_price'] - pos['lastday_price']) / pos['lastday_price']) * 100 if pos['lastday_price'] != 0 else 0

                    enhanced_pos = {
                        **pos,
                        'avg_price': round(avg_price, 2),
                        'day_pnl': round(day_pnl, 2),
                        'day_pnl_pct': round(day_pnl_pct, 2),
                        'total_pnl_pct': round(pos['unrealized_plpc'] * 100, 2),
                        'position_value': round(pos['market_value'], 2),
                        'current_price_formatted': round(pos['current_price'], 2),
                        'qty_formatted': int(pos['qty']) if pos['qty'].is_integer() else pos['qty']
                    }
                    enhanced_positions.append(enhanced_pos)

                return enhanced_positions
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
                # Toggle the state
                self.is_live_trading = not self.is_live_trading

                # Update the Alpaca client to use the new trading mode
                paper_mode = not self.is_live_trading
                self.alpaca_client.switch_trading_mode(paper_mode)

                # Broadcast the change to connected clients
                await self._broadcast_update(
                    {"type": "trading_mode_changed", "is_live": self.is_live_trading}
                )

                return {
                    "is_live": self.is_live_trading,
                    "mode": "live" if self.is_live_trading else "paper",
                    "message": f"Switched to {'live' if self.is_live_trading else 'paper'} trading mode"
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/trading/status")
        async def get_trading_status():
            """Get current trading mode status."""
            try:
                return {
                    "is_live": self.is_live_trading,
                    "mode": "live" if self.is_live_trading else "paper",
                    "alpaca_paper_mode": self.alpaca_client.paper
                }
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

        # Enhanced Strategy Management Endpoints
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

        @self.app.post("/api/strategies/test/{strategy_name}")
        async def test_strategy(strategy_name: str, request: Request):
            """Test a strategy against current market data."""
            try:
                data = await request.json()
                symbols = data.get("symbols", ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"])
                timeframe = data.get("timeframe", "1Day")

                # Get current market data for testing
                results = []
                for symbol in symbols:
                    try:
                        # Get recent market data
                        end_time = datetime.now()
                        start_time = end_time - timedelta(days=30)

                        market_data = await self.alpaca_client.get_historical_data(
                            symbol, start_time, end_time, timeframe
                        )

                        if market_data.empty:
                            continue

                        # Run strategy analysis
                        strategy_result = await self._run_strategy_analysis(
                            strategy_name, symbol, market_data
                        )
                        results.append(strategy_result)

                    except Exception as e:
                        logger.error(f"Error testing {symbol}: {e}")

                return {
                    "status": "success",
                    "strategy": strategy_name,
                    "results": results,
                    "timestamp": datetime.now().isoformat(),
                    "symbols_tested": len(results)
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/strategies/implement/{strategy_name}")
        async def implement_strategy(strategy_name: str, request: Request):
            """Implement a strategy for live trading."""
            try:
                data = await request.json()
                symbols = data.get("symbols", ["AAPL"])
                allocation = data.get("allocation", 1000)  # Default $1000
                auto_execute = data.get("auto_execute", False)

                implementation_result = await self._implement_strategy(
                    strategy_name, symbols, allocation, auto_execute
                )

                return {
                    "status": "success",
                    "strategy": strategy_name,
                    "implementation": implementation_result,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/strategies/active")
        async def get_active_strategies():
            """Get all currently active strategies."""
            try:
                active_strategies = getattr(self, '_active_strategies', {})

                # Update with current performance
                for strategy_id, strategy_data in active_strategies.items():
                    strategy_data['current_performance'] = await self._get_strategy_performance(strategy_id)

                return {
                    "status": "success",
                    "active_strategies": active_strategies,
                    "count": len(active_strategies)
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/strategies/results/{strategy_id}")
        async def get_strategy_results(strategy_id: str):
            """Get detailed results for a specific strategy."""
            try:
                results = await self._get_detailed_strategy_results(strategy_id)
                return {
                    "status": "success",
                    "strategy_id": strategy_id,
                    "results": results
                }
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

    # Strategy Management Helper Methods
    async def _run_strategy_analysis(self, strategy_name: str, symbol: str, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Run strategy analysis on market data."""
        try:
            from src.indicators.technical_indicators import TechnicalIndicators

            # Calculate technical indicators
            indicators = TechnicalIndicators.calculate_all_indicators(market_data)

            # Get latest data point
            latest_data = market_data.iloc[-1]

            # Run strategy specific analysis
            if strategy_name.lower() == "options_income_system":
                options_signal = await self._analyze_options_income_strategy(symbol, market_data, indicators, latest_data)
                return {
                    "symbol": symbol,
                    "strategy": strategy_name,
                    "signal": options_signal["signal"],
                    "confidence": options_signal["confidence"],
                    "current_price": float(latest_data["close"]),
                    "recommendation": options_signal["action"],
                    "reasoning": options_signal["reasoning"],
                    "target_strike": options_signal.get("target_strike"),
                    "premium_estimate": options_signal.get("premium_estimate"),
                    "collateral_required": options_signal.get("collateral_required"),
                    "iv_rank": options_signal.get("iv_rank"),
                    "liquidity_score": options_signal.get("liquidity_score"),
                    "timestamp": datetime.now().isoformat()
                }
            elif strategy_name.lower() == "rsi":
                rsi_signal = self._analyze_rsi_strategy(indicators, latest_data)
                return {
                    "symbol": symbol,
                    "strategy": strategy_name,
                    "signal": rsi_signal["signal"],
                    "confidence": rsi_signal["confidence"],
                    "current_price": float(latest_data["close"]),
                    "rsi_value": float(indicators["rsi_14"].values.iloc[-1]),
                    "recommendation": rsi_signal["action"],
                    "reasoning": rsi_signal["reasoning"],
                    "timestamp": datetime.now().isoformat()
                }
            elif strategy_name.lower() == "macd":
                macd_signal = self._analyze_macd_strategy(indicators, latest_data)
                return {
                    "symbol": symbol,
                    "strategy": strategy_name,
                    "signal": macd_signal["signal"],
                    "confidence": macd_signal["confidence"],
                    "current_price": float(latest_data["close"]),
                    "macd_line": float(indicators["macd"].values.iloc[-1]["macd"]),
                    "signal_line": float(indicators["macd"].values.iloc[-1]["signal"]),
                    "recommendation": macd_signal["action"],
                    "reasoning": macd_signal["reasoning"],
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Generic strategy analysis
                return self._analyze_generic_strategy(strategy_name, symbol, market_data, indicators)

        except Exception as e:
            logger.error(f"Strategy analysis error for {symbol}: {e}")
            return {
                "symbol": symbol,
                "strategy": strategy_name,
                "signal": "error",
                "confidence": 0.0,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _analyze_rsi_strategy(self, indicators: Dict, latest_data: pd.Series) -> Dict[str, Any]:
        """Analyze RSI strategy signals."""
        rsi_value = float(indicators["rsi_14"].values.iloc[-1])

        if rsi_value < 30:
            return {
                "signal": "buy",
                "confidence": min(0.9, (30 - rsi_value) / 10),
                "action": "BUY",
                "reasoning": f"RSI oversold at {rsi_value:.2f} - Strong buy signal"
            }
        elif rsi_value > 70:
            return {
                "signal": "sell",
                "confidence": min(0.9, (rsi_value - 70) / 10),
                "action": "SELL",
                "reasoning": f"RSI overbought at {rsi_value:.2f} - Strong sell signal"
            }
        else:
            return {
                "signal": "hold",
                "confidence": 0.5,
                "action": "HOLD",
                "reasoning": f"RSI neutral at {rsi_value:.2f} - No clear signal"
            }

    def _analyze_macd_strategy(self, indicators: Dict, latest_data: pd.Series) -> Dict[str, Any]:
        """Analyze MACD strategy signals."""
        macd_data = indicators["macd"].values.iloc[-2:]
        current_macd = macd_data.iloc[-1]
        prev_macd = macd_data.iloc[-2]

        macd_line = float(current_macd["macd"])
        signal_line = float(current_macd["signal"])
        prev_macd_line = float(prev_macd["macd"])
        prev_signal_line = float(prev_macd["signal"])

        # Check for crossover
        bullish_crossover = prev_macd_line <= prev_signal_line and macd_line > signal_line
        bearish_crossover = prev_macd_line >= prev_signal_line and macd_line < signal_line

        if bullish_crossover:
            return {
                "signal": "buy",
                "confidence": 0.8,
                "action": "BUY",
                "reasoning": "MACD bullish crossover - Buy signal"
            }
        elif bearish_crossover:
            return {
                "signal": "sell",
                "confidence": 0.8,
                "action": "SELL",
                "reasoning": "MACD bearish crossover - Sell signal"
            }
        elif macd_line > signal_line:
            return {
                "signal": "hold_bullish",
                "confidence": 0.6,
                "action": "HOLD",
                "reasoning": "MACD above signal line - Bullish trend"
            }
        else:
            return {
                "signal": "hold_bearish",
                "confidence": 0.6,
                "action": "HOLD",
                "reasoning": "MACD below signal line - Bearish trend"
            }

    async def _analyze_options_income_strategy(self, symbol: str, market_data: pd.DataFrame, indicators: Dict, latest_data: pd.Series) -> Dict[str, Any]:
        """
        Analyze the Options Income System strategy for cash-secured puts and covered calls.
        Based on the comprehensive natural language instruction provided.
        """
        current_price = float(latest_data["close"])

        # Strategy parameters (can be made configurable later)
        universe_price_range = (1.0, 8.0)  # $1-$8 range
        target_dte_days = (30, 45)  # 30-45 DTE
        min_option_premium = 0.10  # $0.10 minimum
        max_collateral_per_ticker = 400.0  # $400 max per ticker
        min_iv_rank = 60  # IV Rank >= 60

        # Check if symbol fits basic criteria
        price_in_range = universe_price_range[0] <= current_price <= universe_price_range[1]

        if not price_in_range:
            return {
                "signal": "skip",
                "confidence": 0.0,
                "action": "SKIP",
                "reasoning": f"Price ${current_price:.2f} outside target range ${universe_price_range[0]}-${universe_price_range[1]}",
                "target_strike": None,
                "premium_estimate": None,
                "collateral_required": None,
                "iv_rank": None,
                "liquidity_score": 0.0
            }

        # Calculate implied volatility rank (simplified - would need real options data)
        # For demo purposes, use price volatility as proxy
        price_volatility = market_data["close"].pct_change().rolling(20).std() * 100
        current_vol = float(price_volatility.iloc[-1]) if not pd.isna(price_volatility.iloc[-1]) else 25.0
        iv_rank_estimate = min(100, max(0, current_vol * 3))  # Rough approximation

        # Check IV rank criteria
        if iv_rank_estimate < min_iv_rank:
            return {
                "signal": "skip",
                "confidence": 0.0,
                "action": "SKIP",
                "reasoning": f"IV Rank {iv_rank_estimate:.1f}% below minimum {min_iv_rank}%",
                "target_strike": None,
                "premium_estimate": None,
                "collateral_required": None,
                "iv_rank": iv_rank_estimate,
                "liquidity_score": 0.0
            }

        # Calculate target strike for cash-secured put (10-20% below current price)
        strike_discount_range = (0.10, 0.20)  # 10-20% below spot
        target_strike = current_price * (1 - strike_discount_range[1])  # Start at 20% below

        # Estimate premium (simplified calculation - would need real options pricing)
        # Higher IV rank typically means higher premiums
        time_value = (target_dte_days[0] / 365) * current_price * 0.02  # Base time value
        iv_premium = (iv_rank_estimate / 100) * current_price * 0.015  # IV component
        estimated_premium = time_value + iv_premium

        # Ensure minimum premium requirement
        if estimated_premium < min_option_premium:
            # Try moving strike closer to current price
            for discount in [0.15, 0.10, 0.05]:
                target_strike = current_price * (1 - discount)
                estimated_premium = time_value * (1 + discount) + iv_premium
                if estimated_premium >= min_option_premium:
                    break

            if estimated_premium < min_option_premium:
                return {
                    "signal": "skip",
                    "confidence": 0.0,
                    "action": "SKIP",
                    "reasoning": f"Cannot achieve minimum premium ${min_option_premium:.2f} (estimated: ${estimated_premium:.2f})",
                    "target_strike": target_strike,
                    "premium_estimate": estimated_premium,
                    "collateral_required": None,
                    "iv_rank": iv_rank_estimate,
                    "liquidity_score": 0.0
                }

        # Calculate collateral required for cash-secured put
        collateral_required = target_strike * 100  # 100 shares per contract

        # Check collateral limits
        if collateral_required > max_collateral_per_ticker:
            return {
                "signal": "skip",
                "confidence": 0.0,
                "action": "SKIP",
                "reasoning": f"Collateral ${collateral_required:.0f} exceeds max ${max_collateral_per_ticker:.0f} per ticker",
                "target_strike": target_strike,
                "premium_estimate": estimated_premium,
                "collateral_required": collateral_required,
                "iv_rank": iv_rank_estimate,
                "liquidity_score": 0.0
            }

        # Calculate liquidity score (simplified - would need real options data)
        volume = float(latest_data["volume"])
        avg_volume = float(market_data["volume"].rolling(20).mean().iloc[-1])
        relative_volume = volume / avg_volume if avg_volume > 0 else 1.0
        liquidity_score = min(1.0, relative_volume)  # Cap at 1.0

        # Check minimum liquidity requirements
        if liquidity_score < 0.5:  # Require at least 50% of average volume
            return {
                "signal": "skip",
                "confidence": 0.0,
                "action": "SKIP",
                "reasoning": f"Low liquidity score {liquidity_score:.2f} - need ≥0.5",
                "target_strike": target_strike,
                "premium_estimate": estimated_premium,
                "collateral_required": collateral_required,
                "iv_rank": iv_rank_estimate,
                "liquidity_score": liquidity_score
            }

        # Calculate overall strategy confidence
        price_score = 1.0  # Already passed price range check
        iv_score = min(1.0, (iv_rank_estimate - min_iv_rank) / 40)  # Scale above minimum
        premium_score = min(1.0, (estimated_premium - min_option_premium) / 0.20)  # Scale above minimum
        collateral_score = 1.0 - (collateral_required / max_collateral_per_ticker)  # Lower is better

        overall_confidence = (price_score * 0.2 + iv_score * 0.3 + premium_score * 0.3 +
                            collateral_score * 0.1 + liquidity_score * 0.1)

        # Determine action based on confidence
        if overall_confidence >= 0.7:
            action = "SELL_CSP"
            signal = "strong_sell_put"
            reasoning = f"Strong candidate: IV rank {iv_rank_estimate:.1f}%, premium ${estimated_premium:.2f}, strike ${target_strike:.2f}"
        elif overall_confidence >= 0.5:
            action = "CONSIDER_CSP"
            signal = "moderate_sell_put"
            reasoning = f"Moderate candidate: IV rank {iv_rank_estimate:.1f}%, premium ${estimated_premium:.2f}, needs review"
        else:
            action = "SKIP"
            signal = "skip"
            reasoning = f"Low confidence {overall_confidence:.2f} - multiple criteria not optimal"

        return {
            "signal": signal,
            "confidence": overall_confidence,
            "action": action,
            "reasoning": reasoning,
            "target_strike": round(target_strike, 2),
            "premium_estimate": round(estimated_premium, 2),
            "collateral_required": round(collateral_required, 0),
            "iv_rank": round(iv_rank_estimate, 1),
            "liquidity_score": round(liquidity_score, 2)
        }

    def _analyze_generic_strategy(self, strategy_name: str, symbol: str, market_data: pd.DataFrame, indicators: Dict) -> Dict[str, Any]:
        """Generic strategy analysis for custom strategies."""
        latest_data = market_data.iloc[-1]
        price_change = (latest_data["close"] - latest_data["open"]) / latest_data["open"] * 100

        return {
            "symbol": symbol,
            "strategy": strategy_name,
            "signal": "buy" if price_change > 1 else "sell" if price_change < -1 else "hold",
            "confidence": min(0.7, abs(price_change) / 5),
            "current_price": float(latest_data["close"]),
            "price_change_pct": round(price_change, 2),
            "recommendation": "BUY" if price_change > 1 else "SELL" if price_change < -1 else "HOLD",
            "reasoning": f"Price change {price_change:.2f}% for {strategy_name} strategy",
            "timestamp": datetime.now().isoformat()
        }

    async def _implement_strategy(self, strategy_name: str, symbols: List[str], allocation: float, auto_execute: bool) -> Dict[str, Any]:
        """Implement a strategy for live trading."""
        strategy_id = f"{strategy_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        implementation = {
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
            "signals": []
        }

        # Store the active strategy
        self._active_strategies[strategy_id] = implementation

        # Initialize tracking
        self._strategy_results[strategy_id] = []
        self._strategy_trades[strategy_id] = []

        return implementation

    async def _get_strategy_performance(self, strategy_id: str) -> Dict[str, Any]:
        """Get current performance metrics for a strategy."""
        if strategy_id not in self._active_strategies:
            return {"error": "Strategy not found"}

        strategy = self._active_strategies[strategy_id]
        trades = self._strategy_trades.get(strategy_id, [])

        total_pnl = sum(trade.get("pnl", 0) for trade in trades)
        win_rate = 0
        if trades:
            winning_trades = sum(1 for trade in trades if trade.get("pnl", 0) > 0)
            win_rate = (winning_trades / len(trades)) * 100

        return {
            "total_trades": len(trades),
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate, 2),
            "avg_trade": round(total_pnl / len(trades), 2) if trades else 0,
            "last_updated": datetime.now().isoformat()
        }

    async def _get_detailed_strategy_results(self, strategy_id: str) -> Dict[str, Any]:
        """Get detailed results for a strategy."""
        if strategy_id not in self._active_strategies:
            return {"error": "Strategy not found"}

        strategy = self._active_strategies[strategy_id]
        results = self._strategy_results.get(strategy_id, [])
        trades = self._strategy_trades.get(strategy_id, [])

        return {
            "strategy": strategy,
            "analysis_results": results,
            "trades": trades,
            "performance": await self._get_strategy_performance(strategy_id)
        }

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
