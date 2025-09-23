"""
Trading settings and control center management.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class TradingSettings:
    """Trading configuration settings."""

    # Position Management
    position_size: float = 0.02  # 2% of portfolio per trade
    max_positions: int = 5
    max_daily_trades: int = 20

    # Risk Management
    stop_loss_pct: float = 0.02  # 2% stop loss
    take_profit_pct: float = 0.04  # 4% take profit
    max_daily_loss: float = 0.05  # 5% max daily loss
    max_portfolio_risk: float = 0.10  # 10% max total portfolio risk

    # Trading Behavior
    paper_trading: bool = True
    require_confirmation: bool = True
    auto_execute_signals: bool = False
    enable_trailing_stops: bool = False
    trailing_stop_pct: float = 0.01  # 1% trailing stop

    # AI Settings
    ai_auto_mode: bool = True
    ai_confidence_threshold: float = 0.7  # Minimum confidence for AI trades
    use_ai_risk_adjustment: bool = True

    # Market Conditions
    enable_market_hours_only: bool = True
    enable_pre_market: bool = False
    enable_after_hours: bool = False

    # Technical Indicators
    rsi_period: int = 14
    rsi_oversold: float = 30.0
    rsi_overbought: float = 70.0
    macd_fast: int = 12
    macd_slow: int = 26
    macd_signal: int = 9
    sma_short: int = 20
    sma_long: int = 50

    # Advanced Settings
    enable_options_trading: bool = False
    enable_crypto_trading: bool = False
    enable_forex_trading: bool = False
    slippage_tolerance: float = 0.001  # 0.1% slippage tolerance

    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        if self.created_at:
            data["created_at"] = self.created_at.isoformat()
        if self.updated_at:
            data["updated_at"] = self.updated_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TradingSettings":
        """Create from dictionary."""
        if "created_at" in data and data["created_at"]:
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data and data["updated_at"]:
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return cls(**data)


class SettingsManager:
    """Manages trading settings and provides control center functionality."""

    def __init__(self, settings_file: str = "config/trading_settings.json"):
        """
        Initialize settings manager.

        Args:
            settings_file: Path to settings file
        """
        self.settings_file = Path(settings_file)
        self.settings_file.parent.mkdir(exist_ok=True)
        self.current_settings = TradingSettings()
        self.settings_history: List[TradingSettings] = []
        self.load_settings()

    def load_settings(self) -> TradingSettings:
        """Load settings from file."""
        try:
            if self.settings_file.exists():
                with open(self.settings_file, "r") as f:
                    data = json.load(f)
                self.current_settings = TradingSettings.from_dict(data)
                logger.info(f"Loaded settings from {self.settings_file}")
            else:
                logger.info("No settings file found, using defaults")
                self.save_settings()
        except Exception as e:
            logger.error(f"Failed to load settings: {e}")
            self.current_settings = TradingSettings()

        return self.current_settings

    def save_settings(self):
        """Save current settings to file."""
        try:
            self.current_settings.updated_at = datetime.now()
            with open(self.settings_file, "w") as f:
                json.dump(self.current_settings.to_dict(), f, indent=2)
            logger.info(f"Settings saved to {self.settings_file}")
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")

    def update_settings(self, updates: Dict[str, Any]) -> TradingSettings:
        """
        Update settings with new values.

        Args:
            updates: Dictionary of settings to update

        Returns:
            Updated settings
        """
        # Store current settings in history
        self.settings_history.append(
            TradingSettings.from_dict(self.current_settings.to_dict())
        )

        # Update current settings
        for key, value in updates.items():
            if hasattr(self.current_settings, key):
                setattr(self.current_settings, key, value)
                logger.info(f"Updated setting {key}: {value}")
            else:
                logger.warning(f"Unknown setting: {key}")

        self.current_settings.updated_at = datetime.now()
        self.save_settings()
        return self.current_settings

    def reset_to_defaults(self) -> TradingSettings:
        """Reset settings to defaults."""
        self.settings_history.append(
            TradingSettings.from_dict(self.current_settings.to_dict())
        )
        self.current_settings = TradingSettings()
        self.save_settings()
        logger.info("Settings reset to defaults")
        return self.current_settings

    def get_risk_summary(self) -> Dict[str, Any]:
        """Get risk management summary."""
        return {
            "position_size_pct": self.current_settings.position_size * 100,
            "stop_loss_pct": self.current_settings.stop_loss_pct * 100,
            "take_profit_pct": self.current_settings.take_profit_pct * 100,
            "max_daily_loss_pct": self.current_settings.max_daily_loss * 100,
            "max_portfolio_risk_pct": self.current_settings.max_portfolio_risk * 100,
            "max_positions": self.current_settings.max_positions,
            "trailing_stops_enabled": self.current_settings.enable_trailing_stops,
            "trailing_stop_pct": self.current_settings.trailing_stop_pct * 100,
        }

    def get_ai_summary(self) -> Dict[str, Any]:
        """Get AI settings summary."""
        return {
            "ai_auto_mode": self.current_settings.ai_auto_mode,
            "confidence_threshold": self.current_settings.ai_confidence_threshold,
            "auto_execute": self.current_settings.auto_execute_signals,
            "risk_adjustment": self.current_settings.use_ai_risk_adjustment,
            "require_confirmation": self.current_settings.require_confirmation,
        }

    def get_indicator_summary(self) -> Dict[str, Any]:
        """Get technical indicator settings summary."""
        return {
            "rsi": {
                "period": self.current_settings.rsi_period,
                "oversold": self.current_settings.rsi_oversold,
                "overbought": self.current_settings.rsi_overbought,
            },
            "macd": {
                "fast": self.current_settings.macd_fast,
                "slow": self.current_settings.macd_slow,
                "signal": self.current_settings.macd_signal,
            },
            "moving_averages": {
                "short": self.current_settings.sma_short,
                "long": self.current_settings.sma_long,
            },
        }

    def validate_settings(self) -> List[str]:
        """Validate current settings and return any warnings."""
        warnings = []

        # Risk validation
        if self.current_settings.stop_loss_pct > 0.10:
            warnings.append("Stop loss > 10% is very high risk")

        if self.current_settings.position_size > 0.10:
            warnings.append("Position size > 10% is very high risk")

        if self.current_settings.max_daily_loss > 0.20:
            warnings.append("Max daily loss > 20% is extremely high risk")

        # Logic validation
        if self.current_settings.stop_loss_pct >= self.current_settings.take_profit_pct:
            warnings.append("Stop loss should be less than take profit")

        if self.current_settings.ai_confidence_threshold < 0.5:
            warnings.append(
                "AI confidence threshold < 50% may execute many low-quality trades"
            )

        # Indicator validation
        if self.current_settings.rsi_oversold >= self.current_settings.rsi_overbought:
            warnings.append("RSI oversold level should be less than overbought level")

        if self.current_settings.sma_short >= self.current_settings.sma_long:
            warnings.append("Short SMA period should be less than long SMA period")

        return warnings

    def get_settings_comparison(
        self, other_settings: TradingSettings
    ) -> Dict[str, Dict[str, Any]]:
        """Compare current settings with another settings object."""
        current_dict = self.current_settings.to_dict()
        other_dict = other_settings.to_dict()

        differences = {}
        for key in current_dict:
            if key not in ["created_at", "updated_at"]:
                if current_dict[key] != other_dict.get(key):
                    differences[key] = {
                        "current": current_dict[key],
                        "other": other_dict.get(key),
                        "changed": True,
                    }

        return differences

    def export_settings(self) -> str:
        """Export settings as JSON string."""
        return json.dumps(self.current_settings.to_dict(), indent=2)

    def import_settings(self, settings_json: str) -> bool:
        """
        Import settings from JSON string.

        Args:
            settings_json: JSON string containing settings

        Returns:
            True if successful, False otherwise
        """
        try:
            data = json.loads(settings_json)
            self.settings_history.append(
                TradingSettings.from_dict(self.current_settings.to_dict())
            )
            self.current_settings = TradingSettings.from_dict(data)
            self.save_settings()
            logger.info("Settings imported successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to import settings: {e}")
            return False

    def get_preset_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Get preset trading configurations."""
        return {
            "conservative": {
                "name": "Conservative Trading",
                "description": "Low risk, small positions, tight stops",
                "settings": {
                    "position_size": 0.01,  # 1%
                    "stop_loss_pct": 0.015,  # 1.5%
                    "take_profit_pct": 0.03,  # 3%
                    "max_daily_loss": 0.02,  # 2%
                    "max_positions": 3,
                    "ai_confidence_threshold": 0.8,
                },
            },
            "moderate": {
                "name": "Moderate Trading",
                "description": "Balanced risk and reward",
                "settings": {
                    "position_size": 0.02,  # 2%
                    "stop_loss_pct": 0.02,  # 2%
                    "take_profit_pct": 0.04,  # 4%
                    "max_daily_loss": 0.05,  # 5%
                    "max_positions": 5,
                    "ai_confidence_threshold": 0.7,
                },
            },
            "aggressive": {
                "name": "Aggressive Trading",
                "description": "Higher risk, larger positions, wider stops",
                "settings": {
                    "position_size": 0.05,  # 5%
                    "stop_loss_pct": 0.03,  # 3%
                    "take_profit_pct": 0.06,  # 6%
                    "max_daily_loss": 0.10,  # 10%
                    "max_positions": 8,
                    "ai_confidence_threshold": 0.6,
                },
            },
            "scalping": {
                "name": "Scalping Strategy",
                "description": "Quick trades, tight stops, high frequency",
                "settings": {
                    "position_size": 0.03,  # 3%
                    "stop_loss_pct": 0.005,  # 0.5%
                    "take_profit_pct": 0.01,  # 1%
                    "max_daily_loss": 0.03,  # 3%
                    "max_positions": 10,
                    "max_daily_trades": 50,
                    "enable_trailing_stops": True,
                    "trailing_stop_pct": 0.003,  # 0.3%
                },
            },
            "swing_trading": {
                "name": "Swing Trading",
                "description": "Longer holds, wider stops, fewer trades",
                "settings": {
                    "position_size": 0.04,  # 4%
                    "stop_loss_pct": 0.05,  # 5%
                    "take_profit_pct": 0.10,  # 10%
                    "max_daily_loss": 0.08,  # 8%
                    "max_positions": 3,
                    "max_daily_trades": 5,
                    "enable_trailing_stops": True,
                    "trailing_stop_pct": 0.02,  # 2%
                },
            },
        }

    def apply_preset(self, preset_name: str) -> bool:
        """
        Apply a preset configuration.

        Args:
            preset_name: Name of the preset to apply

        Returns:
            True if successful, False otherwise
        """
        presets = self.get_preset_configurations()
        if preset_name not in presets:
            logger.error(f"Unknown preset: {preset_name}")
            return False

        try:
            self.update_settings(presets[preset_name]["settings"])
            logger.info(f"Applied preset: {preset_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to apply preset {preset_name}: {e}")
            return False
