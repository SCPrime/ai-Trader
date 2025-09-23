"""
Input validation utilities for the trading bot.
"""

import re
from typing import List, Optional, Union, Any
from decimal import Decimal, InvalidOperation
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error."""

    pass


class Validators:
    """Collection of validation utilities."""

    # Stock symbol pattern (US markets)
    SYMBOL_PATTERN = re.compile(r"^[A-Z]{1,5}$")

    # API key patterns
    ALPACA_API_KEY_PATTERN = re.compile(r"^[A-Z0-9]{20}$")
    ALPACA_SECRET_KEY_PATTERN = re.compile(r"^[A-Za-z0-9/+=]{40}$")

    @staticmethod
    def validate_symbol(symbol: str) -> str:
        """
        Validate stock symbol format.

        Args:
            symbol: Stock symbol to validate

        Returns:
            Validated symbol in uppercase

        Raises:
            ValidationError: If symbol format is invalid
        """
        if not isinstance(symbol, str):
            raise ValidationError("Symbol must be a string")

        symbol = symbol.upper().strip()

        if not symbol:
            raise ValidationError("Symbol cannot be empty")

        if len(symbol) > 5:
            raise ValidationError("Symbol cannot be longer than 5 characters")

        if not Validators.SYMBOL_PATTERN.match(symbol):
            raise ValidationError(f"Invalid symbol format: {symbol}")

        return symbol

    @staticmethod
    def validate_symbols(symbols: Union[str, List[str]]) -> List[str]:
        """
        Validate multiple stock symbols.

        Args:
            symbols: Single symbol or list of symbols

        Returns:
            List of validated symbols

        Raises:
            ValidationError: If any symbol is invalid
        """
        if isinstance(symbols, str):
            symbols = [s.strip() for s in symbols.split(",") if s.strip()]

        if not symbols:
            raise ValidationError("At least one symbol must be provided")

        validated_symbols = []
        for symbol in symbols:
            validated_symbols.append(Validators.validate_symbol(symbol))

        # Remove duplicates while preserving order
        unique_symbols = []
        for symbol in validated_symbols:
            if symbol not in unique_symbols:
                unique_symbols.append(symbol)

        return unique_symbols

    @staticmethod
    def validate_price(price: Union[str, int, float, Decimal]) -> Decimal:
        """
        Validate price value.

        Args:
            price: Price to validate

        Returns:
            Validated price as Decimal

        Raises:
            ValidationError: If price is invalid
        """
        try:
            if isinstance(price, str):
                # Remove currency symbols and whitespace
                price = re.sub(r"[$,\s]", "", price)

            decimal_price = Decimal(str(price))

            if decimal_price <= 0:
                raise ValidationError("Price must be positive")

            if decimal_price > Decimal("999999.99"):
                raise ValidationError("Price is too large")

            # Round to 2 decimal places for currency
            return decimal_price.quantize(Decimal("0.01"))

        except (InvalidOperation, ValueError) as e:
            raise ValidationError(f"Invalid price format: {price}")

    @staticmethod
    def validate_quantity(quantity: Union[str, int, float]) -> int:
        """
        Validate share quantity.

        Args:
            quantity: Quantity to validate

        Returns:
            Validated quantity as integer

        Raises:
            ValidationError: If quantity is invalid
        """
        try:
            if isinstance(quantity, str):
                quantity = quantity.strip()

            qty = int(float(quantity))

            if qty <= 0:
                raise ValidationError("Quantity must be positive")

            if qty > 1000000:
                raise ValidationError("Quantity is too large")

            return qty

        except ValueError:
            raise ValidationError(f"Invalid quantity format: {quantity}")

    @staticmethod
    def validate_percentage(
        percentage: Union[str, int, float], min_val: float = 0.0, max_val: float = 100.0
    ) -> float:
        """
        Validate percentage value.

        Args:
            percentage: Percentage to validate
            min_val: Minimum allowed value
            max_val: Maximum allowed value

        Returns:
            Validated percentage as float

        Raises:
            ValidationError: If percentage is invalid
        """
        try:
            if isinstance(percentage, str):
                # Remove percentage symbol
                percentage = percentage.replace("%", "").strip()

            pct = float(percentage)

            if pct < min_val or pct > max_val:
                raise ValidationError(
                    f"Percentage must be between {min_val}% and {max_val}%"
                )

            return pct

        except ValueError:
            raise ValidationError(f"Invalid percentage format: {percentage}")

    @staticmethod
    def validate_api_key(api_key: str, key_type: str = "alpaca") -> str:
        """
        Validate API key format.

        Args:
            api_key: API key to validate
            key_type: Type of API key ('alpaca', 'anthropic')

        Returns:
            Validated API key

        Raises:
            ValidationError: If API key is invalid
        """
        if not isinstance(api_key, str):
            raise ValidationError("API key must be a string")

        api_key = api_key.strip()

        if not api_key:
            raise ValidationError("API key cannot be empty")

        if key_type.lower() == "alpaca":
            if not Validators.ALPACA_API_KEY_PATTERN.match(api_key):
                raise ValidationError("Invalid Alpaca API key format")

        elif key_type.lower() == "anthropic":
            if not api_key.startswith("sk-") or len(api_key) < 20:
                raise ValidationError("Invalid Anthropic API key format")

        return api_key

    @staticmethod
    def validate_timeframe(timeframe: str) -> str:
        """
        Validate trading timeframe.

        Args:
            timeframe: Timeframe to validate

        Returns:
            Validated timeframe

        Raises:
            ValidationError: If timeframe is invalid
        """
        valid_timeframes = [
            "1Min",
            "5Min",
            "15Min",
            "30Min",
            "1Hour",
            "4Hour",
            "1Day",
            "1Week",
            "1Month",
        ]

        if timeframe not in valid_timeframes:
            raise ValidationError(
                f"Invalid timeframe. Must be one of: {', '.join(valid_timeframes)}"
            )

        return timeframe

    @staticmethod
    def validate_strategy(strategy: str) -> str:
        """
        Validate trading strategy name.

        Args:
            strategy: Strategy name to validate

        Returns:
            Validated strategy name

        Raises:
            ValidationError: If strategy is invalid
        """
        valid_strategies = ["rsi", "macd", "sma", "ema", "bollinger"]

        strategy = strategy.lower().strip()

        if strategy not in valid_strategies:
            raise ValidationError(
                f"Invalid strategy. Must be one of: {', '.join(valid_strategies)}"
            )

        return strategy

    @staticmethod
    def validate_risk_percentage(risk_pct: Union[str, float]) -> float:
        """
        Validate risk percentage (0.01% to 10%).

        Args:
            risk_pct: Risk percentage to validate

        Returns:
            Validated risk percentage as decimal (e.g., 0.02 for 2%)

        Raises:
            ValidationError: If risk percentage is invalid
        """
        pct = Validators.validate_percentage(risk_pct, min_val=0.01, max_val=10.0)
        return pct / 100.0  # Convert to decimal

    @staticmethod
    def validate_date_range(
        start_date: Optional[str], end_date: Optional[str]
    ) -> tuple:
        """
        Validate date range for historical data.

        Args:
            start_date: Start date string (YYYY-MM-DD)
            end_date: End date string (YYYY-MM-DD)

        Returns:
            Tuple of (start_datetime, end_datetime)

        Raises:
            ValidationError: If date range is invalid
        """
        date_format = "%Y-%m-%d"

        try:
            if start_date:
                start_dt = datetime.strptime(start_date, date_format)
            else:
                start_dt = None

            if end_date:
                end_dt = datetime.strptime(end_date, date_format)
            else:
                end_dt = None

            # Validate date range
            if start_dt and end_dt:
                if start_dt >= end_dt:
                    raise ValidationError("Start date must be before end date")

                # Check if range is too large (max 2 years)
                days_diff = (end_dt - start_dt).days
                if days_diff > 730:
                    raise ValidationError("Date range cannot exceed 2 years")

            return start_dt, end_dt

        except ValueError as e:
            raise ValidationError(f"Invalid date format. Use YYYY-MM-DD: {e}")

    @staticmethod
    def validate_position_size(
        position_size: Union[str, float], min_size: float = 0.001, max_size: float = 1.0
    ) -> float:
        """
        Validate position size as fraction of portfolio.

        Args:
            position_size: Position size to validate
            min_size: Minimum position size (default 0.1%)
            max_size: Maximum position size (default 100%)

        Returns:
            Validated position size as decimal

        Raises:
            ValidationError: If position size is invalid
        """
        try:
            if isinstance(position_size, str):
                position_size = position_size.strip()

            size = float(position_size)

            if size < min_size or size > max_size:
                raise ValidationError(
                    f"Position size must be between {min_size:.3f} and {max_size:.3f}"
                )

            return size

        except ValueError:
            raise ValidationError(f"Invalid position size format: {position_size}")

    @staticmethod
    def validate_order_side(side: str) -> str:
        """
        Validate order side (buy/sell).

        Args:
            side: Order side to validate

        Returns:
            Validated order side

        Raises:
            ValidationError: If order side is invalid
        """
        valid_sides = ["buy", "sell"]

        side = side.lower().strip()

        if side not in valid_sides:
            raise ValidationError(
                f"Invalid order side. Must be one of: {', '.join(valid_sides)}"
            )

        return side

    @staticmethod
    def validate_configuration(config: dict) -> dict:
        """
        Validate complete configuration dictionary.

        Args:
            config: Configuration dictionary to validate

        Returns:
            Validated configuration dictionary

        Raises:
            ValidationError: If configuration is invalid
        """
        validated_config = {}

        # Required fields
        required_fields = ["alpaca_api_key", "alpaca_secret_key"]

        for field in required_fields:
            if field not in config:
                raise ValidationError(f"Missing required configuration field: {field}")

        # Validate API keys
        try:
            validated_config["alpaca_api_key"] = Validators.validate_api_key(
                config["alpaca_api_key"], "alpaca"
            )
            validated_config["alpaca_secret_key"] = config["alpaca_secret_key"]
        except ValidationError as e:
            raise ValidationError(f"Invalid API configuration: {e}")

        # Validate optional fields with defaults
        optional_fields = {
            "paper_trading": True,
            "max_positions": 10,
            "position_size": 0.02,
            "stop_loss_pct": 0.02,
            "take_profit_pct": 0.06,
            "max_daily_loss": 0.05,
        }

        for field, default_value in optional_fields.items():
            value = config.get(field, default_value)

            if field.endswith("_pct") or field in ["position_size", "max_daily_loss"]:
                validated_config[field] = (
                    Validators.validate_risk_percentage(value * 100)
                    if value < 1
                    else Validators.validate_risk_percentage(value)
                )
            elif field in ["max_positions"]:
                validated_config[field] = Validators.validate_quantity(value)
            else:
                validated_config[field] = value

        return validated_config


# Decorator for input validation
def validate_inputs(**validators):
    """
    Decorator for validating function inputs.

    Args:
        **validators: Dictionary of parameter_name: validator_function pairs

    Example:
        @validate_inputs(symbol=Validators.validate_symbol, price=Validators.validate_price)
        def place_order(symbol, price, quantity):
            pass
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            import inspect

            # Get function signature
            sig = inspect.signature(func)
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()

            # Validate each parameter
            for param_name, validator in validators.items():
                if param_name in bound_args.arguments:
                    value = bound_args.arguments[param_name]
                    try:
                        validated_value = validator(value)
                        bound_args.arguments[param_name] = validated_value
                    except ValidationError as e:
                        logger.error(
                            f"Validation error for parameter '{param_name}': {e}"
                        )
                        raise

            return func(*bound_args.args, **bound_args.kwargs)

        return wrapper

    return decorator


# Utility functions
def sanitize_symbol_list(symbols: str) -> List[str]:
    """
    Sanitize and validate a comma-separated string of symbols.

    Args:
        symbols: Comma-separated string of symbols

    Returns:
        List of validated symbols
    """
    try:
        return Validators.validate_symbols(symbols)
    except ValidationError as e:
        logger.error(f"Symbol validation error: {e}")
        return []


def is_valid_price(price: Any) -> bool:
    """
    Check if a price value is valid without raising an exception.

    Args:
        price: Price to check

    Returns:
        True if price is valid, False otherwise
    """
    try:
        Validators.validate_price(price)
        return True
    except ValidationError:
        return False


def is_valid_symbol(symbol: Any) -> bool:
    """
    Check if a symbol is valid without raising an exception.

    Args:
        symbol: Symbol to check

    Returns:
        True if symbol is valid, False otherwise
    """
    try:
        Validators.validate_symbol(symbol)
        return True
    except ValidationError:
        return False
