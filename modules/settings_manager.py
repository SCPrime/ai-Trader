import json
from typing import Dict, Any

class SettingsManager:
    """Manage all configurable settings"""

    def __init__(self):
        self.settings_file = 'config/trading_settings.json'
        self.settings = self.load_settings()

    def load_settings(self) -> Dict[str, Any]:
        """Load settings from file"""
        try:
            with open(self.settings_file, 'r') as f:
                return json.load(f)
        except:
            return self.default_settings()

    def save_settings(self):
        """Save current settings"""
        with open(self.settings_file, 'w') as f:
            json.dump(self.settings, f, indent=2)

    def update_setting(self, category: str, key: str, value: Any):
        """Update specific setting"""
        if category not in self.settings:
            self.settings[category] = {}
        self.settings[category][key] = value
        self.save_settings()

    def default_settings(self) -> Dict[str, Any]:
        return {
            'trading': {
                'mode': 'paper',
                'auto_trade': False,
                'confirm_trades': True,
                'max_position_size': 10000,
                'max_daily_trades': 50
            },
            'risk': {
                'stop_loss_percent': 2.0,
                'take_profit_percent': 5.0,
                'max_portfolio_risk': 20.0,
                'position_sizing': 'kelly'
            },
            'technical': {
                'rsi_period': 14,
                'rsi_oversold': 30,
                'rsi_overbought': 70,
                'macd_fast': 12,
                'macd_slow': 26,
                'macd_signal': 9,
                'sma_short': 20,
                'sma_long': 50
            },
            'options': {
                'enabled': True,
                'level': 2,
                'max_contracts': 10,
                'strategies': ['covered_call', 'cash_secured_put', 'spreads'],
                'min_volume': 100,
                'min_open_interest': 50
            },
            'news': {
                'enabled': True,
                'sources': ['yahoo', 'benzinga', 'finnhub'],
                'sentiment_analysis': True,
                'alert_keywords': ['earnings', 'FDA', 'merger', 'bankruptcy']
            },
            'alerts': {
                'email': False,
                'sms': False,
                'desktop': True,
                'webhook': ''
            }
        }

    def get_all_settings(self):
        """Get all current settings"""
        return self.settings

    def reset_to_defaults(self):
        """Reset all settings to defaults"""
        self.settings = self.default_settings()
        self.save_settings()