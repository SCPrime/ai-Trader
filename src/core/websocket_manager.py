"""
WebSocket streaming manager for real-time market data.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential
import pandas as pd

logger = logging.getLogger(__name__)


class StreamType(Enum):
    """WebSocket stream types."""

    TRADES = "trades"
    QUOTES = "quotes"
    BARS = "bars"
    STATUS = "status"


@dataclass
class MarketData:
    """Market data structure."""

    symbol: str
    timestamp: datetime
    price: float
    volume: int
    data_type: StreamType
    raw_data: Dict[str, Any]


@dataclass
class Quote:
    """Quote data structure."""

    symbol: str
    timestamp: datetime
    bid_price: float
    bid_size: int
    ask_price: float
    ask_size: int
    spread: float


@dataclass
class Trade:
    """Trade data structure."""

    symbol: str
    timestamp: datetime
    price: float
    size: int
    conditions: List[str]
    trade_id: str


@dataclass
class Bar:
    """Bar data structure."""

    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float
    trade_count: int


class WebSocketManager:
    """
    Real-time WebSocket streaming manager for market data.
    """

    def __init__(self, api_key: str, secret_key: str, paper: bool = True):
        """
        Initialize WebSocket manager.

        Args:
            api_key: Alpaca API key
            secret_key: Alpaca secret key
            paper: Use paper trading environment
        """
        self.api_key = api_key
        self.secret_key = secret_key
        self.paper = paper

        # WebSocket configuration
        self.base_url = (
            "wss://stream.data.alpaca.markets/v2"
            if not paper
            else "wss://stream.data.alpaca.markets/v2"
        )
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None

        # Connection management
        self.connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 5

        # Subscriptions
        self.subscribed_symbols: Dict[StreamType, List[str]] = {
            StreamType.TRADES: [],
            StreamType.QUOTES: [],
            StreamType.BARS: [],
        }

        # Event handlers
        self.handlers: Dict[StreamType, List[Callable]] = {
            StreamType.TRADES: [],
            StreamType.QUOTES: [],
            StreamType.BARS: [],
            StreamType.STATUS: [],
        }

        # Data buffering
        self.data_buffer: Dict[str, List[MarketData]] = {}
        self.buffer_size = 1000
        self.last_heartbeat = None

        # Statistics
        self.stats = {
            "messages_received": 0,
            "trades_processed": 0,
            "quotes_processed": 0,
            "bars_processed": 0,
            "errors": 0,
            "reconnections": 0,
            "uptime_start": None,
        }

    async def connect(self) -> bool:
        """
        Establish WebSocket connection.

        Returns:
            True if connection successful
        """
        try:
            logger.info("Connecting to Alpaca WebSocket stream...")

            # Create WebSocket connection
            self.websocket = await websockets.connect(
                self.base_url, ping_interval=20, ping_timeout=10, close_timeout=10
            )

            # Send authentication message
            auth_message = {
                "action": "auth",
                "key": self.api_key,
                "secret": self.secret_key,
            }

            await self.websocket.send(json.dumps(auth_message))

            # Wait for authentication response
            response = await asyncio.wait_for(self.websocket.recv(), timeout=10)
            auth_response = json.loads(response)

            if auth_response.get("T") == "success":
                self.connected = True
                self.reconnect_attempts = 0
                self.stats["uptime_start"] = datetime.now()
                logger.info("WebSocket connection established and authenticated")
                return True
            else:
                logger.error(f"Authentication failed: {auth_response}")
                return False

        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from WebSocket."""
        try:
            self.connected = False
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def subscribe(self, stream_type: StreamType, symbols: List[str]):
        """
        Subscribe to market data streams.

        Args:
            stream_type: Type of stream to subscribe to
            symbols: List of symbols to subscribe to
        """
        if not self.connected:
            raise ConnectionError("WebSocket not connected")

        try:
            # Update subscription list
            current_symbols = set(self.subscribed_symbols[stream_type])
            new_symbols = set(symbols)

            # Only subscribe to new symbols
            symbols_to_add = list(new_symbols - current_symbols)
            if not symbols_to_add:
                logger.debug(f"Already subscribed to all {stream_type.value} symbols")
                return

            # Prepare subscription message
            subscription_message = {
                "action": "subscribe",
                stream_type.value: symbols_to_add,
            }

            await self.websocket.send(json.dumps(subscription_message))

            # Update local subscription list
            self.subscribed_symbols[stream_type].extend(symbols_to_add)

            logger.info(
                f"Subscribed to {stream_type.value} for symbols: {symbols_to_add}"
            )

        except Exception as e:
            logger.error(f"Failed to subscribe to {stream_type.value}: {e}")
            raise

    async def unsubscribe(self, stream_type: StreamType, symbols: List[str]):
        """
        Unsubscribe from market data streams.

        Args:
            stream_type: Type of stream to unsubscribe from
            symbols: List of symbols to unsubscribe from
        """
        if not self.connected:
            return

        try:
            # Prepare unsubscription message
            unsubscription_message = {
                "action": "unsubscribe",
                stream_type.value: symbols,
            }

            await self.websocket.send(json.dumps(unsubscription_message))

            # Update local subscription list
            for symbol in symbols:
                if symbol in self.subscribed_symbols[stream_type]:
                    self.subscribed_symbols[stream_type].remove(symbol)

            logger.info(f"Unsubscribed from {stream_type.value} for symbols: {symbols}")

        except Exception as e:
            logger.error(f"Failed to unsubscribe from {stream_type.value}: {e}")

    def add_handler(self, stream_type: StreamType, handler: Callable):
        """
        Add event handler for specific stream type.

        Args:
            stream_type: Type of stream
            handler: Callback function to handle data
        """
        self.handlers[stream_type].append(handler)
        logger.debug(f"Added handler for {stream_type.value}")

    def remove_handler(self, stream_type: StreamType, handler: Callable):
        """Remove event handler."""
        if handler in self.handlers[stream_type]:
            self.handlers[stream_type].remove(handler)
            logger.debug(f"Removed handler for {stream_type.value}")

    async def _process_message(self, message: Dict[str, Any]):
        """
        Process incoming WebSocket message.

        Args:
            message: Raw message from WebSocket
        """
        try:
            message_type = message.get("T")
            self.stats["messages_received"] += 1

            if message_type == "t":  # Trade
                await self._process_trade(message)
            elif message_type == "q":  # Quote
                await self._process_quote(message)
            elif message_type == "b":  # Bar
                await self._process_bar(message)
            elif message_type == "status":  # Status
                await self._process_status(message)
            elif message_type == "subscription":
                logger.info(f"Subscription confirmed: {message}")
            elif message_type == "error":
                logger.error(f"Stream error: {message}")
                self.stats["errors"] += 1
            else:
                logger.debug(f"Unknown message type: {message_type}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            self.stats["errors"] += 1

    async def _process_trade(self, message: Dict[str, Any]):
        """Process trade message."""
        try:
            trade = Trade(
                symbol=message["S"],
                timestamp=datetime.fromisoformat(message["t"].replace("Z", "+00:00")),
                price=float(message["p"]),
                size=int(message["s"]),
                conditions=message.get("c", []),
                trade_id=message.get("i", ""),
            )

            self.stats["trades_processed"] += 1

            # Call registered handlers
            for handler in self.handlers[StreamType.TRADES]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(trade)
                    else:
                        handler(trade)
                except Exception as e:
                    logger.error(f"Error in trade handler: {e}")

            # Add to buffer
            self._add_to_buffer(
                trade.symbol,
                MarketData(
                    symbol=trade.symbol,
                    timestamp=trade.timestamp,
                    price=trade.price,
                    volume=trade.size,
                    data_type=StreamType.TRADES,
                    raw_data=message,
                ),
            )

        except Exception as e:
            logger.error(f"Error processing trade: {e}")

    async def _process_quote(self, message: Dict[str, Any]):
        """Process quote message."""
        try:
            quote = Quote(
                symbol=message["S"],
                timestamp=datetime.fromisoformat(message["t"].replace("Z", "+00:00")),
                bid_price=float(message["bp"]),
                bid_size=int(message["bs"]),
                ask_price=float(message["ap"]),
                ask_size=int(message["as"]),
                spread=float(message["ap"]) - float(message["bp"]),
            )

            self.stats["quotes_processed"] += 1

            # Call registered handlers
            for handler in self.handlers[StreamType.QUOTES]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(quote)
                    else:
                        handler(quote)
                except Exception as e:
                    logger.error(f"Error in quote handler: {e}")

        except Exception as e:
            logger.error(f"Error processing quote: {e}")

    async def _process_bar(self, message: Dict[str, Any]):
        """Process bar message."""
        try:
            bar = Bar(
                symbol=message["S"],
                timestamp=datetime.fromisoformat(message["t"].replace("Z", "+00:00")),
                open=float(message["o"]),
                high=float(message["h"]),
                low=float(message["l"]),
                close=float(message["c"]),
                volume=int(message["v"]),
                vwap=float(message.get("vw", 0)),
                trade_count=int(message.get("n", 0)),
            )

            self.stats["bars_processed"] += 1

            # Call registered handlers
            for handler in self.handlers[StreamType.BARS]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(bar)
                    else:
                        handler(bar)
                except Exception as e:
                    logger.error(f"Error in bar handler: {e}")

            # Add to buffer
            self._add_to_buffer(
                bar.symbol,
                MarketData(
                    symbol=bar.symbol,
                    timestamp=bar.timestamp,
                    price=bar.close,
                    volume=bar.volume,
                    data_type=StreamType.BARS,
                    raw_data=message,
                ),
            )

        except Exception as e:
            logger.error(f"Error processing bar: {e}")

    async def _process_status(self, message: Dict[str, Any]):
        """Process status message."""
        try:
            # Call registered handlers
            for handler in self.handlers[StreamType.STATUS]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(message)
                    else:
                        handler(message)
                except Exception as e:
                    logger.error(f"Error in status handler: {e}")

            logger.info(f"Status update: {message}")

        except Exception as e:
            logger.error(f"Error processing status: {e}")

    def _add_to_buffer(self, symbol: str, data: MarketData):
        """Add data to buffer."""
        if symbol not in self.data_buffer:
            self.data_buffer[symbol] = []

        self.data_buffer[symbol].append(data)

        # Maintain buffer size
        if len(self.data_buffer[symbol]) > self.buffer_size:
            self.data_buffer[symbol] = self.data_buffer[symbol][-self.buffer_size :]

    def get_buffered_data(
        self, symbol: str, data_type: Optional[StreamType] = None
    ) -> List[MarketData]:
        """
        Get buffered data for a symbol.

        Args:
            symbol: Stock symbol
            data_type: Optional filter by data type

        Returns:
            List of buffered market data
        """
        if symbol not in self.data_buffer:
            return []

        data = self.data_buffer[symbol]

        if data_type:
            data = [d for d in data if d.data_type == data_type]

        return data

    def get_latest_price(self, symbol: str) -> Optional[float]:
        """Get latest price for a symbol."""
        data = self.get_buffered_data(symbol)
        if data:
            return data[-1].price
        return None

    async def start_streaming(self):
        """Start the WebSocket streaming loop."""
        while True:
            try:
                if not self.connected:
                    success = await self.connect()
                    if not success:
                        self.reconnect_attempts += 1
                        if self.reconnect_attempts >= self.max_reconnect_attempts:
                            logger.error("Max reconnection attempts reached")
                            break

                        await asyncio.sleep(self.reconnect_delay)
                        continue

                # Listen for messages
                async for message in self.websocket:
                    try:
                        data = json.loads(message)
                        self.last_heartbeat = datetime.now()
                        await self._process_message(data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode message: {e}")
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")

            except ConnectionClosed:
                logger.warning(
                    "WebSocket connection closed, attempting to reconnect..."
                )
                self.connected = False
                self.stats["reconnections"] += 1
                await asyncio.sleep(self.reconnect_delay)

            except WebSocketException as e:
                logger.error(f"WebSocket error: {e}")
                self.connected = False
                await asyncio.sleep(self.reconnect_delay)

            except Exception as e:
                logger.error(f"Unexpected error in streaming loop: {e}")
                await asyncio.sleep(self.reconnect_delay)

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check.

        Returns:
            Health status dictionary
        """
        now = datetime.now()

        # Calculate uptime
        uptime_seconds = 0
        if self.stats["uptime_start"]:
            uptime_seconds = (now - self.stats["uptime_start"]).total_seconds()

        # Check if receiving data
        last_message_age = None
        if self.last_heartbeat:
            last_message_age = (now - self.last_heartbeat).total_seconds()

        health_status = {
            "connected": self.connected,
            "uptime_seconds": uptime_seconds,
            "last_message_age_seconds": last_message_age,
            "subscribed_symbols": {
                stream_type.value: len(symbols)
                for stream_type, symbols in self.subscribed_symbols.items()
            },
            "statistics": self.stats.copy(),
            "buffer_sizes": {
                symbol: len(data) for symbol, data in self.data_buffer.items()
            },
            "healthy": self.connected
            and (last_message_age is None or last_message_age < 60),
        }

        return health_status

    def get_statistics(self) -> Dict[str, Any]:
        """Get streaming statistics."""
        now = datetime.now()
        uptime_seconds = 0
        if self.stats["uptime_start"]:
            uptime_seconds = (now - self.stats["uptime_start"]).total_seconds()

        return {
            **self.stats,
            "uptime_seconds": uptime_seconds,
            "connected": self.connected,
            "subscribed_symbols_count": sum(
                len(symbols) for symbols in self.subscribed_symbols.values()
            ),
            "buffered_symbols_count": len(self.data_buffer),
        }

    async def close(self):
        """Close WebSocket connection and cleanup."""
        await self.disconnect()
        self.data_buffer.clear()
        for stream_type in self.handlers:
            self.handlers[stream_type].clear()
        logger.info("WebSocket manager closed")


# Utility functions for data conversion
def trade_to_dataframe(trades: List[Trade]) -> pd.DataFrame:
    """Convert list of trades to pandas DataFrame."""
    if not trades:
        return pd.DataFrame()

    data = []
    for trade in trades:
        data.append(
            {
                "timestamp": trade.timestamp,
                "symbol": trade.symbol,
                "price": trade.price,
                "size": trade.size,
                "trade_id": trade.trade_id,
            }
        )

    df = pd.DataFrame(data)
    df.set_index("timestamp", inplace=True)
    return df


def quotes_to_dataframe(quotes: List[Quote]) -> pd.DataFrame:
    """Convert list of quotes to pandas DataFrame."""
    if not quotes:
        return pd.DataFrame()

    data = []
    for quote in quotes:
        data.append(
            {
                "timestamp": quote.timestamp,
                "symbol": quote.symbol,
                "bid_price": quote.bid_price,
                "bid_size": quote.bid_size,
                "ask_price": quote.ask_price,
                "ask_size": quote.ask_size,
                "spread": quote.spread,
            }
        )

    df = pd.DataFrame(data)
    df.set_index("timestamp", inplace=True)
    return df


def bars_to_dataframe(bars: List[Bar]) -> pd.DataFrame:
    """Convert list of bars to pandas DataFrame."""
    if not bars:
        return pd.DataFrame()

    data = []
    for bar in bars:
        data.append(
            {
                "timestamp": bar.timestamp,
                "symbol": bar.symbol,
                "open": bar.open,
                "high": bar.high,
                "low": bar.low,
                "close": bar.close,
                "volume": bar.volume,
                "vwap": bar.vwap,
                "trade_count": bar.trade_count,
            }
        )

    df = pd.DataFrame(data)
    df.set_index("timestamp", inplace=True)
    return df
