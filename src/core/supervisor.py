"""
Trading Supervisor Module - Human oversight and control system.
Manages AI trading recommendations and manual intervention capabilities.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


class SupervisorMode(Enum):
    """Trading supervision modes."""
    MANUAL = "manual"  # All trades require manual approval
    SUGGEST = "suggest"  # AI suggests, human approves
    AUTO = "auto"  # AI trades automatically


class TradeAction(Enum):
    """Trade action types."""
    BUY = "buy"
    SELL = "sell"


@dataclass
class PendingTrade:
    """Represents a trade pending supervisor approval."""
    id: str
    symbol: str
    action: TradeAction
    quantity: int
    price: float
    strategy: str
    ai_confidence: float
    reasoning: str
    timestamp: datetime
    expires_at: datetime


class TradingSupervisor:
    """
    Trading supervisor that manages AI recommendations and human oversight.
    """

    def __init__(self):
        self.mode = SupervisorMode.SUGGEST
        self.pending_trades: Dict[str, PendingTrade] = {}
        self.approved_trades: List[str] = []
        self.rejected_trades: List[str] = []
        self.emergency_stop = False

    async def set_mode(self, mode: SupervisorMode):
        """Set the supervisor mode."""
        logger.info(f"Supervisor mode changed from {self.mode.value} to {mode.value}")
        self.mode = mode

        # In auto mode, approve all pending trades
        if mode == SupervisorMode.AUTO:
            for trade_id in list(self.pending_trades.keys()):
                await self.approve_trade(trade_id, auto_approved=True)

    async def submit_trade_recommendation(
        self,
        symbol: str,
        action: TradeAction,
        quantity: int,
        price: float,
        strategy: str,
        ai_confidence: float,
        reasoning: str
    ) -> Optional[str]:
        """
        Submit a trade recommendation from AI for supervisor review.

        Returns:
            Trade ID if submitted for approval, None if auto-executed
        """
        if self.emergency_stop:
            logger.warning(f"Trade recommendation rejected - Emergency stop active")
            return None

        trade_id = f"{symbol}_{action.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # In AUTO mode, execute immediately
        if self.mode == SupervisorMode.AUTO:
            logger.info(f"Auto-executing trade: {symbol} {action.value} {quantity}")
            await self._execute_trade(trade_id, symbol, action, quantity, price)
            return None

        # In MANUAL or SUGGEST mode, queue for approval
        pending_trade = PendingTrade(
            id=trade_id,
            symbol=symbol,
            action=action,
            quantity=quantity,
            price=price,
            strategy=strategy,
            ai_confidence=ai_confidence,
            reasoning=reasoning,
            timestamp=datetime.now(),
            expires_at=datetime.now() + timedelta(minutes=30)  # Expire after 30 minutes
        )

        self.pending_trades[trade_id] = pending_trade
        logger.info(f"Trade recommendation queued for approval: {trade_id}")

        return trade_id

    async def approve_trade(self, trade_id: str, auto_approved: bool = False) -> bool:
        """Approve a pending trade recommendation."""
        if trade_id not in self.pending_trades:
            logger.warning(f"Trade {trade_id} not found in pending trades")
            return False

        trade = self.pending_trades[trade_id]

        # Check if trade has expired
        if datetime.now() > trade.expires_at and not auto_approved:
            logger.warning(f"Trade {trade_id} has expired")
            del self.pending_trades[trade_id]
            return False

        # Execute the trade
        await self._execute_trade(
            trade_id, trade.symbol, trade.action, trade.quantity, trade.price
        )

        # Move to approved list
        self.approved_trades.append(trade_id)
        del self.pending_trades[trade_id]

        approval_type = "auto-approved" if auto_approved else "manually approved"
        logger.info(f"Trade {trade_id} {approval_type}")

        return True

    async def reject_trade(self, trade_id: str, reason: str = "") -> bool:
        """Reject a pending trade recommendation."""
        if trade_id not in self.pending_trades:
            logger.warning(f"Trade {trade_id} not found in pending trades")
            return False

        trade = self.pending_trades[trade_id]

        # Move to rejected list
        self.rejected_trades.append(trade_id)
        del self.pending_trades[trade_id]

        logger.info(f"Trade {trade_id} rejected: {reason}")

        return True

    async def emergency_stop_all(self):
        """Activate emergency stop - halt all trading."""
        self.emergency_stop = True

        # Reject all pending trades
        for trade_id in list(self.pending_trades.keys()):
            await self.reject_trade(trade_id, "Emergency stop activated")

        logger.critical("EMERGENCY STOP ACTIVATED - All trading halted")

    async def reset_emergency_stop(self):
        """Reset emergency stop."""
        self.emergency_stop = False
        logger.info("Emergency stop reset - Trading can resume")

    async def _execute_trade(
        self,
        trade_id: str,
        symbol: str,
        action: TradeAction,
        quantity: int,
        price: float
    ):
        """Execute an approved trade."""
        # This would integrate with your trading client
        # For now, just log the execution
        logger.info(f"EXECUTING TRADE: {trade_id} - {action.value.upper()} {quantity} {symbol} @ ${price:.2f}")

        # TODO: Integrate with actual trading client
        # await self.trading_client.place_order(symbol, action, quantity, price)

    async def cleanup_expired_trades(self):
        """Remove expired trades from pending list."""
        current_time = datetime.now()
        expired_trades = [
            trade_id for trade_id, trade in self.pending_trades.items()
            if current_time > trade.expires_at
        ]

        for trade_id in expired_trades:
            logger.info(f"Removing expired trade: {trade_id}")
            del self.pending_trades[trade_id]

    def get_status(self) -> Dict[str, Any]:
        """Get current supervisor status."""
        return {
            "mode": self.mode.value,
            "emergency_stop": self.emergency_stop,
            "pending_trades": len(self.pending_trades),
            "pending_list": [
                {
                    "id": trade.id,
                    "symbol": trade.symbol,
                    "action": trade.action.value,
                    "quantity": trade.quantity,
                    "price": trade.price,
                    "strategy": trade.strategy,
                    "ai_confidence": trade.ai_confidence,
                    "reasoning": trade.reasoning,
                    "timestamp": trade.timestamp.isoformat(),
                    "expires_at": trade.expires_at.isoformat()
                }
                for trade in self.pending_trades.values()
            ],
            "approved_count": len(self.approved_trades),
            "rejected_count": len(self.rejected_trades)
        }


# Global supervisor instance
supervisor = TradingSupervisor()