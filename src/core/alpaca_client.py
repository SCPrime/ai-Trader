"""
Alpaca API integration with async support for trading operations.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import (
    MarketOrderRequest,
    LimitOrderRequest,
    StopOrderRequest,
)
from alpaca.trading.enums import OrderSide, TimeInForce, OrderType
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.common.exceptions import APIError
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class AlpacaClient:
    """
    Async Alpaca API client with comprehensive trading functionality.
    """

    def __init__(self, config_or_api_key, secret_key: str = None, paper: bool = True):
        """
        Initialize Alpaca client.

        Args:
            config_or_api_key: Either a config object with alpaca settings or API key string
            secret_key: Alpaca secret key (if config_or_api_key is a string)
            paper: Use paper trading (default: True, if config_or_api_key is a string)
        """
        # Handle both config object and individual parameters
        if hasattr(config_or_api_key, 'api_key'):
            # Config object passed
            config = config_or_api_key
            self.api_key = config.api_key
            self.secret_key = config.secret_key
            self.paper = config.paper_trading
        else:
            # Individual parameters passed
            self.api_key = config_or_api_key
            self.secret_key = secret_key
            self.paper = paper

        # Initialize clients
        self.trading_client = TradingClient(
            api_key=self.api_key, secret_key=self.secret_key, paper=self.paper
        )

        self.data_client = StockHistoricalDataClient(
            api_key=self.api_key, secret_key=self.secret_key
        )

        self._session: Optional[aiohttp.ClientSession] = None
        self._base_url = (
            "https://paper-api.alpaca.markets"
            if self.paper
            else "https://api.alpaca.markets"
        )

    def switch_trading_mode(self, paper: bool):
        """
        Switch between paper and live trading modes.

        Args:
            paper: True for paper trading, False for live trading
        """
        if self.paper == paper:
            return  # No change needed

        self.paper = paper
        self._base_url = (
            "https://paper-api.alpaca.markets"
            if paper
            else "https://api.alpaca.markets"
        )

        # Recreate trading client with new paper setting
        self.trading_client = TradingClient(
            api_key=self.api_key, secret_key=self.secret_key, paper=paper
        )

        logger.info(f"Switched to {'paper' if paper else 'live'} trading mode")

    async def __aenter__(self):
        """Async context manager entry."""
        self._session = aiohttp.ClientSession(
            headers={
                "APCA-API-KEY-ID": self.api_key,
                "APCA-API-SECRET-KEY": self.secret_key,
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._session:
            await self._session.close()

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_account(self) -> Dict[str, Any]:
        """
        Get account information.

        Returns:
            Account details dictionary
        """
        try:
            account = self.trading_client.get_account()
            return {
                "id": account.id,
                "account_number": account.account_number,
                "status": account.status,
                "currency": account.currency,
                "buying_power": float(account.buying_power),
                "regt_buying_power": float(account.regt_buying_power),
                "daytrading_buying_power": float(account.daytrading_buying_power),
                "cash": float(account.cash),
                "portfolio_value": float(account.portfolio_value),
                "equity": float(account.equity),
                "last_equity": float(account.last_equity),
                "multiplier": int(account.multiplier),
                "day_trade_count": int(account.day_trade_count),
                "daytrade_count": int(account.daytrade_count),
                "created_at": account.created_at,
            }
        except APIError as e:
            logger.error(f"Error getting account: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_positions(self) -> List[Dict[str, Any]]:
        """
        Get all open positions.

        Returns:
            List of position dictionaries
        """
        try:
            positions = self.trading_client.get_all_positions()
            return [
                {
                    "asset_id": pos.asset_id,
                    "symbol": pos.symbol,
                    "asset_class": pos.asset_class,
                    "qty": float(pos.qty),
                    "side": pos.side,
                    "market_value": float(pos.market_value),
                    "cost_basis": float(pos.cost_basis),
                    "unrealized_pl": float(pos.unrealized_pl),
                    "unrealized_plpc": float(pos.unrealized_plpc),
                    "current_price": float(pos.current_price),
                    "lastday_price": float(pos.lastday_price),
                    "change_today": float(pos.change_today),
                }
                for pos in positions
            ]
        except APIError as e:
            logger.error(f"Error getting positions: {e}")
            raise

    async def place_market_order(
        self, symbol: str, side: str, qty: float, time_in_force: str = "day"
    ) -> Dict[str, Any]:
        """
        Place a market order.

        Args:
            symbol: Stock symbol
            side: 'buy' or 'sell'
            qty: Quantity to trade
            time_in_force: Order time in force

        Returns:
            Order details dictionary
        """
        try:
            order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
            tif = TimeInForce.DAY if time_in_force.lower() == "day" else TimeInForce.GTC

            market_order_data = MarketOrderRequest(
                symbol=symbol, qty=qty, side=order_side, time_in_force=tif
            )

            order = self.trading_client.submit_order(order_data=market_order_data)

            return {
                "id": order.id,
                "client_order_id": order.client_order_id,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "submitted_at": order.submitted_at,
                "symbol": order.symbol,
                "asset_class": order.asset_class,
                "qty": float(order.qty),
                "filled_qty": float(order.filled_qty or 0),
                "type": order.order_type,
                "side": order.side,
                "time_in_force": order.time_in_force,
                "status": order.status,
            }

        except APIError as e:
            logger.error(f"Error placing market order: {e}")
            raise

    async def place_limit_order(
        self,
        symbol: str,
        side: str,
        qty: float,
        limit_price: float,
        time_in_force: str = "day",
    ) -> Dict[str, Any]:
        """
        Place a limit order.

        Args:
            symbol: Stock symbol
            side: 'buy' or 'sell'
            qty: Quantity to trade
            limit_price: Limit price
            time_in_force: Order time in force

        Returns:
            Order details dictionary
        """
        try:
            order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
            tif = TimeInForce.DAY if time_in_force.lower() == "day" else TimeInForce.GTC

            limit_order_data = LimitOrderRequest(
                symbol=symbol,
                qty=qty,
                side=order_side,
                time_in_force=tif,
                limit_price=limit_price,
            )

            order = self.trading_client.submit_order(order_data=limit_order_data)

            return {
                "id": order.id,
                "client_order_id": order.client_order_id,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "submitted_at": order.submitted_at,
                "symbol": order.symbol,
                "asset_class": order.asset_class,
                "qty": float(order.qty),
                "filled_qty": float(order.filled_qty or 0),
                "type": order.order_type,
                "side": order.side,
                "time_in_force": order.time_in_force,
                "limit_price": float(order.limit_price),
                "status": order.status,
            }

        except APIError as e:
            logger.error(f"Error placing limit order: {e}")
            raise

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "1Min",
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 1000,
    ) -> pd.DataFrame:
        """
        Get historical stock data.

        Args:
            symbol: Stock symbol
            timeframe: Data timeframe ('1Min', '5Min', '15Min', '1Hour', '1Day')
            start: Start datetime
            end: End datetime
            limit: Maximum number of bars

        Returns:
            DataFrame with OHLCV data
        """
        try:
            # Map timeframe strings to TimeFrame enum
            timeframe_map = {
                "1Min": TimeFrame.Minute,
                "5Min": TimeFrame(5, "Min"),
                "15Min": TimeFrame(15, "Min"),
                "1Hour": TimeFrame.Hour,
                "1Day": TimeFrame.Day,
            }

            tf = timeframe_map.get(timeframe, TimeFrame.Minute)

            if not start:
                start = datetime.now() - timedelta(days=30)
            if not end:
                end = datetime.now()

            request_params = StockBarsRequest(
                symbol_or_symbols=symbol,
                timeframe=tf,
                start=start,
                end=end,
                limit=limit,
            )

            bars = self.data_client.get_stock_bars(request_params)

            # Convert to DataFrame
            data = []
            for bar in bars[symbol]:
                data.append(
                    {
                        "timestamp": bar.timestamp,
                        "open": float(bar.open),
                        "high": float(bar.high),
                        "low": float(bar.low),
                        "close": float(bar.close),
                        "volume": int(bar.volume),
                        "trade_count": int(bar.trade_count),
                        "vwap": float(bar.vwap),
                    }
                )

            df = pd.DataFrame(data)
            if not df.empty:
                df.set_index("timestamp", inplace=True)
                df.sort_index(inplace=True)

            return df

        except APIError as e:
            logger.error(f"Error getting historical data: {e}")
            raise

    async def cancel_order(self, order_id: str) -> bool:
        """
        Cancel an order.

        Args:
            order_id: Order ID to cancel

        Returns:
            True if successful
        """
        try:
            self.trading_client.cancel_order_by_id(order_id)
            return True
        except APIError as e:
            logger.error(f"Error canceling order {order_id}: {e}")
            return False

    async def get_orders(self, status: str = "open") -> List[Dict[str, Any]]:
        """
        Get orders by status.

        Args:
            status: Order status ('open', 'closed', 'all')

        Returns:
            List of order dictionaries
        """
        try:
            from alpaca.trading.enums import QueryOrderStatus

            status_map = {
                "open": QueryOrderStatus.OPEN,
                "closed": QueryOrderStatus.CLOSED,
                "all": QueryOrderStatus.ALL,
            }

            orders = self.trading_client.get_orders(
                filter={"status": status_map.get(status, QueryOrderStatus.OPEN)}
            )

            return [
                {
                    "id": order.id,
                    "client_order_id": order.client_order_id,
                    "created_at": order.created_at,
                    "updated_at": order.updated_at,
                    "symbol": order.symbol,
                    "qty": float(order.qty),
                    "filled_qty": float(order.filled_qty or 0),
                    "type": order.order_type,
                    "side": order.side,
                    "time_in_force": order.time_in_force,
                    "limit_price": (
                        float(order.limit_price) if order.limit_price else None
                    ),
                    "stop_price": float(order.stop_price) if order.stop_price else None,
                    "status": order.status,
                }
                for order in orders
            ]

        except APIError as e:
            logger.error(f"Error getting orders: {e}")
            raise

    async def is_market_open(self) -> bool:
        """
        Check if market is currently open.

        Returns:
            True if market is open
        """
        try:
            clock = self.trading_client.get_clock()
            return clock.is_open
        except APIError as e:
            logger.error(f"Error checking market status: {e}")
            return False

    async def get_market_hours(self) -> Dict[str, Any]:
        """
        Get market hours information.

        Returns:
            Market hours dictionary
        """
        try:
            clock = self.trading_client.get_clock()
            return {
                "timestamp": clock.timestamp,
                "is_open": clock.is_open,
                "next_open": clock.next_open,
                "next_close": clock.next_close,
            }
        except APIError as e:
            logger.error(f"Error getting market hours: {e}")
            raise
