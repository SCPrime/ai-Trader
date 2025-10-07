from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from ..core.auth import require_bearer
from ..core.kill_switch import is_killed, set_kill
from ..core.idempotency import check_and_store
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

class Order(BaseModel):
    symbol: str
    side: str
    qty: float
    type: str = "market"

class ExecRequest(BaseModel):
    dryRun: bool = True
    requestId: str
    orders: list[Order]

@router.post("/trading/execute")
def execute(req: ExecRequest, _=Depends(require_bearer)):
    if not req.requestId:
        raise HTTPException(status_code=400, detail="requestId required")

    if not check_and_store(req.requestId):
        return {"accepted": False, "duplicate": True}

    if is_killed():
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="trading halted")

    # Respect LIVE_TRADING setting
    if req.dryRun or not settings.LIVE_TRADING:
        return {"accepted": True, "dryRun": True, "orders": [o.dict() for o in req.orders]}

    # Execute real trades via Alpaca API
    executed_orders = []
    for order in req.orders:
        try:
            response = requests.post(
                f"{ALPACA_BASE_URL}/v2/orders",
                headers=get_alpaca_headers(),
                json={
                    "symbol": order.symbol,
                    "qty": order.qty,
                    "side": order.side,
                    "type": order.type,
                    "time_in_force": "day"
                },
                timeout=10
            )
            response.raise_for_status()
            alpaca_order = response.json()
            executed_orders.append({
                **order.dict(),
                "alpaca_order_id": alpaca_order.get("id"),
                "status": alpaca_order.get("status")
            })
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to execute order for {order.symbol}: {str(e)}"
            )

    return {"accepted": True, "dryRun": False, "orders": executed_orders}

@router.post("/admin/kill")
def kill(state: bool, _=Depends(require_bearer)):
    set_kill(state)
    return {"tradingHalted": state}