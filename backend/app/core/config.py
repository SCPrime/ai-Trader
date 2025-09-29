from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import Optional

class Settings(BaseSettings):
    API_TOKEN: str = "change-me"
    ALLOW_ORIGIN: Optional[AnyHttpUrl] = None
    LIVE_TRADING: bool = False
    IDMP_TTL_SECONDS: int = 600

    class Config:
        env_file = ".env"

settings = Settings()