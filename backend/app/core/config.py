from pydantic import BaseModel, AnyHttpUrl
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file BEFORE reading env vars (works even when imported directly)
ENV_PATH = Path(__file__).parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

class Settings(BaseModel):
    # Read directly from environment variables (loaded above)
    API_TOKEN: str = os.getenv("API_TOKEN", "change-me")
    ALLOW_ORIGIN: Optional[str] = os.getenv("ALLOW_ORIGIN")
    LIVE_TRADING: bool = os.getenv("LIVE_TRADING", "false").lower() == "true"
    IDMP_TTL_SECONDS: int = int(os.getenv("IDMP_TTL_SECONDS", "600"))

    # Alpaca API credentials
    ALPACA_API_KEY: str = os.getenv("ALPACA_PAPER_API_KEY", "")
    ALPACA_SECRET_KEY: str = os.getenv("ALPACA_PAPER_SECRET_KEY", "")
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"

settings = Settings()