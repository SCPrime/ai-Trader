#!/usr/bin/env python3
"""
AI Trading Bot Dashboard - Production Entry Point
A sophisticated trading dashboard with options income strategy analysis.
"""

import os
import sys
import json
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from start_dashboard import create_simple_dashboard
from api.supervisor import router as supervisor_router

# Create the FastAPI app
app = create_simple_dashboard()

# Include supervisor API routes
app.include_router(supervisor_router)

# Add supervisor route
from fastapi import Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="src/web/templates")

@app.get("/supervisor", response_class=HTMLResponse)
async def supervisor_page(request: Request):
    return templates.TemplateResponse("supervisor.html", {"request": request})

if __name__ == "__main__":
    import uvicorn

    # Get port from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"Starting AI Trading Bot Dashboard on {host}:{port}")
    uvicorn.run(app, host=host, port=port)


# Legacy trading bot class for reference (not used in production)
    """
    Main trading bot application orchestrating all components.
    """

    def __init__(self, config: Config):
        """
        Initialize the trading bot application.

        Args:
            config: Application configuration
        """
        self.config = config
        self.running = False
        self.alpaca_client: Optional[AlpacaClient] = None
        self.strategy: Optional[RSIStrategy] = None

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.running = False

    async def initialize(self):
        """Initialize all components."""
        try:
            logger.info("Initializing AI Trading Bot...")

            # Initialize Alpaca client
            self.alpaca_client = AlpacaClient(
                api_key=self.config.alpaca.api_key,
                secret_key=self.config.alpaca.secret_key,
                paper=self.config.alpaca.paper_trading
            )

            # Initialize strategy
            rsi_config = RSIConfig(
                period=self.config.rsi.period,
                oversold=self.config.rsi.oversold,
                overbought=self.config.rsi.overbought,
                use_divergence=self.config.rsi.use_divergence,
                use_volume_filter=self.config.rsi.use_volume_filter,
                min_volume_ratio=self.config.rsi.min_volume_ratio
            )
            self.strategy = RSIStrategy(rsi_config)

            # Verify connection
            async with self.alpaca_client:
                account = await self.alpaca_client.get_account()
                logger.info(f"Connected to Alpaca account: {account['account_number']}")
                logger.info(f"Portfolio value: ${account['portfolio_value']:.2f}")

            logger.info("Trading bot initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize trading bot: {e}")
            raise

    async def run(
        self,
        symbols: Optional[List[str]] = None,
        strategy: str = "rsi",
        dry_run: bool = False
    ):
        """
        Run the trading bot.

        Args:
            symbols: List of symbols to trade
            strategy: Strategy to use
            dry_run: Whether to run in dry-run mode
        """
        try:
            await self.initialize()

            if not symbols:
                symbols = ["SPY", "AAPL", "TSLA", "MSFT", "NVDA"]

            logger.info(f"Starting trading bot for symbols: {symbols}")
            logger.info(f"Strategy: {strategy}")
            logger.info(f"Dry run mode: {dry_run}")

            self.running = True

            # Main trading loop
            while self.running:
                try:
                    await self._trading_iteration(symbols, dry_run)
                    await asyncio.sleep(self.config.trading.trade_frequency)

                except Exception as e:
                    logger.error(f"Error in trading iteration: {e}")
                    await asyncio.sleep(10)  # Wait before retrying

        except Exception as e:
            logger.error(f"Error running trading bot: {e}")
            raise
        finally:
            logger.info("Trading bot shutdown complete")

    async def _trading_iteration(self, symbols: List[str], dry_run: bool):
        """
        Perform a single trading iteration.

        Args:
            symbols: Symbols to analyze
            dry_run: Whether this is a dry run
        """
        async with self.alpaca_client:
            # Check market hours
            is_open = await self.alpaca_client.is_market_open()
            if not is_open:
                logger.debug("Market is closed, skipping iteration")
                return

            # Get account information
            account = await self.alpaca_client.get_account()
            positions = await self.alpaca_client.get_positions()

            # Log portfolio status
            log_portfolio(
                total_value=float(account['portfolio_value']),
                cash=float(account['cash']),
                positions_count=len(positions),
                daily_pnl=float(account['portfolio_value']) - float(account['last_equity']),
                total_pnl=float(account['portfolio_value']) - 100000  # Assuming $100k starting capital
            )

            # Analyze each symbol
            for symbol in symbols:
                try:
                    await self._analyze_symbol(symbol, dry_run, account, positions)
                except Exception as e:
                    logger.error(f"Error analyzing {symbol}: {e}")

    async def _analyze_symbol(
        self,
        symbol: str,
        dry_run: bool,
        account: Dict[str, Any],
        positions: List[Dict[str, Any]]
    ):
        """
        Analyze a single symbol and potentially place trades.

        Args:
            symbol: Symbol to analyze
            dry_run: Whether this is a dry run
            account: Account information
            positions: Current positions
        """
        # Get historical data
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)

        data = await self.alpaca_client.get_historical_data(
            symbol=symbol,
            timeframe="15Min",
            start=start_time,
            end=end_time,
            limit=500
        )

        if data.empty:
            logger.warning(f"No data available for {symbol}")
            return

        # Generate signal
        signal = self.strategy.analyze(data, symbol)
        if not signal:
            logger.debug(f"No signal generated for {symbol}")
            return

        logger.info(f"Signal for {symbol}: {signal.signal.value} "
                   f"(confidence: {signal.confidence:.2f})")

        # Check if we already have a position
        current_position = next((p for p in positions if p['symbol'] == symbol), None)

        # Risk management checks
        if not self._risk_check(signal, account, positions, current_position):
            return

        # Calculate position size
        base_position_size = float(account['portfolio_value']) * self.config.trading.position_size
        position_size = self.strategy.get_position_size(base_position_size, signal)

        # Convert to number of shares
        shares = int(position_size / signal.price)

        if shares < 1:
            logger.debug(f"Position size too small for {symbol}: {shares} shares")
            return

        # Execute trades based on signal
        if signal.signal.value in ["BUY", "STRONG_BUY"] and not current_position:
            await self._execute_buy_order(symbol, shares, signal, dry_run)
        elif signal.signal.value in ["SELL", "STRONG_SELL"] and current_position:
            await self._execute_sell_order(symbol, current_position, signal, dry_run)

    def _risk_check(
        self,
        signal,
        account: Dict[str, Any],
        positions: List[Dict[str, Any]],
        current_position: Optional[Dict[str, Any]]
    ) -> bool:
        """
        Perform risk management checks.

        Args:
            signal: Trading signal
            account: Account information
            positions: Current positions
            current_position: Current position for this symbol

        Returns:
            True if trade passes risk checks
        """
        # Check maximum positions
        if len(positions) >= self.config.trading.max_positions and not current_position:
            log_risk("MAX_POSITIONS_REACHED", current_value=len(positions),
                    threshold=self.config.trading.max_positions)
            return False

        # Check available cash for buy orders
        if signal.signal.value in ["BUY", "STRONG_BUY"]:
            required_cash = signal.price * (
                float(account['portfolio_value']) * self.config.trading.position_size
            ) / signal.price

            if float(account['cash']) < required_cash:
                log_risk("INSUFFICIENT_CASH", current_value=float(account['cash']),
                        threshold=required_cash)
                return False

        # Check daily loss limit
        daily_pnl = float(account['portfolio_value']) - float(account['last_equity'])
        max_daily_loss = float(account['portfolio_value']) * self.config.risk.max_daily_loss

        if daily_pnl < -max_daily_loss:
            log_risk("DAILY_LOSS_LIMIT", current_value=abs(daily_pnl),
                    threshold=max_daily_loss, action_taken="BLOCK_TRADES")
            return False

        return True

    async def _execute_buy_order(self, symbol: str, shares: int, signal, dry_run: bool):
        """Execute a buy order."""
        try:
            if dry_run:
                logger.info(f"DRY RUN: Would buy {shares} shares of {symbol} at ${signal.price:.2f}")
                log_trade("ORDER_SIMULATED", symbol, "BUY", shares, signal.price,
                         strategy=self.strategy.name, confidence=signal.confidence)
                return

            # Place market order
            order = await self.alpaca_client.place_market_order(
                symbol=symbol,
                side="buy",
                qty=shares
            )

            log_trade("ORDER_PLACED", symbol, "BUY", shares, signal.price,
                     order_id=order['id'], strategy=self.strategy.name,
                     confidence=signal.confidence)

            logger.info(f"Buy order placed: {shares} shares of {symbol} "
                       f"at ${signal.price:.2f} (Order ID: {order['id']})")

        except Exception as e:
            logger.error(f"Failed to place buy order for {symbol}: {e}")

    async def _execute_sell_order(self, symbol: str, position: Dict[str, Any], signal, dry_run: bool):
        """Execute a sell order."""
        try:
            shares = int(float(position['qty']))

            if dry_run:
                logger.info(f"DRY RUN: Would sell {shares} shares of {symbol} at ${signal.price:.2f}")
                log_trade("ORDER_SIMULATED", symbol, "SELL", shares, signal.price,
                         strategy=self.strategy.name, confidence=signal.confidence)
                return

            # Place market order
            order = await self.alpaca_client.place_market_order(
                symbol=symbol,
                side="sell",
                qty=shares
            )

            log_trade("ORDER_PLACED", symbol, "SELL", shares, signal.price,
                     order_id=order['id'], strategy=self.strategy.name,
                     confidence=signal.confidence, pnl=float(position['unrealized_pl']))

            logger.info(f"Sell order placed: {shares} shares of {symbol} "
                       f"at ${signal.price:.2f} (Order ID: {order['id']}) "
                       f"P&L: ${float(position['unrealized_pl']):.2f}")

        except Exception as e:
            logger.error(f"Failed to place sell order for {symbol}: {e}")

    async def show_status(self):
        """Show current bot and account status."""
        try:
            await self.initialize()

            async with self.alpaca_client:
                # Get account info
                account = await self.alpaca_client.get_account()
                positions = await self.alpaca_client.get_positions()
                market_hours = await self.alpaca_client.get_market_hours()

                print("\n=== AI Trading Bot Status ===\n")

                # Account information
                print("📊 Account Information:")
                print(f"  Account: {account['account_number']}")
                print(f"  Status: {account['status']}")
                print(f"  Portfolio Value: ${float(account['portfolio_value']):,.2f}")
                print(f"  Cash: ${float(account['cash']):,.2f}")
                print(f"  Buying Power: ${float(account['buying_power']):,.2f}")
                print()

                # Market status
                print("🕒 Market Information:")
                print(f"  Market Open: {'✅' if market_hours['is_open'] else '❌'}")
                print(f"  Next Open: {market_hours['next_open']}")
                print(f"  Next Close: {market_hours['next_close']}")
                print()

                # Positions
                print("💼 Current Positions:")
                if positions:
                    for pos in positions:
                        pnl_color = "🟢" if float(pos['unrealized_pl']) >= 0 else "🔴"
                        print(f"  {pos['symbol']}: {float(pos['qty']):,.0f} shares "
                              f"@ ${float(pos['current_price']):,.2f} "
                              f"{pnl_color} P&L: ${float(pos['unrealized_pl']):,.2f}")
                else:
                    print("  No open positions")
                print()

        except Exception as e:
            logger.error(f"Error getting status: {e}")
            raise

    async def run_backtest(self, symbols: List[str], days: int, strategy: str):
        """
        Run backtesting on historical data.

        Args:
            symbols: Symbols to backtest
            days: Number of days to backtest
            strategy: Strategy to use
        """
        try:
            await self.initialize()
            logger.info(f"Running backtest for {days} days on symbols: {symbols}")

            # This is a placeholder for backtesting functionality
            # In a full implementation, this would:
            # 1. Get historical data for the specified period
            # 2. Run the strategy on historical data
            # 3. Calculate performance metrics
            # 4. Generate backtest report

            print(f"\n⚠️ Backtesting functionality is not yet implemented")
            print(f"Would backtest {symbols} for {days} days using {strategy} strategy")

        except Exception as e:
            logger.error(f"Error running backtest: {e}")
            raise

    async def analyze_symbol(self, symbol: str, days: int):
        """
        Analyze a symbol with AI and technical indicators.

        Args:
            symbol: Symbol to analyze
            days: Days of data to analyze
        """
        try:
            await self.initialize()

            async with self.alpaca_client:
                # Get historical data
                end_time = datetime.now()
                start_time = end_time - timedelta(days=days)

                data = await self.alpaca_client.get_historical_data(
                    symbol=symbol,
                    timeframe="1Hour",
                    start=start_time,
                    end=end_time
                )

                if data.empty:
                    print(f"No data available for {symbol}")
                    return

                # Generate signal
                signal = self.strategy.analyze(data, symbol)

                print(f"\n=== Analysis for {symbol} ===\n")

                # Basic information
                current_price = data['close'].iloc[-1]
                price_change = data['close'].iloc[-1] - data['close'].iloc[-2]
                price_change_pct = (price_change / data['close'].iloc[-2]) * 100

                print(f"📈 Current Price: ${current_price:.2f}")
                print(f"📊 Price Change: ${price_change:+.2f} ({price_change_pct:+.2f}%)")
                print(f"📅 Data Period: {days} days ({len(data)} bars)")
                print()

                # Signal information
                if signal:
                    print(f"🎯 Signal: {signal.signal.value}")
                    print(f"🎲 Confidence: {signal.confidence:.2f}")
                    print(f"💡 Reason: {signal.reason}")
                    print(f"📊 Indicators:")
                    for key, value in signal.indicators.items():
                        if isinstance(value, (int, float)):
                            print(f"    {key}: {value:.2f}")
                        else:
                            print(f"    {key}: {value}")
                else:
                    print("🔍 No signal generated")

                print()

        except Exception as e:
            logger.error(f"Error analyzing {symbol}: {e}")
            raise

# Import the unified AI engine
from src.unified_ai_engine import ai_engine

@app.get("/ai-chat-enhanced")
async def enhanced_chat():
    """Enhanced AI chat with multiple providers"""
    return HTMLResponse(open('templates/enhanced_chat.html').read())

@app.websocket("/ws/ai-enhanced")
async def enhanced_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Get response from unified AI engine
            response = await ai_engine.process_query(
                query=message['text'],
                interface='dashboard'
            )

            # Send structured response
            await websocket.send_text(json.dumps({
                "text": response['text'],
                "type": response['type'],
                "provider": response['provider'],
                "suggestions": response.get('suggestions', []),
                "charts": response.get('charts', [])
            }))

    except WebSocketDisconnect:
        pass

@app.get("/api/ai-query")
async def api_query(query: str):
    """REST API endpoint for AI queries"""
    response = await ai_engine.process_query(query, interface='api')
    return response