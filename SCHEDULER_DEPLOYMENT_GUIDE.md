# 🚀 Auto-Run Scheduler - Deployment Guide (File-Based)

**Version**: File-Based (No Database Required)
**Status**: ✅ Deployed (commit ef6e97c)
**Date**: October 7, 2025

---

## 📦 What's Included

### ✅ Already Deployed Files

#### Frontend Components
- **SchedulerSettings.tsx** - Complete scheduler management UI
- **ApprovalQueue.tsx** - Trade approval interface with risk filtering

#### Backend Services
- **app/scheduler.py** - APScheduler-based scheduler with file storage
- **app/routers/scheduler.py** - REST API endpoints (no database)
- **app/main.py** - Updated with scheduler initialization

#### Dependencies
- **requirements.txt** - Updated with `apscheduler>=3.10.4`

---

## 🎯 Quick Start

The scheduler is **already running** in your backend! Here's how to use it:

### 1. Access the UI

Navigate to your Settings modal and you should see the scheduler interface (needs to be integrated into RadialMenu).

### 2. Create Your First Schedule

```bash
curl -X POST http://localhost:8000/api/scheduler/schedules \
  -H "Authorization: Bearer rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Morning Analysis",
    "type": "morning_routine",
    "cron_expression": "0 9 * * 1-5",
    "timezone": "America/New_York",
    "requires_approval": true,
    "enabled": true
  }'
```

### 3. View Schedules

```bash
curl http://localhost:8000/api/scheduler/schedules \
  -H "Authorization: Bearer rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl"
```

---

## 🔧 Integration Steps

### Step 1: Add to RadialMenu Navigation

Update `frontend/components/RadialMenu.tsx` or your main navigation:

```typescript
// Add these imports
import SchedulerSettings from './SchedulerSettings';
import ApprovalQueue from './ApprovalQueue';

// Add to your wedge configuration
const wedges = [
  // ...existing wedges...
  {
    id: 'automation',
    label: 'Automation',
    icon: <Clock size={24} />,
    component: <SchedulerSettings />
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: <CheckCircle size={24} />,
    component: <ApprovalQueue />,
    badge: pendingApprovalCount // Optional: show count
  }
];
```

### Step 2: Add Pending Approval Notification

```typescript
// In your main app component or Settings
const [pendingCount, setPendingCount] = useState(0);

useEffect(() => {
  const fetchPending = async () => {
    try {
      const response = await fetch('/api/proxy/scheduler/pending-approvals');
      const data = await response.json();
      setPendingCount(data.length);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    }
  };

  fetchPending();
  const interval = setInterval(fetchPending, 30000); // Check every 30 seconds
  return () => clearInterval(interval);
}, []);

// Display notification badge
{pendingCount > 0 && (
  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
    {pendingCount}
  </span>
)}
```

---

## 📁 File Storage Structure

The scheduler stores data in these directories (auto-created):

```
backend/
├── data/
│   ├── schedules/          # Schedule configurations (.json)
│   │   └── {schedule-id}.json
│   ├── executions/         # Execution history (.json)
│   │   └── {execution-id}.json
│   └── approvals/          # Pending approvals (.json)
│       └── {approval-id}.json
```

### Example Schedule File

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Daily Morning Analysis",
  "type": "morning_routine",
  "cron_expression": "0 9 * * 1-5",
  "timezone": "America/New_York",
  "requires_approval": true,
  "enabled": true,
  "status": "active",
  "created_at": "2025-10-07T14:30:00Z",
  "last_run": null
}
```

---

## 🔌 Integration with Existing Systems

### Connect to Morning Routine

Update `scheduler.py` to call your existing morning routine:

```python
# In backend/app/scheduler.py, update _execute_morning_routine

async def _execute_morning_routine(self, schedule_id: str, requires_approval: bool):
    execution_id = await self._create_execution_record(schedule_id, 'morning_routine')

    try:
        # Call your existing morning routine logic
        from .workflows.morning_routine import execute_morning_workflow

        results = await execute_morning_workflow()

        recommendations = results.get('recommendations', [])

        if requires_approval and recommendations:
            await self._create_approval_requests(
                execution_id, recommendations, schedule_id
            )
            result = f"Generated {len(recommendations)} recommendations pending approval"
        else:
            # Execute directly
            from .trading.executor import execute_trades
            trade_results = await execute_trades(recommendations)
            result = f"Executed {len(trade_results)} trades automatically"

        await self._complete_execution(execution_id, 'completed', result)

    except Exception as e:
        logger.error(f"Morning routine failed: {str(e)}")
        await self._complete_execution(execution_id, 'failed', None, str(e))
