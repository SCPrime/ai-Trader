"""
Scheduler API Router (Simplified - File-based)
REST endpoints for managing scheduled trading tasks
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid
import json
from pathlib import Path

from ..scheduler import get_scheduler, SCHEDULES_DIR, EXECUTIONS_DIR, APPROVALS_DIR
from ..core.auth import require_bearer

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


# ========================
# Request/Response Models
# ========================

class ScheduleCreate(BaseModel):
    name: str
    type: str  # morning_routine, news_review, ai_recs, custom
    cron_expression: str
    timezone: str = "America/New_York"
    requires_approval: bool = True
    enabled: bool = True


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    requires_approval: Optional[bool] = None
    enabled: Optional[bool] = None


class ScheduleResponse(BaseModel):
    id: str
    name: str
    type: str
    enabled: bool
    cron_expression: str
    timezone: str
    requires_approval: bool
    last_run: Optional[str]
    next_run: Optional[str]
    status: str
    created_at: str

    class Config:
        from_attributes = True


class ExecutionResponse(BaseModel):
    id: str
    schedule_id: str
    schedule_name: str
    started_at: str
    completed_at: Optional[str]
    status: str
    result: Optional[str]
    error: Optional[str]

    class Config:
        from_attributes = True


class ApprovalResponse(BaseModel):
    id: str
    execution_id: str
    schedule_name: str
    trade_type: str
    symbol: str
    quantity: int
    estimated_price: float
    estimated_value: float
    reason: str
    risk_score: int
    ai_confidence: float
    supporting_data: Optional[dict]
    created_at: str
    expires_at: str

    class Config:
        from_attributes = True


class ApprovalDecision(BaseModel):
    reason: Optional[str] = None


# ========================
# Helper Functions
# ========================

def _load_schedule(schedule_id: str) -> Optional[dict]:
    """Load schedule from file"""
    schedule_file = SCHEDULES_DIR / f"{schedule_id}.json"
    if schedule_file.exists():
        with open(schedule_file, 'r') as f:
            return json.load(f)
    return None


def _save_schedule(schedule: dict):
    """Save schedule to file"""
    schedule_file = SCHEDULES_DIR / f"{schedule['id']}.json"
    with open(schedule_file, 'w') as f:
        json.dump(schedule, f, indent=2)


def _delete_schedule_file(schedule_id: str):
    """Delete schedule file"""
    schedule_file = SCHEDULES_DIR / f"{schedule_id}.json"
    if schedule_file.exists():
        schedule_file.unlink()


def _load_all_schedules() -> List[dict]:
    """Load all schedules from files"""
    schedules = []
    for schedule_file in SCHEDULES_DIR.glob("*.json"):
        with open(schedule_file, 'r') as f:
            schedules.append(json.load(f))
    return sorted(schedules, key=lambda x: x.get('created_at', ''), reverse=True)


def _load_executions(limit: int = 20, schedule_id: Optional[str] = None) -> List[dict]:
    """Load execution history from files"""
    executions = []
    for exec_file in EXECUTIONS_DIR.glob("*.json"):
        with open(exec_file, 'r') as f:
            execution = json.load(f)
            if schedule_id is None or execution['schedule_id'] == schedule_id:
                executions.append(execution)

    # Sort by started_at descending
    executions = sorted(executions, key=lambda x: x.get('started_at', ''), reverse=True)
    return executions[:limit]


def _load_pending_approvals() -> List[dict]:
    """Load pending approvals from files"""
    approvals = []
    now = datetime.utcnow()

    for approval_file in APPROVALS_DIR.glob("*.json"):
        with open(approval_file, 'r') as f:
            approval = json.load(f)
            # Only include pending and not expired
            if approval['status'] == 'pending':
                expires_at = datetime.fromisoformat(approval['expires_at'])
                if expires_at > now:
                    approvals.append(approval)

    return sorted(approvals, key=lambda x: x.get('created_at', ''), reverse=True)


def _update_approval(approval_id: str, updates: dict):
    """Update approval file"""
    approval_file = APPROVALS_DIR / f"{approval_id}.json"
    if approval_file.exists():
        with open(approval_file, 'r') as f:
            approval = json.load(f)
        approval.update(updates)
        with open(approval_file, 'w') as f:
            json.dump(approval, f, indent=2)


# ========================
# Schedule Management
# ========================

@router.get("/schedules", response_model=List[ScheduleResponse])
async def list_schedules(_=Depends(require_bearer)):
    """Get all schedules for the current user"""
    schedules = _load_all_schedules()

    # Enrich with scheduler info
    scheduler = get_scheduler()
    enriched = []
    for schedule in schedules:
        sched_dict = {
            "id": schedule['id'],
            "name": schedule['name'],
            "type": schedule['type'],
            "enabled": schedule['enabled'],
            "cron_expression": schedule['cron_expression'],
            "timezone": schedule['timezone'],
            "requires_approval": schedule['requires_approval'],
            "last_run": schedule.get('last_run'),
            "status": schedule['status'],
            "created_at": schedule['created_at'],
            "next_run": None
        }

        # Get next run time from scheduler
        if schedule['enabled']:
            info = scheduler.get_schedule_info(schedule['id'])
            if info:
                sched_dict["next_run"] = info.get("next_run")

        enriched.append(sched_dict)

    return enriched


@router.post("/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: ScheduleCreate,
    _=Depends(require_bearer)
):
    """Create a new schedule"""
    schedule_id = str(uuid.uuid4())

    # Create schedule record
    schedule = {
        'id': schedule_id,
        'name': schedule_data.name,
        'type': schedule_data.type,
        'cron_expression': schedule_data.cron_expression,
        'timezone': schedule_data.timezone,
        'requires_approval': schedule_data.requires_approval,
        'enabled': schedule_data.enabled,
        'status': 'active' if schedule_data.enabled else 'paused',
        'created_at': datetime.utcnow().isoformat(),
        'last_run': None
    }

    # Save to file
    _save_schedule(schedule)

    # Add to scheduler if enabled
    if schedule_data.enabled:
        scheduler = get_scheduler()
        try:
            await scheduler.add_schedule(
                schedule_id=schedule_id,
                schedule_type=schedule_data.type,
                cron_expression=schedule_data.cron_expression,
                timezone=schedule_data.timezone,
                requires_approval=schedule_data.requires_approval
            )
        except Exception as e:
            # Rollback file if scheduler fails
            _delete_schedule_file(schedule_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create schedule: {str(e)}"
            )

    return schedule


@router.patch("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_data: ScheduleUpdate,
    _=Depends(require_bearer)
):
    """Update an existing schedule"""
    schedule = _load_schedule(schedule_id)

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Update fields
    update_data = schedule_data.model_dump(exclude_unset=True)

    scheduler = get_scheduler()

    # Handle enabled/disabled toggle
    if 'enabled' in update_data:
        if update_data['enabled'] and not schedule['enabled']:
            # Re-enable schedule
            await scheduler.resume_schedule(schedule_id)
            schedule['status'] = 'active'
        elif not update_data['enabled'] and schedule['enabled']:
            # Disable schedule
            await scheduler.pause_schedule(schedule_id)
            schedule['status'] = 'paused'

    # Update schedule in scheduler if cron or timezone changed
    if 'cron_expression' in update_data or 'timezone' in update_data:
        await scheduler.remove_schedule(schedule_id)
        if schedule.get('enabled', False):
            await scheduler.add_schedule(
                schedule_id=schedule_id,
                schedule_type=schedule['type'],
                cron_expression=update_data.get('cron_expression', schedule['cron_expression']),
                timezone=update_data.get('timezone', schedule['timezone']),
                requires_approval=schedule['requires_approval']
            )

    # Apply updates
    schedule.update(update_data)

    # Save to file
    _save_schedule(schedule)

    return schedule


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    _=Depends(require_bearer)
):
    """Delete a schedule"""
    schedule = _load_schedule(schedule_id)

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Remove from scheduler
    scheduler = get_scheduler()
    await scheduler.remove_schedule(schedule_id)

    # Delete from file storage
    _delete_schedule_file(schedule_id)


# ========================
# Emergency Controls
# ========================

@router.post("/pause-all")
async def pause_all_schedules(_=Depends(require_bearer)):
    """Emergency pause all schedules"""
    scheduler = get_scheduler()
    await scheduler.pause_all()

    # Update all schedules in storage
    for schedule in _load_all_schedules():
        schedule['status'] = 'paused'
        schedule['enabled'] = False
        _save_schedule(schedule)

    return {"message": "All schedules paused"}


@router.post("/resume-all")
async def resume_all_schedules(_=Depends(require_bearer)):
    """Resume all paused schedules"""
    scheduler = get_scheduler()
    await scheduler.resume_all()

    # Update all schedules in storage
    for schedule in _load_all_schedules():
        schedule['status'] = 'active'
        schedule['enabled'] = True
        _save_schedule(schedule)

    return {"message": "All schedules resumed"}


# ========================
# Execution History
# ========================

@router.get("/executions", response_model=List[ExecutionResponse])
async def list_executions(
    limit: int = 20,
    schedule_id: Optional[str] = None,
    _=Depends(require_bearer)
):
    """Get execution history"""
    executions = _load_executions(limit, schedule_id)
    return executions


# ========================
# Approval Workflow
# ========================

@router.get("/pending-approvals", response_model=List[ApprovalResponse])
async def list_pending_approvals(_=Depends(require_bearer)):
    """Get all pending trade approvals"""
    approvals = _load_pending_approvals()
    return approvals


@router.post("/approvals/{approval_id}/approve")
async def approve_trade(
    approval_id: str,
    _=Depends(require_bearer)
):
    """Approve a pending trade"""
    approval_file = APPROVALS_DIR / f"{approval_id}.json"

    if not approval_file.exists():
        raise HTTPException(status_code=404, detail="Approval not found")

    with open(approval_file, 'r') as f:
        approval = json.load(f)

    if approval['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Approval already processed")

    # Check expiration
    expires_at = datetime.fromisoformat(approval['expires_at'])
    if expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Approval has expired")

    # Update approval status
    _update_approval(approval_id, {
        'status': 'approved',
        'approved_at': datetime.utcnow().isoformat()
    })

    # TODO: Execute the trade via trading engine

    return {"message": "Trade approved and executed"}


@router.post("/approvals/{approval_id}/reject")
async def reject_trade(
    approval_id: str,
    decision: ApprovalDecision,
    _=Depends(require_bearer)
):
    """Reject a pending trade"""
    approval_file = APPROVALS_DIR / f"{approval_id}.json"

    if not approval_file.exists():
        raise HTTPException(status_code=404, detail="Approval not found")

    with open(approval_file, 'r') as f:
        approval = json.load(f)

    if approval['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Approval already processed")

    # Update approval status
    _update_approval(approval_id, {
        'status': 'rejected',
        'approved_at': datetime.utcnow().isoformat(),
        'rejection_reason': decision.reason
    })

    return {"message": "Trade rejected"}


# ========================
# Health & Status
# ========================

@router.get("/status")
async def scheduler_status(_=Depends(require_bearer)):
    """Get scheduler health status"""
    scheduler = get_scheduler()

    return {
        "running": scheduler.running,
        "jobs_count": len(scheduler.scheduler.get_jobs()),
        "status": "healthy" if scheduler.running else "stopped"
    }
