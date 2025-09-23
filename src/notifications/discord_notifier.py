"""
Discord webhook notification integration.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
import aiohttp
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class DiscordNotifier:
    """
    Discord webhook notifier for trading alerts.
    """

    def __init__(self, webhook_url: str):
        """
        Initialize Discord notifier.

        Args:
            webhook_url: Discord webhook URL
        """
        self.webhook_url = webhook_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.max_message_length = 2000
        self.max_embeds = 10

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def send_notification(self, message) -> bool:
        """
        Send notification to Discord.

        Args:
            message: NotificationMessage object

        Returns:
            True if successful
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()

            # Create Discord embed
            embed = self._create_embed(message)

            # Prepare payload
            payload = {
                "embeds": [embed],
                "username": "AI Trading Bot",
                "avatar_url": "https://cdn.discordapp.com/emojis/🤖.png",
            }

            # Send webhook
            async with self.session.post(
                self.webhook_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 204:
                    logger.debug(f"Discord notification sent: {message.title}")
                    return True
                else:
                    logger.error(f"Discord webhook failed: {response.status}")
                    return False

        except asyncio.TimeoutError:
            logger.error("Discord notification timeout")
            return False
        except Exception as e:
            logger.error(f"Error sending Discord notification: {e}")
            return False

    def _create_embed(self, message) -> Dict[str, Any]:
        """
        Create Discord embed from notification message.

        Args:
            message: NotificationMessage object

        Returns:
            Discord embed dictionary
        """
        # Determine embed color based on level and type
        color = self._get_embed_color(message.level, message.notification_type)

        # Truncate message if too long
        description = message.message
        if len(description) > 2048:
            description = description[:2045] + "..."

        embed = {
            "title": message.title[:256],  # Discord title limit
            "description": description,
            "color": color,
            "timestamp": message.timestamp.isoformat(),
            "footer": {"text": f"AI Trading Bot | {message.level.value}"},
        }

        # Add fields based on message type
        if message.notification_type.value == "trade_executed":
            embed["fields"] = self._create_trade_fields(message)
        elif message.notification_type.value == "signal_generated":
            embed["fields"] = self._create_signal_fields(message)
        elif message.notification_type.value == "risk_alert":
            embed["fields"] = self._create_risk_fields(message)
        elif message.notification_type.value == "performance_update":
            embed["fields"] = self._create_performance_fields(message)
        elif message.notification_type.value == "ai_analysis":
            embed["fields"] = self._create_ai_analysis_fields(message)

        # Add symbol in sidebar if present
        if message.symbol:
            embed["author"] = {
                "name": f"Symbol: {message.symbol}",
                "icon_url": "https://cdn.discordapp.com/emojis/📈.png",
            }

        return embed

    def _get_embed_color(self, level, notification_type) -> int:
        """Get Discord embed color based on level and type."""
        # Colors in decimal format
        color_map = {
            "DEBUG": 0x6C757D,  # Gray
            "INFO": 0x17A2B8,  # Blue
            "WARNING": 0xFFC107,  # Yellow
            "ERROR": 0xDC3545,  # Red
            "CRITICAL": 0x721C24,  # Dark red
        }

        # Special colors for certain notification types
        if notification_type.value == "trade_executed":
            return 0x28A745  # Green
        elif notification_type.value == "signal_generated":
            return 0x007BFF  # Blue
        elif notification_type.value == "ai_analysis":
            return 0x6F42C1  # Purple

        return color_map.get(level.value, 0x6C757D)

    def _create_trade_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for trade notification."""
        metadata = message.metadata
        fields = []

        if "action" in metadata:
            fields.append(
                {"name": "Action", "value": metadata["action"].upper(), "inline": True}
            )

        if "quantity" in metadata and "price" in metadata:
            fields.append(
                {
                    "name": "Quantity",
                    "value": f"{metadata['quantity']:,.0f} shares",
                    "inline": True,
                }
            )

            fields.append(
                {"name": "Price", "value": f"${metadata['price']:.2f}", "inline": True}
            )

        if "strategy" in metadata:
            fields.append(
                {"name": "Strategy", "value": metadata["strategy"], "inline": True}
            )

        if "pnl" in metadata and metadata["pnl"] is not None:
            pnl = metadata["pnl"]
            fields.append({"name": "P&L", "value": f"${pnl:+,.2f}", "inline": True})

        return fields

    def _create_signal_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for signal notification."""
        metadata = message.metadata
        fields = []

        if "signal_type" in metadata:
            fields.append(
                {"name": "Signal", "value": metadata["signal_type"], "inline": True}
            )

        if "confidence" in metadata:
            confidence = metadata["confidence"]
            fields.append(
                {"name": "Confidence", "value": f"{confidence:.1%}", "inline": True}
            )

        if "price" in metadata:
            fields.append(
                {"name": "Price", "value": f"${metadata['price']:.2f}", "inline": True}
            )

        if "strategy" in metadata:
            fields.append(
                {"name": "Strategy", "value": metadata["strategy"], "inline": True}
            )

        if "reason" in metadata:
            reason = metadata["reason"]
            if len(reason) > 100:
                reason = reason[:97] + "..."
            fields.append({"name": "Reason", "value": reason, "inline": False})

        return fields

    def _create_risk_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for risk alert notification."""
        metadata = message.metadata
        fields = []

        if "alert_type" in metadata:
            fields.append(
                {"name": "Alert Type", "value": metadata["alert_type"], "inline": True}
            )

        if "current_value" in metadata:
            fields.append(
                {
                    "name": "Current Value",
                    "value": f"{metadata['current_value']:.2f}",
                    "inline": True,
                }
            )

        if "threshold" in metadata:
            fields.append(
                {
                    "name": "Threshold",
                    "value": f"{metadata['threshold']:.2f}",
                    "inline": True,
                }
            )

        return fields

    def _create_performance_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for performance update notification."""
        metadata = message.metadata
        fields = []

        if "period" in metadata:
            fields.append(
                {"name": "Period", "value": metadata["period"], "inline": True}
            )

        if "total_pnl" in metadata:
            pnl = metadata["total_pnl"]
            fields.append(
                {"name": "Total P&L", "value": f"${pnl:+,.2f}", "inline": True}
            )

        if "win_rate" in metadata:
            fields.append(
                {
                    "name": "Win Rate",
                    "value": f"{metadata['win_rate']:.1%}",
                    "inline": True,
                }
            )

        if "trades_count" in metadata:
            fields.append(
                {
                    "name": "Trades",
                    "value": str(metadata["trades_count"]),
                    "inline": True,
                }
            )

        if "portfolio_value" in metadata:
            fields.append(
                {
                    "name": "Portfolio Value",
                    "value": f"${metadata['portfolio_value']:,.2f}",
                    "inline": True,
                }
            )

        return fields

    def _create_ai_analysis_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for AI analysis notification."""
        metadata = message.metadata
        fields = []

        if "recommendation" in metadata:
            fields.append(
                {
                    "name": "Recommendation",
                    "value": metadata["recommendation"],
                    "inline": True,
                }
            )

        if "confidence" in metadata:
            fields.append(
                {
                    "name": "Confidence",
                    "value": f"{metadata['confidence']:.1%}",
                    "inline": True,
                }
            )

        if "key_points" in metadata:
            key_points = metadata["key_points"]
            if len(key_points) > 200:
                key_points = key_points[:197] + "..."
            fields.append({"name": "Key Points", "value": key_points, "inline": False})

        return fields

    async def send_test_message(self) -> bool:
        """Send a test message to verify webhook configuration."""
        from .notification_manager import (
            NotificationMessage,
            NotificationLevel,
            NotificationType,
        )

        test_message = NotificationMessage(
            title="🧪 Discord Test Message",
            message="This is a test message from the AI Trading Bot Discord notifier.",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SYSTEM_STATUS,
            metadata={"test": True},
        )

        return await self.send_notification(test_message)

    async def send_rich_trade_notification(
        self,
        symbol: str,
        action: str,
        quantity: float,
        price: float,
        value: float,
        strategy: str,
        pnl: Optional[float] = None,
    ) -> bool:
        """
        Send a rich trade notification with additional formatting.

        Args:
            symbol: Stock symbol
            action: BUY or SELL
            quantity: Number of shares
            price: Price per share
            value: Total trade value
            strategy: Trading strategy
            pnl: Profit/loss if available

        Returns:
            True if successful
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()

            # Create rich embed
            embed = {
                "title": f"🔄 Trade Executed: {symbol}",
                "color": 0x28A745 if action.upper() == "BUY" else 0xDC3545,
                "timestamp": datetime.now().isoformat(),
                "author": {
                    "name": f"{symbol} | {action.upper()}",
                    "icon_url": "https://cdn.discordapp.com/emojis/📈.png",
                },
                "fields": [
                    {
                        "name": "📊 Quantity",
                        "value": f"{quantity:,.0f} shares",
                        "inline": True,
                    },
                    {"name": "💰 Price", "value": f"${price:.2f}", "inline": True},
                    {
                        "name": "💵 Total Value",
                        "value": f"${value:,.2f}",
                        "inline": True,
                    },
                    {"name": "🎯 Strategy", "value": strategy, "inline": True},
                ],
                "footer": {
                    "text": "AI Trading Bot | Trade Execution",
                    "icon_url": "https://cdn.discordapp.com/emojis/🤖.png",
                },
            }

            if pnl is not None:
                pnl_emoji = "📈" if pnl >= 0 else "📉"
                embed["fields"].append(
                    {
                        "name": f"{pnl_emoji} P&L",
                        "value": f"${pnl:+,.2f}",
                        "inline": True,
                    }
                )

            payload = {"embeds": [embed], "username": "AI Trading Bot"}

            async with self.session.post(
                self.webhook_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                return response.status == 204

        except Exception as e:
            logger.error(f"Error sending rich Discord notification: {e}")
            return False

    async def close(self):
        """Close the Discord notifier and cleanup resources."""
        if self.session:
            await self.session.close()
            self.session = None
