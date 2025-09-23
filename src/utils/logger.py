"""
Centralized logging configuration for the trading bot.
"""

import sys
import os
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger
from datetime import datetime


class TradingLogger:
    """
    Centralized logging system with structured output and multiple handlers.
    """

    def __init__(self):
        """Initialize the logging system."""
        self._initialized = False
        self._log_dir = Path("logs")
        self._handlers: Dict[str, Any] = {}

    def setup_logging(
        self,
        level: str = "INFO",
        log_format: Optional[str] = None,
        file_path: Optional[str] = None,
        rotation: str = "1 day",
        retention: str = "30 days",
        enable_console: bool = True,
        enable_file: bool = True,
    ) -> None:
        """
        Setup logging configuration.

        Args:
            level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_format: Custom log format string
            file_path: Path to log file
            rotation: Log rotation schedule
            retention: Log retention period
            enable_console: Enable console logging
            enable_file: Enable file logging
        """
        if self._initialized:
            return

        # Remove default handler
        logger.remove()

        # Default format
        if log_format is None:
            log_format = (
                "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
                "<level>{message}</level>"
            )

        # Console handler
        if enable_console:
            logger.add(
                sys.stdout,
                format=log_format,
                level=level,
                colorize=True,
                backtrace=True,
                diagnose=True,
            )

        # File handler
        if enable_file:
            if file_path is None:
                file_path = self._log_dir / "trading_bot.log"

            # Ensure log directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)

            logger.add(
                file_path,
                format=log_format.replace("<green>", "")
                .replace("</green>", "")
                .replace("<level>", "")
                .replace("</level>", "")
                .replace("<cyan>", "")
                .replace("</cyan>", ""),
                level=level,
                rotation=rotation,
                retention=retention,
                compression="zip",
                backtrace=True,
                diagnose=True,
            )

        # Add structured logging for trading events
        self._setup_trade_logging()

        self._initialized = True
        logger.info("Logging system initialized")

    def _setup_trade_logging(self) -> None:
        """Setup specialized logging for trading events."""
        # Trade log file
        trade_log_path = self._log_dir / "trades.log"
        self._log_dir.mkdir(exist_ok=True)

        logger.add(
            trade_log_path,
            format="{time:YYYY-MM-DD HH:mm:ss} | TRADE | {message}",
            level="INFO",
            rotation="1 week",
            retention="1 year",
            filter=lambda record: "TRADE" in record["extra"],
            compression="zip",
        )

        # Error log file
        error_log_path = self._log_dir / "errors.log"

        logger.add(
            error_log_path,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}",
            level="ERROR",
            rotation="1 week",
            retention="6 months",
            compression="zip",
        )

        # Performance log file
        performance_log_path = self._log_dir / "performance.log"

        logger.add(
            performance_log_path,
            format="{time:YYYY-MM-DD HH:mm:ss} | PERF | {message}",
            level="INFO",
            rotation="1 day",
            retention="30 days",
            filter=lambda record: "PERFORMANCE" in record["extra"],
            compression="zip",
        )

    def log_trade_event(
        self,
        event_type: str,
        symbol: str,
        action: str,
        quantity: float,
        price: float,
        order_id: Optional[str] = None,
        strategy: Optional[str] = None,
        **kwargs,
    ) -> None:
        """
        Log trading event with structured data.

        Args:
            event_type: Type of event (ORDER_PLACED, ORDER_FILLED, POSITION_OPENED, etc.)
            symbol: Stock symbol
            action: BUY or SELL
            quantity: Number of shares
            price: Execution price
            order_id: Order ID if available
            strategy: Strategy name
            **kwargs: Additional metadata
        """
        trade_data = {
            "event_type": event_type,
            "symbol": symbol,
            "action": action,
            "quantity": quantity,
            "price": price,
            "timestamp": datetime.now().isoformat(),
            "order_id": order_id,
            "strategy": strategy,
            **kwargs,
        }

        logger.bind(TRADE=True).info(
            f"{event_type} | {symbol} | {action} {quantity} @ ${price:.2f} | "
            f"Order: {order_id} | Strategy: {strategy}"
        )

    def log_performance_metric(
        self,
        metric_name: str,
        value: float,
        symbol: Optional[str] = None,
        strategy: Optional[str] = None,
        **kwargs,
    ) -> None:
        """
        Log performance metric.

        Args:
            metric_name: Name of the metric
            value: Metric value
            symbol: Stock symbol if applicable
            strategy: Strategy name if applicable
            **kwargs: Additional metadata
        """
        performance_data = {
            "metric": metric_name,
            "value": value,
            "symbol": symbol,
            "strategy": strategy,
            "timestamp": datetime.now().isoformat(),
            **kwargs,
        }

        logger.bind(PERFORMANCE=True).info(
            f"{metric_name}: {value} | Symbol: {symbol} | Strategy: {strategy}"
        )

    def log_error_with_context(
        self,
        error: Exception,
        context: Dict[str, Any],
        symbol: Optional[str] = None,
        operation: Optional[str] = None,
    ) -> None:
        """
        Log error with additional context.

        Args:
            error: Exception object
            context: Additional context information
            symbol: Stock symbol if applicable
            operation: Operation being performed
        """
        error_context = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "symbol": symbol,
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            **context,
        }

        logger.error(
            f"Error in {operation or 'unknown operation'} for {symbol or 'unknown symbol'}: "
            f"{error} | Context: {error_context}"
        )

    def log_signal(
        self,
        symbol: str,
        signal_type: str,
        strength: str,
        price: float,
        confidence: float,
        strategy: str,
        indicators: Dict[str, float],
        reason: str,
    ) -> None:
        """
        Log trading signal generation.

        Args:
            symbol: Stock symbol
            signal_type: Type of signal (BUY, SELL, HOLD)
            strength: Signal strength
            price: Current price
            confidence: Confidence level
            strategy: Strategy name
            indicators: Technical indicators
            reason: Signal reason
        """
        logger.info(
            f"SIGNAL | {symbol} | {signal_type} ({strength}) | "
            f"Price: ${price:.2f} | Confidence: {confidence:.2f} | "
            f"Strategy: {strategy} | Reason: {reason} | "
            f"Indicators: {indicators}"
        )

    def log_portfolio_update(
        self,
        total_value: float,
        cash: float,
        positions_count: int,
        daily_pnl: float,
        total_pnl: float,
    ) -> None:
        """
        Log portfolio status update.

        Args:
            total_value: Total portfolio value
            cash: Available cash
            positions_count: Number of open positions
            daily_pnl: Daily P&L
            total_pnl: Total P&L
        """
        logger.info(
            f"PORTFOLIO | Total: ${total_value:.2f} | Cash: ${cash:.2f} | "
            f"Positions: {positions_count} | Daily P&L: ${daily_pnl:.2f} | "
            f"Total P&L: ${total_pnl:.2f}"
        )

    def log_risk_event(
        self,
        event_type: str,
        symbol: Optional[str] = None,
        current_value: float = 0.0,
        threshold: float = 0.0,
        action_taken: Optional[str] = None,
    ) -> None:
        """
        Log risk management event.

        Args:
            event_type: Type of risk event
            symbol: Stock symbol if applicable
            current_value: Current value that triggered the event
            threshold: Risk threshold
            action_taken: Action taken in response
        """
        logger.warning(
            f"RISK | {event_type} | Symbol: {symbol} | "
            f"Value: {current_value:.4f} | Threshold: {threshold:.4f} | "
            f"Action: {action_taken or 'None'}"
        )

    def log_system_event(self, event_type: str, message: str, **kwargs) -> None:
        """
        Log system event.

        Args:
            event_type: Type of system event
            message: Event message
            **kwargs: Additional metadata
        """
        logger.info(f"SYSTEM | {event_type} | {message} | {kwargs}")

    def get_log_stats(self) -> Dict[str, Any]:
        """
        Get logging statistics.

        Returns:
            Dictionary with logging statistics
        """
        stats = {
            "log_directory": str(self._log_dir),
            "initialized": self._initialized,
            "handlers_count": len(self._handlers),
        }

        # Get log file sizes if they exist
        for log_file in self._log_dir.glob("*.log"):
            try:
                stats[f"{log_file.stem}_size_mb"] = log_file.stat().st_size / (
                    1024 * 1024
                )
            except Exception:
                pass

        return stats


