"""
Multi-channel notification manager for trading alerts and system events.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json
import aiohttp
from abc import ABC, abstractmethod

from .discord_notifier import DiscordNotifier
from .slack_notifier import SlackNotifier

logger = logging.getLogger(__name__)


class NotificationLevel(Enum):
    """Notification priority levels."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class NotificationType(Enum):
    """Types of notifications."""

    TRADE_EXECUTED = "trade_executed"
    SIGNAL_GENERATED = "signal_generated"
    RISK_ALERT = "risk_alert"
    SYSTEM_ERROR = "system_error"
    PERFORMANCE_UPDATE = "performance_update"
    MARKET_UPDATE = "market_update"
    SYSTEM_STATUS = "system_status"
    AI_ANALYSIS = "ai_analysis"


@dataclass
class NotificationMessage:
    """Notification message structure."""

    title: str
    message: str
    level: NotificationLevel
    notification_type: NotificationType
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    symbol: Optional[str] = None
    attachments: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class NotificationConfig:
    """Notification configuration."""

    discord_enabled: bool = False
    discord_webhook_url: Optional[str] = None
    slack_enabled: bool = False
    slack_token: Optional[str] = None
    slack_channel: Optional[str] = None
    min_level: NotificationLevel = NotificationLevel.INFO
    rate_limit_per_minute: int = 30
    batch_notifications: bool = True
    batch_interval_seconds: int = 60


