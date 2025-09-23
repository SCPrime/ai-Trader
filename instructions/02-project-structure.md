# Project Structure

```
alpaca_trading_bot/
├── src/
│   ├── core/
│   │   ├── alpaca_client.py         # Alpaca API integration with async support
│   │   ├── websocket_manager.py     # Real-time data streaming
│   │   └── order_manager.py         # Order management and validation
│   ├── strategies/
│   │   ├── strategy_engine.py       # Strategy orchestration
│   │   ├── rsi_strategy.py          # RSI-based trading
│   │   └── macd_strategy.py         # MACD crossover strategy
│   ├── ai/
│   │   ├── ai_agent.py              # Claude LLM integration
│   │   └── prompts/
│   │       └── system_prompts.py    # AI trading prompts
│   ├── data/
│   │   ├── data_manager.py          # HDF5/SQLite data management
│   │   └── database/
│   │       ├── schemas.py           # Database schemas
│   │       └── migrations.py        # Schema versioning
│   ├── risk/
│   │   └── risk_manager.py          # Risk management system
│   ├── notifications/
│   │   ├── notification_manager.py  # Multi-channel notifications
│   │   ├── discord_notifier.py      # Discord integration
│   │   └── slack_notifier.py        # Slack integration
│   ├── monitoring/
│   │   ├── system_monitor.py        # System health monitoring
│   │   └── metrics_collector.py     # Performance metrics
│   └── utils/
│       ├── validators.py            # Input validation
│       ├── logger.py                # Centralized logging
│       └── state_manager.py         # Application state
├── config/
│   ├── config.py                    # Configuration management
│   └── settings.yaml                # Default settings
├── tests/
│   ├── conftest.py                  # Pytest fixtures
│   ├── test_alpaca_client.py        # Unit tests
│   └── mocks/
│       └── mock_alpaca.py           # Mock implementations
├── deployment/
│   ├── Dockerfile                   # Multi-stage Docker build
│   ├── docker-compose.yml           # Container orchestration
│   └── scripts/
│       └── deploy.sh                # Automated deployment
├── main.py                          # CLI entry point
├── app.py                           # Main application
├── requirements.txt                 # Dependencies
├── setup.py                         # Package installation
└── .env.example                     # Configuration template
```