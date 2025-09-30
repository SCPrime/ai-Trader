import os
import time
from threading import RLock
from typing import Optional
from .config import settings

try:
    from redis import Redis
except ImportError:
    Redis = None  # type: ignore

_redis = None
_seen = {}
_lock = RLock()


def get_redis() -> Optional["Redis"]:
    """Return a Redis client if REDIS_URL is set and redis pkg is installed."""
    global _redis
    if _redis is not None:
        return _redis
    url = os.getenv("REDIS_URL")
    if not url or Redis is None:
        return None
    try:
        _redis = Redis.from_url(url, decode_responses=True)
        return _redis
    except Exception:
        return None


def check_and_store(key: str) -> bool:
    """
    Returns True if new; False if duplicate.
    Uses Redis SETNX + EXPIRE when available; falls back to in-mem dict.
    """
    ttl_sec = getattr(settings, "IDMP_TTL_SECONDS", 600)

    # Try Redis first
    r = get_redis()
    if r is not None:
        try:
            # SETNX returns True if key did not exist
            created = r.setnx(f"idemp:{key}", "1")
            if created:
                r.expire(f"idemp:{key}", ttl_sec)
            return bool(created)
        except Exception:
            pass  # fall through to in-memory

    # In-memory fallback
    now = time.time()
    with _lock:
        # TTL purge
        for k, (ts, _) in list(_seen.items()):
            if now - ts > ttl_sec:
                _seen.pop(k, None)

        if key in _seen:
            return False

        _seen[key] = (now, 1)
        return True