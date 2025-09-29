from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from ..core.auth import require_bearer
from ..core.kill_switch import is_killed, set_kill
from ..core.idempotency import check_and_store
from ..core.config import settings

router = APIRouter()

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

    # TODO: integrate broker here (Alpaca, etc). Return broker order ids.
    return {"accepted": True, "dryRun": False, "orders": [o.dict() for o in req.orders]}

@router.post("/admin/kill")
def kill(state: bool, _=Depends(require_bearer)):
    set_kill(state)
    return {"tradingHalted": state}