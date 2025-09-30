from fastapi import APIRouter
from datetime import datetime, timezone
from time import perf_counter
from ..core.idempotency import get_redis

router = APIRouter()

@router.get("/health")
def health():
    info = {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}

    # Check Redis connection
    r = get_redis()
    if r:
        t0 = perf_counter()
        try:
            r.ping()
            ms = int((perf_counter() - t0) * 1000)
            info["redis"] = {"connected": True, "latency_ms": ms}
        except Exception:
            info["redis"] = {"connected": False}

    return info

@router.get("/ready")
def ready():
    return {"ready": True}