"""
Telemetry Router - Tracks user interactions and system events
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Literal, Optional
from datetime import datetime
from collections import defaultdict
import json
import os

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

# In-memory storage (replace with database in production)
telemetry_events: List[Dict[str, Any]] = []


class TelemetryEvent(BaseModel):
    userId: str
    sessionId: str
    component: str
    action: str
    timestamp: str
    metadata: Dict[str, Any]
    userRole: str


class TelemetryBatch(BaseModel):
    events: List[TelemetryEvent]


@router.post("")
async def log_telemetry(batch: TelemetryBatch):
    """
    Receive and store telemetry events
    """
    try:
        # Store events
        for event in batch.events:
            event_dict = event.dict()
            telemetry_events.append(event_dict)

        # Optional: Write to file for persistence
        log_file = "telemetry_events.jsonl"
        with open(log_file, "a") as f:
            for event in batch.events:
                f.write(json.dumps(event.dict()) + "\n")

        return {
            "success": True,
            "received": len(batch.events),
            "message": f"Logged {len(batch.events)} telemetry events"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def get_telemetry_events(
    limit: int = 100,
    user_id: str = None,
    component: str = None,
    action: str = None,
    user_role: str = None
):
    """
    Retrieve telemetry events with optional filters
    """
    filtered_events = telemetry_events

    # Apply filters
    if user_id:
        filtered_events = [e for e in filtered_events if e.get('userId') == user_id]
    if component:
        filtered_events = [e for e in filtered_events if e.get('component') == component]
    if action:
        filtered_events = [e for e in filtered_events if e.get('action') == action]
    if user_role:
        filtered_events = [e for e in filtered_events if e.get('userRole') == user_role]

    # Sort by timestamp (newest first)
    filtered_events.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

    return {
        "total": len(filtered_events),
        "events": filtered_events[:limit]
    }


@router.get("/stats")
async def get_telemetry_stats():
    """
    Get aggregate statistics from telemetry data
    """
    if not telemetry_events:
        return {
            "total_events": 0,
            "unique_users": 0,
            "unique_sessions": 0,
            "top_components": [],
            "top_actions": [],
            "users_by_role": {}
        }

    unique_users = set(e.get('userId') for e in telemetry_events)
    unique_sessions = set(e.get('sessionId') for e in telemetry_events)

    # Count by component
    component_counts = {}
    for event in telemetry_events:
        comp = event.get('component', 'Unknown')
        component_counts[comp] = component_counts.get(comp, 0) + 1

    # Count by action
    action_counts = {}
    for event in telemetry_events:
        action = event.get('action', 'Unknown')
        action_counts[action] = action_counts.get(action, 0) + 1

    # Count by role
    role_counts = {}
    for event in telemetry_events:
        role = event.get('userRole', 'unknown')
        role_counts[role] = role_counts.get(role, 0) + 1

    # Sort and get top 10
    top_components = sorted(component_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_actions = sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total_events": len(telemetry_events),
        "unique_users": len(unique_users),
        "unique_sessions": len(unique_sessions),
        "top_components": [{"component": c, "count": n} for c, n in top_components],
        "top_actions": [{"action": a, "count": n} for a, n in top_actions],
        "users_by_role": role_counts
    }


@router.delete("/events")
async def clear_telemetry_events():
    """
    Clear all telemetry events (admin only)
    """
    global telemetry_events
    count = len(telemetry_events)
    telemetry_events = []

    return {
        "success": True,
        "message": f"Cleared {count} telemetry events"
    }


@router.get("/export")
async def export_telemetry():
    """
    Export all telemetry events as JSON
    """
    return {
        "events": telemetry_events,
        "exported_at": datetime.now().isoformat(),
        "total": len(telemetry_events)
    }
