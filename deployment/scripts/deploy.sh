#!/bin/bash

# AI Trading Bot Deployment Script
# Automated deployment with health checks and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
LOG_DIR="logs"
BACKUP_DIR="backups"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your API keys before continuing."
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    fi

    print_success "Prerequisites check completed"
}

create_directories() {
    print_status "Creating necessary directories..."

    directories=("$LOG_DIR" "$BACKUP_DIR" "data" "config/backups" "deployment/grafana/dashboards" "deployment/grafana/datasources" "deployment/prometheus")

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done

    print_success "Directory structure created"
}

backup_data() {
    if [ -d "data" ] && [ "$(ls -A data)" ]; then
        print_status "Creating backup of existing data..."

        timestamp=$(date +"%Y%m%d_%H%M%S")
        backup_file="$BACKUP_DIR/data_backup_$timestamp.tar.gz"

        tar -czf "$backup_file" data/
        print_success "Data backed up to: $backup_file"
    fi
}

setup_monitoring_config() {
    print_status "Setting up monitoring configuration..."

    # Create Grafana datasource configuration
    cat > deployment/grafana/datasources/postgres.yml << EOF
apiVersion: 1

datasources:
  - name: PostgreSQL
    type: postgres
    url: postgres:5432
    database: trading_bot
    user: trader
    secureJsonData:
      password: \${POSTGRES_PASSWORD}
    jsonData:
      sslmode: disable
    access: proxy
    isDefault: true
EOF

    # Create basic Prometheus configuration
    cat > deployment/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'trading-bot'
    static_configs:
      - targets: ['trading-bot:8000']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s
EOF

    print_success "Monitoring configuration created"
}

deploy_services() {
    print_status "Deploying services with Docker Compose..."

    # Set build date
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VERSION=${VERSION:-1.0.0}

    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose pull

    # Build and start services
    print_status "Building and starting services..."
    docker-compose up -d --build

    print_success "Services deployed"
}

wait_for_services() {
    print_status "Waiting for services to be ready..."

    services=("redis" "postgres" "trading-bot")
    max_attempts=30

    for service in "${services[@]}"; do
        print_status "Checking $service..."
        attempts=0

        while [ $attempts -lt $max_attempts ]; do
            if docker-compose exec -T "$service" echo "ready" &>/dev/null; then
                print_success "$service is ready"
                break
            else
                attempts=$((attempts + 1))
                print_status "Waiting for $service... (attempt $attempts/$max_attempts)"
                sleep 5
            fi
        done

        if [ $attempts -eq $max_attempts ]; then
            print_error "$service failed to become ready"
            print_status "Showing logs for $service:"
            docker-compose logs --tail=20 "$service"
            exit 1
        fi
    done

    print_success "All services are ready"
}

show_status() {
    print_status "Deployment status:"
    echo

    # Show container status
    docker-compose ps
    echo

    # Show service URLs
    print_status "Service URLs:"
    echo "📊 Grafana Dashboard: http://localhost:3000"
    echo "📈 Prometheus Metrics: http://localhost:9090"
    echo "🤖 Trading Bot API: http://localhost:8000"
    echo

    # Show important information
    print_status "Important Information:"
    echo "• Grafana default login: admin / admin123 (change in .env file)"
    echo "• Trading bot runs in PAPER mode by default"
    echo "• View logs: docker-compose logs -f trading-bot"
    echo "• Stop services: docker-compose down"
    echo
}

cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    docker-compose down -v
    exit 1
}

# Main deployment process
main() {
    print_status "🚀 Starting AI Trading Bot deployment..."
    echo

    # Set error trap
    trap cleanup_on_error ERR

    check_prerequisites
    create_directories
    backup_data
    setup_monitoring_config
    deploy_services
    wait_for_services
    show_status

    print_success "🎉 Deployment completed successfully!"
    print_status "The AI Trading Bot is now running in paper trading mode."
    print_warning "Remember to configure your API keys in the .env file before live trading."
}

# Command line options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        print_status "Stopping all services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    "logs")
        service=${2:-trading-bot}
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
        ;;
    "status")
        docker-compose ps
        ;;
    "update")
        print_status "Updating services..."
        docker-compose pull
        docker-compose up -d --build
        print_success "Services updated"
        ;;
    "cleanup")
        print_status "Cleaning up all containers and volumes..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  deploy    Deploy all services (default)"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  logs      Show logs (optional service name)"
        echo "  status    Show service status"
        echo "  update    Update and restart services"
        echo "  cleanup   Remove all containers and volumes"
        echo "  help      Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac