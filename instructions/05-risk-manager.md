# Risk Manager Implementation

## File: src/risk/risk_manager.py

Comprehensive risk management system with multiple safety layers:

## Risk Limits Configuration:
- max_position_size: Maximum dollar value per position ($10,000 default)
- max_portfolio_risk: Maximum portfolio risk percentage (2% default)
- max_daily_loss: Maximum daily loss percentage (5% default)
- max_positions: Maximum number of open positions (10 default)
- max_correlation: Maximum correlation between positions (0.7 default)
- stop_loss_percentage: Automatic stop loss level (2% default)
- take_profit_percentage: Automatic take profit level (6% default)

## Risk Checks:
1. **Daily Loss Limit**: Automatically resets each trading day
2. **Position Size Validation**: Prevents oversized positions
3. **Portfolio Concentration**: Limits position to 10% of account value
4. **Position Count Limit**: Maximum number of simultaneous positions
5. **Correlation Risk**: Limits positions in similar assets (tech, finance, retail)

## Position Management:
- Kelly Criterion-based position sizing
- Volatility-adjusted position sizes
- Automatic stop-loss and take-profit monitoring
- Real-time P&L tracking

## Portfolio Risk Metrics:
- Total exposure calculation
- Value at Risk (VaR) at 95% confidence
- Expected shortfall calculation
- Maximum drawdown tracking