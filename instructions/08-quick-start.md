# Quick Start Guide

## Step-by-Step Setup

### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/alpaca_trading_bot.git
cd alpaca_trading_bot
```

### 2. Install Dependencies
```bash
# Create Python 3.11 virtual environment (optional but recommended)
python3.11 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install all requirements
pip install -r requirements.txt
```

### 3. Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your Alpaca API credentials and settings
# Required: ALPACA_API_KEY, ALPACA_SECRET_KEY
```

### 4. Initialize System
```bash
# Run setup wizard
python main.py setup

# Verify connection (optional)
python main.py status
```

### 5. Start Trading
```bash
# Paper trading mode (safe default)
python main.py run --mode paper

# Alternative: Docker deployment
docker-compose up -d
```

## Important Notes:
- **Paper Trading**: Default mode for safety
- **Live Trading**: Requires `--mode live` and explicit confirmation
- **API Keys**: Store securely in .env file
- **Testing**: Always test strategies in paper mode first

## First Run Checklist:
- [ ] API keys configured
- [ ] Database initialized
- [ ] Account status verified
- [ ] Paper mode confirmed
- [ ] Monitoring setup (optional)