```

### Connect to Under-$4 Multileg Strategy

```python
# Update _execute_morning_routine to use your strategy

from strategies.under4_multileg import create_under4_multileg_strategy

async def _execute_morning_routine(self, schedule_id: str, requires_approval: bool):
    execution_id = await self._create_execution_record(schedule_id, 'morning_routine')

    try:
        # Load strategy config
        from pathlib import Path
        import json

        config_file = Path("data/strategies/default_under4-multileg.json")
        config_dict = None
        if config_file.exists():
            with open(config_file, 'r') as f:
                data = json.load(f)
                config_dict = data.get('config')

        # Create strategy
        strategy = create_under4_multileg_strategy(config_dict)

        # Get Alpaca client
        from .integrations.alpaca import get_alpaca_client
        alpaca = get_alpaca_client()

        # Run morning routine
        result = await strategy.morning_routine(alpaca)

        if requires_approval and result['approved_trades']:
            await self._create_approval_requests(
                execution_id,
                result['approved_trades'],
                schedule_id
            )

        await self._complete_execution(
            execution_id,
            'completed',
            f"Scanned {len(result['candidates'])} candidates, created {len(result['approved_trades'])} trade proposals"
        )

    except Exception as e:
        logger.error(f"Strategy execution failed: {str(e)}")
        await self._complete_execution(execution_id, 'failed', None, str(e))
```

---

## 🚨 Production Deployment

### Render Configuration

Update `backend/render.yaml`:

```yaml
services:
  - type: web
    name: ai-trader-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: API_TOKEN
        sync: false
      - key: APCA_API_KEY_ID
        sync: false
      - key: APCA_API_SECRET_KEY
        sync: false
      - key: SCHEDULER_ENABLED
        value: "true"
      - key: SCHEDULER_TIMEZONE
        value: "America/New_York"
```

### Vercel Environment Variables

No changes needed for Vercel - the frontend will proxy API calls to your Render backend.

---

## 📊 API Endpoints Reference

### Schedule Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scheduler/schedules` | List all schedules |
| POST | `/api/scheduler/schedules` | Create new schedule |
| PATCH | `/api/scheduler/schedules/{id}` | Update schedule |
| DELETE | `/api/scheduler/schedules/{id}` | Delete schedule |

### Emergency Controls

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scheduler/pause-all` | Emergency pause all schedules |
| POST | `/api/scheduler/resume-all` | Resume all schedules |

### Execution History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scheduler/executions?limit=20` | View execution history |
| GET | `/api/scheduler/executions?schedule_id={id}` | History for specific schedule |

### Approval Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scheduler/pending-approvals` | List pending trades |
| POST | `/api/scheduler/approvals/{id}/approve` | Approve trade |
| POST | `/api/scheduler/approvals/{id}/reject` | Reject trade |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scheduler/status` | Scheduler health status |

---

## ⚙️ Configuration Options

### Cron Expression Examples

```python
# Every weekday at 9:00 AM ET
"0 9 * * 1-5"

# Every weekday at 8:00 AM ET (pre-market)
"0 8 * * 1-5"

# Every 4 hours on weekdays
"0 */4 * * 1-5"

# Weekdays at 9 AM and 3 PM (market open/close)
"0 9,15 * * 1-5"

# Every 30 minutes during market hours (9:30 AM - 4:00 PM)
"*/30 9-16 * * 1-5"
```

### Timezone Options

- `America/New_York` - Eastern Time (recommended for US markets)
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time
- `Europe/London` - UK Time
- `Asia/Tokyo` - Japan Time

---

## 🧪 Testing

### Test Schedule Creation

```python
import requests

API_BASE = "http://localhost:8000/api/scheduler"
TOKEN = "rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create test schedule
response = requests.post(
    f"{API_BASE}/schedules",
    headers=headers,
    json={
        "name": "Test Schedule",
        "type": "morning_routine",
        "cron_expression": "*/5 * * * *",  # Every 5 minutes for testing
        "timezone": "America/New_York",
        "requires_approval": True,
        "enabled": True
    }
)

print(response.json())
```

### Check Pending Approvals

```python
# After schedule runs, check for approvals
response = requests.get(
    f"{API_BASE}/pending-approvals",
    headers=headers
)

approvals = response.json()
print(f"Found {len(approvals)} pending approvals")

# Approve first trade
if approvals:
    approval_id = approvals[0]['id']
    response = requests.post(
        f"{API_BASE}/approvals/{approval_id}/approve",
        headers=headers
    )
    print(response.json())
