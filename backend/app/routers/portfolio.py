from fastapi import APIRouter, Depends
from ..core.auth import require_bearer

router = APIRouter()

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