from dotenv import load_dotenv
from pathlib import Path
import os

# Load .env file before importing settings
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

print(f"\n===== BACKEND STARTUP =====")
print(f".env path: {env_path}")
print(f".env exists: {env_path.exists()}")
print(f"API_TOKEN from env: {os.getenv('API_TOKEN', 'NOT_SET')}")
print(f"===========================\n", flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import health, settings as settings_router, portfolio, orders, stream

print(f"\n===== SETTINGS LOADED =====")
print(f"settings.API_TOKEN: {settings.API_TOKEN}")
print(f"===========================\n", flush=True)

app = FastAPI(title="AI Trader Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ALLOW_ORIGIN] if settings.ALLOW_ORIGIN else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(stream.router, prefix="/api")