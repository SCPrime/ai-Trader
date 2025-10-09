from fastapi import Header, HTTPException, status
from .config import settings
import logging

# Add logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

def require_bearer(authorization: str = Header(None)):
    logger.debug("=" * 50)
    logger.debug("AUTH MIDDLEWARE CALLED")
    print(f"\n{'='*50}", flush=True)
    print(f"AUTH MIDDLEWARE CALLED", flush=True)
    print(f"Authorization header: {authorization}", flush=True)

    if not authorization:
        logger.error("❌ No authorization header provided")
        print(f"❌ ERROR: No authorization header", flush=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        logger.error(f"❌ Invalid authorization format: {authorization[:20]}")
        print(f"❌ ERROR: Invalid auth format: {authorization[:20]}", flush=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization format")

    token = authorization.split(" ", 1)[1]
    logger.debug(f"Received token: {token[:10]}...")
    logger.debug(f"Expected token: {settings.API_TOKEN[:10] if settings.API_TOKEN else 'NOT_SET'}...")

    print(f"[AUTH] Received: [{token}]", flush=True)
    print(f"[AUTH] Expected: [{settings.API_TOKEN}]", flush=True)
    print(f"[AUTH] Match: {token == settings.API_TOKEN}", flush=True)

    if not settings.API_TOKEN:
        logger.error("❌ API_TOKEN not set in environment!")
        print(f"❌ ERROR: API_TOKEN not configured", flush=True)
        raise HTTPException(status_code=500, detail="Server configuration error")

    if token != settings.API_TOKEN:
        logger.error("❌ Token mismatch!")
        print(f"❌ ERROR: Token mismatch", flush=True)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")

    logger.debug("✅ Authentication successful")
    print(f"✅ Authentication successful", flush=True)
    print(f"{'='*50}\n", flush=True)
    return token