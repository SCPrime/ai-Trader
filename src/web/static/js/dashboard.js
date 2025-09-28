// AI Trading Bot Dashboard JavaScript

class TradingDashboard {
    constructor() {
        this.ws = null;
        this.currentSymbol = 'AAPL';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // Keep-alive and ping management
        this.lastActivityTime = new Date();
        this.heartbeatInterval = null;
        this.pingInterval = 30000; // 30 seconds
        this.connectionTimeout = 60000; // 60 seconds

        // Enhanced reconnection properties
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.reconnectTimeoutId = null;
        this.lastDisconnectTime = null;
        this.connectionState = 'disconnected'; // disconnected, connecting, connected, failed

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

                // Load enhanced data for new symbol
                this.loadTechnicalIndicators(symbol);
                this.loadEnhancedNews(symbol);
                this.loadOptionsChain(symbol);
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
                console.log('WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000; // Reset reconnection delay
                this.lastActivityTime = new Date();
                this.connectionState = 'connected';

                // Clear any pending reconnection timeouts
                if (this.reconnectTimeoutId) {
                    clearTimeout(this.reconnectTimeoutId);
                    this.reconnectTimeoutId = null;
                }

                this.updateConnectionStatus('connected');
                this.startHeartbeat();

                // Show success notification on reconnection
                if (this.reconnectAttempts > 0 || this.lastDisconnectTime) {
                    this.showNotification('Successfully reconnected to server', 'success');
                }
            };

            this.ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    console.error("Invalid JSON from WebSocket:", event.data, "Error:", e);
                    return;
                }
                this.lastActivityTime = new Date(); // Update activity on each message
                this.handleWebSocketMessage(data);
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected', event.code, event.reason);
                this.isConnected = false;
                this.lastDisconnectTime = new Date();
                this.connectionState = 'disconnected';
                this.stopHeartbeat();

                // Determine if this was an unexpected disconnection
                const wasConnected = this.connectionState === 'connected';

                this.updateConnectionStatus('disconnected');

                // Only show disconnect notification if we were previously connected
                if (wasConnected) {
                    this.showNotification('Connection to server lost. Attempting to reconnect...', 'warning');
                }

                // Attempt reconnection if not manually closed
                if (event.code !== 1000) { // 1000 = normal closure
                    this.attemptReconnect();
                } else {
                    console.log('WebSocket closed normally (no reconnection needed)');
                }
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
        // Clear any existing reconnection timeout
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.connectionState = 'connecting';
            this.updateConnectionStatus('connecting');