class NotificationManager:
    """
    Central notification manager that coordinates multiple notification channels.
    """

    def __init__(self, config: NotificationConfig):
        """
        Initialize notification manager.

        Args:
            config: Notification configuration
        """
        self.config = config
        self.notifiers: Dict[str, Any] = {}
        self.message_queue: List[NotificationMessage] = []
        self.rate_limit_tracker: Dict[str, List[datetime]] = {}
        self.batch_task: Optional[asyncio.Task] = None
        self.running = False

        # Initialize notifiers
        self._initialize_notifiers()

    def _initialize_notifiers(self):
        """Initialize notification channels."""
        try:
            # Discord notifier
            if self.config.discord_enabled and self.config.discord_webhook_url:
                self.notifiers["discord"] = DiscordNotifier(
                    self.config.discord_webhook_url
                )
                logger.info("Discord notifier initialized")

            # Slack notifier
            if self.config.slack_enabled and self.config.slack_token:
                self.notifiers["slack"] = SlackNotifier(
                    self.config.slack_token, self.config.slack_channel
                )
                logger.info("Slack notifier initialized")

            if not self.notifiers:
                logger.warning("No notification channels configured")

        except Exception as e:
            logger.error(f"Error initializing notifiers: {e}")

    async def start(self):
        """Start the notification manager."""
        if self.running:
            return

        self.running = True

        # Start batch processing if enabled
        if self.config.batch_notifications:
            self.batch_task = asyncio.create_task(self._batch_processor())

        logger.info("Notification manager started")

    async def stop(self):
        """Stop the notification manager."""
        self.running = False

        if self.batch_task:
            self.batch_task.cancel()
            try:
                await self.batch_task
            except asyncio.CancelledError:
                pass

        # Send any remaining queued messages
        if self.message_queue:
            await self._process_batch()

        logger.info("Notification manager stopped")

    async def send_notification(self, message: NotificationMessage):
        """
        Send a notification through configured channels.

        Args:
            message: Notification message to send
        """
        try:
            # Check minimum level
            if not self._meets_min_level(message.level):
                logger.debug(f"Message below minimum level: {message.level.value}")
                return

            # Rate limiting check
            if not self._check_rate_limit(message):
                logger.debug("Message rate limited")
                return

            if self.config.batch_notifications:
                # Add to batch queue
                self.message_queue.append(message)
                logger.debug(f"Message queued for batch processing: {message.title}")
            else:
                # Send immediately
                await self._send_message_immediate(message)

        except Exception as e:
            logger.error(f"Error sending notification: {e}")

    async def send_trade_notification(
        self,
        symbol: str,
        action: str,
        quantity: float,
        price: float,
        strategy: str,
        pnl: Optional[float] = None,
    ):
        """Send trade execution notification."""
        pnl_text = f" | P&L: ${pnl:+,.2f}" if pnl is not None else ""

        message = NotificationMessage(
            title=f"🔄 Trade Executed: {symbol}",
            message=f"{action.upper()} {quantity:,.0f} shares at ${price:.2f}{pnl_text} | Strategy: {strategy}",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED,
            symbol=symbol,
            metadata={
                "action": action,
                "quantity": quantity,
                "price": price,
                "strategy": strategy,
                "pnl": pnl,
            },
        )

        await self.send_notification(message)

    async def send_signal_notification(
        self,
        symbol: str,
        signal_type: str,
        confidence: float,
        price: float,
        strategy: str,
        reason: str,
    ):
        """Send trading signal notification."""
        confidence_emoji = (
            "🟢" if confidence >= 0.8 else "🟡" if confidence >= 0.6 else "🔴"
        )

        message = NotificationMessage(
            title=f"📊 Signal: {symbol} - {signal_type}",
            message=f"{confidence_emoji} {signal_type} at ${price:.2f} | Confidence: {confidence:.1%} | {reason[:100]}",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SIGNAL_GENERATED,
            symbol=symbol,
            metadata={
                "signal_type": signal_type,
                "confidence": confidence,
                "price": price,
                "strategy": strategy,
                "reason": reason,
            },
        )

        await self.send_notification(message)

    async def send_risk_alert(
        self,
        alert_type: str,
        message: str,
        current_value: float,
        threshold: float,
        symbol: Optional[str] = None,
    ):
        """Send risk management alert."""
        risk_message = NotificationMessage(
            title=f"⚠️ Risk Alert: {alert_type}",
            message=f"{message} | Current: {current_value:.2f} | Threshold: {threshold:.2f}",
            level=NotificationLevel.WARNING,
            notification_type=NotificationType.RISK_ALERT,
            symbol=symbol,
            metadata={
                "alert_type": alert_type,
                "current_value": current_value,
                "threshold": threshold,
            },
        )

        await self.send_notification(risk_message)

    async def send_error_notification(
        self,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None,
    ):
        """Send system error notification."""
        message = NotificationMessage(
            title=f"❌ System Error: {error_type}",
            message=f"{error_message}",
            level=NotificationLevel.ERROR,
            notification_type=NotificationType.SYSTEM_ERROR,
            metadata=context or {},
        )

        await self.send_notification(message)

    async def send_performance_update(
        self,
        period: str,
        total_pnl: float,
        win_rate: float,
        trades_count: int,
        portfolio_value: float,
    ):
        """Send performance summary notification."""
        pnl_emoji = "📈" if total_pnl >= 0 else "📉"
        win_rate_emoji = "🎯" if win_rate >= 0.6 else "⚡"

        message = NotificationMessage(
            title=f"📊 Performance Update ({period})",
            message=(
                f"{pnl_emoji} P&L: ${total_pnl:+,.2f} | "
                f"{win_rate_emoji} Win Rate: {win_rate:.1%} | "
                f"Trades: {trades_count} | "
                f"Portfolio: ${portfolio_value:,.2f}"
            ),
            level=NotificationLevel.INFO,
            notification_type=NotificationType.PERFORMANCE_UPDATE,
            metadata={
                "period": period,
                "total_pnl": total_pnl,
                "win_rate": win_rate,
                "trades_count": trades_count,
                "portfolio_value": portfolio_value,
            },
        )

        await self.send_notification(message)

    async def send_ai_analysis_notification(
        self, symbol: str, recommendation: str, confidence: float, key_points: str
    ):
        """Send AI analysis notification."""
        confidence_emoji = (
            "🤖" if confidence >= 0.8 else "🧠" if confidence >= 0.6 else "💭"
        )

        message = NotificationMessage(
            title=f"🤖 AI Analysis: {symbol}",
            message=f"{confidence_emoji} {recommendation} | Confidence: {confidence:.1%} | {key_points[:100]}",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.AI_ANALYSIS,
            symbol=symbol,
            metadata={
                "recommendation": recommendation,
                "confidence": confidence,
                "key_points": key_points,
            },
        )

        await self.send_notification(message)

    async def send_system_status(
        self, status: str, uptime: str, active_positions: int, cash_balance: float
    ):
        """Send system status notification."""
        status_emoji = (
            "🟢" if status == "healthy" else "🟡" if status == "warning" else "🔴"
        )

        message = NotificationMessage(
            title=f"⚙️ System Status: {status.upper()}",
            message=(
                f"{status_emoji} Uptime: {uptime} | "
                f"Positions: {active_positions} | "
                f"Cash: ${cash_balance:,.2f}"
            ),
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SYSTEM_STATUS,
            metadata={
                "status": status,
                "uptime": uptime,
                "active_positions": active_positions,
                "cash_balance": cash_balance,
            },
        )

        await self.send_notification(message)

    def _meets_min_level(self, level: NotificationLevel) -> bool:
        """Check if notification meets minimum level requirement."""
        level_order = {
            NotificationLevel.DEBUG: 0,
            NotificationLevel.INFO: 1,
            NotificationLevel.WARNING: 2,
            NotificationLevel.ERROR: 3,
            NotificationLevel.CRITICAL: 4,
        }

        return level_order[level] >= level_order[self.config.min_level]

    def _check_rate_limit(self, message: NotificationMessage) -> bool:
        """Check rate limiting for notifications."""
        now = datetime.now()
        key = f"{message.notification_type.value}_{message.symbol or 'global'}"

        # Initialize tracker for this key
        if key not in self.rate_limit_tracker:
            self.rate_limit_tracker[key] = []

        # Clean old entries (older than 1 minute)
        cutoff_time = now - timedelta(minutes=1)
        self.rate_limit_tracker[key] = [
            timestamp
            for timestamp in self.rate_limit_tracker[key]
            if timestamp > cutoff_time
        ]

        # Check if we're under the rate limit
        if len(self.rate_limit_tracker[key]) >= self.config.rate_limit_per_minute:
            return False

        # Add this request to tracker
        self.rate_limit_tracker[key].append(now)
        return True

    async def _batch_processor(self):
        """Process batched notifications."""
        while self.running:
            try:
                await asyncio.sleep(self.config.batch_interval_seconds)

                if self.message_queue:
                    await self._process_batch()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in batch processor: {e}")

    async def _process_batch(self):
        """Process a batch of notifications."""
        if not self.message_queue:
            return

        try:
            # Group messages by type for better organization
            grouped_messages = self._group_messages_by_type()

            # Send grouped notifications
            for notification_type, messages in grouped_messages.items():
                if len(messages) == 1:
                    # Send single message
                    await self._send_message_immediate(messages[0])
                else:
                    # Send combined message
                    await self._send_combined_message(notification_type, messages)

            # Clear processed messages
            self.message_queue.clear()

        except Exception as e:
            logger.error(f"Error processing notification batch: {e}")

    def _group_messages_by_type(
        self,
    ) -> Dict[NotificationType, List[NotificationMessage]]:
        """Group messages by notification type."""
        grouped = {}

        for message in self.message_queue:
            if message.notification_type not in grouped:
                grouped[message.notification_type] = []
            grouped[message.notification_type].append(message)

        return grouped

    async def _send_combined_message(
        self, notification_type: NotificationType, messages: List[NotificationMessage]
    ):
        """Send a combined message for multiple notifications of the same type."""
        try:
            if notification_type == NotificationType.TRADE_EXECUTED:
                combined_message = self._create_combined_trade_message(messages)
            elif notification_type == NotificationType.SIGNAL_GENERATED:
                combined_message = self._create_combined_signal_message(messages)
            else:
                # For other types, send the most recent message
                combined_message = messages[-1]

            await self._send_message_immediate(combined_message)

        except Exception as e:
            logger.error(f"Error sending combined message: {e}")

    def _create_combined_trade_message(
        self, messages: List[NotificationMessage]
    ) -> NotificationMessage:
        """Create combined trade notification."""
        trade_count = len(messages)
        total_value = sum(
            [
                msg.metadata.get("quantity", 0) * msg.metadata.get("price", 0)
                for msg in messages
            ]
        )

        symbols = list(set([msg.symbol for msg in messages if msg.symbol]))
        symbols_text = ", ".join(symbols[:5])
        if len(symbols) > 5:
            symbols_text += f" +{len(symbols)-5} more"

        combined_message = f"🔄 {trade_count} trades executed | Total value: ${total_value:,.2f} | Symbols: {symbols_text}"

        return NotificationMessage(
            title=f"🔄 {trade_count} Trades Executed",
            message=combined_message,
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED,
            metadata={
                "trade_count": trade_count,
                "total_value": total_value,
                "symbols": symbols,
            },
        )

    def _create_combined_signal_message(
        self, messages: List[NotificationMessage]
    ) -> NotificationMessage:
        """Create combined signal notification."""
        signal_count = len(messages)
        buy_signals = len(
            [msg for msg in messages if "BUY" in msg.metadata.get("signal_type", "")]
        )
        sell_signals = len(
            [msg for msg in messages if "SELL" in msg.metadata.get("signal_type", "")]
        )

        symbols = list(set([msg.symbol for msg in messages if msg.symbol]))
        symbols_text = ", ".join(symbols[:5])
        if len(symbols) > 5:
            symbols_text += f" +{len(symbols)-5} more"

        combined_message = f"📊 {signal_count} signals | Buy: {buy_signals} | Sell: {sell_signals} | Symbols: {symbols_text}"

        return NotificationMessage(
            title=f"📊 {signal_count} Trading Signals",
            message=combined_message,
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SIGNAL_GENERATED,
            metadata={
                "signal_count": signal_count,
                "buy_signals": buy_signals,
                "sell_signals": sell_signals,
            },
        )

    async def _send_message_immediate(self, message: NotificationMessage):
        """Send a message immediately to all configured channels."""
        send_tasks = []

        for channel_name, notifier in self.notifiers.items():
            try:
                task = asyncio.create_task(
                    notifier.send_notification(message),
                    name=f"send_{channel_name}_{message.notification_type.value}",
                )
                send_tasks.append(task)
            except Exception as e:
                logger.error(f"Error creating send task for {channel_name}: {e}")

        if send_tasks:
            # Send to all channels in parallel
            results = await asyncio.gather(*send_tasks, return_exceptions=True)

            # Log any errors
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    channel_name = list(self.notifiers.keys())[i]
                    logger.error(f"Error sending to {channel_name}: {result}")

    def get_notification_stats(self) -> Dict[str, Any]:
        """Get notification statistics."""
        return {
            "configured_channels": list(self.notifiers.keys()),
            "queued_messages": len(self.message_queue),
            "rate_limit_trackers": len(self.rate_limit_tracker),
            "batch_notifications": self.config.batch_notifications,
            "batch_interval_seconds": self.config.batch_interval_seconds,
            "min_level": self.config.min_level.value,
            "running": self.running,
        }

    async def test_notifications(self):
        """Send test notifications to verify configuration."""
        test_message = NotificationMessage(
            title="🧪 Test Notification",
            message="This is a test message from the AI Trading Bot notification system.",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SYSTEM_STATUS,
            metadata={"test": True},
        )

        await self.send_notification(test_message)
        logger.info("Test notification sent")

    def update_config(self, new_config: NotificationConfig):
        """Update notification configuration."""
        self.config = new_config
        self.notifiers.clear()
        self._initialize_notifiers()
        logger.info("Notification configuration updated")


# Utility functions
def create_notification_manager(
    discord_webhook: Optional[str] = None,
    slack_token: Optional[str] = None,
    slack_channel: Optional[str] = None,
    min_level: NotificationLevel = NotificationLevel.INFO,
) -> NotificationManager:
    """Create notification manager with basic configuration."""
    config = NotificationConfig(
        discord_enabled=discord_webhook is not None,
        discord_webhook_url=discord_webhook,
        slack_enabled=slack_token is not None,
        slack_token=slack_token,
        slack_channel=slack_channel,
        min_level=min_level,
    )

    return NotificationManager(config)


def format_currency(amount: float) -> str:
    """Format currency amount for notifications."""
    if abs(amount) >= 1000000:
        return f"${amount/1000000:.1f}M"
    elif abs(amount) >= 1000:
        return f"${amount/1000:.1f}K"
    else:
        return f"${amount:.2f}"


def format_percentage(value: float) -> str:
    """Format percentage for notifications."""
    return f"{value:.1%}"


def get_emoji_for_pnl(pnl: float) -> str:
    """Get emoji based on P&L value."""
    if pnl > 100:
        return "🚀"
    elif pnl > 0:
        return "📈"
    elif pnl > -100:
        return "📉"
    else:
        return "💥"
