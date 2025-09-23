# Docker Deployment Configuration

## File: docker-compose.yml

Multi-service containerized deployment with:

## Services:

### 1. trading-bot
- Main application container
- Resource limits: 2 CPU cores, 4GB RAM
- Volume mounts for data persistence
- Health checks and auto-restart
- Environment file support

### 2. redis
- Redis cache service
- Data persistence with appendonly mode
- Health monitoring
- Network isolation

### 3. monitoring (Grafana)
- Real-time monitoring dashboard
- Accessible on port 3000
- Pre-configured dashboards
- Data visualization for metrics

## Features:
- **Resource Management**: CPU and memory limits/reservations
- **Health Checks**: Automated container health monitoring
- **Data Persistence**: Volume mounts for critical data
- **Network Isolation**: Private trading network
- **Auto-restart**: Unless-stopped restart policy

## Volumes:
- `./data:/app/data` - Trading data and database
- `./logs:/app/logs` - Application logs
- `./config:/app/config` - Configuration files
- `redis-data` - Redis persistence
- `grafana-data` - Grafana dashboards and settings

## Deployment Commands:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f trading-bot

# Stop services
docker-compose down
```