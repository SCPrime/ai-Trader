#!/bin/bash

# AI Trading Bot Update Script
# This script updates the AI Trading Bot in production

set -euo pipefail

# Configuration
APP_NAME="ai-trader"
APP_USER="ai-trader"
APP_DIR="/opt/ai-trader"
VENV_DIR="$APP_DIR/venv"
BACKUP_DIR="$APP_DIR/backups"

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

# Check if service exists
check_service() {
    if ! systemctl list-units --type=service | grep -q "$APP_NAME"; then
        log_error "Service $APP_NAME not found. Please run install.sh first."
        exit 1
    fi
}

# Create backup before update
create_backup() {
    log_info "Creating backup before update..."

    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/pre-update-backup-$DATE.tar.gz"

    mkdir -p "$BACKUP_DIR"

    tar -czf "$BACKUP_FILE" \
        --exclude='*.pyc' \
        --exclude='__pycache__' \
        --exclude='venv' \
        --exclude='backups' \
        --exclude='logs' \
        -C /opt ai-trader

    log_success "Backup created: $BACKUP_FILE"
}

# Stop the service
stop_service() {
    log_info "Stopping $APP_NAME service..."

    if systemctl is-active --quiet "$APP_NAME"; then
        systemctl stop "$APP_NAME"
        log_success "Service stopped"
    else
        log_info "Service was not running"
    fi
}

# Update application files
update_application() {
    log_info "Updating application files..."

    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

    # Backup current config
    if [[ -f "$APP_DIR/config/production.env" ]]; then
        cp "$APP_DIR/config/production.env" "$APP_DIR/config/production.env.backup"
        log_info "Backed up current configuration"
    fi

    # Update source files
    cp -r "$SOURCE_DIR/src" "$APP_DIR/"
    cp "$SOURCE_DIR/main.py" "$APP_DIR/"
    cp "$SOURCE_DIR/requirements.txt" "$APP_DIR/"

    # Update deployment files if they exist
    if [[ -d "$SOURCE_DIR/deploy" ]]; then
        cp -r "$SOURCE_DIR/deploy" "$APP_DIR/"
    fi

    # Restore config if it was backed up
    if [[ -f "$APP_DIR/config/production.env.backup" ]]; then
        cp "$APP_DIR/config/production.env.backup" "$APP_DIR/config/production.env"
        rm "$APP_DIR/config/production.env.backup"
        log_info "Restored configuration"
    fi

    # Set proper ownership
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"

    log_success "Application files updated"
}

# Update Python dependencies
update_dependencies() {
    log_info "Updating Python dependencies..."

    # Update pip first
    sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install --upgrade pip

    # Update dependencies
    sudo -u "$APP_USER" "$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt" --upgrade

    log_success "Dependencies updated"
}

# Update systemd service
update_systemd_service() {
    log_info "Updating systemd service..."

    if [[ -f "$APP_DIR/deploy/ai-trader.service" ]]; then
        cp "$APP_DIR/deploy/ai-trader.service" "/etc/systemd/system/"
        systemctl daemon-reload
        log_success "Systemd service updated"
    else
        log_warning "No systemd service file found in deployment"
    fi
}

# Test the application
test_application() {
    log_info "Testing application..."

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

    log_success "Application test passed"
}

# Start the service
start_service() {
    log_info "Starting $APP_NAME service..."

    systemctl start "$APP_NAME"

    # Wait a moment for service to start
    sleep 5

    if systemctl is-active --quiet "$APP_NAME"; then
        log_success "Service started successfully"
    else
        log_error "Service failed to start"
        log_info "Check logs with: journalctl -u $APP_NAME"
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Performing health check..."

    # Wait for service to be fully ready
    sleep 10

    # Check if API is responding
    if curl -f -s http://localhost:8000/health > /dev/null; then
        log_success "Health check passed"
    else
        log_warning "Health check failed - service may still be starting"
        log_info "Monitor with: journalctl -u $APP_NAME -f"
    fi
}

# Rollback function
rollback() {
    log_error "Update failed. Rolling back..."

    # Stop service
    systemctl stop "$APP_NAME"

    # Find latest backup
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "pre-update-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [[ -n "$LATEST_BACKUP" ]]; then
        log_info "Restoring from backup: $LATEST_BACKUP"

        # Remove current files
        rm -rf "$APP_DIR/src" "$APP_DIR/main.py"

        # Restore from backup
        tar -xzf "$LATEST_BACKUP" -C /

        # Set proper ownership
        chown -R "$APP_USER:$APP_USER" "$APP_DIR"

        # Start service
        systemctl start "$APP_NAME"

        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Show update summary
show_summary() {
    log_info "Update completed successfully!"

    echo ""
    echo "=============================================="
    echo "AI Trading Bot Update Summary"
    echo "=============================================="
    echo "Service Status: $(systemctl is-active ai-trader)"
    echo "Service Enabled: $(systemctl is-enabled ai-trader)"
    echo ""
    echo "Useful commands:"
    echo "- Check status: systemctl status ai-trader"
    echo "- View logs: journalctl -u ai-trader -f"
    echo "- Stop service: systemctl stop ai-trader"
    echo "- Start service: systemctl start ai-trader"
    echo "- Restart service: systemctl restart ai-trader"
    echo ""
    echo "Health check: curl http://localhost:8000/health"
    echo "=============================================="
}

# Main update function
main() {
    log_info "Starting AI Trading Bot update..."

    # Setup error handling for rollback
    trap rollback ERR

    check_root
    check_service
    create_backup
    stop_service
    update_application
    update_dependencies
    update_systemd_service
    test_application
    start_service
    health_check
    show_summary

    # Disable error trap on successful completion
    trap - ERR
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rollback)
            log_info "Rolling back to previous version..."
            rollback
            exit 0
            ;;
        --help|-h)
            echo "AI Trading Bot Update Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --rollback    Rollback to previous version"
            echo "  --help, -h    Show this help message"
            echo ""
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
    shift
done

# Run main function
main "$@"