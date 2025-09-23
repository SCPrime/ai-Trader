#!/bin/bash

# AI Trading Bot Production Installation Script
# This script sets up the AI Trading Bot for production deployment on Ubuntu/Debian

set -euo pipefail

# Configuration
APP_NAME="ai-trader"
APP_USER="ai-trader"
APP_GROUP="ai-trader"
APP_DIR="/opt/ai-trader"
VENV_DIR="$APP_DIR/venv"
LOG_DIR="/var/log/ai-trader"
CONFIG_DIR="$APP_DIR/config"
DATA_DIR="$APP_DIR/data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."

    # Check OS
    if ! grep -q "Ubuntu\|Debian" /etc/os-release; then
        log_warning "This script is designed for Ubuntu/Debian. Other distributions may work but are not tested."
    fi

    # Check Python version
    if ! python3 --version | grep -q "3\.[89]\|3\.1[0-9]"; then
        log_error "Python 3.8+ is required"
        exit 1
    fi

    # Check available memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $TOTAL_MEM -lt 2048 ]]; then
        log_warning "Less than 2GB RAM available. Performance may be affected."
    fi

    log_success "System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."

    # Update package lists
    apt-get update

    # Install required packages
    apt-get install -y \
        python3-pip \
        python3-venv \
        python3-dev \
        build-essential \
        libhdf5-dev \
        pkg-config \
        curl \
        wget \
        git \
        htop \
        supervisor \
        nginx \
        redis-server \
        postgresql \
        postgresql-contrib \
        logrotate \
        fail2ban \
        ufw

    log_success "System dependencies installed"
}

# Create application user and directories
setup_user_and_directories() {
    log_info "Setting up application user and directories..."

    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        useradd --system --shell /bin/bash --home "$APP_DIR" --create-home "$APP_USER"
        log_success "Created user: $APP_USER"
    else
        log_info "User $APP_USER already exists"
    fi

    # Create required directories
    mkdir -p "$APP_DIR" "$LOG_DIR" "$CONFIG_DIR" "$DATA_DIR"

    # Set proper ownership
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR" "$LOG_DIR"

    # Set proper permissions
    chmod 755 "$APP_DIR"
    chmod 750 "$LOG_DIR"
    chmod 750 "$CONFIG_DIR"
    chmod 750 "$DATA_DIR"

    log_success "User and directories configured"
}

# Copy application files
copy_application_files() {
    log_info "Copying application files..."

    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

    # Copy application files
    cp -r "$SOURCE_DIR/src" "$APP_DIR/"
    cp -r "$SOURCE_DIR/config" "$APP_DIR/"
    cp "$SOURCE_DIR/main.py" "$APP_DIR/"
    cp "$SOURCE_DIR/requirements.txt" "$APP_DIR/"
    cp "$SOURCE_DIR/run_tests.py" "$APP_DIR/"

    # Copy deployment files
    if [[ -d "$SOURCE_DIR/deploy" ]]; then
        cp -r "$SOURCE_DIR/deploy" "$APP_DIR/"
    fi

    # Set ownership
    chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

    log_success "Application files copied"
}

# Setup Python virtual environment
setup_virtual_environment() {
    log_info "Setting up Python virtual environment..."

    # Create virtual environment as app user
    sudo -u "$APP_USER" python3 -m venv "$VENV_DIR"

    # Upgrade pip
    sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install --upgrade pip

    # Install Python dependencies
    sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt"

    log_success "Python virtual environment configured"
}

# Configure systemd service
configure_systemd_service() {
    log_info "Configuring systemd service..."

    # Copy service file
    cp "$APP_DIR/deploy/ai-trader.service" "/etc/systemd/system/"

    # Reload systemd
    systemctl daemon-reload

    # Enable service
    systemctl enable ai-trader.service

    log_success "Systemd service configured"
}

# Configure logging
configure_logging() {
    log_info "Configuring logging..."

    # Create logrotate configuration
    cat > "/etc/logrotate.d/ai-trader" << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_GROUP
    postrotate
        systemctl reload ai-trader.service > /dev/null 2>&1 || true
    endscript
}
EOF

    # Create rsyslog configuration for application logs
    cat > "/etc/rsyslog.d/50-ai-trader.conf" << EOF
# AI Trading Bot logs
if \$programname == 'ai-trader' then $LOG_DIR/ai-trader.log
& stop
EOF

    # Restart rsyslog
    systemctl restart rsyslog

    log_success "Logging configured"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall..."

    # Enable UFW
    ufw --force enable

    # Default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH
    ufw allow ssh

    # Allow HTTP and HTTPS for monitoring dashboard
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow application port (if needed)
    ufw allow 8000/tcp comment "AI Trader API"

    log_success "Firewall configured"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."

    # Create monitoring script
    cat > "$APP_DIR/scripts/health_check.sh" << 'EOF'
#!/bin/bash

