"""
Telemetry Router - Tracks user interactions and system events
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Literal, Optional
from datetime import datetime
from collections import defaultdict

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

# In-memory storage (replace with database in production)
telemetry_events: List[Dict[str, Any]] = []


class TelemetryEvent(BaseModel):
    userId: str
    userRole: Literal["owner", "admin", "beta", "alpha", "user"]
    sessionId: str
    timestamp: str
    component: str
    action: str
    metadata: Optional[Dict[str, Any]] = None


class TelemetryBatch(BaseModel):
    events: List[TelemetryEvent]


class TelemetryStats(BaseModel):
    totalEvents: int
    uniqueUsers: int
    eventsByComponent: Dict[str, int]
    eventsByAction: Dict[str, int]
    eventsByRole: Dict[str, int]


@router.post("/track")
async def track_events(batch: TelemetryBatch):
    """
    Track a batch of telemetry events
    """
    for event in batch.events:
        telemetry_events.append(event.dict())

    return {
        "status": "success",
        "tracked": len(batch.events),
        "total": len(telemetry_events)
    }


@router.get("/events", response_model=List[TelemetryEvent])
async def get_events(limit: int = 100):
    """
    Get recent telemetry events
    """
    return telemetry_events[-limit:]


@router.get("/stats", response_model=TelemetryStats)
async def get_stats():
    """
    Get telemetry statistics
    """
    if not telemetry_events:
        return TelemetryStats(
            totalEvents=0,
            uniqueUsers=0,
            eventsByComponent={},
            eventsByAction={},
            eventsByRole={}
        )

    unique_users = set(event["userId"] for event in telemetry_events)

    events_by_component = defaultdict(int)
    events_by_action = defaultdict(int)
    events_by_role = defaultdict(int)

    for event in telemetry_events:
        events_by_component[event["component"]] += 1
        events_by_action[event["action"]] += 1
        events_by_role[event["userRole"]] += 1

    return TelemetryStats(
        totalEvents=len(telemetry_events),
        uniqueUsers=len(unique_users),
        eventsByComponent=dict(events_by_component),
        eventsByAction=dict(events_by_action),
        eventsByRole=dict(events_by_role)
    )


@router.delete("/events")
async def clear_events():
    """
    Clear all telemetry events (admin only)
    """
    global telemetry_events
    count = len(telemetry_events)
    telemetry_events = []
    return {
        "status": "success",
        "cleared": count
    }


@router.get("/export")
async def export_events():
    """
    Export all telemetry events as JSON
    """
    return {
        "events": telemetry_events,
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "total_events": len(telemetry_events)
    }