```

---

## 🔍 Monitoring & Debugging

### Check Scheduler Status

```bash
curl http://localhost:8000/api/scheduler/status \
  -H "Authorization: Bearer rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl"
```

Expected response:
```json
{
  "running": true,
  "jobs_count": 3,
  "status": "healthy"
}
```

### View Execution Logs

Check `backend/data/executions/*.json` files:

```bash
# View latest execution
ls -lt backend/data/executions/*.json | head -1 | xargs cat | jq .
```

### View Scheduler Logs

The scheduler logs to stdout. Check your terminal or Render logs:

```
✅ Scheduler initialized and started
Executing morning routine for schedule sch-123
Morning routine completed for schedule sch-123
```

---

## 🚨 Troubleshooting

### Schedules Not Running

1. Check scheduler is initialized:
```bash
curl http://localhost:8000/api/scheduler/status
```

2. Verify schedule is enabled:
```bash
curl http://localhost:8000/api/scheduler/schedules
```

3. Check APScheduler logs in terminal

### Approvals Not Appearing

1. Check execution completed successfully:
```bash
curl http://localhost:8000/api/scheduler/executions?limit=5
```

2. Verify approval files exist:
```bash
ls -la backend/data/approvals/
```

3. Check expiration times (4 hour default)

### Backend Restart Issues

Schedules are automatically restored on restart from `data/schedules/*.json` files. If not restoring:

1. Check file permissions
2. Verify JSON file format
3. Check scheduler initialization in logs

---

## 📈 Next Steps

### Phase 1: Basic Testing (This Week)
- [ ] Create test schedules with short intervals
- [ ] Verify execution history works
- [ ] Test approval workflow
- [ ] Configure emergency pause

### Phase 2: Integration (Next Week)
- [ ] Connect to real Under-$4 Multileg strategy
- [ ] Integrate with Alpaca API
- [ ] Add notification system (email/SMS)
- [ ] Set up monitoring dashboard

### Phase 3: Production (Week 3)
- [ ] Deploy to Render with persistent storage
- [ ] Configure production cron schedules
- [ ] Set risk thresholds for auto-execution
- [ ] Enable audit logging

### Phase 4: Enhancement (Week 4+)
- [ ] Add more strategy types
- [ ] Implement backtesting before scheduling
- [ ] Mobile push notifications
- [ ] Advanced risk scoring

---

## 🎯 Success Checklist

Your scheduler is working correctly when:

- ✅ `/api/scheduler/status` returns `running: true`
- ✅ Schedules appear in SchedulerSettings UI
- ✅ Jobs execute at scheduled times
- ✅ Executions logged in `data/executions/`
- ✅ Approvals appear in ApprovalQueue UI
- ✅ Emergency pause stops all schedules
- ✅ Schedule persists after server restart

---

## 📞 Support

### Check Implementation
- **Scheduler Service**: `backend/app/scheduler.py`
- **API Router**: `backend/app/routers/scheduler.py`
- **Frontend UI**: `frontend/components/SchedulerSettings.tsx`
- **Approval Queue**: `frontend/components/ApprovalQueue.tsx`

### Logs Location
- **Execution History**: `backend/data/executions/*.json`
- **Pending Approvals**: `backend/data/approvals/*.json`
- **Schedule Configs**: `backend/data/schedules/*.json`

### Quick Debug Commands

```bash
# List all data files
find backend/data -type f -name "*.json"

# Count pending approvals
ls backend/data/approvals/*.json 2>/dev/null | wc -l

# View latest execution
ls -t backend/data/executions/*.json | head -1 | xargs cat | jq .

# Check scheduler running
curl -s http://localhost:8000/api/scheduler/status | jq .
```

---

## ✨ Features Ready to Use

### Scheduler Management
- ✅ Create/edit/delete schedules
- ✅ Enable/disable individual schedules
- ✅ Configure cron expressions
- ✅ Set timezones
- ✅ View execution history

### Approval Workflow
- ✅ Human approval required before trades
- ✅ 4-hour expiration windows
- ✅ Risk-based filtering (high/low risk)
- ✅ Bulk approve/reject
- ✅ Trade rationale display
- ✅ Supporting data visualization

### Emergency Controls
- ✅ Pause all schedules instantly
- ✅ Resume all with one click
- ✅ Individual schedule pause/resume

### Automation Types
- ✅ Morning Routine (pre-market analysis)
- ✅ News Review (sentiment-based signals)
- ✅ AI Recommendations (ML-based trades)
- ✅ Custom Actions (extensible)

---

**Status**: Ready for Integration
**Last Updated**: October 7, 2025
**Commit**: ef6e97c
