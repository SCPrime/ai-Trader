"""
Mock Alpaca API client for testing without external dependencies.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from unittest.mock import Mock, AsyncMock

logger = logging.getLogger(__name__)


class MockAlpacaClient:
    """
    Mock Alpaca client that simulates API responses for testing.
    """

    def __init__(self, api_key: str = "mock_key", secret_key: str = "mock_secret", paper: bool = True):
        """Initialize mock client."""
        self.api_key = api_key
        self.secret_key = secret_key
        self.paper = paper

        # Mock state
        self.mock_account = self._create_mock_account()
        self.mock_positions = []
        self.mock_orders = []
        self.mock_historical_data = {}
        self.market_open = True

        # Call tracking
        self.call_log = []

    def _create_mock_account(self) -> Dict[str, Any]:
        """Create mock account data."""
        return {
            'id': 'mock_account_id',
            'account_number': '123456789',
            'status': 'ACTIVE',
            'currency': 'USD',
            'buying_power': 25000.0,
            'regt_buying_power': 25000.0,
            'daytrading_buying_power': 100000.0,
            'cash': 10000.0,
            'portfolio_value': 25000.0,
            'equity': 25000.0,
            'last_equity': 24800.0,
            'multiplier': 4,
            'day_trade_count': 0,
            'daytrade_count': 0,
            'created_at': datetime.now()
        }

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        pass

    async def get_account(self) -> Dict[str, Any]:
        """Mock get account."""
        self.call_log.append(('get_account', {}))
        await asyncio.sleep(0.01)  # Simulate network delay
        return self.mock_account.copy()

    async def get_positions(self) -> List[Dict[str, Any]]:
        """Mock get positions."""
        self.call_log.append(('get_positions', {}))
        await asyncio.sleep(0.01)
        return [pos.copy() for pos in self.mock_positions]

    async def place_market_order(
        self,
        symbol: str,
        side: str,
        qty: float,
        time_in_force: str = "day"
    ) -> Dict[str, Any]:
        """Mock place market order."""
        self.call_log.append(('place_market_order', {
            'symbol': symbol, 'side': side, 'qty': qty, 'time_in_force': time_in_force
        }))

        # Simulate order execution
        order_id = f"mock_order_{len(self.mock_orders) + 1}"
        current_price = self._get_mock_price(symbol)

        order = {
            'id': order_id,
            'client_order_id': f"client_{order_id}",
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'submitted_at': datetime.now(),
            'symbol': symbol,
            'asset_class': 'us_equity',
            'qty': float(qty),
            'filled_qty': float(qty),
            'type': 'market',
            'side': side,
            'time_in_force': time_in_force,
            'status': 'filled'
        }

        self.mock_orders.append(order)

        # Update positions
        self._update_position_after_trade(symbol, side, qty, current_price)

        # Update account cash
        trade_value = qty * current_price
        if side.lower() == 'buy':
            self.mock_account['cash'] -= trade_value
        else:
            self.mock_account['cash'] += trade_value

        await asyncio.sleep(0.01)  # Simulate network delay
        return order

    async def place_limit_order(
        self,
        symbol: str,
        side: str,
        qty: float,
        limit_price: float,
        time_in_force: str = "day"
    ) -> Dict[str, Any]:
        """Mock place limit order."""
        self.call_log.append(('place_limit_order', {
            'symbol': symbol, 'side': side, 'qty': qty,
            'limit_price': limit_price, 'time_in_force': time_in_force
        }))

        order_id = f"mock_limit_order_{len(self.mock_orders) + 1}"

        order = {
            'id': order_id,
            'client_order_id': f"client_{order_id}",
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'submitted_at': datetime.now(),
            'symbol': symbol,
            'asset_class': 'us_equity',
            'qty': float(qty),
            'filled_qty': 0.0,  # Limit orders may not fill immediately
            'type': 'limit',
            'side': side,
            'time_in_force': time_in_force,
            'limit_price': float(limit_price),
            'status': 'accepted'
        }

        self.mock_orders.append(order)

        await asyncio.sleep(0.01)
        return order

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "1Min",
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 1000
    ) -> pd.DataFrame:
        """Mock get historical data."""
        self.call_log.append(('get_historical_data', {
            'symbol': symbol, 'timeframe': timeframe, 'start': start, 'end': end, 'limit': limit
        }))

        await asyncio.sleep(0.01)

        # Generate or return cached mock data
        cache_key = f"{symbol}_{timeframe}"
        if cache_key not in self.mock_historical_data:
            self.mock_historical_data[cache_key] = self._generate_mock_historical_data(
                symbol, timeframe, start, end, limit
            )

        return self.mock_historical_data[cache_key].copy()

    async def cancel_order(self, order_id: str) -> bool:
        """Mock cancel order."""
        self.call_log.append(('cancel_order', {'order_id': order_id}))

        # Find and update order status
        for order in self.mock_orders:
            if order['id'] == order_id:
                order['status'] = 'canceled'
                await asyncio.sleep(0.01)
                return True

        return False

    async def get_orders(self, status: str = "open") -> List[Dict[str, Any]]:
        """Mock get orders."""
        self.call_log.append(('get_orders', {'status': status}))

        if status == "open":
            filtered_orders = [o for o in self.mock_orders if o['status'] in ['accepted', 'pending_new']]
        elif status == "closed":
            filtered_orders = [o for o in self.mock_orders if o['status'] in ['filled', 'canceled']]
        else:  # all
            filtered_orders = self.mock_orders

        await asyncio.sleep(0.01)
        return [order.copy() for order in filtered_orders]

    async def is_market_open(self) -> bool:
        """Mock market open check."""
        self.call_log.append(('is_market_open', {}))
        await asyncio.sleep(0.01)
        return self.market_open

    async def get_market_hours(self) -> Dict[str, Any]:
        """Mock get market hours."""
        self.call_log.append(('get_market_hours', {}))

        now = datetime.now()
        await asyncio.sleep(0.01)

        return {
            'timestamp': now,
            'is_open': self.market_open,
            'next_open': now + timedelta(hours=1) if not self.market_open else now,
            'next_close': now + timedelta(hours=6.5) if self.market_open else now + timedelta(hours=7.5)
        }

    def _get_mock_price(self, symbol: str) -> float:
        """Get mock current price for symbol."""
        # Simple mock pricing
        base_prices = {
            'AAPL': 150.0,
            'TSLA': 200.0,
            'MSFT': 300.0,
            'GOOGL': 2500.0,
            'SPY': 400.0,
            'QQQ': 350.0
        }

        base_price = base_prices.get(symbol, 100.0)
        # Add some random variation
        variation = np.random.normal(0, 0.01)  # 1% volatility
        return base_price * (1 + variation)

    def _update_position_after_trade(self, symbol: str, side: str, qty: float, price: float):
        """Update position after trade execution."""
        # Find existing position
        existing_position = None
        for i, pos in enumerate(self.mock_positions):
            if pos['symbol'] == symbol:
                existing_position = i
                break

        if existing_position is not None:
            pos = self.mock_positions[existing_position]
            current_qty = float(pos['qty'])

            if side.lower() == 'buy':
                new_qty = current_qty + qty
                new_cost_basis = ((current_qty * float(pos['cost_basis']) / current_qty) + (qty * price)) / new_qty if new_qty != 0 else 0
            else:  # sell
                new_qty = current_qty - qty
                new_cost_basis = float(pos['cost_basis']) / current_qty if current_qty != 0 else 0

            if abs(new_qty) < 0.001:  # Position closed
                self.mock_positions.pop(existing_position)
            else:
                pos['qty'] = new_qty
                pos['cost_basis'] = new_cost_basis * new_qty
                pos['market_value'] = new_qty * price
                pos['current_price'] = price
                pos['unrealized_pl'] = (price - new_cost_basis) * new_qty

        else:
            # Create new position
            if side.lower() == 'buy':
                new_position = {
                    'asset_id': f"mock_asset_{symbol}",
                    'symbol': symbol,
                    'asset_class': 'us_equity',
                    'qty': float(qty),
                    'side': 'long',
                    'market_value': qty * price,
                    'cost_basis': qty * price,
                    'unrealized_pl': 0.0,
                    'unrealized_plpc': 0.0,
                    'current_price': price,
                    'lastday_price': price * 0.99,  # Mock previous price
                    'change_today': price * 0.01
                }
                self.mock_positions.append(new_position)

    def _generate_mock_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start: Optional[datetime],
        end: Optional[datetime],
        limit: int
    ) -> pd.DataFrame:
        """Generate mock historical data."""
        # Determine number of periods
        if start and end:
            if timeframe == "1Min":
                periods = int((end - start).total_seconds() / 60)
            elif timeframe == "5Min":
                periods = int((end - start).total_seconds() / 300)
            elif timeframe == "15Min":
                periods = int((end - start).total_seconds() / 900)
            elif timeframe == "1Hour":
                periods = int((end - start).total_seconds() / 3600)
            elif timeframe == "1Day":
                periods = (end - start).days
            else:
                periods = 100

            periods = min(periods, limit)
            start_date = start
        else:
            periods = min(limit, 100)
            start_date = datetime.now() - timedelta(days=periods if timeframe == "1Day" else 1)

        # Generate time index
        if timeframe == "1Min":
            freq = '1min'
        elif timeframe == "5Min":
            freq = '5min'
        elif timeframe == "15Min":
            freq = '15min'
        elif timeframe == "1Hour":
            freq = '1H'
        elif timeframe == "1Day":
            freq = '1D'
        else:
            freq = '1min'

        dates = pd.date_range(start=start_date, periods=periods, freq=freq)

        # Generate realistic price data
        base_price = self._get_mock_price(symbol)
        np.random.seed(hash(symbol) % 1000)  # Consistent randomness per symbol

        # Generate returns
        volatility = 0.02 if timeframe == "1Day" else 0.005
        returns = np.random.normal(0, volatility, periods)

        # Generate prices
        prices = [base_price]
        for i in range(1, periods):
            prices.append(prices[-1] * (1 + returns[i]))

        # Create OHLCV data
        data = pd.DataFrame({
            'timestamp': dates,
            'open': prices,
            'close': prices,
            'high': [p * (1 + abs(np.random.normal(0, 0.002))) for p in prices],
            'low': [p * (1 - abs(np.random.normal(0, 0.002))) for p in prices],
            'volume': np.random.randint(1000, 100000, periods),
            'trade_count': np.random.randint(10, 1000, periods),
            'vwap': prices
        })

        data.set_index('timestamp', inplace=True)
        return data

    # Mock configuration methods
    def set_market_open(self, is_open: bool):
        """Set mock market open status."""
        self.market_open = is_open

    def set_account_balance(self, cash: float, portfolio_value: float):
        """Set mock account balance."""
        self.mock_account['cash'] = cash
        self.mock_account['portfolio_value'] = portfolio_value
        self.mock_account['equity'] = portfolio_value

    def add_mock_position(self, symbol: str, qty: float, current_price: float, cost_basis: float):
        """Add mock position."""
        position = {
            'asset_id': f"mock_asset_{symbol}",
            'symbol': symbol,
            'asset_class': 'us_equity',
            'qty': float(qty),
            'side': 'long' if qty > 0 else 'short',
            'market_value': qty * current_price,
            'cost_basis': cost_basis,
            'unrealized_pl': (current_price - cost_basis / qty) * qty if qty != 0 else 0,
            'unrealized_plpc': ((current_price - cost_basis / qty) / (cost_basis / qty)) if qty != 0 and cost_basis != 0 else 0,
            'current_price': current_price,
            'lastday_price': current_price * 0.99,
            'change_today': current_price * 0.01
        }
        self.mock_positions.append(position)

    def simulate_order_fill(self, order_id: str, fill_price: Optional[float] = None):
        """Simulate order fill."""
        for order in self.mock_orders:
            if order['id'] == order_id and order['status'] == 'accepted':
                order['status'] = 'filled'
                order['filled_qty'] = order['qty']

                # Update position
                symbol = order['symbol']
                side = order['side']
                qty = order['qty']
                price = fill_price or order.get('limit_price', self._get_mock_price(symbol))

                self._update_position_after_trade(symbol, side, qty, price)
                break

    def get_call_log(self) -> List[tuple]:
        """Get log of all API calls made."""
        return self.call_log.copy()

    def clear_call_log(self):
        """Clear the call log."""
        self.call_log.clear()

    def reset_mock_state(self):
        """Reset all mock state."""
        self.mock_account = self._create_mock_account()
        self.mock_positions.clear()
        self.mock_orders.clear()
        self.mock_historical_data.clear()
        self.call_log.clear()
        self.market_open = True


# Mock WebSocket manager for testing
class MockWebSocketManager:
    """Mock WebSocket manager for testing real-time data."""

    def __init__(self, api_key: str, secret_key: str, paper: bool = True):
        """Initialize mock WebSocket manager."""
        self.api_key = api_key
        self.secret_key = secret_key
        self.paper = paper
        self.connected = False
        self.subscribed_symbols = {}
        self.handlers = {}
        self.message_count = 0

    async def connect(self) -> bool:
        """Mock connect."""
        await asyncio.sleep(0.01)
        self.connected = True
        return True

    async def disconnect(self):
        """Mock disconnect."""
        self.connected = False

    async def subscribe(self, stream_type, symbols: List[str]):
        """Mock subscribe."""
        if stream_type not in self.subscribed_symbols:
            self.subscribed_symbols[stream_type] = []
        self.subscribed_symbols[stream_type].extend(symbols)

    def add_handler(self, stream_type, handler):
        """Mock add handler."""
        if stream_type not in self.handlers:
            self.handlers[stream_type] = []
        self.handlers[stream_type].append(handler)

    async def simulate_trade_message(self, symbol: str, price: float, size: int):
        """Simulate trade message."""
        from src.core.websocket_manager import Trade
        from datetime import datetime

        trade = Trade(
            symbol=symbol,
            timestamp=datetime.now(),
            price=price,
            size=size,
            conditions=[],
            trade_id=f"mock_trade_{self.message_count}"
        )

        self.message_count += 1

        # Call handlers
        if 'trades' in self.handlers:
            for handler in self.handlers['trades']:
                if asyncio.iscoroutinefunction(handler):
                    await handler(trade)
                else:
                    handler(trade)

    async def simulate_quote_message(self, symbol: str, bid_price: float, ask_price: float):
        """Simulate quote message."""
        from src.core.websocket_manager import Quote
        from datetime import datetime

        quote = Quote(
            symbol=symbol,
            timestamp=datetime.now(),
            bid_price=bid_price,
            bid_size=100,
            ask_price=ask_price,
            ask_size=100,
            spread=ask_price - bid_price
        )

        # Call handlers
        if 'quotes' in self.handlers:
            for handler in self.handlers['quotes']:
                if asyncio.iscoroutinefunction(handler):
                    await handler(quote)
                else:
                    handler(quote)

    async def health_check(self) -> Dict[str, Any]:
        """Mock health check."""
        return {
            'connected': self.connected,
            'subscribed_symbols': len(sum(self.subscribed_symbols.values(), [])),
            'message_count': self.message_count,
            'healthy': self.connected
        }