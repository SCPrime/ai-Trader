"""
Configuration management system for the trading bot.
"""

import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)


class AlpacaConfig(BaseModel):
    """Alpaca API configuration."""
    api_key: str = Field(..., description="Alpaca API key")
    secret_key: str = Field(..., description="Alpaca secret key")
    paper_trading: bool = Field(True, description="Use paper trading")
    base_url: Optional[str] = Field(None, description="Custom base URL")


class TradingConfig(BaseModel):
    """Trading strategy configuration."""
    max_positions: int = Field(5, description="Maximum number of positions")
    position_size: float = Field(0.02, description="Position size as fraction of portfolio")
    stop_loss_pct: float = Field(0.02, description="Stop loss percentage")
    take_profit_pct: float = Field(0.04, description="Take profit percentage")
    max_daily_trades: int = Field(10, description="Maximum trades per day")
    trade_frequency: int = Field(60, description="Trade frequency in seconds")


class RSIConfig(BaseModel):
    """RSI strategy configuration."""
    period: int = Field(14, description="RSI calculation period")
    oversold: float = Field(30.0, description="Oversold threshold")
    overbought: float = Field(70.0, description="Overbought threshold")
    use_divergence: bool = Field(True, description="Enable divergence detection")
    use_volume_filter: bool = Field(True, description="Enable volume filtering")
    min_volume_ratio: float = Field(1.5, description="Minimum volume ratio")


class RiskConfig(BaseModel):
    """Risk management configuration."""
    max_daily_loss: float = Field(0.05, description="Maximum daily loss percentage")
    max_portfolio_risk: float = Field(0.10, description="Maximum portfolio risk")
    max_single_position: float = Field(0.05, description="Maximum single position size")
    require_confirmation: bool = Field(True, description="Require trade confirmation")
    emergency_stop: bool = Field(False, description="Emergency stop flag")


class AIConfig(BaseModel):
    """AI integration configuration."""
    anthropic_api_key: str = Field(..., description="Anthropic API key")
    model: str = Field("claude-3-sonnet-20240229", description="Claude model to use")
    max_tokens: int = Field(1000, description="Maximum tokens per request")
    temperature: float = Field(0.1, description="Model temperature")
    use_ai_analysis: bool = Field(True, description="Enable AI trade analysis")


class NotificationConfig(BaseModel):
    """Notification configuration."""
    discord_webhook: Optional[str] = Field(None, description="Discord webhook URL")
    slack_token: Optional[str] = Field(None, description="Slack bot token")
    slack_channel: Optional[str] = Field(None, description="Slack channel")
    email_enabled: bool = Field(False, description="Enable email notifications")
    notification_level: str = Field("INFO", description="Notification level")


class DatabaseConfig(BaseModel):
    """Database configuration."""
    url: str = Field("sqlite:///trading_bot.db", description="Database URL")
    echo: bool = Field(False, description="Echo SQL queries")
    pool_size: int = Field(5, description="Connection pool size")
    max_overflow: int = Field(10, description="Max overflow connections")


class LoggingConfig(BaseModel):
    """Logging configuration."""
    level: str = Field("INFO", description="Log level")
    format: str = Field(
        "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}",
        description="Log format"
    )
    rotation: str = Field("1 day", description="Log rotation")
    retention: str = Field("30 days", description="Log retention")
    file_path: str = Field("logs/trading_bot.log", description="Log file path")


class Config(BaseModel):
    """Main configuration class."""
    alpaca: AlpacaConfig
    trading: TradingConfig = TradingConfig()
    rsi: RSIConfig = RSIConfig()
    risk: RiskConfig = RiskConfig()
    ai: AIConfig
    notifications: NotificationConfig = NotificationConfig()
    database: DatabaseConfig = DatabaseConfig()
    logging: LoggingConfig = LoggingConfig()

    @validator('alpaca', pre=True)
    def validate_alpaca_config(cls, v):
        if isinstance(v, dict):
            return AlpacaConfig(**v)
        return v

    @validator('ai', pre=True)
    def validate_ai_config(cls, v):
        if isinstance(v, dict):
            return AIConfig(**v)
        return v


