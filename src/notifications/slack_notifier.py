"""
Slack webhook notification integration.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
import aiohttp
import json
from datetime import datetime
from slack_sdk.web.async_client import AsyncWebClient
from slack_sdk.errors import SlackApiError

logger = logging.getLogger(__name__)


class SlackNotifier:
    """
    Slack notification integration using bot token.
    """

    def __init__(self, token: str, default_channel: Optional[str] = None):
        """
        Initialize Slack notifier.

        Args:
            token: Slack bot token
            default_channel: Default channel to post messages
        """
        self.token = token
        self.default_channel = default_channel or "#trading-alerts"
        self.client = AsyncWebClient(token=token)
        self.max_message_length = 3000

    async def send_notification(self, message) -> bool:
        """
        Send notification to Slack.

        Args:
            message: NotificationMessage object

        Returns:
            True if successful
        """
        try:
            # Create Slack message blocks
            blocks = self._create_message_blocks(message)

            # Send message
            response = await self.client.chat_postMessage(
                channel=self.default_channel,
                blocks=blocks,
                username="AI Trading Bot",
                icon_emoji=":robot_face:",
            )

            if response["ok"]:
                logger.debug(f"Slack notification sent: {message.title}")
                return True
            else:
                logger.error(
                    f"Slack API error: {response.get('error', 'Unknown error')}"
                )
                return False

        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return False
        except Exception as e:
            logger.error(f"Error sending Slack notification: {e}")
            return False

    def _create_message_blocks(self, message) -> List[Dict[str, Any]]:
        """
        Create Slack message blocks from notification message.

        Args:
            message: NotificationMessage object

        Returns:
            List of Slack blocks
        """
        blocks = []

        # Header block with title and emoji
        emoji = self._get_emoji_for_type(message.notification_type, message.level)
        header_text = f"{emoji} {message.title}"

        blocks.append(
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": header_text[:150],  # Slack header limit
                },
            }
        )

        # Main message block
        blocks.append(
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": self._format_message_text(message)},
            }
        )

        # Add fields based on message type
        fields_block = self._create_fields_block(message)
        if fields_block:
            blocks.append(fields_block)

        # Footer with timestamp
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Level:* {message.level.value} | *Time:* {message.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
                    }
                ],
            }
        )

        return blocks

    def _format_message_text(self, message) -> str:
        """Format message text for Slack with markdown."""
        text = message.message

        # Truncate if too long
        if len(text) > self.max_message_length:
            text = text[: self.max_message_length - 3] + "..."

        # Add symbol context if available
        if message.symbol:
            text = f"*Symbol:* `{message.symbol}`\n{text}"

        return text

    def _get_emoji_for_type(self, notification_type, level) -> str:
        """Get appropriate emoji for notification type and level."""
        emoji_map = {
            "trade_executed": ":heavy_check_mark:",
            "signal_generated": ":chart_with_upwards_trend:",
            "risk_alert": ":warning:",
            "system_error": ":x:",
            "performance_update": ":bar_chart:",
            "market_update": ":globe_with_meridians:",
            "system_status": ":gear:",
            "ai_analysis": ":robot_face:",
        }

        # Override with level-specific emojis for certain cases
        if level.value == "CRITICAL":
            return ":rotating_light:"
        elif level.value == "ERROR":
            return ":x:"
        elif level.value == "WARNING":
            return ":warning:"

        return emoji_map.get(notification_type.value, ":information_source:")

    def _create_fields_block(self, message) -> Optional[Dict[str, Any]]:
        """Create fields block based on message type."""
        fields = []

        if message.notification_type.value == "trade_executed":
            fields = self._create_trade_fields(message)
        elif message.notification_type.value == "signal_generated":
            fields = self._create_signal_fields(message)
        elif message.notification_type.value == "risk_alert":
            fields = self._create_risk_fields(message)
        elif message.notification_type.value == "performance_update":
            fields = self._create_performance_fields(message)
        elif message.notification_type.value == "ai_analysis":
            fields = self._create_ai_analysis_fields(message)

        if not fields:
            return None

        return {"type": "section", "fields": fields}

    def _create_trade_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for trade notification."""
        metadata = message.metadata
        fields = []

        if "action" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Action:*\n{metadata['action'].upper()}"}
            )

        if "quantity" in metadata:
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Quantity:*\n{metadata['quantity']:,.0f} shares",
                }
            )

        if "price" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Price:*\n${metadata['price']:.2f}"}
            )

        if "strategy" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Strategy:*\n{metadata['strategy']}"}
            )

        if "pnl" in metadata and metadata["pnl"] is not None:
            pnl = metadata["pnl"]
            pnl_emoji = (
                ":chart_with_upwards_trend:"
                if pnl >= 0
                else ":chart_with_downwards_trend:"
            )
            fields.append(
                {"type": "mrkdwn", "text": f"*P&L:*\n{pnl_emoji} ${pnl:+,.2f}"}
            )

        return fields

    def _create_signal_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for signal notification."""
        metadata = message.metadata
        fields = []

        if "signal_type" in metadata:
            signal_emoji = (
                ":arrow_up:" if "BUY" in metadata["signal_type"] else ":arrow_down:"
            )
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Signal:*\n{signal_emoji} {metadata['signal_type']}",
                }
            )

        if "confidence" in metadata:
            confidence = metadata["confidence"]
            confidence_emoji = (
                ":green_circle:"
                if confidence >= 0.8
                else ":yellow_circle:" if confidence >= 0.6 else ":red_circle:"
            )
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Confidence:*\n{confidence_emoji} {confidence:.1%}",
                }
            )

        if "price" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Price:*\n${metadata['price']:.2f}"}
            )

        if "strategy" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Strategy:*\n{metadata['strategy']}"}
            )

        return fields

    def _create_risk_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for risk alert notification."""
        metadata = message.metadata
        fields = []

        if "alert_type" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Alert Type:*\n{metadata['alert_type']}"}
            )

        if "current_value" in metadata:
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*Current Value:*\n{metadata['current_value']:.2f}",
                }
            )

        if "threshold" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Threshold:*\n{metadata['threshold']:.2f}"}
            )

        return fields

    def _create_performance_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for performance update notification."""
        metadata = message.metadata
        fields = []

        if "period" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Period:*\n{metadata['period']}"}
            )

        if "total_pnl" in metadata:
            pnl = metadata["total_pnl"]
            pnl_emoji = ":moneybag:" if pnl >= 0 else ":money_with_wings:"
            fields.append(
                {"type": "mrkdwn", "text": f"*Total P&L:*\n{pnl_emoji} ${pnl:+,.2f}"}
            )

        if "win_rate" in metadata:
            win_rate = metadata["win_rate"]
            win_emoji = ":dart:" if win_rate >= 0.6 else ":game_die:"
            fields.append(
                {"type": "mrkdwn", "text": f"*Win Rate:*\n{win_emoji} {win_rate:.1%}"}
            )

        if "trades_count" in metadata:
            fields.append(
                {"type": "mrkdwn", "text": f"*Trades:*\n{metadata['trades_count']}"}
            )

        return fields

    def _create_ai_analysis_fields(self, message) -> List[Dict[str, Any]]:
        """Create fields for AI analysis notification."""
        metadata = message.metadata
        fields = []

        if "recommendation" in metadata:
            rec = metadata["recommendation"]
            rec_emoji = (
                ":thumbsup:"
                if "BUY" in rec
                else ":thumbsdown:" if "SELL" in rec else ":neutral_face:"
            )
            fields.append(
                {"type": "mrkdwn", "text": f"*Recommendation:*\n{rec_emoji} {rec}"}
            )

        if "confidence" in metadata:
            confidence = metadata["confidence"]
            fields.append(
                {
                    "type": "mrkdwn",
                    "text": f"*AI Confidence:*\n:robot_face: {confidence:.1%}",
                }
            )

        return fields

    async def send_test_message(self) -> bool:
        """Send a test message to verify Slack configuration."""
        from .notification_manager import (
            NotificationMessage,
            NotificationLevel,
            NotificationType,
        )

        test_message = NotificationMessage(
            title="Slack Test Message",
            message="This is a test message from the AI Trading Bot Slack notifier.",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SYSTEM_STATUS,
            metadata={"test": True},
        )

        return await self.send_notification(test_message)

    async def send_rich_chart_notification(
        self,
        symbol: str,
        title: str,
        chart_url: Optional[str] = None,
        analysis: Optional[str] = None,
    ) -> bool:
        """
        Send a rich notification with chart image.

        Args:
            symbol: Stock symbol
            title: Notification title
            chart_url: URL to chart image
            analysis: Analysis text

        Returns:
            True if successful
        """
        try:
            blocks = [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": f"📊 {title}"},
                },
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Symbol:* `{symbol}`"},
                },
            ]

            if analysis:
                blocks.append(
                    {"type": "section", "text": {"type": "mrkdwn", "text": analysis}}
                )

            if chart_url:
                blocks.append(
                    {
                        "type": "image",
                        "image_url": chart_url,
                        "alt_text": f"{symbol} chart",
                    }
                )

            response = await self.client.chat_postMessage(
                channel=self.default_channel,
                blocks=blocks,
                username="AI Trading Bot",
                icon_emoji=":robot_face:",
            )

            return response["ok"]

        except Exception as e:
            logger.error(f"Error sending rich Slack notification: {e}")
            return False

    async def send_daily_summary(self, summary_data: Dict[str, Any]) -> bool:
        """
        Send daily trading summary.

        Args:
            summary_data: Summary data dictionary

        Returns:
            True if successful
        """
        try:
            # Create comprehensive summary blocks
            blocks = [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "📈 Daily Trading Summary"},
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Total P&L:*\n${summary_data.get('total_pnl', 0):+,.2f}",
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Win Rate:*\n{summary_data.get('win_rate', 0):.1%}",
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Total Trades:*\n{summary_data.get('total_trades', 0)}",
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Portfolio Value:*\n${summary_data.get('portfolio_value', 0):,.2f}",
                        },
                    ],
                },
            ]

            # Add top performers if available
            if "top_performers" in summary_data:
                performers_text = "\n".join(
                    [
                        f"• {symbol}: ${pnl:+,.2f}"
                        for symbol, pnl in summary_data["top_performers"][:5]
                    ]
                )

                blocks.append(
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Top Performers:*\n{performers_text}",
                        },
                    }
                )

            response = await self.client.chat_postMessage(
                channel=self.default_channel,
                blocks=blocks,
                username="AI Trading Bot",
                icon_emoji=":robot_face:",
            )

            return response["ok"]

        except Exception as e:
            logger.error(f"Error sending daily summary: {e}")
            return False

    async def get_channel_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the configured channel."""
        try:
            # Handle both channel names and IDs
            channel = self.default_channel
            if channel.startswith("#"):
                channel = channel[1:]  # Remove # prefix

            response = await self.client.conversations_info(channel=channel)

            if response["ok"]:
                return response["channel"]
            else:
                logger.error(f"Failed to get channel info: {response.get('error')}")
                return None

        except SlackApiError as e:
            logger.error(f"Slack API error getting channel info: {e.response['error']}")
            return None
        except Exception as e:
            logger.error(f"Error getting channel info: {e}")
            return None

    async def close(self):
        """Close the Slack notifier and cleanup resources."""
        # AsyncWebClient doesn't require explicit closing
        pass
