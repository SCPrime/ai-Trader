from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from ..core.auth import require_bearer
from ..core.config import settings
import requests
import os

router = APIRouter()

# Alpaca API configuration
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"  # Paper trading

def get_alpaca_headers():
    """Get headers for Alpaca API requests"""
    return {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
    }

class AlpacaAccount(BaseModel):
    """Alpaca account information"""
    id: str
    account_number: str
    status: Literal["ACTIVE", "INACTIVE"]
    currency: str = "USD"
    buying_power: str
    cash: str
    portfolio_value: str
    equity: str
    last_equity: str
    long_market_value: str
    short_market_value: str
    initial_margin: str
    maintenance_margin: str
    last_maintenance_margin: str
    daytrade_count: int
    daytrading_buying_power: Optional[str] = None
    pattern_day_trader: bool = False
    trading_blocked: bool = False
    transfers_blocked: bool = False
    account_blocked: bool = False
    created_at: str
    trade_suspended_by_user: bool = False
    multiplier: str
    shorting_enabled: bool = True
    long_market_value_change: Optional[str] = None
    short_market_value_change: Optional[str] = None

@router.get("/account", response_model=AlpacaAccount)
def get_account(_=Depends(require_bearer)):
    """Get real Alpaca account information"""
    try:
        response = requests.get(
            f"{ALPACA_BASE_URL}/v2/account",
            headers=get_alpaca_headers(),
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Alpaca account: {str(e)}"
        )

@router.get("/positions")
def get_positions(_=Depends(require_bearer)):
    """Get real Alpaca positions"""
    try:
        response = requests.get(
            f"{ALPACA_BASE_URL}/v2/positions",
            headers=get_alpaca_headers(),
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Alpaca positions: {str(e)}"
        )

@router.get("/positions/{symbol}")
def get_position(symbol: str, _=Depends(require_bearer)):
    """Get a specific position by symbol"""
    try:
        response = requests.get(
            f"{ALPACA_BASE_URL}/v2/positions/{symbol}",
            headers=get_alpaca_headers(),
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if hasattr(e, 'response') and e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"No position found for {symbol}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch position for {symbol}: {str(e)}"
        )
