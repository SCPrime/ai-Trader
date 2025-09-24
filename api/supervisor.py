"""
Supervisor API endpoints for FastAPI.
Provides REST API for supervisor dashboard functionality.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
import logging

from core.supervisor import supervisor, SupervisorMode, TradeAction

logger = logging.getLogger(__name__)

# Create API router
router = APIRouter(prefix="/api/supervisor", tags=["supervisor"])


class ModeChangeRequest(BaseModel):
    """Request model for changing supervisor mode."""
    mode: str


class TradeApprovalRequest(BaseModel):
    """Request model for approving a trade."""
    trade_id: str


class TradeRejectionRequest(BaseModel):
    """Request model for rejecting a trade."""
    trade_id: str
    reason: str = ""


@router.get("/status")
async def get_supervisor_status() -> Dict[str, Any]:
    """Get current supervisor status and pending trades."""
    try:
        status = supervisor.get_status()

        # Cleanup expired trades
        await supervisor.cleanup_expired_trades()

        return status
    except Exception as e:
        logger.error(f"Error getting supervisor status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supervisor status")


@router.post("/mode")
async def change_supervisor_mode(request: ModeChangeRequest) -> Dict[str, str]:
    """Change the supervisor mode."""
    try:
        # Validate mode
        if request.mode not in [mode.value for mode in SupervisorMode]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mode. Must be one of: {[mode.value for mode in SupervisorMode]}"
            )

        mode = SupervisorMode(request.mode)
        await supervisor.set_mode(mode)

        return {"status": "success", "mode": mode.value}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid supervisor mode")
    except Exception as e:
        logger.error(f"Error changing supervisor mode: {e}")
        raise HTTPException(status_code=500, detail="Failed to change supervisor mode")


@router.post("/approve")
async def approve_trade(request: TradeApprovalRequest) -> Dict[str, str]:
    """Approve a pending trade."""
    try:
        success = await supervisor.approve_trade(request.trade_id)

        if not success:
            raise HTTPException(status_code=404, detail="Trade not found or expired")

        return {"status": "success", "message": f"Trade {request.trade_id} approved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving trade {request.trade_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to approve trade")


@router.post("/reject")
async def reject_trade(request: TradeRejectionRequest) -> Dict[str, str]:
    """Reject a pending trade."""
    try:
        success = await supervisor.reject_trade(request.trade_id, request.reason)

        if not success:
            raise HTTPException(status_code=404, detail="Trade not found")

        return {"status": "success", "message": f"Trade {request.trade_id} rejected"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting trade {request.trade_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reject trade")


@router.post("/emergency")
async def emergency_stop() -> Dict[str, str]:
    """Activate emergency stop - halt all trading."""
    try:
        await supervisor.emergency_stop_all()

        return {"status": "success", "message": "Emergency stop activated"}
    except Exception as e:
        logger.error(f"Error activating emergency stop: {e}")
        raise HTTPException(status_code=500, detail="Failed to activate emergency stop")


@router.post("/reset-emergency")
async def reset_emergency_stop() -> Dict[str, str]:
    """Reset emergency stop."""
    try:
        await supervisor.reset_emergency_stop()

        return {"status": "success", "message": "Emergency stop reset"}
    except Exception as e:
        logger.error(f"Error resetting emergency stop: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset emergency stop")


@router.get("/trades/pending")
async def get_pending_trades() -> Dict[str, Any]:
    """Get all pending trades."""
    try:
        status = supervisor.get_status()
        return {"pending_trades": status["pending_list"]}
    except Exception as e:
        logger.error(f"Error getting pending trades: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pending trades")


@router.get("/health")
async def supervisor_health() -> Dict[str, str]:
    """Health check endpoint for supervisor service."""
    return {"status": "healthy", "service": "trading_supervisor"}