# Global logger instance
trading_logger = TradingLogger()


def setup_logging(**kwargs) -> None:
    """Setup global logging configuration."""
    trading_logger.setup_logging(**kwargs)


def get_logger() -> Any:
    """Get the configured logger instance."""
    return logger


# Convenience functions
def log_trade(
    event_type: str, symbol: str, action: str, quantity: float, price: float, **kwargs
) -> None:
    """Log a trade event."""
    trading_logger.log_trade_event(
        event_type, symbol, action, quantity, price, **kwargs
    )


def log_signal(
    symbol: str,
    signal_type: str,
    strength: str,
    price: float,
    confidence: float,
    strategy: str,
    indicators: Dict[str, float],
    reason: str,
) -> None:
    """Log a trading signal."""
    trading_logger.log_signal(
        symbol, signal_type, strength, price, confidence, strategy, indicators, reason
    )


def log_portfolio(
    total_value: float,
    cash: float,
    positions_count: int,
    daily_pnl: float,
    total_pnl: float,
) -> None:
    """Log portfolio status."""
    trading_logger.log_portfolio_update(
        total_value, cash, positions_count, daily_pnl, total_pnl
    )


def log_risk(event_type: str, **kwargs) -> None:
    """Log a risk event."""
    trading_logger.log_risk_event(event_type, **kwargs)


def log_performance(metric_name: str, value: float, **kwargs) -> None:
    """Log a performance metric."""
    trading_logger.log_performance_metric(metric_name, value, **kwargs)
