from threading import RLock

_flag = False
_lock = RLock()

def set_kill(state: bool):
    global _flag
    with _lock:
        _flag = state

def is_killed() -> bool:
    with _lock:
        return _flag