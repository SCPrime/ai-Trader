"""
Tests for notification system.
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from src.notifications.notification_manager import (
    NotificationManager, NotificationMessage, NotificationLevel,
    NotificationType, NotificationConfig
)
from src.notifications.slack_notifier import SlackNotifier
from src.notifications.discord_notifier import DiscordNotifier


class TestNotificationMessage:
    """Test cases for notification message."""

    def test_notification_message_creation(self):
        """Test notification message creation."""
        message = NotificationMessage(
            title="Test Notification",
            message="This is a test message",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.SYSTEM_STATUS,
            symbol="AAPL",
            metadata={"test": True}
        )

        assert message.title == "Test Notification"
        assert message.message == "This is a test message"
        assert message.level == NotificationLevel.INFO
        assert message.notification_type == NotificationType.SYSTEM_STATUS
        assert message.symbol == "AAPL"
        assert message.metadata["test"] is True
        assert isinstance(message.timestamp, datetime)

    def test_notification_message_without_optional_fields(self):
        """Test notification message creation without optional fields."""
        message = NotificationMessage(
            title="Simple Test",
            message="Simple message",
            level=NotificationLevel.WARNING,
            notification_type=NotificationType.RISK_ALERT
        )

        assert message.symbol is None
        assert message.metadata == {}

    def test_notification_level_enum(self):
        """Test notification level enum values."""
        assert NotificationLevel.DEBUG.value == "DEBUG"
        assert NotificationLevel.INFO.value == "INFO"
        assert NotificationLevel.WARNING.value == "WARNING"
        assert NotificationLevel.ERROR.value == "ERROR"
        assert NotificationLevel.CRITICAL.value == "CRITICAL"

    def test_notification_type_enum(self):
        """Test notification type enum values."""
        assert NotificationType.TRADE_EXECUTED.value == "trade_executed"
        assert NotificationType.SIGNAL_GENERATED.value == "signal_generated"
        assert NotificationType.RISK_ALERT.value == "risk_alert"
        assert NotificationType.SYSTEM_ERROR.value == "system_error"
        assert NotificationType.PERFORMANCE_UPDATE.value == "performance_update"


class TestNotificationManager:
    """Test cases for notification manager."""

    @pytest.fixture
    def notification_config(self):
        """Create test notification configuration."""
        return NotificationConfig(
            enable_slack=True,
            enable_discord=True,
            slack_token="test_slack_token",
            slack_channel="#test-channel",
            discord_webhook="https://test.discord.webhook",
            batch_size=5,
            batch_timeout=1.0,
            rate_limit_per_minute=30
        )

    @pytest.fixture
    def notification_manager(self, notification_config):
        """Create notification manager for testing."""
        return NotificationManager(notification_config)

    def test_notification_manager_initialization(self, notification_config):
        """Test notification manager initialization."""
        manager = NotificationManager(notification_config)

        assert manager.config.enable_slack is True
        assert manager.config.enable_discord is True
        assert manager.config.batch_size == 5
        assert len(manager.pending_notifications) == 0

    @pytest.mark.asyncio
    async def test_send_single_notification(self, notification_manager):
        """Test sending single notification."""
        with patch.object(notification_manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            message = NotificationMessage(
                title="Test Trade",
                message="Trade executed successfully",
                level=NotificationLevel.INFO,
                notification_type=NotificationType.TRADE_EXECUTED,
                symbol="AAPL"
            )

            success = await notification_manager.send_notification(message)

            assert success is True
            mock_send.assert_called_once_with([message])

    @pytest.mark.asyncio
    async def test_batch_notification_processing(self, notification_manager):
        """Test batch notification processing."""
        with patch.object(notification_manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            # Send multiple notifications quickly
            messages = []
            for i in range(3):
                message = NotificationMessage(
                    title=f"Test {i}",
                    message=f"Test message {i}",
                    level=NotificationLevel.INFO,
                    notification_type=NotificationType.SYSTEM_STATUS
                )
                messages.append(message)
                await notification_manager.send_notification(message)

            # Allow batch processing to complete
            await asyncio.sleep(0.1)

            # Should have batched the notifications
            assert len(notification_manager.pending_notifications) <= 3

    @pytest.mark.asyncio
    async def test_rate_limiting(self, notification_config):
        """Test rate limiting functionality."""
        # Set low rate limit for testing
        notification_config.rate_limit_per_minute = 2
        manager = NotificationManager(notification_config)

        with patch.object(manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            # Send notifications exceeding rate limit
            for i in range(5):
                message = NotificationMessage(
                    title=f"Test {i}",
                    message=f"Message {i}",
                    level=NotificationLevel.INFO,
                    notification_type=NotificationType.SYSTEM_STATUS
                )
                await manager.send_notification(message)

            # Should have rate limited some notifications
            assert mock_send.call_count <= 2

    @pytest.mark.asyncio
    async def test_critical_notification_bypass(self, notification_manager):
        """Test that critical notifications bypass batching."""
        with patch.object(notification_manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            critical_message = NotificationMessage(
                title="Critical Error",
                message="System failure detected",
                level=NotificationLevel.CRITICAL,
                notification_type=NotificationType.SYSTEM_ERROR
            )

            await notification_manager.send_notification(critical_message)

            # Critical messages should be sent immediately
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_notification_filtering(self, notification_config):
        """Test notification filtering by level."""
        notification_config.min_level = NotificationLevel.WARNING
        manager = NotificationManager(notification_config)

        with patch.object(manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            # Send INFO level message (should be filtered)
            info_message = NotificationMessage(
                title="Info Message",
                message="This is info level",
                level=NotificationLevel.INFO,
                notification_type=NotificationType.SYSTEM_STATUS
            )

            await manager.send_notification(info_message)

            # Should not send INFO level when min level is WARNING
            mock_send.assert_not_called()

            # Send WARNING level message (should be sent)
            warning_message = NotificationMessage(
                title="Warning Message",
                message="This is warning level",
                level=NotificationLevel.WARNING,
                notification_type=NotificationType.RISK_ALERT
            )

            await manager.send_notification(warning_message)

            # Should send WARNING level
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_startup_and_shutdown(self, notification_manager):
        """Test manager startup and shutdown."""
        await notification_manager.start()

        # Should be running
        assert notification_manager._batch_task is not None

        await notification_manager.stop()

        # Should be stopped
        assert notification_manager._batch_task is None or notification_manager._batch_task.done()


class TestSlackNotifier:
    """Test cases for Slack notifier."""

    @pytest.fixture
    def slack_notifier(self):
        """Create Slack notifier for testing."""
        return SlackNotifier(
            token="test_token",
            default_channel="#test-channel"
        )

    @pytest.mark.asyncio
    async def test_slack_message_creation(self, slack_notifier):
        """Test Slack message block creation."""
        message = NotificationMessage(
            title="Test Trade",
            message="Trade executed successfully",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED,
            symbol="AAPL",
            metadata={
                "action": "BUY",
                "quantity": 100,
                "price": 150.00,
                "strategy": "RSI"
            }
        )

        blocks = slack_notifier._create_message_blocks(message)

        assert len(blocks) >= 3  # Header, content, footer
        assert blocks[0]["type"] == "header"
        assert "Test Trade" in blocks[0]["text"]["text"]

    @pytest.mark.asyncio
    async def test_slack_trade_fields(self, slack_notifier):
        """Test Slack trade field generation."""
        message = NotificationMessage(
            title="Trade Executed",
            message="Successfully executed trade",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED,
            metadata={
                "action": "BUY",
                "quantity": 100,
                "price": 150.00,
                "strategy": "RSI",
                "pnl": 50.00
            }
        )

        fields = slack_notifier._create_trade_fields(message)

        assert len(fields) == 5  # action, quantity, price, strategy, pnl
        assert any("BUY" in field["text"] for field in fields)
        assert any("100" in field["text"] for field in fields)
        assert any("$150.00" in field["text"] for field in fields)

    @pytest.mark.asyncio
    async def test_slack_send_notification_mock(self, slack_notifier):
        """Test Slack notification sending with mock."""
        with patch.object(slack_notifier.client, 'chat_postMessage', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = {"ok": True}

            message = NotificationMessage(
                title="Test",
                message="Test message",
                level=NotificationLevel.INFO,
                notification_type=NotificationType.SYSTEM_STATUS
            )

            result = await slack_notifier.send_notification(message)

            assert result is True
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_slack_test_message(self, slack_notifier):
        """Test Slack test message sending."""
        with patch.object(slack_notifier, 'send_notification', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await slack_notifier.send_test_message()

            assert result is True
            mock_send.assert_called_once()


class TestDiscordNotifier:
    """Test cases for Discord notifier."""

    @pytest.fixture
    def discord_notifier(self):
        """Create Discord notifier for testing."""
        return DiscordNotifier("https://discord.com/api/webhooks/test")

    def test_discord_embed_creation(self, discord_notifier):
        """Test Discord embed creation."""
        message = NotificationMessage(
            title="Test Trade",
            message="Trade executed successfully",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED,
            symbol="AAPL",
            metadata={
                "action": "BUY",
                "quantity": 100,
                "price": 150.00
            }
        )

        embed = discord_notifier._create_embed(message)

        assert embed["title"] == "Test Trade"
        assert embed["description"] == "Trade executed successfully"
        assert embed["color"] == 0x28a745  # Green for trade_executed
        assert "fields" in embed

    def test_discord_embed_colors(self, discord_notifier):
        """Test Discord embed color assignment."""
        # Test trade execution (green)
        trade_message = NotificationMessage(
            title="Trade",
            message="Test",
            level=NotificationLevel.INFO,
            notification_type=NotificationType.TRADE_EXECUTED
        )

        embed = discord_notifier._create_embed(trade_message)
        assert embed["color"] == 0x28a745  # Green

        # Test critical level (dark red)
        critical_message = NotificationMessage(
            title="Critical",
            message="Test",
            level=NotificationLevel.CRITICAL,
            notification_type=NotificationType.SYSTEM_ERROR
        )

        embed = discord_notifier._create_embed(critical_message)
        assert embed["color"] == 0x721c24  # Dark red

    @pytest.mark.asyncio
    async def test_discord_send_notification_mock(self, discord_notifier):
        """Test Discord notification sending with mock."""
        mock_response = MagicMock()
        mock_response.status = 204

        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_post.return_value.__aenter__.return_value = mock_response

            message = NotificationMessage(
                title="Test",
                message="Test message",
                level=NotificationLevel.INFO,
                notification_type=NotificationType.SYSTEM_STATUS
            )

            result = await discord_notifier.send_notification(message)

            assert result is True

    @pytest.mark.asyncio
    async def test_discord_rich_trade_notification(self, discord_notifier):
        """Test Discord rich trade notification."""
        mock_response = MagicMock()
        mock_response.status = 204

        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await discord_notifier.send_rich_trade_notification(
                symbol="AAPL",
                action="BUY",
                quantity=100,
                price=150.00,
                value=15000.00,
                strategy="RSI",
                pnl=50.00
            )

            assert result is True
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_discord_context_manager(self):
        """Test Discord notifier as async context manager."""
        notifier = DiscordNotifier("https://test.webhook")

        async with notifier as n:
            assert n.session is not None

        # Session should be closed after context
        assert notifier.session is None


@pytest.mark.integration
class TestNotificationIntegration:
    """Integration tests for notification system."""

    @pytest.mark.asyncio
    async def test_full_notification_pipeline(self):
        """Test complete notification pipeline."""
        config = NotificationConfig(
            enable_slack=True,
            enable_discord=True,
            slack_token="test_token",
            discord_webhook="https://test.webhook",
            batch_size=2,
            batch_timeout=0.1
        )

        manager = NotificationManager(config)

        with patch.object(manager, '_send_to_notifiers', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await manager.start()

            # Send multiple notifications
            for i in range(3):
                message = NotificationMessage(
                    title=f"Test {i}",
                    message=f"Message {i}",
                    level=NotificationLevel.INFO,
                    notification_type=NotificationType.SYSTEM_STATUS
                )
                await manager.send_notification(message)

            # Wait for batch processing
            await asyncio.sleep(0.2)

            await manager.stop()

            # Should have processed the notifications
            assert mock_send.call_count >= 1