class ConfigManager:
    """Configuration manager for loading and managing settings."""

    def __init__(self, config_path: Optional[str] = None, env_file: Optional[str] = None):
        """
        Initialize configuration manager.

        Args:
            config_path: Path to YAML configuration file
            env_file: Path to environment file
        """
        self.config_path = config_path or self._find_config_file()
        self.env_file = env_file or ".env"
        self._config: Optional[Config] = None

        # Load environment variables
        if os.path.exists(self.env_file):
            load_dotenv(self.env_file)

    def _find_config_file(self) -> str:
        """Find configuration file."""
        possible_paths = [
            "config/settings.yaml",
            "settings.yaml",
            "config.yaml"
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path

        return "config/settings.yaml"

    def load_config(self) -> Config:
        """
        Load configuration from file and environment variables.

        Returns:
            Loaded configuration
        """
        if self._config is not None:
            return self._config

        # Load from YAML file if it exists
        config_data = {}
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    config_data = yaml.safe_load(f) or {}
            except Exception as e:
                logger.warning(f"Failed to load config file {self.config_path}: {e}")

        # Override with environment variables
        config_data = self._merge_env_vars(config_data)

        try:
            self._config = Config(**config_data)
            logger.info(f"Configuration loaded successfully from {self.config_path}")
            return self._config
        except Exception as e:
            logger.error(f"Failed to validate configuration: {e}")
            raise

    def _merge_env_vars(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge environment variables into configuration.

        Args:
            config_data: Base configuration data

        Returns:
            Merged configuration data
        """
        # Initialize nested dictionaries
        if 'alpaca' not in config_data:
            config_data['alpaca'] = {}
        if 'ai' not in config_data:
            config_data['ai'] = {}

        # Alpaca configuration from environment
        env_mappings = {
            'ALPACA_API_KEY': ('alpaca', 'api_key'),
            'ALPACA_SECRET_KEY': ('alpaca', 'secret_key'),
            'ALPACA_PAPER_TRADING': ('alpaca', 'paper_trading'),
            'ALPACA_BASE_URL': ('alpaca', 'base_url'),
            'ANTHROPIC_API_KEY': ('ai', 'anthropic_api_key'),
            'AI_MODEL': ('ai', 'model'),
            'MAX_POSITIONS': ('trading', 'max_positions'),
            'POSITION_SIZE': ('trading', 'position_size'),
            'STOP_LOSS_PCT': ('trading', 'stop_loss_pct'),
            'TAKE_PROFIT_PCT': ('trading', 'take_profit_pct'),
            'RSI_PERIOD': ('rsi', 'period'),
            'RSI_OVERSOLD': ('rsi', 'oversold'),
            'RSI_OVERBOUGHT': ('rsi', 'overbought'),
            'MAX_DAILY_LOSS': ('risk', 'max_daily_loss'),
            'DISCORD_WEBHOOK': ('notifications', 'discord_webhook'),
            'SLACK_TOKEN': ('notifications', 'slack_token'),
            'SLACK_CHANNEL': ('notifications', 'slack_channel'),
            'DATABASE_URL': ('database', 'url'),
            'LOG_LEVEL': ('logging', 'level')
        }

        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                if section not in config_data:
                    config_data[section] = {}

                # Type conversion
                if env_var in ['ALPACA_PAPER_TRADING']:
                    value = value.lower() in ('true', '1', 'yes')
                elif env_var in ['MAX_POSITIONS', 'RSI_PERIOD']:
                    value = int(value)
                elif env_var in ['POSITION_SIZE', 'STOP_LOSS_PCT', 'TAKE_PROFIT_PCT',
                               'RSI_OVERSOLD', 'RSI_OVERBOUGHT', 'MAX_DAILY_LOSS']:
                    value = float(value)

                config_data[section][key] = value

        return config_data

    def get_config(self) -> Config:
        """Get current configuration, loading if necessary."""
        if self._config is None:
            return self.load_config()
        return self._config

    def reload_config(self) -> Config:
        """Reload configuration from file."""
        self._config = None
        return self.load_config()

    def update_config(self, updates: Dict[str, Any]) -> None:
        """
        Update configuration values.

        Args:
            updates: Dictionary of updates to apply
        """
        if self._config is None:
            self.load_config()

        # Apply updates
        for key, value in updates.items():
            if hasattr(self._config, key):
                setattr(self._config, key, value)

        logger.info("Configuration updated")

    def save_config(self, path: Optional[str] = None) -> None:
        """
        Save current configuration to file.

        Args:
            path: Optional path to save to
        """
        if self._config is None:
            raise ValueError("No configuration loaded")

        save_path = path or self.config_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        config_dict = self._config.dict()

        try:
            with open(save_path, 'w') as f:
                yaml.dump(config_dict, f, default_flow_style=False, indent=2)
            logger.info(f"Configuration saved to {save_path}")
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            raise


# Global configuration instance
config_manager = ConfigManager()


def get_config() -> Config:
    """Get the global configuration instance."""
    return config_manager.get_config()


def reload_config() -> Config:
    """Reload the global configuration."""
    return config_manager.reload_config()