"""
Strategy API Routes
Endpoints for managing trading strategies
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Optional, List
import json
import os
from pathlib import Path

from ..core.auth import require_bearer
import sys
from pathlib import Path

# Add backend root to path for strategies import
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from strategies.under4_multileg import (
    Under4MultilegConfig,
    create_under4_multileg_strategy
)

router = APIRouter()

# Strategy storage path
STRATEGIES_DIR = Path("data/strategies")
STRATEGIES_DIR.mkdir(parents=True, exist_ok=True)


class StrategyConfigRequest(BaseModel):
    """Request model for saving strategy configuration"""
    strategy_type: str
    config: Dict


class StrategyRunRequest(BaseModel):
    """Request model for running a strategy"""
    strategy_type: str
    dry_run: bool = True


@router.post("/strategies/save")
async def save_strategy(
    request: StrategyConfigRequest,
    _=Depends(require_bearer)
):
    """
    Save strategy configuration

    POST /api/strategies/save
    Body: {
        "strategy_type": "under4-multileg",
        "config": { ... }
    }
    """
    user_id = "default"  # TODO: Get from auth
    strategy_file = STRATEGIES_DIR / f"{user_id}_{request.strategy_type}.json"

    try:
        # Validate config based on strategy type
        if request.strategy_type == "under4-multileg":
            # Validate against Pydantic model
            config = Under4MultilegConfig(**request.config)
            validated_config = config.model_dump()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown strategy type: {request.strategy_type}"
            )

        # Save to file
        with open(strategy_file, 'w') as f:
            json.dump({
                "strategy_type": request.strategy_type,
                "config": validated_config
            }, f, indent=2)

        return {
            "success": True,
            "message": f"Strategy '{request.strategy_type}' saved successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/strategies/load/{strategy_type}")
async def load_strategy(
    strategy_type: str,
    _=Depends(require_bearer)
):
    """
    Load strategy configuration

    GET /api/strategies/load/under4-multileg
    """
    user_id = "default"  # TODO: Get from auth
    strategy_file = STRATEGIES_DIR / f"{user_id}_{strategy_type}.json"

    if not strategy_file.exists():
        # Return default configuration
        if strategy_type == "under4-multileg":
            default_config = Under4MultilegConfig()
            return {
                "strategy_type": strategy_type,
                "config": default_config.model_dump(),
                "is_default": True
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Strategy '{strategy_type}' not found"
            )

    try:
        with open(strategy_file, 'r') as f:
            data = json.load(f)

        return {
            **data,
            "is_default": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies/list")
async def list_strategies(_=Depends(require_bearer)):
    """
    List all available strategies

    GET /api/strategies/list
    """
    user_id = "default"  # TODO: Get from auth

    strategies = []

    # Check for saved strategies
    for strategy_file in STRATEGIES_DIR.glob(f"{user_id}_*.json"):
        try:
            with open(strategy_file, 'r') as f:
                data = json.load(f)
            strategies.append({
                "strategy_type": data["strategy_type"],
                "has_config": True
            })
        except:
            continue

    # Add available strategies that haven't been configured
    available_strategies = ["under4-multileg", "custom"]
    for strategy_type in available_strategies:
        if not any(s["strategy_type"] == strategy_type for s in strategies):
            strategies.append({
                "strategy_type": strategy_type,
                "has_config": False
            })

    return {
        "strategies": strategies
    }


@router.post("/strategies/run")
async def run_strategy(
    request: StrategyRunRequest,
    _=Depends(require_bearer)
):
    """
    Run a strategy (execute morning routine)

    POST /api/strategies/run
    Body: {
        "strategy_type": "under4-multileg",
        "dry_run": true
    }
    """
    user_id = "default"  # TODO: Get from auth

    try:
        # Load strategy configuration
        strategy_file = STRATEGIES_DIR / f"{user_id}_{request.strategy_type}.json"

        if strategy_file.exists():
            with open(strategy_file, 'r') as f:
                data = json.load(f)
                config_dict = data["config"]
        else:
            config_dict = None

        # Create strategy instance
        if request.strategy_type == "under4-multileg":
            strategy = create_under4_multileg_strategy(config_dict)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown strategy type: {request.strategy_type}"
            )

        # TODO: Get Alpaca client from user's credentials
        # For now, return mock results

        if request.dry_run:
            return {
                "success": True,
                "dry_run": True,
                "message": "Strategy dry run completed",
                "results": {
                    "candidates": ["SNDL", "NOK", "SOFI", "PLUG"],
                    "proposals": [
                        {
                            "type": "BUY_CALL",
                            "symbol": "SNDL",
                            "strike": 3.50,
                            "expiry": "2025-11-15",
                            "delta": 0.60,
                            "qty": 3
                        },
                        {
                            "type": "SELL_PUT",
                            "symbol": "NOK",
                            "strike": 3.00,
                            "expiry": "2025-11-15",
                            "delta": 0.20,
                            "qty": 2
                        }
                    ],
                    "approved_trades": 2
                }
            }
        else:
            # TODO: Implement actual execution
            raise HTTPException(
                status_code=501,
                detail="Live execution not yet implemented"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/strategies/{strategy_type}")
async def delete_strategy(
    strategy_type: str,
    _=Depends(require_bearer)
):
    """
    Delete a saved strategy configuration

    DELETE /api/strategies/under4-multileg
    """
    user_id = "default"  # TODO: Get from auth
    strategy_file = STRATEGIES_DIR / f"{user_id}_{strategy_type}.json"

    if not strategy_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Strategy '{strategy_type}' not found"
        )

    try:
        strategy_file.unlink()
        return {
            "success": True,
            "message": f"Strategy '{strategy_type}' deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
