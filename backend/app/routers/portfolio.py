from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from ..core.auth import require_bearer
from ..core.config import settings
from ..services.tradier_client import get_tradier_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

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

@router.get("/account")
def get_account(_=Depends(require_bearer)):
    """Get Tradier account information"""
    logger.info("🎯 ACCOUNT ENDPOINT - Tradier Production")

    try:
        client = get_tradier_client()
        account_data = client.get_account()

        logger.info("✅ Tradier account data retrieved successfully")
        return account_data

    except Exception as e:
        logger.error(f"❌ Tradier account request failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Tradier account: {str(e)}"
        )

@router.get("/positions")
def get_positions(_=Depends(require_bearer)):
    """Get Tradier positions"""
    try:
        client = get_tradier_client()
        positions = client.get_positions()
        logger.info(f"✅ Retrieved {len(positions)} positions from Tradier")
        return positions

    except Exception as e:
        logger.error(f"❌ Tradier positions request failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Tradier positions: {str(e)}"
        )

@router.get("/positions/{symbol}")
def get_position(symbol: str, _=Depends(require_bearer)):
    """Get a specific position by symbol"""
    try:
        client = get_tradier_client()
        positions = client.get_positions()

        # Find position by symbol
        for position in positions:
            if position.get("symbol") == symbol.upper():
                return position

        raise HTTPException(status_code=404, detail=f"No position found for {symbol}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to fetch position for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch position for {symbol}: {str(e)}"
        )
