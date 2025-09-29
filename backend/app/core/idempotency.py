import time
from threading import RLock
from .config import settings

_seen = {}
_lock = RLock()

def check_and_store(key: str) -> bool:
    """Returns True if new; False if duplicate."""
    now = time.time()
    with _lock:
        # TTL purge
        for k, (ts, _) in list(_seen.items()):
            if now - ts > settings.IDMP_TTL_SECONDS:
                _seen.pop(k, None)

        if key in _seen:
            return False

        _seen[key] = (now, 1)
        return True