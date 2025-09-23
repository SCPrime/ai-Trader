# CLI Interface Implementation

## File: main.py

Professional command-line interface with Rich formatting and comprehensive commands:

## Performance Optimizations:
- uvloop installation for Unix systems (high-performance async event loop)
- Efficient async operations throughout

## Available Commands:

### 1. run
Start the trading bot with options:
- `--mode`: paper (default) or live trading
- `--strategy`: Select strategies (RSI, MACD)
- `--symbols`: Comma-separated symbol list

**Safety**: Requires explicit confirmation for live trading mode

### 2. status
Check system status and account information:
- Account details (buying power, portfolio value, cash)
- Current positions with P&L
- Pattern day trader status

### 3. analyze
Analyze specific symbol performance:
- `--symbol`: Symbol to analyze (required)
- `--period`: Time period (1D, 1W, 1M)
- Shows price changes, volume, volatility, highs/lows

### 4. setup
Initial setup wizard:
- Creates required directories (data, logs, config, backups)
- Generates .env file from template
- Initializes database schema

### 5. performance
Show trading performance metrics:
- `--days`: Number of days to include (default: 30)
- Win rate, total trades, P&L summary
- Performance statistics table

## Rich UI Features:
- Colored output and formatted tables
- Live status updates
- Progress indicators
- Professional console styling