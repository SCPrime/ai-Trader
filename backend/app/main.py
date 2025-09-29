from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import health, settings as settings_router, portfolio, orders, stream

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