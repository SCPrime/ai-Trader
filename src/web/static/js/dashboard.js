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
        switch (data.type) {
            case 'periodic_update':
                this.updateDashboardData(data);
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
                console.log('Unknown message type:', data.type);
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

            // Populate form fields
            document.getElementById('positionSize').value = (settings.position_size * 100).toFixed(2);
            document.getElementById('stopLoss').value = (settings.stop_loss_pct * 100).toFixed(2);
            document.getElementById('takeProfit').value = (settings.take_profit_pct * 100).toFixed(2);
            document.getElementById('maxDailyLoss').value = (settings.max_daily_loss * 100).toFixed(2);
            document.getElementById('maxPositions').value = settings.max_positions;
            document.getElementById('maxDailyTrades').value = settings.max_daily_trades;
            document.getElementById('requireConfirmation').checked = settings.require_confirmation;
            document.getElementById('enableTrailingStops').checked = settings.enable_trailing_stops;
            document.getElementById('aiConfidenceThreshold').value = settings.ai_confidence_threshold;
            document.getElementById('rsiPeriod').value = settings.rsi_period;
            document.getElementById('smaShort').value = settings.sma_short;
            document.getElementById('smaLong').value = settings.sma_long;

        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showNotification('Failed to load settings', 'error');
        }
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
}

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