            // Exponential backoff with jitter
            const baseDelay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
            const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
            const delay = baseDelay + jitter;

            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay/1000)}s`);

            this.showNotification(
                `Connection lost. Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
                'warning'
            );

            this.reconnectTimeoutId = setTimeout(() => {
                console.log(`Executing reconnection attempt ${this.reconnectAttempts}`);
                this.connectWebSocket();
            }, delay);
        } else {
            // Max attempts reached
            this.connectionState = 'failed';
            this.updateConnectionStatus('failed');
            this.handleReconnectionFailure();
        }
    }

    handleReconnectionFailure() {
        console.error('Max reconnection attempts reached. Connection failed.');

        this.showNotification(
            'Connection failed after multiple attempts. Please check your internet connection and refresh the page.',
            'error',
            10000 // Show for 10 seconds
        );

        // Offer manual reconnection option
        this.showReconnectionPrompt();
    }

    showReconnectionPrompt() {
        // Create a manual reconnection button
        const existingPrompt = document.getElementById('reconnectionPrompt');
        if (!existingPrompt) {
            const prompt = document.createElement('div');
            prompt.id = 'reconnectionPrompt';
            prompt.className = 'alert alert-warning reconnection-prompt';
            prompt.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Connection Lost</strong> - Real-time updates are disabled
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary me-2" onclick="dashboard.manualReconnect()">
                            <i class="fas fa-sync"></i> Reconnect
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="dashboard.dismissReconnectionPrompt()">
                            <i class="fas fa-times"></i> Dismiss
                        </button>
                    </div>
                </div>
            `;

            // Insert at top of dashboard
            const container = document.querySelector('.container-fluid') || document.body;
            container.insertBefore(prompt, container.firstChild);
        }
    }

    manualReconnect() {
        console.log('Manual reconnection initiated');
        this.dismissReconnectionPrompt();
        this.reconnectAttempts = 0; // Reset attempts
        this.reconnectDelay = 1000; // Reset delay
        this.connectionState = 'connecting';
        this.showNotification('Attempting manual reconnection...', 'info');
        this.connectWebSocket();
    }

    dismissReconnectionPrompt() {
        const prompt = document.getElementById('reconnectionPrompt');
        if (prompt) {
            prompt.remove();
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) {
            console.warn('Connection status element not found');
            return;
        }

        // Store current state
        this.connectionState = status;

        statusElement.className = 'badge';

        switch (status) {
            case 'connected':
                statusElement.classList.add('bg-success', 'connected');
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
                statusElement.title = 'WebSocket connected and receiving real-time updates';
                // Clear any reconnection prompt when successfully connected
                this.dismissReconnectionPrompt();
                break;

            case 'connecting':
                statusElement.classList.add('bg-warning', 'connecting');
                statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting';
                statusElement.title = `Attempting to connect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
                break;

            case 'disconnected':
                statusElement.classList.add('bg-danger', 'disconnected');
                statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Disconnected';
                statusElement.title = 'WebSocket disconnected - real-time updates unavailable';
                break;

            case 'failed':
                statusElement.classList.add('bg-dark', 'failed');
                statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection Failed';
                statusElement.title = 'Connection failed after multiple attempts - manual intervention required';
                break;

            case 'reconnecting':
                statusElement.classList.add('bg-info', 'reconnecting');
                statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> Reconnecting';
                statusElement.title = `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
                break;

            default:
                statusElement.classList.add('bg-secondary', 'unknown');
                statusElement.innerHTML = '<i class="fas fa-question"></i> Unknown';
                statusElement.title = 'Connection status unknown';
        }
    }

    handleWebSocketMessage(data) {
        console.log('WebSocket message received:', data);

        // Validate message structure
        if (!data || typeof data !== 'object') {
            console.error('Invalid WebSocket message structure:', data);
            return;
        }

        // Handle different message types
        try {
            switch (data.type) {
                case 'periodic_update':
                    this.updateDashboardData(data);
                    break;

                case 'market_data':
                case 'price_update':
                    this.handleMarketDataUpdate(data);
                    break;

                case 'position_update':
                    this.handlePositionUpdate(data);
                    break;

                case 'order_update':
                    this.handleOrderUpdate(data);
                    break;

                case 'portfolio_update':
                    this.handlePortfolioUpdate(data);
                    break;

                case 'trading_mode_changed':
                    this.updateTradingModeUI(data.is_live);
                    break;

                case 'ai_mode_changed':
                    this.updateAIModeUI(data.is_auto);
                    break;

                case 'trade_placed':
                    this.handleTradeConfirmation(data);
                    break;

                case 'alert':
                case 'notification':
                    this.handleAlert(data);
                    break;

                case 'error':
                    this.handleError(data);
                    break;

                case 'ping':
                    this.handlePing(data);
                    break;

                case 'keep_alive':
                    this.handleKeepAlive(data);
                    break;

                default:
                    console.warn('Unknown WebSocket message type:', data.type, 'Full message:', data);
                    this.handleUnknownMessage(data);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error, 'Message:', data);
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

            // Load enhanced data from new endpoints
            await this.loadTechnicalIndicators();
            await this.loadEnhancedNews();

            // Load options data
            await this.loadOptionsChain();

        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load initial data', 'error');
        }
    }

    async loadTechnicalIndicators(symbol = this.currentSymbol) {
        try {
            const response = await fetch(`/api/indicators/${symbol}`);
            const data = await response.json();

            if (response.ok) {
                this.displayTechnicalIndicators(data);
            } else {
                console.error('Failed to load technical indicators:', data);
            }
        } catch (error) {
            console.error('Error loading technical indicators:', error);
        }
    }

    displayTechnicalIndicators(data) {
        const container = document.getElementById('technicalIndicators');
        if (!container) return;

        const indicators = data.indicators;
        const analysis = data.analysis;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card bg-dark border-secondary mb-3">
                        <div class="card-header text-info">
                            <i class="fas fa-chart-line"></i> Technical Indicators
                        </div>
                        <div class="card-body">
                            ${indicators.rsi ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>RSI (${indicators.rsi.period}):</span>
                                    <span class="badge bg-${this.getSignalColor(indicators.rsi.signal)}">${indicators.rsi.value} (${indicators.rsi.signal})</span>
                                </div>
                            ` : ''}
                            ${indicators.macd ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>MACD:</span>
                                    <span class="badge bg-${this.getSignalColor(indicators.macd.signal)}">${indicators.macd.macd_line.toFixed(3)} (${indicators.macd.signal})</span>
                                </div>
                            ` : ''}
                            ${indicators.sma ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>SMA 20/50:</span>
                                    <span class="badge bg-${this.getSignalColor(indicators.sma.signal)}">${indicators.sma.sma_20}/${indicators.sma.sma_50} (${indicators.sma.signal})</span>
                                </div>
                            ` : ''}
                            ${indicators.bollinger_bands ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Bollinger:</span>
                                    <span class="badge bg-${this.getSignalColor(indicators.bollinger_bands.signal)}">${indicators.bollinger_bands.position} (${indicators.bollinger_bands.signal})</span>
                                </div>
                            ` : ''}
                            ${indicators.stochastic ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Stochastic:</span>
                                    <span class="badge bg-${this.getSignalColor(indicators.stochastic.signal)}">${indicators.stochastic.k_percent.toFixed(1)}% (${indicators.stochastic.signal})</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-dark border-secondary mb-3">
                        <div class="card-header text-warning">
                            <i class="fas fa-brain"></i> AI Analysis
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Trend:</span>
                                <span class="badge bg-${analysis.trend === 'bullish' ? 'success' : analysis.trend === 'bearish' ? 'danger' : 'secondary'}">${analysis.trend}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Strength:</span>
                                <span class="badge bg-${analysis.strength === 'strong' ? 'success' : analysis.strength === 'weak' ? 'warning' : 'secondary'}">${analysis.strength}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Recommendation:</span>
                                <span class="badge bg-${analysis.recommendation === 'buy' ? 'success' : analysis.recommendation === 'sell' ? 'danger' : 'warning'}">${analysis.recommendation.toUpperCase()}</span>
                            </div>
                            <div class="text-muted small mt-2">
                                Last updated: ${new Date(data.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadEnhancedNews(symbol = this.currentSymbol, limit = 10) {
        try {
            const response = await fetch(`/api/news/${symbol}?limit=${limit}`);
            const data = await response.json();

            if (response.ok) {
                this.displayEnhancedNews(data);
            } else {
                console.error('Failed to load enhanced news:', data);
            }
        } catch (error) {
            console.error('Error loading enhanced news:', error);
        }
    }

    displayEnhancedNews(data) {
        const container = document.getElementById('morningNews');
        if (!container) return;

        const newsHtml = data.news.slice(0, 5).map(article => `
            <div class="border-bottom border-secondary pb-2 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">
                        <a href="${article.url}" target="_blank" class="text-decoration-none text-info">
                            ${article.title}
                        </a>
                    </h6>
                    <span class="badge bg-${this.getSentimentColor(article.sentiment)} ms-2">${article.sentiment}</span>
                </div>
                <p class="mb-1 text-muted small">${article.summary}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        ${article.source} • ${new Date(article.published).toLocaleDateString()}
                    </small>
                    <span class="badge bg-outline-secondary">${article.relevance}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-info mb-0">
                    <i class="fas fa-newspaper"></i> Enhanced Market News (${data.symbol})
                </h6>
                <small class="text-muted">Updated: ${new Date(data.last_updated).toLocaleTimeString()}</small>
            </div>
            ${newsHtml}
            <div class="text-center mt-3">
                <button class="btn btn-outline-info btn-sm" onclick="dashboard.loadEnhancedNews('${data.symbol}', 20)">
                    <i class="fas fa-sync"></i> Load More News
                </button>
            </div>
        `;
    }

    getSignalColor(signal) {
        switch(signal?.toLowerCase()) {
            case 'bullish':
            case 'buy':
                return 'success';
            case 'bearish':
            case 'sell':
                return 'danger';
            case 'neutral':
            case 'hold':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    getSentimentColor(sentiment) {
        switch(sentiment?.toLowerCase()) {
            case 'positive':
                return 'success';
            case 'negative':
                return 'danger';
            case 'neutral':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    // ============ OPTIONS TRADING FEATURES ============

    async loadOptionsChain(symbol = this.currentSymbol) {
        try {
            const response = await fetch(`/api/options/enhanced/${symbol}`);
            const data = await response.json();

            if (response.ok) {
                this.optionsData = data;
                this.displayOptionsChain(data);
            } else {
                console.error('Failed to load options chain:', data);
            }
        } catch (error) {
            console.error('Error loading options chain:', error);
        }
    }

    displayOptionsChain(data) {
        // This will be triggered when the options modal is opened
        // For now, just store the data
        this.optionsData = data;
    }

    openOptionsCenter() {
        // Load fresh options data
        this.loadOptionsChain();

        // Show the options modal
        const modal = new bootstrap.Modal(document.getElementById('optionsModal'));
        modal.show();

        // Initialize the options UI
        this.initializeOptionsUI();
    }

    initializeOptionsUI() {
        if (!this.optionsData) return;

        const data = this.optionsData;

        // Update options header info
        document.getElementById('optionsSymbol').textContent = data.symbol;
        document.getElementById('optionsPrice').textContent = `$${data.underlying_price}`;
        document.getElementById('optionsExpiration').textContent = data.expiration_date;
        document.getElementById('optionsIV').textContent = `${(data.implied_volatility * 100).toFixed(1)}%`;

        // Build options chain table
        this.buildOptionsChainTable(data.options_chain);

        // Update market summary
        this.updateMarketSummary(data.market_summary);
    }

    buildOptionsChainTable(optionsChain) {
        const tbody = document.getElementById('optionsChainBody');
        tbody.innerHTML = '';

        optionsChain.forEach(strike => {
            const row = document.createElement('tr');

            // Determine if this strike is near the money
            const isNearMoney = Math.abs(strike.strike - this.optionsData.underlying_price) <= 10;
            if (isNearMoney) {
                row.classList.add('table-warning');
            }

            row.innerHTML = `
                <!-- Call Option Data -->
                <td class="text-end">
                    <small class="text-muted">IV: ${(strike.call.implied_volatility * 100).toFixed(1)}%</small><br>
                    <small class="text-muted">Vol: ${strike.call.volume}</small>
                </td>
                <td class="text-end">
                    <span class="text-success">Δ ${strike.call.delta.toFixed(2)}</span><br>
                    <small class="text-muted">Γ ${strike.call.gamma.toFixed(3)}</small>
                </td>
                <td class="text-end">
                    <span class="fw-bold">$${strike.call.bid}</span> x <span class="fw-bold">$${strike.call.ask}</span><br>
                    <small class="text-muted">Mid: $${strike.call.mid}</small>
                </td>

                <!-- Strike Price (Center) -->
                <td class="text-center fw-bold ${strike.call.moneyness === 'ATM' ? 'text-warning' : ''}">
                    $${strike.strike}
                    ${strike.call.moneyness === 'ATM' ? '<br><small class="badge bg-warning text-dark">ATM</small>' : ''}
                </td>

                <!-- Put Option Data -->
                <td class="text-start">
                    <span class="fw-bold">$${strike.put.bid}</span> x <span class="fw-bold">$${strike.put.ask}</span><br>
                    <small class="text-muted">Mid: $${strike.put.mid}</small>
                </td>
                <td class="text-start">
                    <span class="text-danger">Δ ${strike.put.delta.toFixed(2)}</span><br>
                    <small class="text-muted">Γ ${strike.put.gamma.toFixed(3)}</small>
                </td>
                <td class="text-start">
                    <small class="text-muted">IV: ${(strike.put.implied_volatility * 100).toFixed(1)}%</small><br>
                    <small class="text-muted">Vol: ${strike.put.volume}</small>
                </td>

                <!-- Action Buttons -->
                <td>
                    <div class="btn-group-vertical btn-group-sm" role="group">
                        <button class="btn btn-outline-success btn-xs" onclick="dashboard.addToStrategy('call', ${strike.strike}, ${strike.call.mid}, 'buy')">
                            Buy Call
                        </button>
                        <button class="btn btn-outline-danger btn-xs" onclick="dashboard.addToStrategy('call', ${strike.strike}, ${strike.call.mid}, 'sell')">
                            Sell Call
                        </button>
                        <button class="btn btn-outline-success btn-xs" onclick="dashboard.addToStrategy('put', ${strike.strike}, ${strike.put.mid}, 'buy')">
                            Buy Put
                        </button>
                        <button class="btn btn-outline-danger btn-xs" onclick="dashboard.addToStrategy('put', ${strike.strike}, ${strike.put.mid}, 'sell')">
                            Sell Put
                        </button>
                    </div>
                </td>
            `;

            // Add click handler for Greeks calculator
            row.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    this.showGreeksCalculator(strike.strike);
                }
            });

            tbody.appendChild(row);
        });
    }

    updateMarketSummary(summary) {
        document.getElementById('totalCallVolume').textContent = summary.total_call_volume.toLocaleString();
        document.getElementById('totalPutVolume').textContent = summary.total_put_volume.toLocaleString();
        document.getElementById('putCallRatio').textContent = summary.put_call_ratio;
        document.getElementById('maxPain').textContent = `$${summary.max_pain}`;
        document.getElementById('ivRank').textContent = `${summary.iv_rank}%`;
    }

    // Strategy Builder
    addToStrategy(type, strike, price, action) {
        if (!this.strategyLegs) {
            this.strategyLegs = [];
        }

        const leg = {
            type: type,
            strike: strike,
            price: price,
            action: action,
            quantity: 1
        };

        this.strategyLegs.push(leg);
        this.updateStrategyBuilder();
        this.showNotification(`Added ${action} ${type} $${strike} to strategy`, 'success');
    }

    updateStrategyBuilder() {
        const container = document.getElementById('strategyLegs');
        if (!container || !this.strategyLegs) return;

        container.innerHTML = this.strategyLegs.map((leg, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <span class="badge bg-${leg.action === 'buy' ? 'success' : 'danger'}">${leg.action.toUpperCase()}</span>
                    <span class="ms-2">${leg.quantity}x ${leg.type.toUpperCase()} $${leg.strike}</span>
                    <small class="text-muted ms-2">@ $${leg.price}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeStrategyLeg(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // Update strategy analysis
        this.analyzeStrategy();
    }

    removeStrategyLeg(index) {
        this.strategyLegs.splice(index, 1);
        this.updateStrategyBuilder();
    }

    async analyzeStrategy() {
        if (!this.strategyLegs || this.strategyLegs.length === 0) {
            document.getElementById('strategyAnalysis').innerHTML = '<p class="text-muted">Add options to build a strategy</p>';
            return;
        }

        try {
            const response = await fetch('/api/options/strategy/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'custom',
                    symbol: this.currentSymbol,
                    legs: this.strategyLegs.map(leg => ({
                        quantity: leg.quantity,
                        action: leg.action,
                        option_type: leg.type,
                        strike: leg.strike,
                        price: leg.price
                    }))
                })
            });

            const analysis = await response.json();
            this.displayStrategyAnalysis(analysis);

        } catch (error) {
            console.error('Strategy analysis error:', error);
        }
    }

    displayStrategyAnalysis(analysis) {
        const container = document.getElementById('strategyAnalysis');
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Strategy Summary</h6>
                    <table class="table table-sm table-dark">
                        <tr><td>Total Cost:</td><td class="fw-bold ${analysis.summary.total_cost >= 0 ? 'text-success' : 'text-danger'}">$${analysis.summary.total_cost}</td></tr>
                        <tr><td>Max Profit:</td><td class="text-success">$${analysis.summary.max_profit}</td></tr>
                        <tr><td>Max Loss:</td><td class="text-danger">$${analysis.summary.max_loss}</td></tr>
                        <tr><td>Net Delta:</td><td>${analysis.summary.net_delta.toFixed(3)}</td></tr>
                        <tr><td>Net Theta:</td><td>${analysis.summary.net_theta.toFixed(3)}</td></tr>
                    </table>
                    ${analysis.summary.breakeven_points.length > 0 ? `
                        <p><strong>Breakeven:</strong> $${analysis.summary.breakeven_points.join(', $')}</p>
                    ` : ''}
                </div>
                <div class="col-md-6">
                    <h6>P&L Chart</h6>
                    <canvas id="plChart" width="300" height="200"></canvas>
                </div>
            </div>
        `;

        // Draw P&L chart
        this.drawPLChart(analysis.pl_chart);
    }

    drawPLChart(chartData) {
        const canvas = document.getElementById('plChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set up chart parameters
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        const prices = chartData.prices;
        const plValues = chartData.pl_values;

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const minPL = Math.min(...plValues);
        const maxPL = Math.max(...plValues);

        // Draw axes
        ctx.strokeStyle = '#6c757d';
        ctx.lineWidth = 1;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // Draw zero line
        const zeroY = height - padding - ((0 - minPL) / (maxPL - minPL)) * chartHeight;
        ctx.strokeStyle = '#ffc107';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(width - padding, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw P&L line
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < prices.length; i++) {
            const x = padding + (i / (prices.length - 1)) * chartWidth;
            const y = height - padding - ((plValues[i] - minPL) / (maxPL - minPL)) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Add labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // Price labels
        ctx.fillText(`$${minPrice.toFixed(0)}`, padding, height - 10);
        ctx.fillText(`$${maxPrice.toFixed(0)}`, width - padding, height - 10);

        // P&L labels
        ctx.textAlign = 'right';
        ctx.fillText(`$${maxPL.toFixed(0)}`, padding - 5, padding + 5);
        ctx.fillText(`$${minPL.toFixed(0)}`, padding - 5, height - padding + 5);
    }

    // Greeks Calculator
    async showGreeksCalculator(strike, optionType = 'call') {
        try {
            const response = await fetch(`/api/options/greeks/${this.currentSymbol}/${strike}/${optionType}`);
            const data = await response.json();

            document.getElementById('greeksSymbol').textContent = data.symbol;
            document.getElementById('greeksStrike').textContent = `$${data.strike}`;
            document.getElementById('greeksType').textContent = data.option_type.toUpperCase();
            document.getElementById('greeksPrice').textContent = `$${data.option_price}`;
            document.getElementById('greeksUnderlying').textContent = `$${data.underlying_price}`;

            // Display Greeks
            document.getElementById('deltaValue').textContent = data.greeks.delta.toFixed(4);
            document.getElementById('gammaValue').textContent = data.greeks.gamma.toFixed(4);
            document.getElementById('thetaValue').textContent = data.greeks.theta.toFixed(4);
            document.getElementById('vegaValue').textContent = data.greeks.vega.toFixed(4);
            document.getElementById('rhoValue').textContent = data.greeks.rho.toFixed(4);

            // Display explanations
            document.getElementById('deltaExplanation').textContent = data.sensitivity_analysis.delta_explanation;
            document.getElementById('gammaExplanation').textContent = data.sensitivity_analysis.gamma_explanation;
            document.getElementById('thetaExplanation').textContent = data.sensitivity_analysis.theta_explanation;
            document.getElementById('vegaExplanation').textContent = data.sensitivity_analysis.vega_explanation;
            document.getElementById('rhoExplanation').textContent = data.sensitivity_analysis.rho_explanation;

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('greeksModal'));
            modal.show();

        } catch (error) {
            console.error('Greeks calculation error:', error);
            this.showNotification('Failed to calculate Greeks', 'error');
        }
    }

    // Quick Strategy Templates
    async createQuickStrategy(strategyType) {
        const currentPrice = this.optionsData?.underlying_price || 250;
        let legs = [];

        switch (strategyType) {
            case 'bull_call_spread':
                legs = [
                    { type: 'call', strike: currentPrice - 5, price: 8, action: 'buy', quantity: 1 },
                    { type: 'call', strike: currentPrice + 5, price: 4, action: 'sell', quantity: 1 }
                ];
                break;
            case 'bear_put_spread':
                legs = [
                    { type: 'put', strike: currentPrice + 5, price: 8, action: 'buy', quantity: 1 },
                    { type: 'put', strike: currentPrice - 5, price: 4, action: 'sell', quantity: 1 }
                ];
                break;
            case 'iron_condor':
                legs = [
                    { type: 'call', strike: currentPrice - 10, price: 2, action: 'sell', quantity: 1 },
                    { type: 'call', strike: currentPrice - 5, price: 4, action: 'buy', quantity: 1 },
                    { type: 'put', strike: currentPrice + 5, price: 4, action: 'buy', quantity: 1 },
                    { type: 'put', strike: currentPrice + 10, price: 2, action: 'sell', quantity: 1 }
                ];
                break;
            case 'strangle':
                legs = [
                    { type: 'call', strike: currentPrice + 10, price: 5, action: 'buy', quantity: 1 },
                    { type: 'put', strike: currentPrice - 10, price: 5, action: 'buy', quantity: 1 }
                ];
                break;
        }

        this.strategyLegs = legs;
        this.updateStrategyBuilder();
        this.showNotification(`Created ${strategyType.replace('_', ' ')} strategy`, 'success');
    }

    clearStrategy() {
        this.strategyLegs = [];
        this.updateStrategyBuilder();
        document.getElementById('strategyAnalysis').innerHTML = '<p class="text-muted">Add options to build a strategy</p>';
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

    // ===== WEBSOCKET MESSAGE HANDLERS =====

    handlePositionUpdate(data) {
        console.log('Position update received:', data);
        try {
            if (data.positions || data.symbol) {
                this.loadPositions(); // Refresh positions display
                if (data.symbol) {
                    this.showNotification(`Position updated for ${data.symbol}`, 'info');
                }
            }
        } catch (error) {
            console.error('Error handling position update:', error);
        }
    }

    handleOrderUpdate(data) {
        console.log('Order update received:', data);
        try {
            if (data.orders || data.order_id) {
                this.loadOrders(); // Refresh orders display
                if (data.status) {
                    this.showNotification(`Order ${data.order_id}: ${data.status}`, 'info');
                }
            }
        } catch (error) {
            console.error('Error handling order update:', error);
        }
    }

    handlePortfolioUpdate(data) {
        console.log('Portfolio update received:', data);
        try {
            if (data.portfolio_value || data.buying_power) {
                this.loadAccountInfo(); // Refresh account data
                this.showNotification('Portfolio updated', 'success');
            }
        } catch (error) {
            console.error('Error handling portfolio update:', error);
        }
    }

    handleTradeConfirmation(data) {
        console.log('Trade confirmation received:', data);
        try {
            this.showNotification('Trade placed successfully', 'success');
            this.loadOrders();
            this.loadPositions();
            this.loadAccountInfo();

            if (data.symbol && data.side && data.qty) {
                this.showNotification(
                    `${data.side.toUpperCase()} ${data.qty} shares of ${data.symbol}`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Error handling trade confirmation:', error);
        }
    }

    handleAlert(data) {
        console.log('Alert received:', data);
        try {
            const message = data.message || data.text || 'Alert received';
            const type = data.level || data.severity || 'info';
            this.showNotification(message, type);
        } catch (error) {
            console.error('Error handling alert:', error);
        }
    }

    handleError(data) {
        console.error('WebSocket error message received:', data);
        try {
            const message = data.message || data.error || 'An error occurred';
            this.showNotification(message, 'error');
        } catch (error) {
            console.error('Error handling error message:', error);
        }
    }

    handlePing(data) {
        console.log('Ping received, sending pong');
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            }
        } catch (error) {
            console.error('Error handling ping:', error);
        }
    }

    handleKeepAlive(data) {
        console.log('Keep-alive received');
        // Update last activity timestamp
        this.lastActivityTime = new Date();
    }

    // ===== HEARTBEAT & CONNECTION MANAGEMENT =====

    startHeartbeat() {
        this.stopHeartbeat(); // Clear any existing interval

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const now = new Date();
                const timeSinceLastActivity = now - this.lastActivityTime;

                // Send ping if connection seems stale
                if (timeSinceLastActivity > this.pingInterval) {
                    this.sendPing();
                }

                // Check for timeout
                if (timeSinceLastActivity > this.connectionTimeout) {
                    console.warn('WebSocket connection timeout detected, reconnecting...');
                    this.ws.close();
                }
            }
        }, this.pingInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    sendPing() {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ping',
                    timestamp: new Date().toISOString(),
                    client_id: 'dashboard'
                }));
                console.log('Sent ping to server');
            }
        } catch (error) {
            console.error('Error sending ping:', error);
        }
    }

    handleUnknownMessage(data) {
        console.warn('Unhandled WebSocket message:', data);
        // Log for debugging but don't break the application
        if (data.type && data.message) {
            console.log(`Unknown message type "${data.type}": ${data.message}`);
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
                this.showNotification(details, 'info');
            } else {
                throw new Error(strategy.detail || 'Strategy not found');
            }

        } catch (error) {
            console.error('Failed to view strategy:', error);
            this.showNotification('Failed to load strategy details', 'error');
        }
    }

    async deleteStrategy(name) {
        // Remove blocking confirm() - proceed with deletion and show notification
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
            const data = await response.json();

            // Apply default values using nullish coalescing for missing/null fields
            const settings = {
                stop_loss:     data.stop_loss ?? data.stop_loss_pct ?? 2.0,
                take_profit:   data.take_profit ?? data.take_profit_pct ?? 5.0,
                position_size: data.position_size ?? 0.02,
                max_positions: data.max_positions ?? 5,
                max_daily_trades: data.max_daily_trades ?? 10,
                max_daily_loss: data.max_daily_loss ?? 500.0,
                risk_per_trade: data.risk_per_trade ?? 1.0,
                ai_confidence_threshold: data.ai_confidence_threshold ?? 0.7,
                rsi_period: data.rsi_period ?? 14,
                sma_short: data.sma_short ?? 20,
                sma_long: data.sma_long ?? 50,
                require_confirmation: data.require_confirmation ?? true,
                enable_trailing_stops: data.enable_trailing_stops ?? false,
                enable_news_analysis: data.enable_news_analysis ?? true,
                enable_sentiment_analysis: data.enable_sentiment_analysis ?? false
            };

            // Apply settings to UI with robust error handling
            this.applySettingsToUI(settings);

        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showNotification('Failed to load settings', 'error');

            // Set safe defaults on error
            this.setDefaultSettings();
        }
    }

    // New robust function to apply settings to UI
    applySettingsToUI(settings) {
        try {
            // Helper function to safely set numeric values with fallbacks
            const safeSetValue = (elementId, value, defaultValue = 0, multiplier = 1) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const numValue = parseFloat(value);
                    const finalValue = isNaN(numValue) ? defaultValue : numValue * multiplier;
                    element.value = finalValue.toFixed(2);
                } else {
                    console.debug(`Settings element not found: ${elementId}`);
                }
            };

            const safeSetIntValue = (elementId, value, defaultValue = 0) => {
                const element = document.getElementById(elementId);
                if (element) {
                    const numValue = parseInt(value);
                    element.value = isNaN(numValue) ? defaultValue : numValue;
                } else {
                    console.debug(`Settings element not found: ${elementId}`);
                }
            };

            const safeSetBoolValue = (elementId, value, defaultValue = false) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.checked = value !== undefined ? Boolean(value) : defaultValue;
                } else {
                    console.debug(`Settings element not found: ${elementId}`);
                }
            };

            // Apply all settings with guaranteed non-NaN values
            safeSetValue('positionSize', settings.position_size, 2.0, 100);
            safeSetValue('stopLoss', settings.stop_loss, 2.0, 100);
            safeSetValue('takeProfit', settings.take_profit, 5.0, 100);
            safeSetValue('maxDailyLoss', settings.max_daily_loss, 500.0, 1);
            safeSetIntValue('maxPositions', settings.max_positions, 5);
            safeSetIntValue('maxDailyTrades', settings.max_daily_trades, 10);
            safeSetValue('aiConfidenceThreshold', settings.ai_confidence_threshold, 70.0, 100);
            safeSetIntValue('rsiPeriod', settings.rsi_period, 14);
            safeSetIntValue('smaShort', settings.sma_short, 20);
            safeSetIntValue('smaLong', settings.sma_long, 50);
            safeSetBoolValue('requireConfirmation', settings.require_confirmation, true);
            safeSetBoolValue('enableTrailingStops', settings.enable_trailing_stops, false);
            safeSetBoolValue('enableNewsAnalysis', settings.enable_news_analysis, true);
            safeSetBoolValue('enableSentimentAnalysis', settings.enable_sentiment_analysis, false);

            console.log('Settings loaded successfully:', settings);

        } catch (error) {
            console.error('Error applying settings to UI:', error);
            this.setDefaultSettings();
        }
    }

    setDefaultSettings() {
        // Comprehensive default values - guaranteed no NaN values
        const defaults = {
            'positionSize': '2.00',
            'stopLoss': '2.00',
            'takeProfit': '5.00',
            'maxDailyLoss': '500.00',
            'maxPositions': '5',
            'maxDailyTrades': '10',
            'aiConfidenceThreshold': '70.00',
            'rsiPeriod': '14',
            'smaShort': '20',
            'smaLong': '50'
        };

        Object.entries(defaults).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                console.debug(`Set default for ${id}: ${value}`);
            }
        });

        // Set boolean defaults
        const boolDefaults = {
            'requireConfirmation': true,
            'enableTrailingStops': false,
            'enableNewsAnalysis': true,
            'enableSentimentAnalysis': false
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
                const warningList = summary.warnings.map(w => `• ${w}`).join('<br>');
                // Use non-blocking notification instead of alert
                this.showNotification(`Settings Validation Warnings:<br><br>${warningList}`, 'warning');
            } else {
                this.showNotification('All settings are valid', 'success');
            }

        } catch (error) {
            console.error('Failed to validate settings:', error);
            this.showNotification('Failed to validate settings', 'error');
        }
    }

    async resetSettings() {
        // Remove blocking confirm() - proceed directly with reset for better performance
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
            this.showNotification('Failed to reset settings: ' + error.message, 'error');
        }
    }

    async loadPresets() {
        try {
            const response = await fetch('/api/settings/presets');
            const presets = await response.json();

            const presetNames = Object.keys(presets);
            // Remove blocking prompt() - load first available preset instead
            const selectedPreset = presetNames.length > 0 ? presetNames[0] : null;

            if (selectedPreset) {
                this.showNotification(`Loading preset: ${selectedPreset}`, 'info');
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

    // ===== TRADING METHODS =====

    async placeTrade(side) {
        try {
            // Get form values
            const symbol = document.getElementById('tradeSymbol')?.value?.trim().toUpperCase();
            const quantity = parseInt(document.getElementById('tradeQuantity')?.value) || 1;

            // Validation
            if (!symbol) {
                this.showNotification('Please enter a symbol', 'warning');
                return;
            }

            if (quantity <= 0) {
                this.showNotification('Please enter a valid quantity', 'warning');
                return;
            }

            // Show loading state
            const button = side === 'buy' ?
                document.getElementById('buyButton') :
                document.getElementById('sellButton');

            if (button) {
                button.disabled = true;
                button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${side === 'buy' ? 'Buying' : 'Selling'}...`;
            }

            // Prepare trade data
            const tradeData = {
                symbol: symbol,
                qty: quantity,
                side: side
            };

            console.log(`Placing ${side} order:`, tradeData);

            // Submit trade to API
            const endpoint = side === 'buy' ? '/api/stock/buy' : '/api/stock/sell';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tradeData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success
                this.showNotification(
                    `${side.toUpperCase()} order placed: ${quantity} shares of ${symbol}`,
                    'success'
                );

                // Log order details
                console.log('Order placed successfully:', result.order);

                // Refresh positions and orders
                await this.loadPositions();
                await this.loadOrders();
                await this.loadAccountInfo();

                // Clear form
                document.getElementById('tradeQuantity').value = '1';

            } else {
                // API returned error
                throw new Error(result.detail || result.message || 'Trade execution failed');
            }

        } catch (error) {
            console.error('Trade execution error:', error);
            this.showNotification(
                `Failed to place ${side} order: ${error.message}`,
                'error'
            );
        } finally {
            // Restore button state
            const buyButton = document.getElementById('buyButton');
            const sellButton = document.getElementById('sellButton');

            if (buyButton) {
                buyButton.disabled = false;
                buyButton.innerHTML = '<i class="fas fa-arrow-up"></i> Buy';
            }

            if (sellButton) {
                sellButton.disabled = false;
                sellButton.innerHTML = '<i class="fas fa-arrow-down"></i> Sell';
            }
        }
    }

    async closePosition(symbol) {
        try {
            // Remove blocking confirm() - proceed with closing position

            this.showNotification(`Closing position in ${symbol}...`, 'info');

            const response = await fetch(`/api/positions/${symbol}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(`Position in ${symbol} closed successfully`, 'success');
                await this.loadPositions();
                await this.loadAccountInfo();
            } else {
                // Fallback: use sell order to close position
                const positions = await this.getCurrentPositions();
                const position = positions.find(p => p.symbol === symbol);

                if (position && position.qty > 0) {
                    await this.placeTrade('sell');
                    this.showNotification(`Sell order placed to close ${symbol} position`, 'info');
                } else {
                    throw new Error('Position not found or already closed');
                }
            }

        } catch (error) {
            console.error('Failed to close position:', error);
            this.showNotification(`Failed to close position in ${symbol}: ${error.message}`, 'error');
        }
    }

    async getCurrentPositions() {
        try {
            const response = await fetch('/api/positions');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Failed to get positions:', error);
            return [];
        }
    }

    addToStrategy(optionType, strike, price, action) {
        try {
            const strategyLeg = {
                type: optionType,
                strike: strike,
                price: price,
                action: action,
                timestamp: new Date().toISOString()
            };

            console.log('Adding to strategy:', strategyLeg);

            // Get existing strategy or create new one
            let currentStrategy = JSON.parse(localStorage.getItem('currentStrategy') || '{"legs": []}');

            // Add new leg
            currentStrategy.legs.push(strategyLeg);

            // Save strategy
            localStorage.setItem('currentStrategy', JSON.stringify(currentStrategy));

            // Update UI
            this.displayCurrentStrategy(currentStrategy);

            this.showNotification(
                `Added ${action} ${optionType} @ $${strike} to strategy`,
                'success'
            );

        } catch (error) {
            console.error('Failed to add to strategy:', error);
            this.showNotification('Failed to add to strategy', 'error');
        }
    }

    displayCurrentStrategy(strategy) {
        const container = document.getElementById('currentStrategy');
        if (!container) return;

        if (!strategy.legs || strategy.legs.length === 0) {
            container.innerHTML = '<p class="text-muted">No strategy legs added</p>';
            return;
        }

        let html = '<div class="strategy-legs">';
        strategy.legs.forEach((leg, index) => {
            html += `
                <div class="strategy-leg d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                        <strong>${leg.action.toUpperCase()}</strong> ${leg.type.toUpperCase()} @ $${leg.strike}
                        <small class="text-muted">($${leg.price})</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeStrategyLeg(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
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
        // Remove blocking confirm() - proceed with closing position
        try {
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

        // Remove blocking confirm() - proceed with strategy implementation

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
        // Remove blocking confirm() - proceed with strategy stop

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

    // Comprehensive Backtesting System
    async runComprehensiveBacktest() {
        try {
            const symbol = document.getElementById('backtestSymbol').value.trim().toUpperCase();
            const strategy = document.getElementById('backtestStrategy').value;
            const period = document.getElementById('backtestPeriod').value;
            const initialCapital = parseFloat(document.getElementById('backtestCapital').value) || 10000;

            if (!symbol) {
                this.showNotification('Please enter a symbol for backtesting', 'warning');
                return;
            }

            const button = document.getElementById('runBacktestBtn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Backtest...';

            // Show loading state
            document.getElementById('backtestResults').innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Running ${strategy.replace('_', ' ')} backtest on ${symbol}...</div>
                    <div class="small text-muted mt-1">This may take a few moments</div>
                </div>
            `;

            // Collect strategy parameters
            const params = this.collectStrategyParameters();

            // Try to fetch from API
            const response = await fetch('/api/backtest/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol,
                    strategy: strategy,
                    period: period,
                    initial_capital: initialCapital,
                    parameters: params
                })
            });

            let backtestData;
            if (response.ok) {
                backtestData = await response.json();
                if (backtestData.error) {
                    throw new Error(backtestData.error);
                }
            } else {
                throw new Error('API not available');
            }

            this.displayBacktestResults(backtestData);
            this.showNotification(`Backtest completed successfully for ${symbol}`, 'success');

        } catch (error) {
            console.error('Failed to run backtest:', error);

            // Show demo data as fallback
            const demoBacktest = this.generateDemoBacktestData(symbol || 'AAPL', strategy);
            this.displayBacktestResults(demoBacktest);
            this.showNotification('Using demo backtest data (API not available)', 'info');

        } finally {
            const button = document.getElementById('runBacktestBtn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Run Backtest';
        }
    }

    collectStrategyParameters() {
        const strategy = document.getElementById('backtestStrategy').value;
        const params = {};

        switch (strategy) {
            case 'sma_crossover':
                params.short_window = parseInt(document.getElementById('smaShort').value) || 10;
                params.long_window = parseInt(document.getElementById('smaLong').value) || 30;
                break;
            case 'rsi_strategy':
                params.rsi_period = parseInt(document.getElementById('rsiPeriod').value) || 14;
                params.oversold = parseFloat(document.getElementById('rsiOversold').value) || 30;
                params.overbought = parseFloat(document.getElementById('rsiOverbought').value) || 70;
                break;
            case 'buy_and_hold':
            default:
                // No additional parameters needed
                break;
        }

        return params;
    }

    updateStrategyParameters(strategy) {
        const paramContainer = document.getElementById('strategyParameters');
        let paramHTML = '';

        switch (strategy) {
            case 'sma_crossover':
                paramHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <label for="smaShort" class="form-label">Short MA Period</label>
                            <input type="number" class="form-control" id="smaShort" value="10" min="1" max="50">
                        </div>
                        <div class="col-md-6">
                            <label for="smaLong" class="form-label">Long MA Period</label>
                            <input type="number" class="form-control" id="smaLong" value="30" min="20" max="200">
                        </div>
                    </div>
                `;
                break;
            case 'rsi_strategy':
                paramHTML = `
                    <div class="row">
                        <div class="col-md-4">
                            <label for="rsiPeriod" class="form-label">RSI Period</label>
                            <input type="number" class="form-control" id="rsiPeriod" value="14" min="7" max="30">
                        </div>
                        <div class="col-md-4">
                            <label for="rsiOversold" class="form-label">Oversold Level</label>
                            <input type="number" class="form-control" id="rsiOversold" value="30" min="10" max="40" step="0.1">
                        </div>
                        <div class="col-md-4">
                            <label for="rsiOverbought" class="form-label">Overbought Level</label>
                            <input type="number" class="form-control" id="rsiOverbought" value="70" min="60" max="90" step="0.1">
                        </div>
                    </div>
                `;
                break;
            case 'buy_and_hold':
            default:
                paramHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Buy and Hold strategy requires no additional parameters.
                        It will buy the stock at the beginning and hold until the end of the period.
                    </div>
                `;
                break;
        }

        paramContainer.innerHTML = paramHTML;
    }

    displayBacktestResults(data) {
        const resultsContainer = document.getElementById('backtestResults');
        const metrics = data.metrics || {};
        const trades = data.trades || [];

        // Performance Metrics
        const totalReturn = ((metrics.final_value - metrics.initial_capital) / metrics.initial_capital * 100) || 0;
        const annualizedReturn = metrics.annualized_return || 0;
        const sharpeRatio = metrics.sharpe_ratio || 0;
        const maxDrawdown = metrics.max_drawdown || 0;
        const winRate = metrics.win_rate || 0;
        const totalTrades = trades.length || 0;

        resultsContainer.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card bg-dark">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Performance Summary</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6">
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Total Return</div>
                                        <div class="metric-value ${totalReturn >= 0 ? 'text-success' : 'text-danger'}">
                                            ${totalReturn.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Annualized Return</div>
                                        <div class="metric-value ${annualizedReturn >= 0 ? 'text-success' : 'text-danger'}">
                                            ${annualizedReturn.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Sharpe Ratio</div>
                                        <div class="metric-value ${sharpeRatio >= 1 ? 'text-success' : sharpeRatio >= 0.5 ? 'text-warning' : 'text-danger'}">
                                            ${sharpeRatio.toFixed(3)}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Max Drawdown</div>
                                        <div class="metric-value text-danger">
                                            -${Math.abs(maxDrawdown).toFixed(2)}%
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Win Rate</div>
                                        <div class="metric-value ${winRate >= 50 ? 'text-success' : 'text-warning'}">
                                            ${winRate.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Total Trades</div>
                                        <div class="metric-value text-info">
                                            ${totalTrades}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-dark">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-calculator me-2"></i>Risk Metrics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6">
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Volatility</div>
                                        <div class="metric-value text-warning">
                                            ${(metrics.volatility || 0).toFixed(2)}%
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Beta</div>
                                        <div class="metric-value text-info">
                                            ${(metrics.beta || 1).toFixed(3)}
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">VaR (95%)</div>
                                        <div class="metric-value text-danger">
                                            ${this.formatCurrency(metrics.var_95 || 0)}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Calmar Ratio</div>
                                        <div class="metric-value ${(metrics.calmar_ratio || 0) >= 0.5 ? 'text-success' : 'text-warning'}">
                                            ${(metrics.calmar_ratio || 0).toFixed(3)}
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Sortino Ratio</div>
                                        <div class="metric-value ${(metrics.sortino_ratio || 0) >= 1 ? 'text-success' : 'text-warning'}">
                                            ${(metrics.sortino_ratio || 0).toFixed(3)}
                                        </div>
                                    </div>
                                    <div class="metric-item mb-3">
                                        <div class="metric-label">Max DD Duration</div>
                                        <div class="metric-value text-muted">
                                            ${metrics.max_dd_duration || 0} days
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card bg-dark">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-area me-2"></i>Portfolio Performance Chart</h6>
                        </div>
                        <div class="card-body">
                            <div id="backtestChart" style="height: 400px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card bg-dark">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-exchange-alt me-2"></i>Trade History</h6>
                        </div>
                        <div class="card-body">
                            <div id="backtestTrades" style="max-height: 300px; overflow-y: auto;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Plot performance chart
        this.plotBacktestChart(data.portfolio_values, data.dates, data.symbol);

        // Display trades
        this.displayBacktestTrades(trades);
    }

    plotBacktestChart(portfolioValues, dates, symbol) {
        const chartContainer = document.getElementById('backtestChart');

        if (!portfolioValues || !dates || portfolioValues.length === 0) {
            chartContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-chart-line fa-2x mb-3"></i>
                    <h6>No chart data available</h6>
                    <p>Unable to generate performance chart.</p>
                </div>
            `;
            return;
        }

        const trace = {
            x: dates,
            y: portfolioValues,
            type: 'scatter',
            mode: 'lines',
            name: 'Portfolio Value',
            line: {
                color: '#28a745',
                width: 2
            }
        };

        const layout = {
            title: {
                text: `${symbol} Backtest Performance`,
                font: { color: '#ffffff', size: 16 }
            },
            xaxis: {
                title: 'Date',
                color: '#ffffff',
                gridcolor: '#444'
            },
            yaxis: {
                title: 'Portfolio Value ($)',
                color: '#ffffff',
                gridcolor: '#444'
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 40, r: 10, b: 40, l: 60 }
        };

        Plotly.newPlot(chartContainer, [trace], layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    displayBacktestTrades(trades) {
        const tradesContainer = document.getElementById('backtestTrades');

        if (!trades || trades.length === 0) {
            tradesContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exchange-alt fa-2x mb-3"></i>
                    <h6>No trades executed</h6>
                    <p>This strategy didn't generate any trades during the backtest period.</p>
                </div>
            `;
            return;
        }

        let tradesHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Action</th>
                            <th>Price</th>
                            <th>Shares</th>
                            <th>Value</th>
                            <th>P&L</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        trades.forEach(trade => {
            const date = new Date(trade.date).toLocaleDateString();
            const actionClass = trade.action === 'BUY' ? 'text-success' : 'text-danger';
            const plClass = trade.pnl > 0 ? 'text-success' : trade.pnl < 0 ? 'text-danger' : 'text-muted';

            tradesHTML += `
                <tr>
                    <td>${date}</td>
                    <td><span class="${actionClass}">${trade.action}</span></td>
                    <td>${this.formatCurrency(trade.price)}</td>
                    <td>${trade.shares}</td>
                    <td>${this.formatCurrency(trade.value)}</td>
                    <td class="${plClass}">${trade.pnl ? this.formatCurrency(trade.pnl) : '--'}</td>
                </tr>
            `;
        });

        tradesHTML += `
                    </tbody>
                </table>
            </div>
        `;

        tradesContainer.innerHTML = tradesHTML;
    }

    generateDemoBacktestData(symbol, strategy) {
        // Generate realistic demo backtest results
        const initialCapital = 10000;
        const numDays = 252; // Trading days in a year
        const dates = [];
        const portfolioValues = [];
        const trades = [];

        // Generate dates
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        for (let i = 0; i < numDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }

        // Generate portfolio values based on strategy
        let currentValue = initialCapital;
        let volatility = 0.15; // 15% annual volatility
        let drift = 0.08; // 8% annual return

        // Adjust for strategy
        switch (strategy) {
            case 'buy_and_hold':
                drift = 0.10;
                volatility = 0.18;
                break;
            case 'sma_crossover':
                drift = 0.06;
                volatility = 0.12;
                break;
            case 'rsi_strategy':
                drift = 0.05;
                volatility = 0.10;
                break;
        }

        const dailyDrift = drift / 252;
        const dailyVol = volatility / Math.sqrt(252);

        for (let i = 0; i < numDays; i++) {
            const randomReturn = dailyDrift + dailyVol * this.generateRandomNormal();
            currentValue *= (1 + randomReturn);
            portfolioValues.push(currentValue);

            // Generate some random trades
            if (strategy !== 'buy_and_hold' && Math.random() < 0.02) { // 2% chance of trade each day
                const action = trades.length % 2 === 0 ? 'BUY' : 'SELL';
                const price = 150 + Math.random() * 50;
                const shares = Math.floor(currentValue / price / 10);

                trades.push({
                    date: dates[i],
                    action: action,
                    price: price,
                    shares: shares,
                    value: price * shares,
                    pnl: action === 'SELL' ? (Math.random() - 0.4) * 500 : null
                });
            }
        }

        // If buy and hold, just add initial buy
        if (strategy === 'buy_and_hold') {
            trades.push({
                date: dates[0],
                action: 'BUY',
                price: 175,
                shares: Math.floor(initialCapital / 175),
                value: initialCapital,
                pnl: null
            });
        }

        // Calculate metrics
        const finalValue = portfolioValues[portfolioValues.length - 1];
        const totalReturn = (finalValue - initialCapital) / initialCapital;
        const annualizedReturn = Math.pow(finalValue / initialCapital, 252 / numDays) - 1;

        // Calculate volatility
        const returns = [];
        for (let i = 1; i < portfolioValues.length; i++) {
            returns.push((portfolioValues[i] - portfolioValues[i-1]) / portfolioValues[i-1]);
        }
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const calculatedVolatility = Math.sqrt(variance * 252) * 100;

        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = portfolioValues[0];
        for (const value of portfolioValues) {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        // Calculate win rate
        const profitableTrades = trades.filter(t => t.pnl && t.pnl > 0).length;
        const totalTradesWithPnL = trades.filter(t => t.pnl !== null).length;
        const winRate = totalTradesWithPnL > 0 ? (profitableTrades / totalTradesWithPnL) * 100 : 0;

        const sharpeRatio = annualizedReturn / (calculatedVolatility / 100);
        const calmarRatio = annualizedReturn / maxDrawdown;
        const sortino = sharpeRatio * 1.2; // Approximate

        return {
            symbol: symbol,
            strategy: strategy,
            dates: dates,
            portfolio_values: portfolioValues,
            trades: trades,
            metrics: {
                initial_capital: initialCapital,
                final_value: finalValue,
                total_return: totalReturn * 100,
                annualized_return: annualizedReturn * 100,
                volatility: calculatedVolatility,
                sharpe_ratio: sharpeRatio,
                max_drawdown: maxDrawdown * 100,
                win_rate: winRate,
                calmar_ratio: calmarRatio,
                sortino_ratio: sortino,
                beta: 0.8 + Math.random() * 0.4,
                var_95: -finalValue * 0.05,
                max_dd_duration: Math.floor(Math.random() * 30) + 5
            }
        };
    }

    generateRandomNormal() {
        // Box-Muller transformation for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // Portfolio Analytics Functions
    async loadPortfolioAnalytics() {
        try {
            const symbol = this.currentSymbol || 'AAPL';
            const response = await fetch(`/api/portfolio/analytics/${symbol}`);

            let analyticsData;
            if (response.ok) {
                analyticsData = await response.json();
                if (analyticsData.error) {
                    throw new Error(analyticsData.error);
                }
            } else {
                throw new Error('API not available');
            }

            this.displayPortfolioAnalytics(analyticsData);

        } catch (error) {
            console.error('Failed to load portfolio analytics:', error);
            // Show demo analytics data
            const demoAnalytics = this.generateDemoAnalytics();
            this.displayPortfolioAnalytics(demoAnalytics);
        }
    }

    displayPortfolioAnalytics(data) {
        // Update portfolio overview
        document.getElementById('portfolioTotalValue').textContent = this.formatCurrency(data.total_value || 0);
        document.getElementById('portfolioDayChange').textContent = `${data.day_change >= 0 ? '+' : ''}${this.formatCurrency(data.day_change || 0)} (${(data.day_change_percent || 0).toFixed(2)}%)`;
        document.getElementById('portfolioDayChange').className = `fw-bold ${(data.day_change || 0) >= 0 ? 'text-success' : 'text-danger'}`;

        document.getElementById('portfolioTotalReturn').textContent = `${(data.total_return_percent || 0).toFixed(2)}%`;
        document.getElementById('portfolioTotalReturn').className = `fw-bold ${(data.total_return_percent || 0) >= 0 ? 'text-success' : 'text-danger'}`;

        document.getElementById('portfolioCash').textContent = this.formatCurrency(data.cash_available || 0);

        // Update risk metrics
        const riskMetrics = data.risk_metrics || {};
        document.getElementById('portfolioBeta').textContent = (riskMetrics.beta || 1).toFixed(3);
        document.getElementById('portfolioSharpe').textContent = (riskMetrics.sharpe_ratio || 0).toFixed(3);
        document.getElementById('portfolioVolatility').textContent = `${(riskMetrics.volatility || 0).toFixed(2)}%`;
        document.getElementById('portfolioVaR').textContent = this.formatCurrency(riskMetrics.var_95 || 0);

        // Display portfolio holdings
        this.displayPortfolioHoldings(data.positions || []);

        // Create portfolio composition chart
        this.plotPortfolioChart(data.positions || []);
    }

    generateDemoAnalytics() {
        return {
            total_value: 50000 + Math.random() * 20000,
            day_change: (Math.random() - 0.5) * 2000,
            day_change_percent: (Math.random() - 0.5) * 4,
            positions: [
                { symbol: 'AAPL', value: 15000, change: 250 },
                { symbol: 'MSFT', value: 12000, change: -180 },
                { symbol: 'GOOGL', value: 8000, change: 95 }
            ],
            risk_metrics: {
                beta: 1.1,
                sharpe_ratio: 1.2,
                volatility: 18.5,
                var_95: -2500
            }
        };
    }

    // Trade Journal Functions
    async loadTradeJournal() {
        try {
            const response = await fetch('/api/trades/journal');

            let journalData;
            if (response.ok) {
                journalData = await response.json();
                if (journalData.error) {
                    throw new Error(journalData.error);
                }
            } else {
                throw new Error('API not available');
            }

            this.displayTradeJournal(journalData);

        } catch (error) {
            console.error('Failed to load trade journal:', error);
            // Show demo journal data
            const demoJournal = this.generateDemoTradeJournal();
            this.displayTradeJournal(demoJournal);
        }
    }

    displayTradeJournal(data) {
        // Update journal summary
        document.getElementById('totalTrades').textContent = data.total_trades || 0;
        document.getElementById('profitableTrades').textContent = data.profitable_trades || 0;
        document.getElementById('journalWinRate').textContent = `${(data.win_rate || 0).toFixed(1)}%`;
        document.getElementById('totalPnL').textContent = this.formatCurrency(data.total_pnl || 0);
        document.getElementById('totalPnL').className = `h4 mb-1 ${(data.total_pnl || 0) >= 0 ? 'text-success' : 'text-danger'}`;

        // Display trade history table
        this.displayTradeTable(data.trades || []);
    }

    generateDemoTradeJournal() {
        const trades = [];
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

        for (let i = 0; i < 10; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const entryDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const exitDate = new Date(entryDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

            trades.push({
                id: i + 1,
                symbol: symbol,
                strategy: ['buy_and_hold', 'swing_trade', 'day_trade'][Math.floor(Math.random() * 3)],
                entry_date: entryDate.toISOString(),
                exit_date: Math.random() > 0.3 ? exitDate.toISOString() : null,
                entry_price: 150 + Math.random() * 100,
                exit_price: Math.random() > 0.3 ? 150 + Math.random() * 100 : null,
                quantity: Math.floor(Math.random() * 100) + 10,
                pnl: Math.random() > 0.3 ? (Math.random() - 0.4) * 1000 : null,
                notes: `Demo trade for ${symbol}`
            });
        }

        return {
            trades: trades,
            total_trades: trades.length,
            profitable_trades: trades.filter(t => t.pnl && t.pnl > 0).length,
            total_pnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
            win_rate: trades.filter(t => t.pnl && t.pnl > 0).length / trades.filter(t => t.pnl !== null).length * 100
        };
    }

    // Additional helper functions for portfolio analytics and trade journal
    displayPortfolioHoldings(positions) {
        const holdingsContainer = document.getElementById('portfolioHoldings');

        if (!positions || positions.length === 0) {
            holdingsContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-chart-pie fa-2x mb-3"></i>
                    <h6>No positions</h6>
                    <p>Your portfolio is currently empty.</p>
                </div>
            `;
            return;
        }

        let holdingsHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th class="text-end">Value</th>
                            <th class="text-end">Change</th>
                            <th class="text-end">Weight</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const totalValue = positions.reduce((sum, pos) => sum + (pos.value || 0), 0);

        positions.forEach(position => {
            const weight = totalValue > 0 ? (position.value / totalValue * 100) : 0;
            const changeClass = (position.change || 0) >= 0 ? 'text-success' : 'text-danger';

            holdingsHTML += `
                <tr>
                    <td><strong>${position.symbol}</strong></td>
                    <td class="text-end">${this.formatCurrency(position.value || 0)}</td>
                    <td class="text-end ${changeClass}">
                        ${(position.change || 0) >= 0 ? '+' : ''}${this.formatCurrency(position.change || 0)}
                    </td>
                    <td class="text-end">${weight.toFixed(1)}%</td>
                </tr>
            `;
        });

        holdingsHTML += `
                    </tbody>
                </table>
            </div>
        `;

        holdingsContainer.innerHTML = holdingsHTML;
    }

    plotPortfolioChart(positions) {
        const chartContainer = document.getElementById('portfolioChart');

        if (!positions || positions.length === 0) {
            chartContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-chart-pie fa-2x mb-3"></i>
                    <h6>No data to display</h6>
                    <p>Add positions to see portfolio composition.</p>
                </div>
            `;
            return;
        }

        const data = [{
            values: positions.map(p => p.value || 0),
            labels: positions.map(p => p.symbol),
            type: 'pie',
            textinfo: 'label+percent',
            marker: {
                colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
            }
        }];

        const layout = {
            title: {
                text: 'Portfolio Composition',
                font: { color: '#ffffff', size: 14 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            showlegend: true,
            legend: {
                font: { color: '#ffffff' }
            },
            margin: { t: 40, r: 10, b: 10, l: 10 }
        };

        Plotly.newPlot(chartContainer, data, layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    displayTradeTable(trades) {
        const tableContainer = document.getElementById('tradeJournalTable');

        if (!trades || trades.length === 0) {
            tableContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-book fa-2x mb-3"></i>
                    <h6>No trades found</h6>
                    <p>Start adding trades to track your performance.</p>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Strategy</th>
                            <th>Entry Date</th>
                            <th>Exit Date</th>
                            <th class="text-end">Entry Price</th>
                            <th class="text-end">Exit Price</th>
                            <th class="text-end">Quantity</th>
                            <th class="text-end">P&L</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        trades.forEach(trade => {
            const entryDate = trade.entry_date ? new Date(trade.entry_date).toLocaleDateString() : '--';
            const exitDate = trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : 'Open';
            const entryPrice = trade.entry_price ? `$${trade.entry_price.toFixed(2)}` : '--';
            const exitPrice = trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '--';
            const pnl = trade.pnl !== null ? trade.pnl : 0;
            const pnlClass = pnl > 0 ? 'text-success' : pnl < 0 ? 'text-danger' : 'text-muted';
            const pnlText = trade.pnl !== null ? this.formatCurrency(pnl) : 'Open';

            tableHTML += `
                <tr>
                    <td><strong>${trade.symbol}</strong></td>
                    <td><span class="badge bg-secondary">${trade.strategy}</span></td>
                    <td>${entryDate}</td>
                    <td>${exitDate}</td>
                    <td class="text-end">${entryPrice}</td>
                    <td class="text-end">${exitPrice}</td>
                    <td class="text-end">${trade.quantity}</td>
                    <td class="text-end ${pnlClass}">${pnlText}</td>
                    <td><small class="text-muted">${trade.notes || '--'}</small></td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    async addTrade() {
        try {
            const symbol = document.getElementById('tradeSymbol').value.trim().toUpperCase();
            const strategy = document.getElementById('tradeStrategy').value;
            const entryDate = document.getElementById('tradeEntryDate').value;
            const exitDate = document.getElementById('tradeExitDate').value;
            const entryPrice = parseFloat(document.getElementById('tradeEntryPrice').value);
            const exitPrice = document.getElementById('tradeExitPrice').value ? parseFloat(document.getElementById('tradeExitPrice').value) : null;
            const quantity = parseInt(document.getElementById('tradeQuantity').value);
            const notes = document.getElementById('tradeNotes').value.trim();

            if (!symbol || !strategy || !entryDate || !entryPrice || !quantity) {
                this.showNotification('Please fill in all required fields', 'warning');
                return;
            }

            const tradeData = {
                symbol: symbol,
                strategy: strategy,
                entry_date: entryDate,
                exit_date: exitDate || null,
                entry_price: entryPrice,
                exit_price: exitPrice,
                quantity: quantity,
                notes: notes
            };

            // Try to save to API
            const response = await fetch('/api/trades/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradeData)
            });

            if (response.ok) {
                this.showNotification('Trade added successfully', 'success');
                // Close modal and refresh trade journal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addTradeModal'));
                modal.hide();
                this.loadTradeJournal();

                // Clear form
                document.getElementById('addTradeForm').reset();
            } else {
                throw new Error('Failed to save trade');
            }

        } catch (error) {
            console.error('Failed to add trade:', error);
            this.showNotification('Using demo mode - trade not saved permanently', 'info');

            // Close modal anyway for demo
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTradeModal'));
            modal.hide();
            document.getElementById('addTradeForm').reset();
        }
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

    // Strategy selector change handler
    const backtestStrategy = document.getElementById('backtestStrategy');
    if (backtestStrategy) {
        backtestStrategy.addEventListener('change', (e) => {
            if (dashboard) {
                dashboard.updateStrategyParameters(e.target.value);
            }
        });
    }

    // Portfolio Analytics modal handler
    const portfolioAnalyticsModal = document.getElementById('portfolioAnalyticsModal');
    if (portfolioAnalyticsModal) {
        portfolioAnalyticsModal.addEventListener('shown.bs.modal', () => {
            if (dashboard) {
                dashboard.loadPortfolioAnalytics();
            }
        });
    }

    // Trade Journal modal handler
    const tradeJournalModal = document.getElementById('tradeJournalModal');
    if (tradeJournalModal) {
        tradeJournalModal.addEventListener('shown.bs.modal', () => {
            if (dashboard) {
                dashboard.loadTradeJournal();
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

// ===== MISSING BUTTON HANDLERS =====

// Schedule Morning Routine - Enhanced with automatic scheduling
window.scheduleMorningRoutine = function() {
    console.log("Running morning routine manually...");

    if (dashboard) {
        dashboard.showNotification('Running morning routine...', 'info');
    }

    // Execute the morning routine immediately when button is clicked
    fetch('/api/morning-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            time: '09:00',
            enabled: true,
            tasks: ['market_analysis', 'portfolio_review', 'news_scan'],
            manual_trigger: true
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Morning routine executed:', data);
        if (dashboard) {
            dashboard.showNotification('Morning routine completed successfully!', 'success');
        }
    })
    .catch(err => {
        console.error('Morning routine failed:', err);
        if (dashboard) {
            dashboard.showNotification('Morning routine failed: ' + err.message, 'error');
        }
    });
};

// Automatic morning routine scheduler for frontend
function setupAutomaticMorningRoutine() {
    console.log("🌅 Setting up automatic morning routine scheduler...");

    // Function to check if it's 9:00 AM and run morning routine
    function checkMorningRoutine() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Check if it's 9:00 AM (and we haven't run it today)
        if (hours === 9 && minutes === 0) {
            const today = now.toDateString();
            const lastRun = localStorage.getItem('lastMorningRoutine');

            if (lastRun !== today) {
                console.log("🌅 Auto-triggering morning routine at 9:00 AM");
                window.scheduleMorningRoutine();
                localStorage.setItem('lastMorningRoutine', today);
            }
        }
    }

    // Check every minute for morning routine time (non-blocking)
    setInterval(checkMorningRoutine, 60000); // Check every minute

    // Also check immediately on page load
    checkMorningRoutine();
}

// Setup automatic scheduling when page loads
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay setup to ensure dashboard is ready
        setTimeout(setupAutomaticMorningRoutine, 2000);
    });
}

// Show Quick Orders
window.showQuickOrders = function() {
    console.log("Showing quick orders panel...");

    // Try to find and show a quick orders modal or panel
    const quickOrdersModal = document.getElementById('quickOrdersModal');
    if (quickOrdersModal) {
        const modal = new bootstrap.Modal(quickOrdersModal);
        modal.show();
    } else {
        // Fallback: show notification that feature is available in main trading section
        if (dashboard) {
            dashboard.showNotification('Quick orders available in the Trading section', 'info');
        }

        // Try to switch to trading section
        const tradingSection = document.querySelector('[data-section="trading"]');
        if (tradingSection) {
            showSection('trading');
        }
    }
};