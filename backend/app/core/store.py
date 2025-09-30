import os
import time
from typing import Optional

try:
    from redis import Redis
except ImportError:
    Redis = None  # type: ignore

_redis = None


def get_redis() -> Optional["Redis"]:
    """Return a Redis client if REDIS_URL is set and redis pkg is installed."""
    global _redis
    if _redis is not None:
        return _redis
    url = os.getenv("REDIS_URL")
    if not url or Redis is None:
        return None
    _redis = Redis.from_url(url, decode_responses=True)
    return _redis


def idem_check_and_store(key: str, ttl_sec: int = 600) -> bool:
    """
    Return True if this requestId is NEW (store it), False if duplicate.
    Uses Redis SETNX + EXPIRE when available; falls back to in-mem dict.
    """
    r = get_redis()
    if r is not None:
        # SETNX returns True if key did not exist
        created = r.setnx(f"idemp:{key}", "1")
        if created:
            r.expire(f"idemp:{key}", ttl_sec)
        return bool(created)

    # In-memory fallback (single-process only)
    # NOTE: fine for local dev; in prod use Redis above
    now = time.time()
    from threading import RLock

    if not hasattr(idem_check_and_store, "_mem"):  # type: ignore
        idem_check_and_store._mem = {}  # type: ignore
        idem_check_and_store._lock = RLock()  # type: ignore
    mem = idem_check_and_store._mem  # type: ignore
    lock = idem_check_and_store._lock  # type: ignore
    with lock:
        # purge old
        for k, (ts, _) in list(mem.items()):
            if now - ts > ttl_sec:
                mem.pop(k, None)
        if key in mem:
            return False
        mem[key] = (now, 1)
        return True
