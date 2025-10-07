from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Literal
from ..core.auth import require_bearer

router = APIRouter()

class AlpacaAccount(BaseModel):
    """Alpaca account information - mock data for now"""
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
    """Get Alpaca account information - mock data for now"""
    return {
        "id": "demo-account-id",
        "account_number": "PA3XXXXXXX",
        "status": "ACTIVE",
        "currency": "USD",
        "buying_power": "25000.00",
        "cash": "10000.00",
        "portfolio_value": "15000.00",
        "equity": "15000.00",
        "last_equity": "14850.00",
        "long_market_value": "5000.00",
        "short_market_value": "0.00",
        "initial_margin": "0.00",
        "maintenance_margin": "0.00",
        "last_maintenance_margin": "0.00",
        "daytrade_count": 0,
        "daytrading_buying_power": "100000.00",
        "pattern_day_trader": False,
        "trading_blocked": False,
        "transfers_blocked": False,
        "account_blocked": False,
        "created_at": "2024-01-01T00:00:00Z",
        "trade_suspended_by_user": False,
        "multiplier": "4",
        "shorting_enabled": True,
        "long_market_value_change": "150.00",
        "short_market_value_change": "0.00"
    }

@router.get("/portfolio/positions")
def positions(_=Depends(require_bearer)):
    return [
        {
            "symbol": "AAPL",
            "qty": 10,
            "avgPrice": 182.34,
            "marketPrice": 184.10,
            "unrealized": 17.6
        }
    ]