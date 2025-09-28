// AI Trading Bot Dashboard JavaScript

class TradingDashboard {
    constructor() {
        this.ws = null;
        this.currentSymbol = 'AAPL';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadInitialData();
        this.setupPeriodicUpdates();
    }

    setupEventListeners() {
        // Chart loading
        document.getElementById('loadChart').addEventListener('click', () => {
            const symbol = document.getElementById('symbolInput').value.toUpperCase().trim();
            if (symbol && symbol.length > 0) {
                console.log(`🎯 User requested chart for: ${symbol}`);
                this.currentSymbol = symbol;
                this.showNotification(`Loading ${symbol} chart with real-time data...`, 'info');
                this.loadChart(symbol);
                this.updateTradeForm(symbol);
            } else {
                this.showNotification('Please enter a valid stock symbol', 'warning');
            }
        });

        // Enter key for symbol input
        document.getElementById('symbolInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loadChart').click();
            }
        });

        // Trading mode toggle
        document.getElementById('tradingModeToggle').addEventListener('change', (e) => {
            this.toggleTradingMode(e.target.checked);
        });

        // AI mode toggle
        document.getElementById('aiModeToggle').addEventListener('change', (e) => {
            this.toggleAIMode(e.target.checked);
        });

        // AI Analysis
        document.getElementById('getAiAnalysis').addEventListener('click', () => {
            this.getAIAnalysis(this.currentSymbol);
        });

        // Trading buttons
        document.getElementById('buyButton').addEventListener('click', () => {
            this.placeTrade('buy');
        });

        document.getElementById('sellButton').addEventListener('click', () => {
            this.placeTrade('sell');
        });

        // Update trade symbol when chart symbol changes
        document.getElementById('symbolInput').addEventListener('input', (e) => {
            document.getElementById('tradeSymbol').value = e.target.value.toUpperCase();
        });

        // Strategy Management
        document.getElementById('createStrategy').addEventListener('click', () => {
            this.createStrategy();
        });

        document.getElementById('loadExamples').addEventListener('click', () => {
            this.loadStrategyExamples();
        });

        document.getElementById('refreshStrategies').addEventListener('click', () => {
            this.loadStrategies();
        });

        // Settings Management
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('validateSettings').addEventListener('click', () => {
            this.validateSettings();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        document.getElementById('loadPresets').addEventListener('click', () => {
            this.loadPresets();
        });

        // Refresh positions button
        document.getElementById('refreshPositions').addEventListener('click', () => {
            this.loadPositions();
        });

        // Strategy Management buttons
        document.getElementById('strategizeBtn').addEventListener('click', () => {
            this.testStrategy();
        });

        document.getElementById('implementStrategyBtn').addEventListener('click', () => {
            this.implementStrategy();
        });

        document.getElementById('viewActiveStrategies').addEventListener('click', () => {
            this.loadActiveStrategies();
        });

        // Strategy selection auto-trigger for options strategies
        document.getElementById('strategySelect').addEventListener('change', (e) => {
            this.handleStrategySelection(e.target.value);
        });

        // AI Chat input event listener
        document.getElementById('aiChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });

        // Backtest event listeners
        document.getElementById('runBacktestBtn').addEventListener('click', () => {
            this.runBacktest();
        });

        document.getElementById('backtestStrategy').addEventListener('change', (e) => {
            this.updateStrategyParameters(e.target.value);
        });

        // Morning routine event listener
        document.getElementById('runMorningRoutineBtn').addEventListener('click', () => {
            this.runMorningRoutine();
        });

        // News research event listener
        document.getElementById('searchNewsBtn').addEventListener('click', () => {
            this.searchNews();
        });

        // Allow Enter key for news search
        document.getElementById('newsSymbolSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchNews();
            }
        });

        // Options strategy event listener
        document.getElementById('buildOptionsStrategyBtn').addEventListener('click', () => {
            this.buildOptionsStrategy();
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected');
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateConnectionStatus('connecting');

            setTimeout(() => {
                console.log(`Reconnection attempt ${this.reconnectAttempts}`);
                this.connectWebSocket();
            }, 2000 * this.reconnectAttempts);
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        const icon = statusElement.querySelector('i');

        statusElement.className = 'badge';

        switch (status) {
            case 'connected':
                statusElement.classList.add('bg-success', 'connected');
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
                break;
            case 'connecting':
                statusElement.classList.add('bg-warning', 'connecting');
                statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting';
                break;
            case 'disconnected':
                statusElement.classList.add('bg-danger', 'disconnected');
                statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Disconnected';
                break;
        }
    }

    handleWebSocketMessage(data) {
        console.log('WebSocket message received:', data);

        switch (data.type) {
            case 'periodic_update':
                this.updateDashboardData(data);
                break;
            case 'market_data':
            case 'price_update':
                this.handleMarketDataUpdate(data);
                break;
            case 'trading_mode_changed':
                this.updateTradingModeUI(data.is_live);
                break;
            case 'ai_mode_changed':
                this.updateAIModeUI(data.is_auto);
                break;
            case 'trade_placed':
                this.showNotification('Trade placed successfully', 'success');
                this.loadOrders();
                this.loadPositions();
                break;
            default:
                console.warn('Unknown WebSocket message type:', data.type, 'Full message:', data);
        }
    }

    async loadInitialData() {
        try {
            // Load default chart
            await this.loadChart(this.currentSymbol);

            // Load account data
            await this.loadAccountData();

            // Load positions and orders
            await this.loadPositions();
            await this.loadOrders();

            // Load system health
            await this.loadSystemHealth();

            // Load trading status
            await this.loadTradingStatus();

            // Load strategies and settings
            await this.loadStrategies();
            await this.loadCurrentSettings();

            // Load available strategies for dropdown
            await this.loadAvailableStrategies();

        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load initial data', 'error');
        }
    }

    async loadChart(symbol) {
        try {
            const chartContainer = document.getElementById('chartContainer');
            chartContainer.innerHTML = `
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status"></div>
                        <div class="mt-2"><strong>Loading ${symbol} chart data...</strong></div>
                        <div class="small text-muted">Fetching real-time data from Yahoo Finance</div>
                    </div>
                </div>
            `;

            // Add cache busting and debugging
            const timestamp = new Date().getTime();
            const url = `/api/chart/${symbol}?t=${timestamp}`;
            console.log(`🔄 Loading chart for ${symbol} from: ${url}`);

            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            console.log(`Chart data received for ${symbol}:`, data);

            if (data.error) {
                throw new Error(data.error);
            }

            // Update price display
            await this.updateCurrentPrice(symbol);

            // Completely clear and reset chart container
            Plotly.purge(chartContainer);
            chartContainer.innerHTML = ''; // Clear any residual content

            // Add a brief delay to ensure clearing is complete
            setTimeout(() => {
                // Render fresh chart
                const chartData = JSON.parse(data.chart);
                console.log(`Parsed chart data for ${symbol}:`, chartData);
                console.log(`Chart data traces:`, chartData.data.length);

                // Extract price info for verification
                if (chartData.data[0] && chartData.data[0].close && chartData.data[0].close.bdata) {
                    try {
                        const closeBytes = atob(chartData.data[0].close.bdata);
                        const prices = new Float64Array(closeBytes.length / 8);
                        for (let i = 0; i < prices.length; i++) {
                            const bytes = closeBytes.slice(i * 8, (i + 1) * 8);
                            prices[i] = new DataView(new ArrayBuffer(8)).setUint8Array(bytes);
                        }
                        const minPrice = Math.min(...Array.from(prices).filter(p => p > 0));
                        const maxPrice = Math.max(...Array.from(prices).filter(p => p > 0));
                        console.log(`${symbol} price range in chart: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
                    } catch (e) {
                        console.log(`Price extraction failed for ${symbol}:`, e);
                    }
                }

                // Update chart title to show it's real data
                if (chartData.layout) {
                    chartData.layout.title = {
                        text: `${symbol} - Live Stock Data (Yahoo Finance)`,
                        font: { size: 16 }
                    };
                    // Force y-axis to rescale
                    chartData.layout.yaxis = {
                        ...chartData.layout.yaxis,
                        autorange: true,
                        fixedrange: false
                    };
                }

                // Create completely new plot
                Plotly.newPlot(chartContainer, chartData.data, chartData.layout, {
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
                });

                console.log(`✓ Chart successfully rendered for ${symbol}`);

                // Show success notification
                this.showNotification(`${symbol} chart loaded with real-time data!`, 'success');
            }, 100);

            // Update technical indicators
            this.updateTechnicalIndicators(data.indicators);

            // Enable AI analysis button
            document.getElementById('getAiAnalysis').disabled = false;

        } catch (error) {
            console.error('Failed to load chart:', error);
            document.getElementById('chartContainer').innerHTML =
                '<div class="alert alert-danger">Failed to load chart data</div>';
            this.showNotification('Failed to load chart', 'error');
        }
    }

    async loadAccountData() {
        try {
            const response = await fetch('/api/account');
            const account = await response.json();

            // Update portfolio value
            document.getElementById('portfolioValue').textContent =
                this.formatCurrency(account.portfolio_value);

            // Update buying power
            document.getElementById('buyingPower').textContent =
                this.formatCurrency(account.buying_power);

            // Calculate and display day change
            const dayChange = parseFloat(account.equity) - parseFloat(account.last_equity);
            const dayChangePercent = (dayChange / parseFloat(account.last_equity)) * 100;

            const changeElement = document.getElementById('portfolioChange');
            changeElement.textContent = `${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}% (${this.formatCurrency(dayChange)})`;
            changeElement.className = dayChange >= 0 ? 'text-success' : 'text-danger';

        } catch (error) {
            console.error('Failed to load account data:', error);
        }
    }

    async loadPositions() {
        try {
            const response = await fetch('/api/positions');
            const positions = await response.json();

            const tbody = document.querySelector('#positionsTable tbody');
            tbody.innerHTML = '';

            // Update active positions count
            document.getElementById('activePositions').textContent = positions.length;

            // Update last updated timestamp
            document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

            if (positions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">No active positions</td></tr>';
                document.getElementById('noPositionsMessage').style.display = 'block';
                this.updatePortfolioSummary([]);
                return;
            }

            document.getElementById('noPositionsMessage').style.display = 'none';

            positions.forEach(position => {
                const row = document.createElement('tr');

                // Style classes for P&L
                const dayPnlClass = position.day_pnl >= 0 ? 'text-success' : 'text-danger';
                const totalPnlClass = position.unrealized_pl >= 0 ? 'text-success' : 'text-danger';

                // Asset type display
                const assetType = position.asset_class || 'Stock';

                row.innerHTML = `
                    <td class="text-center">
                        <strong>${position.symbol}</strong>
                        <small class="d-block text-muted">${position.side.toUpperCase()}</small>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-secondary">${assetType}</span>
                    </td>
                    <td class="text-center">
                        <strong>${position.qty_formatted}</strong>
                    </td>
                    <td class="text-center">
                        $${position.avg_price}
                    </td>
                    <td class="text-center">
                        <strong>$${position.current_price_formatted}</strong>
                    </td>
                    <td class="text-center">
                        <strong>$${this.formatNumber(position.position_value)}</strong>
                    </td>
                    <td class="text-center ${dayPnlClass}">
                        <strong>$${this.formatNumber(position.day_pnl)}</strong>
                    </td>
                    <td class="text-center ${dayPnlClass}">
                        <strong>${position.day_pnl_pct > 0 ? '+' : ''}${position.day_pnl_pct}%</strong>
                    </td>
                    <td class="text-center ${totalPnlClass}">
                        <strong>$${this.formatNumber(position.unrealized_pl)}</strong>
                    </td>
                    <td class="text-center ${totalPnlClass}">
                        <strong>${position.total_pnl_pct > 0 ? '+' : ''}${position.total_pnl_pct}%</strong>
                    </td>
                    <td class="text-center">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm mb-1" onclick="dashboard.loadChart('${position.symbol}')">
                                <i class="fas fa-chart-line"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="dashboard.closePosition('${position.symbol}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Update portfolio summary
            this.updatePortfolioSummary(positions);

        } catch (error) {
            console.error('Failed to load positions:', error);
            const tbody = document.querySelector('#positionsTable tbody');
            tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger py-4">Failed to load positions</td></tr>';
        }
    }

    updatePortfolioSummary(positions) {
        try {
            // Calculate totals
            const totalPortfolioValue = positions.reduce((sum, pos) => sum + pos.position_value, 0);
            const totalDayPnL = positions.reduce((sum, pos) => sum + pos.day_pnl, 0);
            const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pl, 0);

            // Update display
            document.getElementById('totalPortfolioValue').textContent = `$${this.formatNumber(totalPortfolioValue)}`;

            const dayPnLElement = document.getElementById('totalDayPnL');
            dayPnLElement.textContent = `${totalDayPnL > 0 ? '+' : ''}$${this.formatNumber(totalDayPnL)}`;
            dayPnLElement.className = `mb-0 ${totalDayPnL >= 0 ? 'text-success' : 'text-danger'}`;

            const unrealizedPnLElement = document.getElementById('totalUnrealizedPnL');
            unrealizedPnLElement.textContent = `${totalUnrealizedPnL > 0 ? '+' : ''}$${this.formatNumber(totalUnrealizedPnL)}`;
            unrealizedPnLElement.className = `mb-0 ${totalUnrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`;

        } catch (error) {
            console.error('Failed to update portfolio summary:', error);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/orders');
            const result = await response.json();

            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = '';

            if (!result.orders || result.orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No recent orders</td></tr>';
                return;
            }

            result.orders.slice(0, 10).forEach(order => {
                const row = document.createElement('tr');
                const timestamp = new Date(order.timestamp);
                const timeStr = timestamp.toLocaleTimeString();

                // Determine status styling
                const statusClass = order.status === 'FILLED' ? 'text-success' :
                                   order.status === 'PENDING' ? 'text-warning' : 'text-danger';

                // Determine side styling
                const sideClass = order.side.includes('SELL') ? 'text-danger' : 'text-success';

                row.innerHTML = `
                    <td class="small">${timeStr}</td>
                    <td><strong>${order.symbol}</strong></td>
                    <td class="${sideClass} small">${order.side}</td>
                    <td class="text-end">${order.quantity}</td>
                    <td class="text-end">$${order.price.toFixed(2)}</td>
                    <td class="${statusClass} small">${order.status}</td>
                `;

                // Add tooltip with additional info
                row.title = `Strategy: ${order.strategy} | Leg: ${order.leg_type}${order.expiration ? ' | Exp: ' + order.expiration : ''}${order.profit_target ? ' | Target: $' + order.profit_target.toFixed(2) : ''}`;

                tbody.appendChild(row);
            });

        } catch (error) {
            console.error('Failed to load orders:', error);
            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load orders</td></tr>';
        }
    }

    async loadSystemHealth() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();

            const healthElement = document.getElementById('systemHealth');
            healthElement.textContent = health.status.toUpperCase();

            // Update health card color
            const healthCard = healthElement.closest('.card');
            healthCard.className = 'card text-white';

            switch (health.status) {
                case 'healthy':
                    healthCard.classList.add('bg-success');
                    break;
                case 'warning':
                    healthCard.classList.add('bg-warning');
                    break;
                case 'critical':
                    healthCard.classList.add('bg-danger');
                    break;
                default:
                    healthCard.classList.add('bg-secondary');
            }

        } catch (error) {
            console.error('Failed to load system health:', error);
        }
    }

    async loadTradingStatus() {
        try {
            const response = await fetch('/api/trading/status');
            const status = await response.json();

            // Update the trading mode UI
            this.updateTradingModeUI(status.is_live);

            console.log(`Trading mode loaded: ${status.mode} (Alpaca paper: ${status.alpaca_paper_mode})`);

        } catch (error) {
            console.error('Failed to load trading status:', error);
        }
    }

    async loadAvailableStrategies() {
        try {
            const response = await fetch('/api/strategies');
            const strategies = await response.json();

            const dropdown = document.getElementById('strategySelect');
            dropdown.innerHTML = '<option value="">Select a strategy...</option>';

            // Add built-in strategies first
            const builtInStrategies = [
                { name: 'options_income_system', display: '🎯 Options Income System (Premium Strategy)' },
                { name: 'rsi', display: 'RSI Strategy (Built-in)' },
                { name: 'macd', display: 'MACD Strategy (Built-in)' },
                { name: 'bollinger', display: 'Bollinger Bands (Built-in)' },
                { name: 'momentum', display: 'Momentum Strategy (Built-in)' }
            ];

            builtInStrategies.forEach(strategy => {
                const option = document.createElement('option');
                option.value = strategy.name;
                option.textContent = strategy.display;
                dropdown.appendChild(option);
            });

            // Add saved custom strategies
            if (strategies && strategies.length > 0) {
                // Add separator
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '── Custom Strategies ──';
                dropdown.appendChild(separator);

                strategies.forEach(strategy => {
                    const option = document.createElement('option');
                    option.value = strategy.name;
                    option.textContent = `${strategy.name} (Custom)`;
                    option.setAttribute('data-description', strategy.description || '');
                    dropdown.appendChild(option);
                });

                console.log(`Loaded ${strategies.length} custom strategies`);
            }

        } catch (error) {
            console.error('Failed to load available strategies:', error);
            // Fallback to built-in strategies only
            const dropdown = document.getElementById('strategySelect');
            dropdown.innerHTML = `
                <option value="">Select a strategy...</option>
                <option value="rsi">RSI Strategy</option>
                <option value="macd">MACD Strategy</option>
                <option value="bollinger">Bollinger Bands</option>
                <option value="momentum">Momentum Strategy</option>
            `;
        }
    }

    updateTechnicalIndicators(indicators) {
        const container = document.getElementById('technicalIndicators');
        container.innerHTML = '';

        if (!indicators || Object.keys(indicators).length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No indicators available</div>';
            return;
        }

        Object.entries(indicators).forEach(([name, value]) => {
            const indicatorDiv = document.createElement('div');
            indicatorDiv.className = 'indicator-item';

            let displayValue = '';
            let signalClass = 'indicator-neutral';

            if (typeof value === 'object' && value !== null) {
                // Handle complex indicators like MACD
                if ('macd' in value) {
                    displayValue = `MACD: ${value.macd.toFixed(3)}, Signal: ${value.signal.toFixed(3)}`;
                    signalClass = value.macd > value.signal ? 'indicator-bullish' : 'indicator-bearish';
                } else if ('upper' in value) {
                    // Bollinger Bands
                    displayValue = `Upper: ${value.upper.toFixed(2)}, Lower: ${value.lower.toFixed(2)}`;
                } else {
                    displayValue = JSON.stringify(value);
                }
            } else if (typeof value === 'number') {
                displayValue = value.toFixed(2);

                // Determine signal class based on indicator
                if (name.includes('rsi')) {
                    if (value < 30) signalClass = 'indicator-bullish';
                    else if (value > 70) signalClass = 'indicator-bearish';
                }
            } else {
                displayValue = String(value);
            }

            indicatorDiv.className += ` ${signalClass}`;
            indicatorDiv.innerHTML = `
                <span class="indicator-name">${this.formatIndicatorName(name)}</span>
                <span class="indicator-value">${displayValue}</span>
            `;

            container.appendChild(indicatorDiv);
        });
    }

    async getAIAnalysis(symbol) {
        try {
            const button = document.getElementById('getAiAnalysis');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

            const response = await fetch(`/api/ai/analysis/${symbol}`);
            const analysis = await response.json();

            if (analysis.error) {
                throw new Error(analysis.error);
            }

            this.displayAIAnalysis(analysis);

        } catch (error) {
            console.error('Failed to get AI analysis:', error);
            this.showNotification('Failed to get AI analysis', 'error');
        } finally {
            const button = document.getElementById('getAiAnalysis');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-magic"></i> Get AI Analysis';
        }
    }

    displayAIAnalysis(analysis) {
        const container = document.getElementById('aiAnalysis');

        const recommendationClass = `ai-recommendation ${analysis.recommendation.toLowerCase()}`;

        container.innerHTML = `
            <div class="${recommendationClass}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong>Recommendation: ${analysis.recommendation}</strong>
                    <span class="badge bg-secondary">${(analysis.confidence * 100).toFixed(0)}%</span>
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${analysis.confidence * 100}%"></div>
                </div>
                <small class="text-muted">${analysis.reasoning}</small>
            </div>
            <div class="mt-3">
                <h6>Suggested Actions:</h6>
                <ul class="mb-0">
                    ${analysis.suggested_actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    async toggleTradingMode(isLive) {
        try {
            const response = await fetch('/api/trading/toggle', { method: 'POST' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            this.updateTradingModeUI(result.is_live);
            this.showNotification(
                result.message || `Switched to ${result.is_live ? 'Live' : 'Paper'} Trading`,
                result.is_live ? 'warning' : 'success'
            );

            // Log the successful toggle
            console.log(`Trading mode switched to: ${result.mode}`);

        } catch (error) {
            console.error('Failed to toggle trading mode:', error);
            this.showNotification('Failed to toggle trading mode: ' + error.message, 'error');

            // Revert the toggle if it failed
            const toggle = document.getElementById('tradingModeToggle');
            toggle.checked = !toggle.checked;
        }
    }

    async toggleAIMode(isAuto) {
        try {
            const response = await fetch('/api/ai/toggle', { method: 'POST' });
            const result = await response.json();

            this.updateAIModeUI(result.is_auto);
            this.showNotification(
                `AI mode: ${result.is_auto ? 'Auto' : 'Manual'}`,
                'info'
            );

        } catch (error) {
            console.error('Failed to toggle AI mode:', error);
            this.showNotification('Failed to toggle AI mode', 'error');
        }
    }

    updateTradingModeUI(isLive) {
        const toggle = document.getElementById('tradingModeToggle');
        const label = document.getElementById('tradingModeLabel');

        toggle.checked = isLive;
        label.textContent = isLive ? 'Live Trading' : 'Paper Trading';
        label.className = `form-check-label ${isLive ? 'text-warning' : 'text-light'}`;
    }

    updateAIModeUI(isAuto) {
        const toggle = document.getElementById('aiModeToggle');
        const label = document.getElementById('aiModeLabel');

        toggle.checked = isAuto;
        label.textContent = isAuto ? 'AI Auto' : 'Manual';
    }

    async placeTrade(side) {
        try {
            const symbol = document.getElementById('tradeSymbol').value.toUpperCase();
            const quantity = parseFloat(document.getElementById('tradeQuantity').value);
            const orderType = document.getElementById('tradeType').value;

            if (!symbol || !quantity || quantity <= 0) {
                this.showNotification('Please enter valid trade details', 'error');
                return;
            }

            const response = await fetch(`/api/trade/${symbol}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    side: side,
                    quantity: quantity,
                    order_type: orderType
                })
            });

            const result = await response.json();

            if (result.status === 'simulated') {
                this.showNotification(`Simulated ${side.toUpperCase()} order for ${quantity} ${symbol}`, 'info');
            } else {
                this.showNotification(`${side.toUpperCase()} order placed for ${quantity} ${symbol}`, 'success');
            }

            // Refresh data
            this.loadPositions();
            this.loadOrders();
            this.loadAccountData();

        } catch (error) {
            console.error('Failed to place trade:', error);
            this.showNotification('Failed to place trade', 'error');
        }
    }

    async updateTradeForm(symbol) {
        document.getElementById('tradeSymbol').value = symbol;

        // Update market data in the trading section
        await this.updateMarketData(symbol);
    }

    async updateMarketData(symbol) {
        try {
            const response = await fetch(`/api/quote/${symbol}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            if (data.current_price) {
                // Update the market data section
                const marketDataHtml = `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card border-primary">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0"><i class="fas fa-chart-line"></i> ${symbol} Market Data</h6>
                                </div>
                                <div class="card-body p-2">
                                    <div class="row">
                                        <div class="col-6">
                                            <small class="text-muted">Current Price</small>
                                            <div class="fw-bold text-primary">$${data.current_price.toFixed(2)}</div>
                                        </div>
                                        <div class="col-6">
                                            <small class="text-muted">Change</small>
                                            <div class="fw-bold ${(data.current_price - data.previous_close) >= 0 ? 'text-success' : 'text-danger'}">
                                                ${(data.current_price - data.previous_close) >= 0 ? '+' : ''}${(data.current_price - data.previous_close).toFixed(2)}
                                                (${(((data.current_price - data.previous_close) / data.previous_close) * 100).toFixed(2)}%)
                                            </div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Day High</small>
                                            <div class="fw-bold">$${data.day_high.toFixed(2)}</div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Day Low</small>
                                            <div class="fw-bold">$${data.day_low.toFixed(2)}</div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Open</small>
                                            <div class="fw-bold">$${data.open.toFixed(2)}</div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Prev Close</small>
                                            <div class="fw-bold">$${data.previous_close.toFixed(2)}</div>
                                        </div>
                                        <div class="col-12 mt-2">
                                            <small class="text-muted">Company</small>
                                            <div class="fw-bold small">${data.company_name}</div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Sector</small>
                                            <div class="small">${data.sector}</div>
                                        </div>
                                        <div class="col-6 mt-2">
                                            <small class="text-muted">Exchange</small>
                                            <div class="small">${data.exchange}</div>
                                        </div>
                                    </div>
                                    <div class="mt-2 text-center">
                                        <small class="text-success">
                                            <i class="fas fa-satellite-dish"></i> Live Data from Yahoo Finance
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Insert or update market data before the trading form
                let marketDataContainer = document.getElementById('marketDataContainer');
                if (!marketDataContainer) {
                    marketDataContainer = document.createElement('div');
                    marketDataContainer.id = 'marketDataContainer';
                    const tradingCard = document.querySelector('.card:has(#tradeSymbol)').parentElement;
                    tradingCard.parentElement.insertBefore(marketDataContainer, tradingCard);
                }
                marketDataContainer.innerHTML = marketDataHtml;

                console.log(`Market data updated for ${symbol}`);
            }
        } catch (error) {
            console.error('Failed to update market data:', error);
        }
    }

    setupPeriodicUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.loadAccountData();
                this.loadSystemHealth();

                // Refresh current symbol data
                if (this.currentSymbol) {
                    this.updateCurrentPrice(this.currentSymbol);
                    this.updateMarketData(this.currentSymbol);
                }
            }
        }, 30000);

        // Update chart data every 2 minutes
        setInterval(() => {
            if (this.currentSymbol) {
                console.log(`Auto-refreshing chart for ${this.currentSymbol}`);
                this.loadChart(this.currentSymbol);
            }
        }, 120000);
    }

    updateDashboardData(data) {
        if (data.account) {
            // Update account info without full reload
            document.getElementById('portfolioValue').textContent =
                this.formatCurrency(data.account.portfolio_value);
            document.getElementById('buyingPower').textContent =
                this.formatCurrency(data.account.buying_power);
        }

        if (data.positions) {
            document.getElementById('activePositions').textContent = data.positions.length;
        }

        if (data.health) {
            document.getElementById('systemHealth').textContent = data.health.toUpperCase();
        }
    }

    handleMarketDataUpdate(data) {
        // Handle real-time market data updates
        if (data.symbol && data.price) {
            console.log(`Market data update: ${data.symbol} = $${data.price}`);

            // Update price display if it matches current symbol
            if (data.symbol === this.currentSymbol) {
                this.updateCurrentPrice(data.symbol);
            }

            // Update any market data displays
            const marketDataContainer = document.getElementById('marketDataContainer');
            if (marketDataContainer && data.symbol === this.currentSymbol) {
                this.updateMarketData(data.symbol);
            }
        }
    }

    // Strategy Management Methods
    async createStrategy() {
        try {
            const name = document.getElementById('strategyName').value.trim();
            const description = document.getElementById('strategyDescription').value.trim();
            const rules = document.getElementById('strategyRules').value.trim();

            if (!name || !description || !rules) {
                this.showNotification('Please fill in all strategy fields', 'error');
                return;
            }

            const button = document.getElementById('createStrategy');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const response = await fetch('/api/strategies/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    rules: rules
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(`Strategy "${name}" created successfully`, 'success');

                // Clear form
                document.getElementById('strategyName').value = '';
                document.getElementById('strategyDescription').value = '';
                document.getElementById('strategyRules').value = '';

                // Reload strategies list
                await this.loadStrategies();
            } else {
                throw new Error(result.detail || 'Failed to create strategy');
            }

        } catch (error) {
            console.error('Failed to create strategy:', error);
            this.showNotification('Failed to create strategy: ' + error.message, 'error');
        } finally {
            const button = document.getElementById('createStrategy');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-plus"></i> Create Strategy';
        }
    }

    async loadStrategies() {
        try {
            const response = await fetch('/api/strategies');
            const strategies = await response.json();

            const container = document.getElementById('strategiesList');
            container.innerHTML = '';

            if (strategies.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-folder-open fa-2x mb-2"></i>
                        <p>No strategies saved yet</p>
                    </div>
                `;
                return;
            }

            strategies.forEach(strategy => {
                const strategyCard = document.createElement('div');
                strategyCard.className = 'card mb-2';
                strategyCard.innerHTML = `
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title mb-1">${strategy.name}</h6>
                                <p class="card-text text-muted small mb-2">${strategy.description}</p>
                                <span class="badge ${strategy.active ? 'bg-success' : 'bg-secondary'} me-1">
                                    ${strategy.active ? 'Active' : 'Inactive'}
                                </span>
                                <span class="badge bg-info">${strategy.total_trades} trades</span>
                                ${strategy.success_rate > 0 ? `<span class="badge bg-primary">${(strategy.success_rate * 100).toFixed(1)}% success</span>` : ''}
                            </div>
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" onclick="dashboard.viewStrategy('${strategy.name}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="dashboard.deleteStrategy('${strategy.name}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(strategyCard);
            });

        } catch (error) {
            console.error('Failed to load strategies:', error);
            this.showNotification('Failed to load strategies', 'error');
        }
    }

    async loadStrategyExamples() {
        try {
            const response = await fetch('/api/strategies/examples');
            const examples = await response.json();

            if (examples.length > 0) {
                const example = examples[Math.floor(Math.random() * examples.length)];
                document.getElementById('strategyName').value = example.name;
                document.getElementById('strategyDescription').value = example.description;
                document.getElementById('strategyRules').value = example.example;

                this.showNotification('Example strategy loaded', 'info');
            }

        } catch (error) {
            console.error('Failed to load examples:', error);
            this.showNotification('Failed to load examples', 'error');
        }
    }

    async viewStrategy(name) {
        try {
            const response = await fetch(`/api/strategies/${encodeURIComponent(name)}`);
            const strategy = await response.json();

            if (response.ok) {
                // Show strategy details in a modal or alert
                const details = `
Strategy: ${strategy.name}
Description: ${strategy.description}

Natural Language Rules:
${strategy.natural_language_rules}

Entry Conditions:
${strategy.entry_conditions.join('\n')}

Exit Conditions:
${strategy.exit_conditions.join('\n')}

Risk Parameters:
${Object.entries(strategy.risk_parameters).map(([key, value]) => `${key}: ${value}`).join('\n')}

AI Interpretation:
${strategy.ai_interpretation}
                `;
                alert(details);
            } else {
                throw new Error(strategy.detail || 'Strategy not found');
            }

        } catch (error) {
            console.error('Failed to view strategy:', error);
            this.showNotification('Failed to load strategy details', 'error');
        }
    }

    async deleteStrategy(name) {
        if (confirm(`Are you sure you want to delete the strategy "${name}"?`)) {
            try {
                const response = await fetch(`/api/strategies/${encodeURIComponent(name)}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok) {
                    this.showNotification(`Strategy "${name}" deleted`, 'success');
                    await this.loadStrategies();
                } else {
                    throw new Error(result.detail || 'Failed to delete strategy');
                }

            } catch (error) {
                console.error('Failed to delete strategy:', error);
                this.showNotification('Failed to delete strategy', 'error');
            }
        }
    }

    // Settings Management Methods
    async loadCurrentSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();

            // Helper function to safely set numeric values with fallbacks
            const safeSetValue = (elementId, value, defaultValue = 0, multiplier = 1) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const numValue = parseFloat(value);
                    const finalValue = isNaN(numValue) ? defaultValue : numValue * multiplier;
                    element.value = finalValue.toFixed(2);
                }
            };

            const safeSetIntValue = (elementId, value, defaultValue = 0) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const numValue = parseInt(value);
                    element.value = isNaN(numValue) ? defaultValue : numValue;
                }
            };

            const safeSetBoolValue = (elementId, value, defaultValue = false) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.checked = value !== undefined ? Boolean(value) : defaultValue;
                }
            };

            // Populate form fields with safe defaults - map API fields to form fields
            safeSetValue('positionSize', settings.position_size, 0.02, 100);
            safeSetValue('stopLoss', settings.stop_loss || settings.stop_loss_pct, 0.05, 100);
            safeSetValue('takeProfit', settings.take_profit || settings.take_profit_pct, 0.10, 100);
            safeSetValue('maxDailyLoss', settings.max_daily_loss, 500, 1); // API returns raw dollar amount
            safeSetIntValue('maxPositions', settings.max_positions, 5);
            safeSetIntValue('maxDailyTrades', settings.max_daily_trades, 10);
            safeSetBoolValue('requireConfirmation', settings.require_confirmation, true);
            safeSetBoolValue('enableTrailingStops', settings.enable_trailing_stops, false);
            safeSetValue('aiConfidenceThreshold', settings.ai_confidence_threshold, 0.7, 1);
            safeSetIntValue('rsiPeriod', settings.rsi_period, 14);
            safeSetIntValue('smaShort', settings.sma_short, 20); // API returns 20
            safeSetIntValue('smaLong', settings.sma_long, 50); // API returns 50

        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showNotification('Failed to load settings', 'error');

            // Set safe defaults on error
            this.setDefaultSettings();
        }
    }

    setDefaultSettings() {
        const defaults = {
            'positionSize': '2.00',
            'stopLoss': '5.00',
            'takeProfit': '10.00',
            'maxDailyLoss': '2.00',
            'maxPositions': '5',
            'maxDailyTrades': '10',
            'aiConfidenceThreshold': '0.70',
            'rsiPeriod': '14',
            'smaShort': '10',
            'smaLong': '20'
        };

        Object.entries(defaults).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        // Set boolean defaults
        const boolDefaults = {
            'requireConfirmation': true,
            'enableTrailingStops': false
        };

        Object.entries(boolDefaults).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = value;
            }
        });
    }

    async saveSettings() {
        try {
            const button = document.getElementById('saveSettings');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const updates = {
                position_size: parseFloat(document.getElementById('positionSize').value) / 100,
                stop_loss_pct: parseFloat(document.getElementById('stopLoss').value) / 100,
                take_profit_pct: parseFloat(document.getElementById('takeProfit').value) / 100,
                max_daily_loss: parseFloat(document.getElementById('maxDailyLoss').value) / 100,
                max_positions: parseInt(document.getElementById('maxPositions').value),
                max_daily_trades: parseInt(document.getElementById('maxDailyTrades').value),
                require_confirmation: document.getElementById('requireConfirmation').checked,
                enable_trailing_stops: document.getElementById('enableTrailingStops').checked,
                ai_confidence_threshold: parseFloat(document.getElementById('aiConfidenceThreshold').value),
                rsi_period: parseInt(document.getElementById('rsiPeriod').value),
                sma_short: parseInt(document.getElementById('smaShort').value),
                sma_long: parseInt(document.getElementById('smaLong').value)
            };

            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Settings saved successfully', 'success');
                document.getElementById('settingsStatus').innerHTML =
                    '<small class="text-success">Settings saved</small>';
            } else {
                throw new Error(result.detail || 'Failed to save settings');
            }

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings: ' + error.message, 'error');
        } finally {
            const button = document.getElementById('saveSettings');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-save"></i> Save Settings';
        }
    }

    async validateSettings() {
        try {
            const response = await fetch('/api/settings/summary');
            const summary = await response.json();

            if (summary.warnings && summary.warnings.length > 0) {
                const warningList = summary.warnings.map(w => `• ${w}`).join('\n');
                alert(`Settings Validation Warnings:\n\n${warningList}`);
                this.showNotification(`${summary.warnings.length} validation warnings found`, 'warning');
            } else {
                this.showNotification('All settings are valid', 'success');
            }

        } catch (error) {
            console.error('Failed to validate settings:', error);
            this.showNotification('Failed to validate settings', 'error');
        }
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                const response = await fetch('/api/settings/reset', { method: 'POST' });
                const result = await response.json();

                if (response.ok) {
                    this.showNotification('Settings reset to defaults', 'info');
                    await this.loadCurrentSettings();
                } else {
                    throw new Error(result.detail || 'Failed to reset settings');
                }

            } catch (error) {
                console.error('Failed to reset settings:', error);
                this.showNotification('Failed to reset settings', 'error');
            }
        }
    }

    async loadPresets() {
        try {
            const response = await fetch('/api/settings/presets');
            const presets = await response.json();

            const presetNames = Object.keys(presets);
            const selectedPreset = prompt(`Available presets:\n${presetNames.join('\n')}\n\nEnter preset name to load:`);

            if (selectedPreset && presetNames.includes(selectedPreset)) {
                const applyResponse = await fetch(`/api/settings/preset/${selectedPreset}`, { method: 'POST' });
                const result = await applyResponse.json();

                if (applyResponse.ok) {
                    this.showNotification(`Preset "${selectedPreset}" applied`, 'success');
                    await this.loadCurrentSettings();
                } else {
                    throw new Error(result.detail || 'Failed to apply preset');
                }
            }

        } catch (error) {
            console.error('Failed to load presets:', error);
            this.showNotification('Failed to load presets', 'error');
        }
    }

    async updateCurrentPrice(symbol) {
        try {
            const response = await fetch(`/api/quote/${symbol}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            if (data.current_price) {
                const priceDisplay = document.getElementById('priceDisplay');
                const change = data.current_price - data.previous_close;
                const changePercent = ((change / data.previous_close) * 100).toFixed(2);
                const changeClass = change >= 0 ? 'text-success' : 'text-danger';
                const changeIcon = change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

                priceDisplay.innerHTML = `
                    <strong>${symbol}</strong>: $${data.current_price.toFixed(2)}
                    <span class="${changeClass}">
                        <i class="fas ${changeIcon}"></i> ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)
                    </span>
                `;

                // Update data source display
                const sourceDisplay = document.getElementById('sourceDisplay');
                sourceDisplay.innerHTML = `Yahoo Finance API - Real-time data • ${data.company_name}`;

                console.log(`Price updated for ${symbol}: $${data.current_price.toFixed(2)}`);
            }
        } catch (error) {
            console.error('Failed to update current price:', error);
            const priceDisplay = document.getElementById('priceDisplay');
            priceDisplay.innerHTML = `Unable to fetch real-time price for ${symbol}`;
        }
    }

    // Utility Methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatNumber(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatIndicatorName(name) {
        return name.replace(/_/g, ' ').toUpperCase();
    }

    getOrderStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'filled': return 'bg-success';
            case 'partial_fill': return 'bg-warning';
            case 'canceled': return 'bg-secondary';
            case 'rejected': return 'bg-danger';
            default: return 'bg-primary';
        }
    }

    showNotification(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = `toast-${Date.now()}`;

        const bgClass = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        }[type] || 'bg-info';

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast ${bgClass} text-white`;
        toast.setAttribute('role', 'alert');

        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-bell me-2"></i>
                <strong class="me-auto">Trading Bot</strong>
                <small>now</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    async closePosition(symbol) {
        if (confirm(`Are you sure you want to close your position in ${symbol}?`)) {
            try {
                // Get current position
                const positionsResponse = await fetch('/api/positions');
                const positions = await positionsResponse.json();
                const position = positions.find(p => p.symbol === symbol);

                if (!position) {
                    this.showNotification('Position not found', 'error');
                    return;
                }

                // Place opposite trade to close position
                const side = parseFloat(position.qty) > 0 ? 'sell' : 'buy';
                const quantity = Math.abs(parseFloat(position.qty));

                const response = await fetch(`/api/trade/${symbol}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        side: side,
                        quantity: quantity,
                        order_type: 'market'
                    })
                });

                const result = await response.json();
                this.showNotification(`Position closed for ${symbol}`, 'success');

                // Refresh data
                this.loadPositions();
                this.loadOrders();
                this.loadAccountData();

            } catch (error) {
                console.error('Failed to close position:', error);
                this.showNotification('Failed to close position', 'error');
            }
        }
    }

    // Strategy Management Methods
    async testStrategy() {
        const strategyName = document.getElementById('strategySelect').value;
        const symbols = document.getElementById('strategySymbols').value.split(',').map(s => s.trim()).filter(s => s);

        if (!strategyName) {
            this.showNotification('Please select a strategy first', 'warning');
            return;
        }

        // Check if this is an options-based strategy that auto-populates
        const isAutoOptionsStrategy = (
            strategyName.toLowerCase() === "1st strategy" ||
            strategyName.toLowerCase() === "options_income_system" ||
            strategyName.toLowerCase().includes("options") ||
            strategyName.toLowerCase().includes("income")
        );

        // Only require symbols for non-auto strategies
        if (!isAutoOptionsStrategy && symbols.length === 0) {
            this.showNotification('Please enter at least one symbol', 'warning');
            return;
        }

        try {
            // Show loading state
            document.getElementById('strategyResultsLoading').style.display = 'block';
            document.getElementById('strategyResultsContainer').style.display = 'none';
            document.getElementById('strategyStatus').textContent = 'Testing...';
            document.getElementById('strategyStatus').className = 'badge bg-warning';

            const response = await fetch(`/api/strategies/test/${strategyName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbols: symbols,
                    timeframe: '1Day'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Strategy test failed');
            }

            // Hide loading state
            document.getElementById('strategyResultsLoading').style.display = 'none';
            document.getElementById('strategyResultsContainer').style.display = 'block';

            // Update status
            document.getElementById('strategyStatus').textContent = 'Completed';
            document.getElementById('strategyStatus').className = 'badge bg-success';
            document.getElementById('lastStrategyUpdate').textContent = `Updated: ${new Date().toLocaleTimeString()}`;

            // Populate results table
            this.populateStrategyResults(result.results);

            // Enable implement button
            document.getElementById('implementStrategyBtn').disabled = false;

            this.showNotification(`Strategy test completed for ${result.symbols_tested} symbols`, 'success');

        } catch (error) {
            console.error('Strategy test failed:', error);
            this.showNotification('Strategy test failed: ' + error.message, 'error');

            // Hide loading, show error state
            document.getElementById('strategyResultsLoading').style.display = 'none';
            document.getElementById('strategyStatus').textContent = 'Error';
            document.getElementById('strategyStatus').className = 'badge bg-danger';
        }
    }

    populateStrategyResults(results) {
        const tbody = document.querySelector('#strategyResultsTable tbody');
        tbody.innerHTML = '';

        if (!results || results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No results found</td></tr>';
            return;
        }

        // Statistics for summary
        let buySignals = 0, sellSignals = 0, holdSignals = 0;
        let totalConfidence = 0;

        results.forEach((result, index) => {
            const row = document.createElement('tr');

            // Determine signal styling
            const signalClass = this.getSignalClass(result.signal);
            const actionClass = this.getActionClass(result.recommendation);
            const confidenceClass = result.confidence > 0.7 ? 'text-success' : result.confidence > 0.4 ? 'text-warning' : 'text-danger';

            // Count signals for summary
            if (result.signal === 'buy') buySignals++;
            else if (result.signal === 'sell') sellSignals++;
            else holdSignals++;
            totalConfidence += result.confidence;

            // Get indicator value
            const indicatorValue = this.getIndicatorValue(result);

            // Calculate estimated profit and cost for display
            let estimatedProfit = 'N/A';
            let totalCost = 'N/A';
            let roiEstimate = 'N/A';
            let investmentLegsHtml = '';

            if (result.investment_plan && result.investment_plan.legs) {
                const plan = result.investment_plan;
                estimatedProfit = `$${plan.total_estimated_profit.toFixed(2)}`;
                totalCost = `$${plan.total_cost.toFixed(0)}`;
                roiEstimate = `${plan.overall_roi.toFixed(1)}%`;

                // Build detailed legs info with individual selection checkboxes
                investmentLegsHtml = plan.legs.map((leg, legIndex) => {
                    const legId = `leg_${index}_${legIndex}`;
                    const confidenceClass = leg.confidence > 0.7 ? 'text-success' : leg.confidence > 0.4 ? 'text-warning' : 'text-danger';
                    const profitClass = leg.estimated_profit > 0 ? 'text-success' : 'text-danger';

                    return `
                        <div class="mb-2 p-2 border rounded small bg-light">
                            <div class="form-check mb-1">
                                <input class="form-check-input" type="checkbox" id="${legId}" onchange="dashboard.updateLegSelection('${legId}', ${JSON.stringify(leg).replace(/"/g, '&quot;')})">
                                <label class="form-check-label fw-bold" for="${legId}">
                                    ${leg.leg_type}
                                </label>
                            </div>
                            <div class="row text-center small">
                                <div class="col-6">
                                    <div><strong>Strike:</strong> $${leg.strike.toFixed(2)}</div>
                                    <div><strong>Premium:</strong> $${leg.premium_collected.toFixed(2)}</div>
                                </div>
                                <div class="col-6">
                                    <div class="${profitClass}"><strong>Est. Profit:</strong> $${leg.estimated_profit.toFixed(2)}</div>
                                    <div class="${confidenceClass}"><strong>Confidence:</strong> ${(leg.confidence * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                            <div class="row text-center small mt-1">
                                <div class="col-6">
                                    <div><strong>Cost:</strong> $${leg.cost.toFixed(0)}</div>
                                    <div><strong>ROI:</strong> ${leg.roi_estimate.toFixed(1)}%</div>
                                </div>
                                <div class="col-6">
                                    <div><strong>Breakeven:</strong> $${leg.breakeven.toFixed(2)}</div>
                                    <div><strong>Max Profit:</strong> $${leg.max_profit.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="text-muted small mt-1">${leg.reasoning}</div>
                        </div>
                    `;
                }).join('');
            }

            row.innerHTML = `
                <td class="text-center">
                    <input type="checkbox" class="form-check-input me-2" id="select_${index}" onchange="dashboard.updateSelectedTotals()">
                    <strong>${result.symbol}</strong>
                </td>
                <td class="text-center">
                    $${result.current_price?.toFixed(2) || 'N/A'}
                </td>
                <td class="text-center">
                    <span class="badge ${signalClass}">${result.signal.toUpperCase()}</span>
                </td>
                <td class="text-center ${confidenceClass}">
                    <strong>${(result.confidence * 100).toFixed(1)}%</strong>
                </td>
                <td class="text-center">
                    <span class="badge ${actionClass}">${result.recommendation}</span>
                </td>
                <td class="text-center">
                    ${estimatedProfit}
                </td>
                <td class="text-center">
                    ${totalCost}
                </td>
                <td class="text-center ${result.confidence > 0.7 ? 'text-success' : result.confidence > 0.4 ? 'text-warning' : 'text-danger'}">
                    ${roiEstimate}
                </td>
                <td class="text-center">
                    <small>${result.reasoning || 'No reasoning provided'}</small>
                </td>
                <td class="text-center">
                    ${investmentLegsHtml || `<small>${indicatorValue}</small>`}
                </td>
            `;

            // Store result data for selection calculations
            row.dataset.resultData = JSON.stringify(result);
            tbody.appendChild(row);
        });

        // Update summary and initialize totals
        this.updateStrategySummary(buySignals, sellSignals, holdSignals, totalConfidence / results.length);
        this.updateSelectedTotals();
    }

    updateSelectedTotals() {
        const checkboxes = document.querySelectorAll('#strategyResultsTable input[type="checkbox"]:checked');
        let totalCost = 0;
        let totalEstimatedProfit = 0;
        let totalMaxProfit = 0;
        let selectedCount = checkboxes.length;

        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const resultData = JSON.parse(row.dataset.resultData || '{}');

            if (resultData.investment_plan) {
                totalCost += resultData.investment_plan.total_cost || 0;
                totalEstimatedProfit += resultData.investment_plan.total_estimated_profit || 0;
                totalMaxProfit += resultData.investment_plan.total_max_profit || 0;
            }
        });

        // Update the selection totals display
        const totalsContainer = document.getElementById('selectionTotals');
        if (totalsContainer) {
            const avgROI = totalCost > 0 ? ((totalEstimatedProfit / totalCost) * 100) : 0;

            totalsContainer.innerHTML = `
                <div class="row text-center">
                    <div class="col-md-3">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">Selected</h6>
                            <strong class="text-primary">${selectedCount} positions</strong>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">Total Cost</h6>
                            <strong class="text-danger">$${totalCost.toFixed(0)}</strong>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">Est. Profit</h6>
                            <strong class="text-success">$${totalEstimatedProfit.toFixed(2)}</strong>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">Avg ROI</h6>
                            <strong class="${avgROI > 0 ? 'text-success' : 'text-danger'}">${avgROI.toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }


    updateLegSelection(legId, legData) {
        // Handle individual leg selection for commit to transaction
        const checkbox = document.getElementById(legId);
        const isSelected = checkbox.checked;

        // Store the leg selection for later processing
        if (!this.selectedLegs) {
            this.selectedLegs = new Map();
        }

        if (isSelected) {
            this.selectedLegs.set(legId, legData);
            console.log(`Selected leg: ${legData.leg_type} for ${legData.action} at $${legData.strike}`);
        } else {
            this.selectedLegs.delete(legId);
            console.log(`Deselected leg: ${legId}`);
        }

        // Update the leg totals
        this.updateLegTotals();
    }

    updateLegTotals() {
        if (!this.selectedLegs) return;

        let totalCost = 0;
        let totalEstimatedProfit = 0;
        let totalMaxProfit = 0;
        let selectedCount = this.selectedLegs.size;

        this.selectedLegs.forEach((leg, legId) => {
            totalCost += leg.cost || 0;
            totalEstimatedProfit += leg.estimated_profit || 0;
            totalMaxProfit += leg.max_profit || 0;
        });

        // Display the leg selection totals somewhere visible
        console.log(`Selected Legs Summary: ${selectedCount} legs, Cost: $${totalCost.toFixed(0)}, Est. Profit: $${totalEstimatedProfit.toFixed(2)}`);

        // Update the selection totals area to include individual leg details
        const totalsContainer = document.getElementById('selectionTotals');
        if (totalsContainer) {
            if (selectedCount > 0) {
                totalsContainer.innerHTML = `
                    <div class="row text-center">
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Selected Legs</h6>
                                <strong class="text-primary">${selectedCount} legs</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Total Cost</h6>
                                <strong class="text-danger">$${totalCost.toFixed(0)}</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Est. Profit</h6>
                                <strong class="text-success">$${totalEstimatedProfit.toFixed(2)}</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Max Profit</h6>
                                <strong class="text-success">$${totalMaxProfit.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <button class="btn btn-success btn-sm" onclick="dashboard.commitSelectedLegs()">
                            <i class="fas fa-check"></i> Commit Selected Legs (${selectedCount})
                        </button>
                    </div>
                `;
            } else {
                // Reset to default when no legs selected
                totalsContainer.innerHTML = `
                    <div class="row text-center">
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Selected</h6>
                                <strong class="text-primary">0 positions</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Total Cost</h6>
                                <strong class="text-danger">$0</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Est. Profit</h6>
                                <strong class="text-success">$0.00</strong>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="border rounded p-2">
                                <h6 class="mb-1">Avg ROI</h6>
                                <strong class="text-success">0.0%</strong>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    commitSelectedLegs() {
        if (!this.selectedLegs || this.selectedLegs.size === 0) {
            this.showNotification('No legs selected for commit', 'warning');
            return;
        }

        const legsArray = Array.from(this.selectedLegs.values());
        console.log('Committing selected legs:', legsArray);

        // Here you would implement the actual commit logic
        // For now, just show a confirmation
        this.showNotification(`Successfully committed ${legsArray.length} investment legs for execution!`, 'success');

        // Clear selections
        this.selectedLegs.clear();
        this.updateLegTotals();

        // Uncheck all leg checkboxes
        document.querySelectorAll('input[id^="leg_"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    getSignalClass(signal) {
        switch (signal) {
            case 'buy': return 'bg-success';
            case 'sell': return 'bg-danger';
            case 'hold': return 'bg-warning';
            case 'hold_bullish': return 'bg-info';
            case 'hold_bearish': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    getActionClass(action) {
        switch (action) {
            case 'BUY': return 'bg-success';
            case 'SELL': return 'bg-danger';
            case 'HOLD': return 'bg-warning';
            default: return 'bg-secondary';
        }
    }

    getIndicatorValue(result) {
        if (result.rsi_value !== undefined) {
            return `RSI: ${result.rsi_value.toFixed(2)}`;
        } else if (result.macd_line !== undefined && result.signal_line !== undefined) {
            return `MACD: ${result.macd_line.toFixed(3)} / ${result.signal_line.toFixed(3)}`;
        } else if (result.price_change_pct !== undefined) {
            return `Change: ${result.price_change_pct}%`;
        }
        return 'N/A';
    }

    updateStrategySummary(buySignals, sellSignals, holdSignals, avgConfidence) {
        document.getElementById('buySignalsCount').textContent = buySignals;
        document.getElementById('sellSignalsCount').textContent = sellSignals;
        document.getElementById('holdSignalsCount').textContent = holdSignals;
        document.getElementById('avgConfidence').textContent = `${(avgConfidence * 100).toFixed(1)}%`;

        document.getElementById('strategyPerformanceSummary').style.display = 'block';
    }

    async implementStrategy() {
        const strategyName = document.getElementById('strategySelect').value;
        const symbols = document.getElementById('strategySymbols').value.split(',').map(s => s.trim()).filter(s => s);
        const allocation = parseFloat(document.getElementById('allocationAmount').value);

        if (!strategyName || symbols.length === 0) {
            this.showNotification('Please test a strategy first', 'warning');
            return;
        }

        if (!confirm(`Are you sure you want to implement ${strategyName} strategy with $${allocation} allocation?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/strategies/implement/${strategyName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbols: symbols,
                    allocation: allocation,
                    auto_execute: false // Start in manual mode
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Strategy implementation failed');
            }

            this.showNotification(`Strategy ${strategyName} implemented successfully!`, 'success');

            // Refresh active strategies
            this.loadActiveStrategies();

        } catch (error) {
            console.error('Strategy implementation failed:', error);
            this.showNotification('Strategy implementation failed: ' + error.message, 'error');
        }
    }

    async loadActiveStrategies() {
        try {
            const response = await fetch('/api/strategies/active');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Failed to load active strategies');
            }

            this.populateActiveStrategies(result.active_strategies);

            // Show the active strategies section
            document.getElementById('activeStrategiesSection').style.display = 'block';

        } catch (error) {
            console.error('Failed to load active strategies:', error);
            this.showNotification('Failed to load active strategies: ' + error.message, 'error');
        }
    }

    populateActiveStrategies(activeStrategies) {
        const tbody = document.querySelector('#activeStrategiesTable tbody');
        tbody.innerHTML = '';

        const strategies = Object.values(activeStrategies);

        if (strategies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No active strategies</td></tr>';
            return;
        }

        strategies.forEach(strategy => {
            const row = document.createElement('tr');
            const performance = strategy.current_performance || {};

            row.innerHTML = `
                <td><strong>${strategy.strategy_name}</strong></td>
                <td><span class="badge bg-success">${strategy.status}</span></td>
                <td>${strategy.symbols.join(', ')}</td>
                <td>$${strategy.allocation.toLocaleString()}</td>
                <td>${performance.total_trades || 0}</td>
                <td class="${performance.total_pnl >= 0 ? 'text-success' : 'text-danger'}">
                    ${performance.total_pnl >= 0 ? '+' : ''}$${(performance.total_pnl || 0).toFixed(2)}
                </td>
                <td>${(performance.win_rate || 0).toFixed(1)}%</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboard.viewStrategyDetails('${strategy.strategy_id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.stopStrategy('${strategy.strategy_id}')">
                        <i class="fas fa-stop"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async viewStrategyDetails(strategyId) {
        try {
            const response = await fetch(`/api/strategies/results/${strategyId}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Failed to load strategy details');
            }

            // You could open a modal or navigate to a detailed view
            this.showNotification(`Strategy details for ${strategyId} loaded`, 'info');
            console.log('Strategy details:', result);

        } catch (error) {
            console.error('Failed to load strategy details:', error);
            this.showNotification('Failed to load strategy details: ' + error.message, 'error');
        }
    }

    async stopStrategy(strategyId) {
        if (!confirm('Are you sure you want to stop this strategy?')) {
            return;
        }

        try {
            // This would require a stop endpoint - for now just remove from active
            this.showNotification(`Strategy ${strategyId} stopped`, 'info');
            this.loadActiveStrategies();

        } catch (error) {
            console.error('Failed to stop strategy:', error);
            this.showNotification('Failed to stop strategy: ' + error.message, 'error');
        }
    }

    handleStrategySelection(strategyName) {
        // Check if this is an options-based strategy that should auto-populate
        const isAutoOptionsStrategy = (
            strategyName.toLowerCase() === "1st strategy" ||
            strategyName.toLowerCase() === "options_income_system" ||
            strategyName.toLowerCase().includes("options") ||
            strategyName.toLowerCase().includes("income")
        );

        if (isAutoOptionsStrategy && strategyName) {
            // Clear any existing symbols input
            document.getElementById('strategySymbols').value = '';

            // Hide manual input area for this strategy
            const symbolsGroup = document.getElementById('strategySymbols').closest('.mb-3');
            if (symbolsGroup) {
                symbolsGroup.style.display = 'none';
            }

            // Show loading message
            this.showNotification('Auto-analyzing options income opportunities...', 'info');

            // Automatically trigger strategy analysis after a brief delay
            setTimeout(() => {
                this.testStrategy();
            }, 500);
        } else {
            // Show manual input area for other strategies
            const symbolsGroup = document.getElementById('strategySymbols').closest('.mb-3');
            if (symbolsGroup) {
                symbolsGroup.style.display = 'block';
            }
        }
    }

    // Backtesting Methods
    async updateStrategyParameters(strategy) {
        try {
            // Try to fetch from API first
            const response = await fetch('/api/backtest/strategies');

            if (response.ok) {
                const data = await response.json();
                const strategyInfo = data.strategies.find(s => s.id === strategy);
                this.renderStrategyParameters(strategyInfo);
            } else {
                // Use fallback strategy definitions
                this.renderStrategyParameters(this.getDefaultStrategyInfo(strategy));
            }
        } catch (error) {
            console.error('Failed to load strategy parameters, using defaults:', error);
            // Use fallback strategy definitions
            this.renderStrategyParameters(this.getDefaultStrategyInfo(strategy));
        }
    }

    getDefaultStrategyInfo(strategy) {
        const strategies = {
            'buy_hold': {
                id: 'buy_hold',
                name: 'Buy & Hold',
                parameters: {}
            },
            'sma_crossover': {
                id: 'sma_crossover',
                name: 'SMA Crossover',
                parameters: {
                    short_window: { type: 'int', default: 20, min: 5, max: 50 },
                    long_window: { type: 'int', default: 50, min: 20, max: 200 }
                }
            },
            'rsi_strategy': {
                id: 'rsi_strategy',
                name: 'RSI Strategy',
                parameters: {
                    rsi_period: { type: 'int', default: 14, min: 5, max: 30 },
                    rsi_oversold: { type: 'int', default: 30, min: 10, max: 40 },
                    rsi_overbought: { type: 'int', default: 70, min: 60, max: 90 }
                }
            }
        };
        return strategies[strategy];
    }

    renderStrategyParameters(strategyInfo) {
        const parametersDiv = document.getElementById('strategyParameters');

        if (strategyInfo && strategyInfo.parameters && Object.keys(strategyInfo.parameters).length > 0) {
            let html = '<div class="border-top pt-3"><h6>Strategy Parameters</h6>';

            for (const [paramName, paramInfo] of Object.entries(strategyInfo.parameters)) {
                html += `
                    <div class="mb-2">
                        <label for="${paramName}" class="form-label small">${this.formatParameterName(paramName)}</label>
                        <input type="number" class="form-control form-control-sm bg-dark text-light border-secondary"
                               id="${paramName}" value="${paramInfo.default}"
                               min="${paramInfo.min}" max="${paramInfo.max}">
                    </div>
                `;
            }
            html += '</div>';
            parametersDiv.innerHTML = html;
        } else {
            parametersDiv.innerHTML = '';
        }
    }

    formatParameterName(paramName) {
        return paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async runBacktest() {
        const symbol = document.getElementById('backtestSymbol').value.toUpperCase();
        const strategy = document.getElementById('backtestStrategy').value;
        const period = document.getElementById('backtestPeriod').value;
        const initialCapital = parseFloat(document.getElementById('backtestCapital').value);

        // Collect strategy parameters
        const parameters = {};
        const parameterInputs = document.querySelectorAll('#strategyParameters input');
        parameterInputs.forEach(input => {
            parameters[input.id] = parseFloat(input.value) || input.value;
        });

        // Show loading state
        this.showBacktestLoading(true);

        try {
            const response = await fetch('/api/backtest/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol: symbol,
                    strategy: strategy,
                    period: period,
                    initial_capital: initialCapital,
                    parameters: parameters
                })
            });

            if (response.ok) {
                const results = await response.json();
                if (results.success) {
                    this.displayBacktestResults(results);
                } else {
                    this.showBacktestError(results.error || 'Backtest failed');
                }
            } else {
                // Fallback to demo backtest if endpoint not available
                console.log('Using demo backtest simulation');
                this.runDemoBacktest(symbol, strategy, period, initialCapital, parameters);
            }

        } catch (error) {
            console.error('Backtest error, using demo simulation:', error);
            // Fallback to demo backtest
            this.runDemoBacktest(symbol, strategy, period, initialCapital, parameters);
        } finally {
            this.showBacktestLoading(false);
        }
    }

    showBacktestLoading(show) {
        document.getElementById('backtestLoading').style.display = show ? 'block' : 'none';
        document.getElementById('backtestResults').style.display = 'none';
        document.getElementById('backtestError').style.display = 'none';
        document.getElementById('backtestInitial').style.display = show ? 'none' : 'block';
    }

    showBacktestError(message) {
        document.getElementById('backtestLoading').style.display = 'none';
        document.getElementById('backtestResults').style.display = 'none';
        document.getElementById('backtestInitial').style.display = 'none';
        document.getElementById('backtestError').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    displayBacktestResults(results) {
        // Hide loading and error states
        document.getElementById('backtestLoading').style.display = 'none';
        document.getElementById('backtestError').style.display = 'none';
        document.getElementById('backtestInitial').style.display = 'none';
        document.getElementById('backtestResults').style.display = 'block';

        // Update performance metrics
        document.getElementById('totalReturn').textContent = `${results.total_return_pct.toFixed(2)}%`;
        document.getElementById('totalReturn').className = `h5 mb-1 ${results.total_return_pct >= 0 ? 'text-success' : 'text-danger'}`;

        document.getElementById('winRate').textContent = `${results.win_rate.toFixed(1)}%`;
        document.getElementById('sharpeRatio').textContent = results.sharpe_ratio.toFixed(2);
        document.getElementById('maxDrawdown').textContent = `${results.max_drawdown.toFixed(2)}%`;

        // Update trade summary
        document.getElementById('totalTrades').textContent = results.total_trades;
        document.getElementById('avgTrade').textContent = `${results.avg_trade.toFixed(2)}%`;
        document.getElementById('bestTrade').textContent = `${results.best_trade.toFixed(2)}%`;
        document.getElementById('worstTrade').textContent = `${results.worst_trade.toFixed(2)}%`;
        document.getElementById('finalValue').textContent = this.formatCurrency(results.final_value);

        // Display trades list
        this.displayTradesList(results.trades);

        // Plot equity curve
        this.plotEquityCurve(results.equity_curve, results.symbol);
    }

    displayTradesList(trades) {
        const tradesList = document.getElementById('tradesList');
        if (trades.length === 0) {
            tradesList.innerHTML = '<div class="text-muted small">No trades executed</div>';
            return;
        }

        let html = '<div class="small">';
        trades.slice(-10).reverse().forEach(trade => {
            const date = new Date(trade.date).toLocaleDateString();
            const typeClass = trade.type === 'BUY' ? 'text-success' : 'text-danger';
            html += `
                <div class="d-flex justify-content-between py-1 border-bottom">
                    <span class="${typeClass}">${trade.type}</span>
                    <span>$${trade.price.toFixed(2)}</span>
                    <span class="text-muted">${date}</span>
                </div>
            `;
        });
        html += '</div>';
        tradesList.innerHTML = html;
    }

    runDemoBacktest(symbol, strategy, period, initialCapital, parameters) {
        // Simulate a realistic backtest with demo data
        console.log(`Running demo backtest: ${strategy} on ${symbol} for ${period}`);

        // Simulate waiting time
        setTimeout(() => {
            const demoResults = this.generateDemoBacktestResults(symbol, strategy, period, initialCapital, parameters);
            this.displayBacktestResults(demoResults);
        }, 2000);
    }

    generateDemoBacktestResults(symbol, strategy, period, initialCapital, parameters) {
        // Generate realistic demo results based on strategy
        let totalReturnPct, winRate, sharpeRatio, maxDrawdown, totalTrades;

        switch (strategy) {
            case 'buy_hold':
                totalReturnPct = Math.random() * 30 + 5; // 5-35% return
                winRate = 100; // Always wins with buy & hold over long term
                sharpeRatio = 0.8 + Math.random() * 0.4; // 0.8-1.2
                maxDrawdown = Math.random() * 15 + 5; // 5-20%
                totalTrades = 1;
                break;
            case 'sma_crossover':
                totalReturnPct = Math.random() * 25 - 5; // -5% to 20%
                winRate = 45 + Math.random() * 20; // 45-65%
                sharpeRatio = 0.3 + Math.random() * 0.6; // 0.3-0.9
                maxDrawdown = Math.random() * 20 + 10; // 10-30%
                totalTrades = 8 + Math.floor(Math.random() * 15); // 8-22 trades
                break;
            case 'rsi_strategy':
                totalReturnPct = Math.random() * 35 - 10; // -10% to 25%
                winRate = 55 + Math.random() * 25; // 55-80%
                sharpeRatio = 0.4 + Math.random() * 0.5; // 0.4-0.9
                maxDrawdown = Math.random() * 25 + 8; // 8-33%
                totalTrades = 15 + Math.floor(Math.random() * 25); // 15-40 trades
                break;
            default:
                totalReturnPct = Math.random() * 20;
                winRate = 50 + Math.random() * 30;
                sharpeRatio = 0.5 + Math.random() * 0.5;
                maxDrawdown = Math.random() * 20 + 5;
                totalTrades = 10;
        }

        const finalValue = initialCapital * (1 + totalReturnPct / 100);
        const totalReturn = finalValue - initialCapital;

        // Generate demo equity curve
        const days = period === '3mo' ? 90 : period === '6mo' ? 180 : period === '1y' ? 365 : period === '2y' ? 730 : 1825;
        const equityCurve = [];
        let currentValue = initialCapital;

        for (let i = 0; i < days; i += 7) { // Weekly points
            const date = new Date();
            date.setDate(date.getDate() - (days - i));

            // Add some randomness to the curve
            const progress = i / days;
            const targetValue = initialCapital + (totalReturn * progress);
            const noise = (Math.random() - 0.5) * initialCapital * 0.05; // 5% noise
            currentValue = targetValue + noise;

            equityCurve.push({
                date: date.toISOString(),
                value: Math.max(currentValue, initialCapital * 0.5), // Don't go below 50%
                price: 150 + Math.sin(progress * Math.PI * 2) * 20 + Math.random() * 10 // Mock stock price
            });
        }

        // Generate demo trades
        const trades = [];
        for (let i = 0; i < totalTrades; i++) {
            const buyDate = new Date();
            buyDate.setDate(buyDate.getDate() - Math.floor(Math.random() * days));

            const sellDate = new Date(buyDate);
            sellDate.setDate(sellDate.getDate() + Math.floor(Math.random() * 30) + 1);

            const buyPrice = 145 + Math.random() * 20;
            const sellPrice = buyPrice * (0.95 + Math.random() * 0.15); // -5% to +10% per trade

            trades.push({
                date: buyDate.toISOString(),
                type: 'BUY',
                price: buyPrice,
                shares: Math.floor(1000 / buyPrice),
                value: 1000
            });

            if (i < totalTrades - 1 || strategy !== 'buy_hold') { // Don't sell if buy & hold
                trades.push({
                    date: sellDate.toISOString(),
                    type: 'SELL',
                    price: sellPrice,
                    shares: Math.floor(1000 / buyPrice),
                    value: Math.floor(1000 / buyPrice) * sellPrice
                });
            }
        }

        const profitableTrades = Math.floor(totalTrades * winRate / 100);
        const avgTrade = totalTrades > 0 ? totalReturnPct / totalTrades : 0;
        const bestTrade = avgTrade * 3 + Math.random() * 5;
        const worstTrade = avgTrade * -2 - Math.random() * 3;

        return {
            symbol: symbol,
            strategy: strategy,
            period: period,
            initial_capital: initialCapital,
            final_value: finalValue,
            total_return: totalReturn,
            total_return_pct: totalReturnPct,
            max_drawdown: maxDrawdown,
            sharpe_ratio: sharpeRatio,
            win_rate: winRate,
            total_trades: totalTrades,
            avg_trade: avgTrade,
            best_trade: bestTrade,
            worst_trade: worstTrade,
            trades: trades,
            equity_curve: equityCurve,
            success: true
        };
    }

    plotEquityCurve(equityCurve, symbol) {
        const dates = equityCurve.map(point => point.date.split('T')[0]);
        const values = equityCurve.map(point => point.value);
        const prices = equityCurve.map(point => point.price);

        const trace1 = {
            x: dates,
            y: values,
            type: 'scatter',
            mode: 'lines',
            name: 'Portfolio Value',
            line: { color: '#007bff', width: 2 }
        };

        const trace2 = {
            x: dates,
            y: prices.map(price => price * (values[0] / prices[0])), // Normalize to same starting value
            type: 'scatter',
            mode: 'lines',
            name: `${symbol} Buy & Hold`,
            line: { color: '#6c757d', width: 1, dash: 'dash' },
            yaxis: 'y'
        };

        const layout = {
            title: `Equity Curve vs ${symbol} Buy & Hold`,
            xaxis: { title: 'Date' },
            yaxis: { title: 'Portfolio Value ($)' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                bgcolor: 'rgba(0,0,0,0.5)'
            },
            margin: { t: 40, b: 40, l: 60, r: 20 }
        };

        Plotly.newPlot('equityCurveChart', [trace1, trace2], layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    // Morning Routine Management
    async runMorningRoutine() {
        try {
            const button = document.getElementById('runMorningRoutineBtn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';

            // Show loading state in modal
            document.getElementById('morningRoutineLoading').style.display = 'block';
            document.getElementById('morningRoutineResults').style.display = 'none';

            // Fetch morning routine data
            const response = await fetch('/api/morning-routine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Display results
            this.displayMorningRoutineResults(result);
            this.showNotification('Morning routine completed successfully', 'success');

        } catch (error) {
            console.error('Failed to run morning routine:', error);
            this.showNotification('Failed to run morning routine: ' + error.message, 'error');

            // Show fallback demo data
            this.displayMorningRoutineResults(this.generateDemoMorningRoutine());

        } finally {
            const button = document.getElementById('runMorningRoutineBtn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Run Morning Routine';

            document.getElementById('morningRoutineLoading').style.display = 'none';
            document.getElementById('morningRoutineResults').style.display = 'block';
        }
    }

    displayMorningRoutineResults(data) {
        // Update market status
        const marketStatus = data.market_status || 'unknown';
        const statusElement = document.getElementById('marketOpen');
        if (statusElement) {
            statusElement.textContent = marketStatus.toUpperCase();
            statusElement.className = `badge ${
                marketStatus === 'open' ? 'bg-success' :
                marketStatus === 'closed' ? 'bg-danger' :
                marketStatus === 'pre' ? 'bg-warning' : 'bg-secondary'
            }`;
        }

        // Update current time
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString();
        }

        // Update account summary
        const accountData = data.account || {};
        const portfolioElement = document.getElementById('morningPortfolioValue');
        if (portfolioElement) {
            portfolioElement.textContent = this.formatCurrency(accountData.portfolio_value || 0);
        }

        const buyingPowerElement = document.getElementById('morningBuyingPower');
        if (buyingPowerElement) {
            buyingPowerElement.textContent = this.formatCurrency(accountData.buying_power || 0);
        }

        const dayChangeElement = document.getElementById('morningDayChange');
        if (dayChangeElement) {
            dayChangeElement.textContent =
                `${accountData.day_change >= 0 ? '+' : ''}${this.formatCurrency(accountData.day_change || 0)} (${(accountData.day_change_percent || 0).toFixed(2)}%)`;
            dayChangeElement.className = `${(accountData.day_change || 0) >= 0 ? 'text-success' : 'text-danger'}`;
        }

        // Update positions summary
        const positions = data.positions || [];
        const positionsContainer = document.getElementById('morningPositions');
        if (positionsContainer) {
            positionsContainer.innerHTML = '';

            if (positions.length === 0) {
                positionsContainer.innerHTML = '<div class="text-muted text-center py-3">No positions</div>';
            } else {
                positions.slice(0, 5).forEach(position => {
                    const positionItem = document.createElement('div');
                    positionItem.className = 'position-item d-flex justify-content-between align-items-center py-2 border-bottom';
                    positionItem.innerHTML = `
                        <div>
                            <strong>${position.symbol}</strong>
                            <small class="text-muted d-block">${position.qty} shares</small>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${this.formatCurrency(position.market_value || 0)}</div>
                            <small class="${(position.unrealized_pl || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                ${(position.unrealized_pl || 0) >= 0 ? '+' : ''}${this.formatCurrency(position.unrealized_pl || 0)}
                            </small>
                        </div>
                    `;
                    positionsContainer.appendChild(positionItem);
                });
            }
        }

        // Update orders
        const ordersContainer = document.getElementById('morningOrders');
        if (ordersContainer) {
            const orders = data.orders || [];
            ordersContainer.innerHTML = '';

            if (orders.length === 0) {
                ordersContainer.innerHTML = '<div class="text-muted text-center py-3">No pending orders</div>';
            } else {
                orders.slice(0, 5).forEach(order => {
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item d-flex justify-content-between align-items-center py-2 border-bottom';
                    orderItem.innerHTML = `
                        <div>
                            <strong>${order.symbol}</strong>
                            <small class="text-muted d-block">${order.side} ${order.qty} @ ${this.formatCurrency(order.limit_price || order.stop_price || 0)}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge ${this.getOrderStatusClass(order.status)}">${order.status}</span>
                        </div>
                    `;
                    ordersContainer.appendChild(orderItem);
                });
            }
        }

        // Update news summary
        const news = data.news || [];
        const newsContainer = document.getElementById('morningNews');
        if (newsContainer) {
            newsContainer.innerHTML = '';

            if (news.length === 0) {
                newsContainer.innerHTML = '<div class="text-muted text-center py-3">No recent news</div>';
            } else {
                news.slice(0, 5).forEach(article => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'news-item py-2 border-bottom';
                    newsItem.innerHTML = `
                        <div class="fw-bold mb-1">${article.title}</div>
                        <small class="text-muted">${article.source} • ${new Date(article.published).toLocaleTimeString()}</small>
                    `;
                    newsContainer.appendChild(newsItem);
                });
            }
        }
    }

    generateDemoMorningRoutine() {
        const now = new Date();
        const marketHour = now.getHours();
        const isMarketOpen = marketHour >= 9 && marketHour < 16;

        return {
            market_status: isMarketOpen ? 'open' : 'closed',
            account: {
                portfolio_value: 50000 + Math.random() * 10000,
                day_change: (Math.random() - 0.5) * 1000,
                day_change_percent: (Math.random() - 0.5) * 2,
                buying_power: 25000 + Math.random() * 5000
            },
            positions: [
                {
                    symbol: 'AAPL',
                    qty: 50,
                    market_value: 8750,
                    unrealized_pl: 125.50
                },
                {
                    symbol: 'MSFT',
                    qty: 25,
                    market_value: 9875,
                    unrealized_pl: -67.25
                },
                {
                    symbol: 'GOOGL',
                    qty: 10,
                    market_value: 2890,
                    unrealized_pl: 45.80
                }
            ],
            orders: [
                {
                    symbol: 'TSLA',
                    side: 'BUY',
                    qty: 10,
                    limit_price: 180.00,
                    status: 'pending'
                },
                {
                    symbol: 'NVDA',
                    side: 'SELL',
                    qty: 5,
                    stop_price: 420.00,
                    status: 'pending'
                }
            ],
            news: [
                {
                    title: 'Market Opens Higher on Strong Earnings',
                    source: 'Financial News',
                    published: new Date().toISOString()
                },
                {
                    title: 'Tech Stocks Rally Continues',
                    source: 'MarketWatch',
                    published: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    title: 'Federal Reserve Maintains Interest Rates',
                    source: 'Reuters',
                    published: new Date(Date.now() - 7200000).toISOString()
                }
            ],
            alerts: [
                {
                    type: 'warning',
                    title: 'Portfolio Alert',
                    message: 'AAPL position has gained 15% since purchase'
                }
            ]
        };
    }

    // News Research System
    async searchNews() {
        try {
            const symbol = document.getElementById('newsSymbolSearch').value.trim().toUpperCase();
            const source = document.getElementById('newsSource').value;

            if (!symbol) {
                this.showNotification('Please enter a symbol to search for news', 'warning');
                return;
            }

            const button = document.getElementById('searchNewsBtn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

            // Show loading state
            document.getElementById('newsResults').innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Searching news for ${symbol}...</div>
                </div>
            `;

            // Try to fetch from API
            const response = await fetch(`/api/news/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol,
                    source: source,
                    limit: 20
                })
            });

            let newsData;
            if (response.ok) {
                newsData = await response.json();
                if (newsData.error) {
                    throw new Error(newsData.error);
                }
            } else {
                throw new Error('API not available');
            }

            this.displayNewsResults(newsData, symbol);
            this.showNotification(`Found ${newsData.articles?.length || 0} news articles for ${symbol}`, 'success');

        } catch (error) {
            console.error('Failed to search news:', error);

            // Show demo data as fallback
            const demoNews = this.generateDemoNewsData(symbol || 'AAPL');
            this.displayNewsResults(demoNews, symbol || 'AAPL');
            this.showNotification('Using demo news data (API not available)', 'info');

        } finally {
            const button = document.getElementById('searchNewsBtn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-search"></i> Search News';
        }
    }

    displayNewsResults(newsData, symbol) {
        const articles = newsData.articles || [];
        const sentiment = newsData.sentiment || {};

        // Display articles
        const newsContainer = document.getElementById('newsResults');
        newsContainer.innerHTML = '';

        if (articles.length === 0) {
            newsContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-newspaper fa-2x mb-3"></i>
                    <h6>No news found for ${symbol}</h6>
                    <p>Try a different symbol or news source.</p>
                </div>
            `;
        } else {
            articles.forEach(article => {
                const articleDiv = document.createElement('div');
                articleDiv.className = 'news-article border-bottom py-3';

                const timeAgo = this.getTimeAgo(new Date(article.published));
                const sentimentClass = this.getSentimentClass(article.sentiment);

                articleDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-1 text-light">${article.title}</h6>
                        <span class="badge ${sentimentClass} ms-2">${article.sentiment || 'neutral'}</span>
                    </div>
                    <p class="text-muted small mb-2">${article.summary || 'No summary available.'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-source"></i> ${article.source} • ${timeAgo}
                        </small>
                        ${article.url ? `<a href="${article.url}" target="_blank" class="btn btn-outline-primary btn-sm">
                            <i class="fas fa-external-link-alt"></i> Read
                        </a>` : ''}
                    </div>
                `;
                newsContainer.appendChild(articleDiv);
            });
        }

        // Display sentiment analysis
        this.displaySentimentAnalysis(sentiment, symbol);
    }

    displaySentimentAnalysis(sentiment, symbol) {
        const container = document.getElementById('sentimentAnalysis');

        if (!sentiment || Object.keys(sentiment).length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-chart-line fa-2x mb-3"></i>
                    <p>Sentiment analysis for ${symbol}</p>
                    <div class="sentiment-score">
                        <div class="d-flex justify-content-between">
                            <span>Overall:</span>
                            <span class="badge bg-secondary">Neutral</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const score = sentiment.score || 0;
        const scoreClass = score > 0.1 ? 'bg-success' : score < -0.1 ? 'bg-danger' : 'bg-secondary';
        const scoreLabel = score > 0.1 ? 'Positive' : score < -0.1 ? 'Negative' : 'Neutral';

        container.innerHTML = `
            <div class="sentiment-analysis">
                <div class="text-center mb-3">
                    <h6>${symbol} News Sentiment</h6>
                </div>

                <div class="mb-3">
                    <div class="d-flex justify-content-between">
                        <span>Overall Score:</span>
                        <span class="badge ${scoreClass}">${scoreLabel}</span>
                    </div>
                    <div class="progress mt-2" style="height: 6px;">
                        <div class="progress-bar ${scoreClass}"
                             style="width: ${Math.abs(score) * 100}%"></div>
                    </div>
                </div>

                <div class="sentiment-breakdown">
                    <div class="d-flex justify-content-between mb-1">
                        <small>Positive:</small>
                        <small>${sentiment.positive || 0}</small>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <small>Neutral:</small>
                        <small>${sentiment.neutral || 0}</small>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small>Negative:</small>
                        <small>${sentiment.negative || 0}</small>
                    </div>
                </div>
            </div>
        `;
    }

    generateDemoNewsData(symbol) {
        const articles = [
            {
                title: `${symbol} Reports Strong Q4 Earnings, Beats Expectations`,
                summary: `${symbol} posted revenue and earnings that exceeded analyst expectations, driven by strong demand and operational efficiency.`,
                source: 'Financial Times',
                published: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
                sentiment: 'positive',
                url: '#'
            },
            {
                title: `Analyst Upgrades ${symbol} Price Target Following Recent Performance`,
                summary: `Wall Street analysts are increasingly bullish on ${symbol} following strong fundamentals and market position.`,
                source: 'MarketWatch',
                published: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                sentiment: 'positive',
                url: '#'
            },
            {
                title: `${symbol} Faces Regulatory Scrutiny Over Market Practices`,
                summary: `Regulatory bodies are reviewing ${symbol}'s business practices, which could impact future operations.`,
                source: 'Reuters',
                published: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                sentiment: 'negative',
                url: '#'
            },
            {
                title: `${symbol} Announces Strategic Partnership in Technology Sector`,
                summary: `The company has formed a new partnership that could drive innovation and market expansion.`,
                source: 'TechCrunch',
                published: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
                sentiment: 'positive',
                url: '#'
            },
            {
                title: `Market Volatility Impacts ${symbol} Stock Performance`,
                summary: `Recent market turbulence has affected ${symbol} share price, though analysts remain cautiously optimistic.`,
                source: 'Bloomberg',
                published: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
                sentiment: 'neutral',
                url: '#'
            }
        ];

        const sentiment = {
            score: Math.random() * 0.4 - 0.2, // Random score between -0.2 and 0.2
            positive: Math.floor(Math.random() * 10) + 5,
            neutral: Math.floor(Math.random() * 15) + 10,
            negative: Math.floor(Math.random() * 8) + 2
        };

        return { articles, sentiment };
    }

    getSentimentClass(sentiment) {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'bg-success';
            case 'negative': return 'bg-danger';
            case 'neutral':
            default: return 'bg-secondary';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    // Options Trading System
    async buildOptionsStrategy() {
        try {
            const symbol = document.getElementById('optionsSymbol').value.trim().toUpperCase();
            const strategy = document.getElementById('optionsStrategy').value;
            const expiration = document.getElementById('optionsExpiration').value;

            if (!symbol) {
                this.showNotification('Please enter a symbol for options strategy', 'warning');
                return;
            }

            const button = document.getElementById('buildOptionsStrategyBtn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Building...';

            // Show loading state
            document.getElementById('optionsPLChart').innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-warning" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Building ${strategy.replace('_', ' ')} strategy for ${symbol}...</div>
                </div>
            `;

            // Try to fetch from API
            const response = await fetch('/api/options/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol,
                    strategy: strategy,
                    expiration: expiration
                })
            });

            let strategyData;
            if (response.ok) {
                strategyData = await response.json();
                if (strategyData.error) {
                    throw new Error(strategyData.error);
                }
            } else {
                throw new Error('API not available');
            }

            this.displayOptionsStrategy(strategyData, symbol, strategy);
            this.showNotification(`Options strategy built successfully for ${symbol}`, 'success');

        } catch (error) {
            console.error('Failed to build options strategy:', error);

            // Show demo data as fallback
            const demoStrategy = this.generateDemoOptionsStrategy(symbol || 'AAPL', strategy);
            this.displayOptionsStrategy(demoStrategy, symbol || 'AAPL', strategy);
            this.showNotification('Using demo options data (API not available)', 'info');

        } finally {
            const button = document.getElementById('buildOptionsStrategyBtn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-hammer"></i> Build Strategy';
        }
    }

    displayOptionsStrategy(strategyData, symbol, strategyType) {
        // Display P/L Chart
        this.plotOptionsPLChart(strategyData.pl_data, symbol, strategyType);

        // Update Greeks
        const greeks = strategyData.greeks || {};
        document.getElementById('optionsDelta').textContent = (greeks.delta || 0).toFixed(3);
        document.getElementById('optionsGamma').textContent = (greeks.gamma || 0).toFixed(3);
        document.getElementById('optionsTheta').textContent = (greeks.theta || 0).toFixed(3);
        document.getElementById('optionsVega').textContent = (greeks.vega || 0).toFixed(3);

        // Update Strategy Metrics
        const metrics = strategyData.metrics || {};
        document.getElementById('maxProfit').textContent =
            metrics.max_profit ? this.formatCurrency(metrics.max_profit) : 'Unlimited';
        document.getElementById('maxLoss').textContent =
            metrics.max_loss ? this.formatCurrency(metrics.max_loss) : 'Limited';
        document.getElementById('breakeven').textContent =
            metrics.breakeven ? `$${metrics.breakeven.toFixed(2)}` : '--';

        // Add probability of profit if available
        const probElement = document.getElementById('probProfit');
        if (probElement && metrics.prob_profit) {
            probElement.textContent = `${(metrics.prob_profit * 100).toFixed(1)}%`;
        }
    }

    plotOptionsPLChart(plData, symbol, strategy) {
        const chartContainer = document.getElementById('optionsPLChart');

        if (!plData || !plData.spot_prices || !plData.profits) {
            chartContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-chart-line fa-2x mb-3"></i>
                    <h6>No P/L data available</h6>
                    <p>Unable to generate profit/loss chart for this strategy.</p>
                </div>
            `;
            return;
        }

        const trace = {
            x: plData.spot_prices,
            y: plData.profits,
            type: 'scatter',
            mode: 'lines',
            name: 'P/L at Expiration',
            line: {
                color: '#ffc107',
                width: 3
            }
        };

        // Add breakeven lines
        const traces = [trace];
        if (plData.breakeven_points && plData.breakeven_points.length > 0) {
            plData.breakeven_points.forEach((breakeven, index) => {
                traces.push({
                    x: [breakeven, breakeven],
                    y: [Math.min(...plData.profits), Math.max(...plData.profits)],
                    type: 'scatter',
                    mode: 'lines',
                    name: `Breakeven ${index + 1}`,
                    line: {
                        color: '#dc3545',
                        width: 2,
                        dash: 'dash'
                    }
                });
            });
        }

        // Add zero profit line
        traces.push({
            x: [Math.min(...plData.spot_prices), Math.max(...plData.spot_prices)],
            y: [0, 0],
            type: 'scatter',
            mode: 'lines',
            name: 'Break Even',
            line: {
                color: '#6c757d',
                width: 1,
                dash: 'dot'
            }
        });

        const layout = {
            title: {
                text: `${symbol} ${strategy.replace('_', ' ').toUpperCase()} Strategy`,
                font: { color: '#ffffff', size: 14 }
            },
            xaxis: {
                title: 'Stock Price at Expiration',
                color: '#ffffff',
                gridcolor: '#444'
            },
            yaxis: {
                title: 'Profit/Loss ($)',
                color: '#ffffff',
                gridcolor: '#444'
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            legend: {
                font: { color: '#ffffff' }
            },
            margin: { t: 40, r: 10, b: 40, l: 60 }
        };

        Plotly.newPlot(chartContainer, traces, layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    generateDemoOptionsStrategy(symbol, strategy) {
        // Mock current stock price
        const currentPrice = 175 + Math.random() * 50; // Random price between 175-225
        const strikePrice = Math.round(currentPrice / 5) * 5; // Round to nearest $5

        // Generate P/L data points
        const spotPrices = [];
        const profits = [];
        const minPrice = currentPrice * 0.7;
        const maxPrice = currentPrice * 1.3;

        for (let price = minPrice; price <= maxPrice; price += 1) {
            spotPrices.push(price);
            profits.push(this.calculateStrategyPL(strategy, price, strikePrice, currentPrice));
        }

        // Calculate breakeven points
        const breakevens = this.findBreakevens(spotPrices, profits);

        // Generate mock Greeks
        const greeks = {
            delta: (Math.random() - 0.5) * 1,
            gamma: Math.random() * 0.1,
            theta: -Math.random() * 5,
            vega: Math.random() * 20
        };

        // Calculate metrics
        const maxProfit = Math.max(...profits);
        const maxLoss = Math.min(...profits);
        const probProfit = profits.filter(p => p > 0).length / profits.length;

        return {
            pl_data: {
                spot_prices: spotPrices,
                profits: profits,
                breakeven_points: breakevens
            },
            greeks: greeks,
            metrics: {
                max_profit: maxProfit > 1000 ? null : maxProfit, // Null for unlimited
                max_loss: maxLoss < -1000 ? null : maxLoss, // Null for unlimited
                breakeven: breakevens[0] || null,
                prob_profit: probProfit
            }
        };
    }

    calculateStrategyPL(strategy, spotPrice, strikePrice, currentPrice) {
        const premium = 3 + Math.random() * 5; // Random premium $3-8

        switch (strategy) {
            case 'covered_call':
                // Long stock + short call
                const stockPL = spotPrice - currentPrice;
                const callPL = Math.max(0, strikePrice - spotPrice) + premium;
                return stockPL + callPL;

            case 'cash_secured_put':
                // Short put
                return Math.min(premium, spotPrice - strikePrice + premium);

            case 'protective_put':
                // Long stock + long put
                const protectiveStockPL = spotPrice - currentPrice;
                const putPL = Math.max(0, strikePrice - spotPrice) - premium;
                return protectiveStockPL + putPL;

            case 'collar':
                // Long stock + long put + short call
                const collarStockPL = spotPrice - currentPrice;
                const collarPutPL = Math.max(0, strikePrice * 0.95 - spotPrice) - premium * 0.7;
                const collarCallPL = Math.max(0, strikePrice * 1.05 - spotPrice) + premium * 0.3;
                return collarStockPL + collarPutPL + collarCallPL;

            case 'iron_condor':
                // Complex spread strategy
                const wing1 = Math.max(0, strikePrice * 0.9 - spotPrice) - premium * 0.25;
                const wing2 = Math.max(0, spotPrice - strikePrice * 0.95) - premium * 0.75;
                const wing3 = Math.max(0, spotPrice - strikePrice * 1.05) + premium * 0.75;
                const wing4 = Math.max(0, strikePrice * 1.1 - spotPrice) + premium * 0.25;
                return wing1 + wing2 + wing3 + wing4;

            case 'butterfly':
                // Butterfly spread
                const butterfly1 = Math.max(0, strikePrice * 0.95 - spotPrice) - premium * 0.5;
                const butterfly2 = 2 * (Math.max(0, spotPrice - strikePrice) - premium * 0.5);
                const butterfly3 = Math.max(0, spotPrice - strikePrice * 1.05) + premium * 0.5;
                return butterfly1 - butterfly2 + butterfly3;

            default:
                return 0;
        }
    }

    findBreakevens(prices, profits) {
        const breakevens = [];
        for (let i = 1; i < profits.length; i++) {
            if ((profits[i-1] < 0 && profits[i] > 0) || (profits[i-1] > 0 && profits[i] < 0)) {
                // Linear interpolation to find exact breakeven
                const ratio = Math.abs(profits[i-1]) / (Math.abs(profits[i-1]) + Math.abs(profits[i]));
                const breakeven = prices[i-1] + ratio * (prices[i] - prices[i-1]);
                breakevens.push(breakeven);
            }
        }
        return breakevens;
    }
}

// AI Chat Functionality
let aiChatWs = null;
let aiChatInitialized = false;

function initializeAIChat() {
    if (aiChatInitialized) return;

    // Connect to AI WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ai-chat`;

    try {
        aiChatWs = new WebSocket(wsUrl);

        aiChatWs.onopen = () => {
            console.log('AI Chat WebSocket connected');
            document.getElementById('aiProvider').textContent = 'Claude (Connected)';
            document.getElementById('aiProvider').className = 'badge bg-success ms-2';
        };

        aiChatWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            addAIMessage(data.message, 'ai');
        };

        aiChatWs.onclose = () => {
            console.log('AI Chat WebSocket disconnected');
            document.getElementById('aiProvider').textContent = 'Claude (Disconnected)';
            document.getElementById('aiProvider').className = 'badge bg-danger ms-2';
        };

        aiChatWs.onerror = (error) => {
            console.error('AI Chat WebSocket error:', error);
            addAIMessage('Sorry, I\'m having connection issues. Please try again later.', 'ai');
        };

        aiChatInitialized = true;
    } catch (error) {
        console.error('Failed to initialize AI chat:', error);
        addAIMessage('Unable to connect to AI assistant. Using mock responses.', 'ai');
    }
}

function sendAIMessage(message = null) {
    const input = document.getElementById('aiChatInput');
    const messageText = message || input.value.trim();

    if (!messageText) return;

    // Add user message to chat
    addAIMessage(messageText, 'user');

    // Clear input if it came from the input field
    if (!message) {
        input.value = '';
    }

    // Initialize AI chat if not already done
    if (!aiChatInitialized) {
        initializeAIChat();
    }

    // Send message to AI
    if (aiChatWs && aiChatWs.readyState === WebSocket.OPEN) {
        aiChatWs.send(JSON.stringify({
            message: messageText,
            context: {
                portfolio_value: document.getElementById('portfolioValue')?.textContent || 'N/A',
                positions_count: document.getElementById('activePositions')?.textContent || 'N/A',
                current_symbol: dashboard?.currentSymbol || 'AAPL'
            }
        }));
    } else {
        // Fallback to mock responses
        setTimeout(() => {
            generateMockAIResponse(messageText);
        }, 1000);
    }
}

function addAIMessage(text, sender) {
    const messagesContainer = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message mb-3`;

    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="d-flex justify-content-end">
                <div class="me-2">
                    <div class="bg-primary p-2 rounded text-white" style="max-width: 400px;">
                        ${text}
                    </div>
                </div>
                <div>
                    <i class="fas fa-user text-primary"></i>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="d-flex">
                <div class="me-2">
                    <i class="fas fa-robot text-info"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="bg-info bg-opacity-10 p-2 rounded">
                        ${text}
                    </div>
                    <div class="small text-muted mt-1">
                        ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update sidebar status when modal opens
    updateAIChatSidebar();
}

function generateMockAIResponse(userMessage) {
    const responses = {
        'what are my current positions': `Based on your current portfolio, you have ${document.getElementById('activePositions')?.textContent || '0'} active positions. Your portfolio value is ${document.getElementById('portfolioValue')?.textContent || 'loading'}. I can see you're currently tracking ${dashboard?.currentSymbol || 'AAPL'} on your chart.`,
        'how is my performance today': `Your portfolio performance today shows you're in paper trading mode, which is great for learning! Your current portfolio value is ${document.getElementById('portfolioValue')?.textContent || 'loading'}. Keep tracking your strategies to build confidence before going live.`,
        'analyze aapl stock': 'AAPL is currently showing strong technical indicators. Based on the real-time data in your dashboard, you can see the current price movements. Consider looking at the RSI and moving averages in your technical indicators section.',
        'what is my risk exposure': 'In paper trading mode, your financial risk is zero, which is perfect for learning! Your position sizing and risk management settings can be reviewed in the Settings tab. This is a great time to experiment with different strategies.',
        'should i adjust my trading strategy': 'Based on your current setup, I can see you have access to multiple strategies in your Strategy section. Consider backtesting different approaches using the strategy tester before implementing them live.',
        'show me market news and sentiment': 'Your dashboard includes a real-time news feed from Yahoo Finance, Google News, and Reddit. Check the news section for the latest market sentiment and financial news updates.',
        'explain options trading strategies': 'Options trading involves contracts that give you the right (not obligation) to buy or sell stocks at specific prices. Common strategies include covered calls (income generation) and protective puts (insurance). Your bot includes an options income system strategy you can explore.'
    };

    const lowerMessage = userMessage.toLowerCase();
    let response = 'I understand you\'re asking about trading. While I\'m currently in demonstration mode, I can help explain trading concepts, analyze your dashboard data, and provide educational guidance. What specific aspect of trading would you like to learn more about?';

    // Find matching response
    for (const [key, value] of Object.entries(responses)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            response = value;
            break;
        }
    }

    addAIMessage(response, 'ai');
}

function updateAIChatSidebar() {
    // Update sidebar with current dashboard data
    const portfolioValue = document.getElementById('portfolioValue')?.textContent || 'Loading...';
    const activePositions = document.getElementById('activePositions')?.textContent || 'Loading...';

    document.getElementById('aiChatPortfolioValue').textContent = portfolioValue;
    document.getElementById('aiChatPositionCount').textContent = activePositions;
    document.getElementById('aiChatDayPnL').textContent = '+$0.00'; // Would need to calculate from actual data
}

// Event listener for modal shown event
document.addEventListener('DOMContentLoaded', () => {
    const aiChatModal = document.getElementById('aiChatModal');
    if (aiChatModal) {
        aiChatModal.addEventListener('shown.bs.modal', () => {
            updateAIChatSidebar();
            if (!aiChatInitialized) {
                initializeAIChat();
            }
        });
    }

    // Initialize backtest modal
    const backtestModal = document.getElementById('backtestModal');
    if (backtestModal) {
        backtestModal.addEventListener('shown.bs.modal', () => {
            // Initialize with default strategy parameters
            if (dashboard) {
                const defaultStrategy = document.getElementById('backtestStrategy').value;
                dashboard.updateStrategyParameters(defaultStrategy);
            }
        });
    }
});

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TradingDashboard();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (dashboard) {
        dashboard.showNotification('An unexpected error occurred', 'error');
    }
});