# Production Deployment

## Cloud Deployment (Recommended)

### Option A: Render + Vercel (Active)

**Live Deployment**: See [DEPLOY_INSTRUCTIONS.md](../DEPLOY_INSTRUCTIONS.md) for complete setup guide.

- **Backend**: [Render](https://render.com) - FastAPI with Redis, kill-switch, idempotency
- **Frontend**: [Vercel](https://vercel.com) - Next.js with secure server-side proxy
- **Cost**: $0-5/month (free tiers available)

**Architecture**:
```
User Browser → Vercel (Frontend + Proxy) → Render (FastAPI) → Redis
```

**Security Features**:
- Strict CORS to specific origins
- CSP + security headers
- Server-side token hiding (never exposed to browser)
- Redis idempotency (duplicate request detection)
- Kill-switch (emergency trading halt)
- Rate limiting (60 req/min per IP)
- Request ID tracing

**Quick Deploy**:
1. Deploy backend to Render from `backend/` directory on `feat/option-a-cloud-backend` branch
2. Deploy frontend to Vercel from `frontend/` directory on same branch
3. Configure environment variables (see DEPLOY_INSTRUCTIONS.md)
4. Run acceptance tests: `./test-deployment.sh <vercel-url>`

## Docker Deployment (Local/Self-Hosted)

### Setup Process
```bash
# Build and start containers in background
docker-compose up -d

# Monitor bot activity
docker-compose logs -f trading-bot

# Stop all services
docker-compose down
```

### Container Services
1. **Trading Bot** (alpaca-trading-bot container)
   - Main application execution
   - Resource limits: 2 CPU cores, 4GB RAM
   - Auto-restart on failure

2. **Redis** (trading-redis container)
   - Caching and message queues
   - Data persistence enabled
   - Health monitoring

3. **Grafana** (trading-monitoring container)
   - Monitoring dashboard at http://localhost:3000
   - Custom dashboards for trading metrics
   - Performance visualization

### Data Persistence
- All critical data stored in mounted volumes
- Survives container restarts and updates
- Backup-friendly architecture

## Systemd Deployment (Linux)

### Service Installation
```bash
# Install service file
sudo cp deployment/systemd/trading-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable trading-bot.service

# Start and monitor service
sudo systemctl start trading-bot.service
sudo systemctl status trading-bot.service
journalctl -u trading-bot.service -f
```

### Service Features
- Automatic startup on boot
- Process monitoring and restart
- Log integration with systemd
- User and permissions management

## Production Considerations

### Security
- API keys stored in environment variables
- Network isolation with Docker networks
- Regular security updates
- Access logging and monitoring

### Scalability
- Horizontal scaling capability
- Load balancing for multiple instances
- Database connection pooling
- Efficient resource utilization

### Monitoring
- Health checks and alerts
- Performance metrics collection
- Error tracking and notification
- Capacity planning metrics