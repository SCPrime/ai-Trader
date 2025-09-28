# Working Configuration - 2025-09-27

## What's Running
- Main bot: Port 8000
- Dashboard: http://localhost:8000
- Mode: Paper Trading
- Status: HEALTHY

## File Structure That Works
- Main entry: [identify your main file]
- Dashboard: Simple Browser in VSCode
- Config: .env with paper API keys

## Known Issues
- API endpoints returning 404 (e.g., /api/status, /api/trade, /api/positions)
- Server only serving HTML dashboard, not full API functionality
- Multiple Python files with different route definitions - unclear which is active

## Next Tasks
- [ ] Identify which Python file is actually running the server
- [ ] Verify paper trades executing
- [ ] Check strategy configuration
- [ ] Review position sizing
- [ ] Implement missing API endpoints or switch to correct server file