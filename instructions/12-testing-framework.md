# Testing Framework

## Test Suite Overview

Comprehensive testing ensures system reliability and stability:

### Test Execution
```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=src --cov-report=html

# Run specific test module
pytest tests/test_alpaca_client.py -v
```

## Test Categories

### 1. Unit Tests
- **test_alpaca_client.py**: API integration testing
- **test_rsi_strategy.py**: Strategy signal generation
- **test_risk_manager.py**: Risk management logic
- **test_data_manager.py**: Data storage and retrieval

### 2. Integration Tests
- End-to-end trading workflows
- WebSocket connection handling
- Database operations
- External API interactions

### 3. Mock Implementations
- **mock_alpaca.py**: Simulated Alpaca API responses
- Market data simulation
- Order execution mocking
- Account status simulation

## Test Configuration

### conftest.py Features
- Pytest fixtures for common test data
- Database setup and teardown
- Mock client initialization
- Test environment configuration

### Coverage Requirements
- Minimum 80% code coverage
- Critical components have higher coverage
- Risk management: 95% coverage
- Trading strategies: 90% coverage
- Core client: 85% coverage

## Testing Best Practices

### Test Data
- Use realistic market data samples
- Test edge cases and error conditions
- Validate signal generation accuracy
- Verify risk limit enforcement

### Continuous Integration
- Automated test execution on commits
- Performance regression testing
- Security vulnerability scanning
- Dependency update testing

### Production Testing
- Paper trading validation
- Staged deployment testing
- Performance benchmarking
- Stress testing under load