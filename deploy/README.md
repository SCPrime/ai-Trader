# AI Trading Bot Production Deployment

This directory contains production deployment configurations and scripts for the AI Trading Bot.

## Files Overview

- `ai-trader.service` - Systemd service configuration
- `install.sh` - Production installation script
- `update.sh` - Update script for production deployments
- `README.md` - This documentation file

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or Debian 11+ (recommended)
- Python 3.8+
- 2GB+ RAM
- 10GB+ disk space
- Internet connectivity

### Required API Keys
- Alpaca Markets API credentials
- Anthropic API key for Claude AI
- Optional: Slack/Discord webhook URLs for notifications

## Installation

### 1. Quick Installation

```bash
# Download and run installation script
curl -sSL https://raw.githubusercontent.com/user/ai-trader/main/deploy/install.sh | sudo bash
```

### 2. Manual Installation

```bash
# Clone repository
git clone https://github.com/user/ai-trader.git
cd ai-trader

# Run installation script
sudo ./deploy/install.sh
```

### 3. Configuration

After installation, configure the application:

```bash
# Copy configuration template
sudo cp /opt/ai-trader/config/production.env.template /opt/ai-trader/config/production.env

# Edit configuration with your API keys
sudo nano /opt/ai-trader/config/production.env
```

### 4. Start the Service

```bash
# Start the service
sudo systemctl start ai-trader

# Enable auto-start on boot
sudo systemctl enable ai-trader

# Check status
sudo systemctl status ai-trader
```

## Configuration

### Environment Variables

Edit `/opt/ai-trader/config/production.env`:

```bash
# Trading Configuration
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_PAPER_TRADING=true  # Set to false for live trading

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Risk Management
MAX_POSITIONS=5
POSITION_SIZE=0.02
STOP_LOSS_PCT=0.02
MAX_DAILY_LOSS=0.05

# Notifications (optional)
ENABLE_SLACK=true
SLACK_TOKEN=your_slack_token
SLACK_CHANNEL=#trading-alerts

ENABLE_DISCORD=true
DISCORD_WEBHOOK=your_discord_webhook_url
```

### Systemd Service Configuration

The service is configured with:
- Automatic restart on failure
- Resource limits (2GB RAM, 200% CPU)
- Security hardening
- Health monitoring
- Graceful shutdown

## Management Commands

### Service Management
```bash
# Start service
sudo systemctl start ai-trader

# Stop service
sudo systemctl stop ai-trader

# Restart service
sudo systemctl restart ai-trader

# Check status
sudo systemctl status ai-trader

# Enable auto-start
sudo systemctl enable ai-trader

# Disable auto-start
sudo systemctl disable ai-trader
```

### Monitoring
```bash
# View real-time logs
sudo journalctl -u ai-trader -f

# View recent logs
sudo journalctl -u ai-trader -n 100

# Check health endpoint
curl http://localhost:8000/health

# View system resources
htop
```

### Updates
```bash
# Update to latest version
sudo ./deploy/update.sh

# Rollback if needed
sudo ./deploy/update.sh --rollback
```

## Monitoring and Alerting

### Health Checks
The service includes built-in health monitoring:
- System resource monitoring (CPU, memory, disk)
- Application health checks
- API endpoint monitoring
- Automatic alerting via notifications

### Log Files
- Application logs: `/var/log/ai-trader/`
- System logs: `journalctl -u ai-trader`
- Health check logs: `/var/log/ai-trader/health_check.log`

### Performance Monitoring
Access the monitoring dashboard at:
```
http://your-server-ip:8000/metrics
```

## Backup and Recovery

### Automatic Backups
Daily backups are automatically created at 2 AM and stored in `/opt/ai-trader/backups/`.

### Manual Backup
```bash
sudo /opt/ai-trader/scripts/backup.sh
```

### Restore from Backup
```bash
# List available backups
ls -la /opt/ai-trader/backups/

# Stop service
sudo systemctl stop ai-trader

# Restore backup (replace with actual backup file)
sudo tar -xzf /opt/ai-trader/backups/ai-trader-backup-YYYYMMDD_HHMMSS.tar.gz -C /

# Start service
sudo systemctl start ai-trader
```

## Security

### Firewall Configuration
The installation script configures UFW firewall with:
- SSH access (port 22)
- HTTP/HTTPS access (ports 80/443) for monitoring
- Application API (port 8000)

### Security Features
- Dedicated system user (`ai-trader`)
- Restricted file permissions
- Process isolation
- No new privileges
- Protected system directories

### SSL/TLS (Optional)
For production deployments, consider setting up SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Configure nginx reverse proxy
sudo nano /etc/nginx/sites-available/ai-trader
```

## Troubleshooting

### Common Issues

1. **Service fails to start**
   ```bash
   # Check logs
   sudo journalctl -u ai-trader -n 50

   # Check configuration
   sudo -u ai-trader /opt/ai-trader/venv/bin/python -c "
   import os
   os.chdir('/opt/ai-trader')
   from config.config import Config
   config = Config.from_env_file('config/production.env')
   print('Configuration loaded successfully')
   "
   ```

2. **High memory usage**
   ```bash
   # Check memory usage
   free -h

   # Restart service
   sudo systemctl restart ai-trader
   ```

3. **API connectivity issues**
   ```bash
   # Test API connectivity
   curl -v https://paper-api.alpaca.markets/v2/account

   # Check firewall
   sudo ufw status
   ```

4. **Permission errors**
   ```bash
   # Fix ownership
   sudo chown -R ai-trader:ai-trader /opt/ai-trader

   # Fix permissions
   sudo chmod -R 755 /opt/ai-trader
   sudo chmod 640 /opt/ai-trader/config/production.env
   ```

### Log Analysis
```bash
# Error patterns
sudo journalctl -u ai-trader | grep -i error

# Performance issues
sudo journalctl -u ai-trader | grep -i "memory\|cpu\|timeout"

# Trading activity
sudo journalctl -u ai-trader | grep -i "trade\|order\|signal"
```

## Performance Tuning

### System Optimization
```bash
# Increase file descriptor limits
echo "ai-trader soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "ai-trader hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize Python performance
export PYTHONOPTIMIZE=1
export PYTHONDONTWRITEBYTECODE=1
```

### Resource Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor in real-time
htop
iotop -a
nethogs
```

## Maintenance

### Regular Maintenance Tasks
1. Monitor log files and disk usage
2. Review trading performance metrics
3. Update system packages monthly
4. Rotate API keys quarterly
5. Test backup and recovery procedures

### Scheduled Maintenance
```bash
# Add to crontab for user ai-trader
sudo -u ai-trader crontab -e

# Example maintenance tasks:
# 0 2 * * * /opt/ai-trader/scripts/backup.sh
# 0 3 * * 0 /opt/ai-trader/scripts/cleanup_logs.sh
# */5 * * * * /opt/ai-trader/scripts/health_check.sh
```

## Support

For support and troubleshooting:
1. Check application logs
2. Review this documentation
3. Check the GitHub repository issues
4. Contact system administrator

## License

This deployment configuration is part of the AI Trading Bot project.
See the main project license for details.