# Health check script for AI Trading Bot

SERVICE_NAME="ai-trader"
LOG_FILE="/var/log/ai-trader/health_check.log"

# Check if service is running
if ! systemctl is-active --quiet $SERVICE_NAME; then
    echo "$(date): Service $SERVICE_NAME is not running" >> $LOG_FILE
    exit 1
fi

# Check if API is responding
if ! curl -f -s http://localhost:8000/health > /dev/null; then
    echo "$(date): API health check failed" >> $LOG_FILE
    exit 1
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [[ $MEMORY_USAGE -gt 90 ]]; then
    echo "$(date): High memory usage: ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "$(date): Health check passed" >> $LOG_FILE
EOF

    chmod +x "$APP_DIR/scripts/health_check.sh"
    chown "$APP_USER:$APP_GROUP" "$APP_DIR/scripts/health_check.sh"

    # Add to crontab
    (crontab -u "$APP_USER" -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/scripts/health_check.sh") | crontab -u "$APP_USER" -

    log_success "Monitoring configured"
}

# Create configuration templates
create_config_templates() {
    log_info "Creating configuration templates..."

    # Production environment template
    cat > "$CONFIG_DIR/production.env.template" << 'EOF'
# AI Trading Bot Production Configuration

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false

# Alpaca Configuration
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_PAPER_TRADING=true

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AI_MODEL=claude-3-sonnet-20240229

# Trading Configuration
MAX_POSITIONS=5
POSITION_SIZE=0.02
STOP_LOSS_PCT=0.02
TAKE_PROFIT_PCT=0.04

# Risk Management
MAX_DAILY_LOSS=0.05
MAX_PORTFOLIO_RISK=0.10

# Notifications
ENABLE_SLACK=false
SLACK_TOKEN=your_slack_token_here
SLACK_CHANNEL=#trading-alerts

ENABLE_DISCORD=false
DISCORD_WEBHOOK=your_discord_webhook_here

# Database
DATABASE_URL=sqlite:///opt/ai-trader/data/trading.db
DATA_DIR=/opt/ai-trader/data

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Monitoring
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=60
ENABLE_PERFORMANCE_MONITORING=true
EOF

    chown "$APP_USER:$APP_GROUP" "$CONFIG_DIR/production.env.template"
    chmod 640 "$CONFIG_DIR/production.env.template"

    log_success "Configuration templates created"
}

# Setup backup script
setup_backup() {
    log_info "Setting up backup script..."

    mkdir -p "$APP_DIR/scripts"

    cat > "$APP_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash

# Backup script for AI Trading Bot

BACKUP_DIR="/opt/ai-trader/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ai-trader-backup-$DATE.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    --exclude='venv' \
    --exclude='backups' \
    -C /opt ai-trader

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t ai-trader-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup created: $BACKUP_FILE"
EOF

    chmod +x "$APP_DIR/scripts/backup.sh"
    chown "$APP_USER:$APP_GROUP" "$APP_DIR/scripts/backup.sh"

    # Schedule daily backup
    (crontab -u "$APP_USER" -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh") | crontab -u "$APP_USER" -

    log_success "Backup script configured"
}

# Final setup and instructions
final_setup() {
    log_info "Performing final setup..."

    # Test Python imports
    sudo -u "$APP_USER" "$VENV_DIR/bin/python" -c "
import sys
sys.path.insert(0, '$APP_DIR')
try:
    from src.core.alpaca_client import AlpacaClient
    from src.ai.ai_agent import AIAgent
    print('Python imports successful')
except ImportError as e:
    print(f'Import error: {e}')
    sys.exit(1)
"

    log_success "Installation completed successfully!"

    echo ""
    echo "=============================================="
    echo "AI Trading Bot Installation Complete"
    echo "=============================================="
    echo ""
    echo "Next steps:"
    echo "1. Copy the configuration template:"
    echo "   cp $CONFIG_DIR/production.env.template $CONFIG_DIR/production.env"
    echo ""
    echo "2. Edit the configuration file with your API keys:"
    echo "   nano $CONFIG_DIR/production.env"
    echo ""
    echo "3. Start the service:"
    echo "   systemctl start ai-trader"
    echo ""
    echo "4. Check service status:"
    echo "   systemctl status ai-trader"
    echo ""
    echo "5. View logs:"
    echo "   journalctl -u ai-trader -f"
    echo ""
    echo "6. Enable monitoring dashboard (optional):"
    echo "   Visit http://your-server-ip:8000/health"
    echo ""
    echo "=============================================="
}

# Main installation function
main() {
    log_info "Starting AI Trading Bot installation..."

    check_root
    check_requirements
    install_dependencies
    setup_user_and_directories
    copy_application_files
    setup_virtual_environment
    configure_systemd_service
    configure_logging
    configure_firewall
    setup_monitoring
    create_config_templates
    setup_backup
    final_setup
}

# Run main function
main "$@"