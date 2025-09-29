from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import time

router = APIRouter()

@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    """
    Demo ticker for Render/Fly deployment.

    Note: Vercel Functions can't be WebSocket servers.
    For Vercel-only deployments, use SSE (Server-Sent Events) instead:
    GET /stream with text/event-stream content-type.
    """
    await ws.accept()
    try:
        while True:
            # Demo tick
            msg = {
                "type": "market",
                "symbol": "AAPL",
                "price": 184.10,
                "ts": time.time()
            }
            await ws.send_text(json.dumps(msg))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass