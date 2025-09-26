import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

class ConfigManager:
    """Manage configurations for different environments"""

    def __init__(self):
        self.environment = os.getenv('ENVIRONMENT', 'local')
        self.load_config()

    def load_config(self) -> Dict[str, Any]:
        """Load config based on environment"""

        # Load base .env
        load_dotenv()

        # Load environment-specific config
        config_path = f"config/environments/{self.environment}.json"

        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = self.get_default_config()

        # SAFETY: Force paper trading in all environments
        self.config['trading_mode'] = 'paper'

        # Load secrets from environment variables
        self.load_secrets()

        return self.config

    def load_secrets(self):
        """Load secrets from environment variables"""
        # These come from .env locally or Vercel env vars
        self.config['alpaca_key'] = os.getenv('ALPACA_API_KEY_ID')
        self.config['alpaca_secret'] = os.getenv('ALPACA_API_SECRET_KEY')
        self.config['alpaca_base'] = 'https://paper-api.alpaca.markets'  # ALWAYS PAPER

    def get_default_config(self) -> Dict[str, Any]:
        """Default safe configuration"""
        return {
            "name": "default",
            "trading_mode": "paper",
            "debug": False,
            "max_risk": 100,
            "force_paper": True
        }

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == 'production' or os.getenv('VERCEL') is not None

    def get_base_url(self) -> str:
        """Get appropriate base URL"""
        if self.is_production():
            return os.getenv('VERCEL_URL', 'https://your-app.vercel.app')
        return 'http://localhost:8002'

# Singleton
config = ConfigManager()