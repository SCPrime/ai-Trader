from fastapi import Header, HTTPException, status
from .config import settings

def require_bearer(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    print(f"[AUTH] Received: [{token}]", flush=True)
    print(f"[AUTH] Expected: [{settings.API_TOKEN}]", flush=True)
    print(f"[AUTH] Match: {token == settings.API_TOKEN}", flush=True)
    if token != settings.API_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")