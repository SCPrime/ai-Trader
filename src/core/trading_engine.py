"""
Trading Engine Module - Executes approved trades via Alpaca API.
Handles order placement, position management, and trade execution.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from .alpaca_client import AlpacaClient
import os

logger = logging.getLogger(__name__)


class TradingEngine:
    """
    Trading engine responsible for executing approved trades.
    """

    def __init__(self):
        self.alpaca_client: Optional[AlpacaClient] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Alpaca client."""
        try:
            # Use environment variables directly
            self.alpaca_client = AlpacaClient(
                os.getenv('ALPACA_PAPER_API_KEY', ''),
                os.getenv('ALPACA_PAPER_SECRET_KEY', ''),
                os.getenv('ALPACA_PAPER_TRADING', 'true').lower() == 'true'
            )
            logger.info("Alpaca client initialized with environment variables")
        except Exception as e:
            logger.error(f"Failed to initialize Alpaca client: {e}")
            self.alpaca_client = None

    async def execute_trade(
        self,
        trade_id: str,
        symbol: str,
        action: str,
        quantity: int,
        price: float,
        strategy: str = "unknown",
        ai_confidence: float = 0.0
    ) -> Dict[str, Any]:
        """
        Execute a trade through Alpaca API.

        Args:
            trade_id: Unique identifier for the trade
            symbol: Stock symbol (e.g., 'AAPL')
            action: 'buy' or 'sell'
            quantity: Number of shares
            price: Expected price (for reference, market order will be used)
            strategy: Strategy name that generated the trade
            ai_confidence: AI confidence level (0-100)

        Returns:
            Dict containing execution result
        """
        if not self.alpaca_client:
            logger.error("Alpaca client not initialized")
            return {
                "success": False,
                "error": "Trading client not available",
                "trade_id": trade_id
            }

        try:
            logger.info(f"Executing trade {trade_id}: {action} {quantity} shares of {symbol}")

            async with self.alpaca_client:
                # Check market hours
                is_open = await self.alpaca_client.is_market_open()
                if not is_open:
                    logger.warning(f"Market is closed, queuing trade {trade_id}")
                    # In a real implementation, you might want to queue the trade
                    # For now, we'll proceed but note this in the response

                # Place market order
                order = await self.alpaca_client.place_market_order(
                    symbol=symbol,
                    side=action.lower(),
                    qty=quantity
                )

                logger.info(f"Trade {trade_id} executed successfully: Order ID {order['id']}")

                return {
                    "success": True,
                    "order_id": order["id"],
                    "trade_id": trade_id,
                    "symbol": symbol,
                    "action": action,
                    "quantity": quantity,
                    "expected_price": price,
                    "strategy": strategy,
                    "ai_confidence": ai_confidence,
                    "timestamp": datetime.now().isoformat(),
                    "market_open": is_open
                }

        except Exception as e:
            logger.error(f"Failed to execute trade {trade_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "trade_id": trade_id,
                "symbol": symbol,
                "action": action,
                "quantity": quantity
            }

    async def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Get current account information."""
        if not self.alpaca_client:
            return None

        try:
            async with self.alpaca_client:
                return await self.alpaca_client.get_account()
        except Exception as e:
            logger.error(f"Failed to get account info: {e}")
            return None

    async def get_positions(self) -> Optional[list]:
        """Get current positions."""
        if not self.alpaca_client:
            return None

        try:
            async with self.alpaca_client:
                return await self.alpaca_client.get_positions()
        except Exception as e:
            logger.error(f"Failed to get positions: {e}")
            return None

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending order."""
        if not self.alpaca_client:
            return False

        try:
            async with self.alpaca_client:
                await self.alpaca_client.cancel_order(order_id)
                logger.info(f"Order {order_id} cancelled successfully")
                return True
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id}: {e}")
            return False

    def is_available(self) -> bool:
        """Check if the trading engine is available."""
        return self.alpaca_client is not None