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
print(f"Deployed from: main branch (auto-deploy test)")
print(f"===========================\n", flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import health, settings as settings_router, portfolio, orders, stream, screening, market, ai, telemetry, strategies, scheduler, claude, market_data, news
from .scheduler import init_scheduler
import atexit

print(f"\n===== SETTINGS LOADED =====")
print(f"settings.API_TOKEN: {settings.API_TOKEN}")
print(f"===========================\n", flush=True)

app = FastAPI(
    title="PaiiD Trading API",
    description="Personal Artificial Intelligence Investment Dashboard",
    version="1.0.0"
)

# Initialize scheduler on startup
@app.on_event("startup")
async def startup_event():
    try:
        scheduler_instance = init_scheduler()
        print("[OK] Scheduler initialized and started", flush=True)
    except Exception as e:
        print(f"[ERROR] Failed to initialize scheduler: {str(e)}", flush=True)

# Shutdown scheduler gracefully
@app.on_event("shutdown")
async def shutdown_event():
    try:
        from .scheduler import get_scheduler
        scheduler_instance = get_scheduler()
        scheduler_instance.shutdown()
        print("[OK] Scheduler shut down gracefully", flush=True)
    except Exception as e:
        print(f"[ERROR] Scheduler shutdown error: {str(e)}", flush=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://paiid-snowy.vercel.app",
        "https://paiid-scprimes-projects.vercel.app",
        "https://paiid-git-main-scprimes-projects.vercel.app",
        settings.ALLOW_ORIGIN
    ] if settings.ALLOW_ORIGIN else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(stream.router, prefix="/api")
app.include_router(screening.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(market_data.router, prefix="/api", tags=["market-data"])
app.include_router(news.router, prefix="/api", tags=["news"])
app.include_router(ai.router, prefix="/api")
app.include_router(claude.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(scheduler.router, prefix="/api")
app.include_router(telemetry.router)