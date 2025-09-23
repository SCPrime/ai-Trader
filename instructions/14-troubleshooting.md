# Troubleshooting Guide

## Common Issues and Solutions

### 1. API Connection Failed

**Symptoms**: Authentication errors, network timeouts
**Solutions**:
- Verify Alpaca API key and secret in `.env` file
- Check internet connection stability
- Confirm Alpaca service status
- Verify firewall/proxy settings for API traffic

### 2. No Trades Executing

**Symptoms**: Bot running but no orders placed
**Solutions**:
- Confirm `TRADING_ENABLED` is true in configuration
- Check if market is open (no trades outside hours/holidays)
- Verify strategy signals using `analyze` command
- Review risk limits and account status
- Check for daily loss limits or other halts

### 3. WebSocket Disconnections

**Symptoms**: Frequent data stream interruptions
**Solutions**:
- `WebsocketManager` auto-reconnects by design
- Check network stability and reliability
- Monitor Alpaca streaming service status
- Review reconnection logs for patterns
- Restart bot to reset WebSocket connection

### 4. High Memory Usage

**Symptoms**: Growing memory footprint over time
**Solutions**:
- Monitor data retention in memory
- Implement periodic data pruning for old data
- Check for debug logging overhead
- Set log level to WARN/ERROR in production
- Review DataFrame usage for memory efficiency

### 5. Slow Performance

**Symptoms**: High latency, delayed signal processing
**Solutions**:
- Ensure uvloop is installed and active (Unix systems)
- Verify sufficient CPU resources
- Avoid blocking operations on main event loop
- Profile custom code for bottlenecks
- Consider vertical scaling (more CPU/RAM)
- Use horizontal scaling for multiple symbols

## Diagnostic Commands

### System Status
```bash
# Check account and connection status
python main.py status

# Analyze specific symbol performance
python main.py analyze --symbol AAPL --period 1D

# View recent performance metrics
python main.py performance --days 7
```

### Docker Diagnostics
```bash
# View container logs
docker-compose logs -f trading-bot

# Check container resource usage
docker stats

# Restart specific service
docker-compose restart trading-bot
```

### Log Analysis
```bash
# View recent logs
tail -f logs/trading_bot.log

# Search for errors
grep "ERROR" logs/trading_bot.log

# Filter by component
grep "RiskManager" logs/trading_bot.log
```

## Performance Optimization

### Event Loop Optimization
- Use uvloop on Unix systems for 2-4x performance boost
- Ensure all I/O operations are async
- Avoid CPU-intensive tasks on main thread

### Database Optimization
- Regular SQLite VACUUM operations
- Proper indexing on frequently queried columns
- Batch operations for multiple inserts

### Memory Management
- Implement data windowing for large datasets
- Use generators for processing large data
- Regular garbage collection monitoring