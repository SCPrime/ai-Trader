# Safety Features

## Primary Safety Mechanisms

### 1. Paper Trading Default
- Bot runs in Alpaca's paper trading environment by default
- Prevents accidental real-money trades
- Requires explicit `--mode live` flag for live trading

### 2. Strict Risk Limits
- All trades evaluated by `RiskManager.can_trade()`
- Predefined limits protect against excessive risk:
  - Maximum position size
  - Maximum daily loss percentage
  - Portfolio concentration limits
  - Maximum number of positions

### 3. Live Trade Confirmation
- CLI forces user confirmation before enabling live trading
- Warning message displayed for live mode
- Prevents accidental live trading activation

### 4. Stop-Loss & Take-Profit
- Every position monitored for exit conditions
- Default stop-loss: 2% loss
- Default take-profit: 6% gain
- Automated position closure for risk management

### 5. Daily Loss Halt
- System stops new trades if daily losses exceed 5% of account
- Automatic reset at start of each trading day
- Prevents cascade losses during bad market conditions

### 6. Audit Logging
- All trade decisions logged with timestamps
- Complete order history and reasoning
- Error tracking and system events
- Compliance and review capabilities

## Additional Protections

### Correlation Risk Management
- Limits positions in similar asset categories
- Prevents over-concentration in correlated stocks
- Maximum 3 positions per correlation group

### Position Size Validation
- Kelly Criterion-based sizing
- Volatility-adjusted position sizes
- Maximum 10% of account per position
- Account value percentage limits

### Market Hour Enforcement
- Trading only during market hours
- Holiday and weekend protection
- Pre-market and after-hours restrictions