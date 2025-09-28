/**
 * AI Trading Suite - New Dashboard JavaScript
 * Professional trading interface with green/white/black theme
 */

class TradingDashboard {
    constructor() {
        this.currentSymbol = 'AAPL';
        this.currentPrice = 0;
        this.websocket = null;
        this.updateInterval = null;
        this.chartInstance = null;
        this.isLiveTrading = false;
        this.positions = [];
        this.watchlist = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

        this.init();
    }

    // ===== INITIALIZATION =====
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeChart();
        this.setupWebSocket();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Symbol search
        const symbolSearch = document.getElementById('symbolSearch');
        if (symbolSearch) {
            symbolSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.changeSymbol(e.target.value.toUpperCase());
                }
            });

            // Add autocomplete
            symbolSearch.addEventListener('input', this.debounce((e) => {
                this.searchSymbols(e.target.value);
            }, 300));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '/':
                        e.preventDefault();
                        document.getElementById('symbolSearch').focus();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.quickBuy();
                        break;
                    case 's':
                        e.preventDefault();
                        this.quickSell();
                        break;
                }
            }
            if (e.key === ' ' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.toggleTradingMode();
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.chartInstance) {
                Plotly.Plots.resize('chartContainer');
            }
        });
    }

    // ===== DATA LOADING =====
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadPortfolioSummary(),
                this.loadPositions(),
                this.loadQuote(this.currentSymbol),
                this.loadTechnicalIndicators(this.currentSymbol),
                this.loadAIInsights(this.currentSymbol),
                this.loadRecentNews(this.currentSymbol)
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Failed to load some data. Using demo data.', 'warning');
            this.loadDemoData();
        }
    }

    async loadPortfolioSummary() {
        try {
            const response = await fetch('/api/account');
            if (response.ok) {
                const data = await response.json();
                this.updatePortfolioSummary(data);
            } else {
                throw new Error('Failed to load portfolio');
            }
        } catch (error) {
            console.error('Portfolio load error:', error);
            this.updatePortfolioSummary(this.getDemoPortfolio());
        }
    }

    async loadPositions() {
        try {
            const response = await fetch('/api/positions');
            if (response.ok) {
                const data = await response.json();
                this.positions = data;
                this.updatePositionsTable(data);
            } else {
                throw new Error('Failed to load positions');
            }
        } catch (error) {
            console.error('Positions load error:', error);
            this.positions = this.getDemoPositions();
            this.updatePositionsTable(this.positions);
        }
    }

    async loadQuote(symbol) {
        try {
            const response = await fetch(`/api/quote/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                this.updateQuoteDisplay(data);
                this.currentPrice = data.price;
            } else {
                throw new Error('Failed to load quote');
            }
        } catch (error) {
            console.error('Quote load error:', error);
            this.updateQuoteDisplay(this.getDemoQuote(symbol));
        }
    }

    async loadChart(symbol, timeframe = '1D') {
        try {
            const response = await fetch(`/api/chart/${symbol}?timeframe=${timeframe}`);
            if (response.ok) {
                const data = await response.json();
                this.updateChart(data);
            } else {
                throw new Error('Failed to load chart');
            }
        } catch (error) {
            console.error('Chart load error:', error);
            this.updateChart(this.getDemoChartData(symbol));
        }
    }

    async loadTechnicalIndicators(symbol) {
        try {
            const response = await fetch(`/api/indicators/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                this.updateTechnicalIndicators(data);
            } else {
                throw new Error('Failed to load indicators');
            }
        } catch (error) {
            console.error('Indicators load error:', error);
            this.updateTechnicalIndicators(this.getDemoIndicators());
        }
    }

    async loadAIInsights(symbol) {
        try {
            const response = await fetch(`/api/ai/analysis/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                this.updateAIInsights(data);
            } else {
                throw new Error('Failed to load AI insights');
            }
        } catch (error) {
            console.error('AI insights load error:', error);
            this.updateAIInsights(this.getDemoAIInsights());
        }
    }

    async loadRecentNews(symbol) {
        try {
            const response = await fetch(`/api/news/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                this.updateRecentNews(data);
            } else {
                throw new Error('Failed to load news');
            }
        } catch (error) {
            console.error('News load error:', error);
            this.updateRecentNews(this.getDemoNews());
        }
    }

    // ===== UI UPDATES =====
    updatePortfolioSummary(data) {
        const portfolioValue = document.getElementById('portfolioValue');
        const dayChange = document.getElementById('dayChange');
        const totalReturn = document.getElementById('totalReturn');
        const activePositions = document.getElementById('activePositions');

        if (portfolioValue) portfolioValue.textContent = this.formatCurrency(data.portfolio_value || 0);
        if (dayChange) {
            const change = data.day_change || 0;
            dayChange.textContent = `${change >= 0 ? '+' : ''}${this.formatCurrency(change)}`;
            dayChange.className = `metric-value ${change >= 0 ? 'metric-positive' : 'metric-negative'}`;
        }
        if (totalReturn) {
            const returnPct = data.total_return_percent || 0;
            totalReturn.textContent = `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%`;
            totalReturn.className = `metric-value ${returnPct >= 0 ? 'metric-positive' : 'metric-negative'}`;
        }
        if (activePositions) activePositions.textContent = data.position_count || 0;
    }

    updateQuoteDisplay(data) {
        const symbolElement = document.getElementById('currentSymbol');
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('currentChange');

        if (symbolElement) symbolElement.textContent = data.symbol || this.currentSymbol;
        if (priceElement) priceElement.textContent = this.formatCurrency(data.price || 0);
        if (changeElement) {
            const change = data.change_percent || 0;
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.className = `symbol-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    updatePositionsTable(positions) {
        const tableContainer = document.getElementById('positionsTable');
        if (!tableContainer) return;

        if (!positions || positions.length === 0) {
            tableContainer.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-chart-pie fa-2x mb-2"></i>
                    <div>No active positions</div>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th class="text-end">Qty</th>
                            <th class="text-end">Avg Cost</th>
                            <th class="text-end">Market Value</th>
                            <th class="text-end">P&L</th>
                            <th class="text-end">%</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        positions.forEach(position => {
            const pnl = position.unrealized_pl || 0;
            const pnlPercent = position.unrealized_pl_percent || 0;
            const pnlClass = pnl >= 0 ? 'text-success' : 'text-danger';

            tableHTML += `
                <tr>
                    <td>
                        <strong>${position.symbol}</strong>
                    </td>
                    <td class="text-end font-mono">${position.qty}</td>
                    <td class="text-end font-mono">${this.formatCurrency(position.avg_entry_price || 0)}</td>
                    <td class="text-end font-mono">${this.formatCurrency(position.market_value || 0)}</td>
                    <td class="text-end font-mono ${pnlClass}">
                        ${pnl >= 0 ? '+' : ''}${this.formatCurrency(pnl)}
                    </td>
                    <td class="text-end font-mono ${pnlClass}">
                        ${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%
                    </td>
                    <td class="text-end">
                        <button class="btn-trading btn-outline btn-sm" onclick="tradingDashboard.managePosition('${position.symbol}')">
                            <i class="fas fa-cog"></i>
                        </button>
                    </td>
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

    updateTechnicalIndicators(data) {
        const container = document.getElementById('technicalIndicators');
        if (!container) return;

        const indicators = data.indicators || this.getDemoIndicators().indicators;

        container.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <span>RSI (14):</span>
                <span class="font-mono ${this.getRSIClass(indicators.rsi)}">${indicators.rsi.toFixed(1)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span>MACD:</span>
                <span class="font-mono ${indicators.macd >= 0 ? 'text-success' : 'text-danger'}">${indicators.macd >= 0 ? '+' : ''}${indicators.macd.toFixed(3)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span>SMA 50:</span>
                <span class="font-mono">${this.formatCurrency(indicators.sma_50)}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>SMA 200:</span>
                <span class="font-mono">${this.formatCurrency(indicators.sma_200)}</span>
            </div>
        `;
    }

    updateAIInsights(data) {
        const container = document.getElementById('aiInsights');
        if (!container) return;

        const recommendation = data.recommendation || 'HOLD';
        const confidence = data.confidence || 50;
        const reasoning = data.reasoning || 'No analysis available.';

        const recClass = recommendation === 'BUY' ? 'text-success' :
                        recommendation === 'SELL' ? 'text-danger' : 'text-warning';

        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="font-weight-medium">Recommendation:</span>
                <span class="${recClass} font-weight-bold">${recommendation}</span>
            </div>
            <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="font-weight-medium">Confidence:</span>
                <span class="${this.getConfidenceClass(confidence)}">${confidence}%</span>
            </div>
            <div class="text-muted font-size-sm">
                ${reasoning}
            </div>
        `;
    }

    updateRecentNews(data) {
        const container = document.getElementById('recentNews');
        if (!container) return;

        const articles = data.articles || data || [];

        if (articles.length === 0) {
            container.innerHTML = '<div class="text-muted">No recent news</div>';
            return;
        }

        let newsHTML = '';
        articles.slice(0, 3).forEach((article, index) => {
            const timeAgo = this.getTimeAgo(new Date(article.published_at || article.date));
            const borderClass = index < articles.length - 1 ? 'border-bottom' : '';

            newsHTML += `
                <div class="mb-2 pb-2 ${borderClass}">
                    <div class="font-weight-medium" style="font-size: 0.85rem;">${article.title}</div>
                    <div class="text-muted font-size-sm">${timeAgo}</div>
                </div>
            `;
        });

        container.innerHTML = newsHTML;
    }

    // ===== CHART FUNCTIONALITY =====
    initializeChart() {
        this.loadChart(this.currentSymbol);
    }

    updateChart(data) {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        const trace = {
            x: data.dates || data.timestamp,
            y: data.prices || data.close,
            type: 'scatter',
            mode: 'lines',
            name: this.currentSymbol,
            line: {
                color: '#00C851',
                width: 2
            }
        };

        const layout = {
            title: {
                text: `${this.currentSymbol} Price Chart`,
                font: { size: 16 }
            },
            xaxis: {
                title: 'Time',
                gridcolor: '#E0E0E0'
            },
            yaxis: {
                title: 'Price ($)',
                gridcolor: '#E0E0E0'
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            margin: { t: 40, r: 10, b: 40, l: 60 },
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, {
            responsive: true,
            displayModeBar: false
        });

        this.chartInstance = container;
    }

    // ===== TRADING FUNCTIONS =====
    async quickBuy() {
        const quantity = document.getElementById('tradeQuantity').value;
        const orderType = document.getElementById('orderType').value;

        if (!quantity || quantity <= 0) {
            this.showNotification('Please enter a valid quantity', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/stock/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: this.currentSymbol,
                    quantity: parseInt(quantity),
                    order_type: orderType
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(`Buy order submitted for ${quantity} shares of ${this.currentSymbol}`, 'success');
                this.refreshPositions();
            } else {
                throw new Error('Order failed');
            }
        } catch (error) {
            console.error('Buy order error:', error);
            this.showNotification(`Demo: Buy ${quantity} shares of ${this.currentSymbol} at ${this.formatCurrency(this.currentPrice)}`, 'info');
        }
    }

    async quickSell() {
        const quantity = document.getElementById('tradeQuantity').value;
        const orderType = document.getElementById('orderType').value;

        if (!quantity || quantity <= 0) {
            this.showNotification('Please enter a valid quantity', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/stock/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: this.currentSymbol,
                    quantity: parseInt(quantity),
                    order_type: orderType
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(`Sell order submitted for ${quantity} shares of ${this.currentSymbol}`, 'success');
                this.refreshPositions();
            } else {
                throw new Error('Order failed');
            }
        } catch (error) {
            console.error('Sell order error:', error);
            this.showNotification(`Demo: Sell ${quantity} shares of ${this.currentSymbol} at ${this.formatCurrency(this.currentPrice)}`, 'info');
        }
    }

    toggleTradingMode() {
        this.isLiveTrading = !this.isLiveTrading;
        const modeElement = document.getElementById('tradingMode');

        if (this.isLiveTrading) {
            modeElement.className = 'status-indicator live';
            modeElement.innerHTML = '<i class="fas fa-bolt"></i> Live Trading';
            this.showNotification('Switched to Live Trading mode', 'warning');
        } else {
            modeElement.className = 'status-indicator paper';
            modeElement.innerHTML = '<i class="fas fa-paper-plane"></i> Paper Trading';
            this.showNotification('Switched to Paper Trading mode', 'success');
        }
    }

    // ===== UTILITY FUNCTIONS =====
    changeSymbol(symbol) {
        if (symbol && symbol !== this.currentSymbol) {
            this.currentSymbol = symbol;
            document.getElementById('symbolSearch').value = symbol;

            // Reload all data for new symbol
            this.loadQuote(symbol);
            this.loadChart(symbol);
            this.loadTechnicalIndicators(symbol);
            this.loadAIInsights(symbol);
            this.loadRecentNews(symbol);

            this.showNotification(`Switched to ${symbol}`, 'info');
        }
    }

    async searchSymbols(query) {
        if (query.length < 2) return;

        try {
            const response = await fetch(`/api/search/${query}`);
            if (response.ok) {
                const results = await response.json();
                this.showSymbolSuggestions(results);
            }
        } catch (error) {
            console.error('Symbol search error:', error);
        }
    }

    showSymbolSuggestions(results) {
        // Implement autocomplete dropdown
        console.log('Symbol suggestions:', results);
    }

    refreshPositions() {
        this.loadPositions();
        this.loadPortfolioSummary();
    }

    managePosition(symbol) {
        console.log(`Managing position for ${symbol}`);
        // Implement position management modal
    }

    changeTimeframe(timeframe) {
        this.loadChart(this.currentSymbol, timeframe);
    }

    // ===== WEBSOCKET =====
    setupWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;

            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.updateConnectionStatus(true);
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus(false);
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
        } catch (error) {
            console.error('WebSocket setup error:', error);
            this.updateConnectionStatus(false);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'quote':
                if (data.symbol === this.currentSymbol) {
                    this.updateQuoteDisplay(data);
                }
                break;
            case 'position_update':
                this.refreshPositions();
                break;
            case 'order_update':
                this.showNotification(`Order ${data.status}: ${data.symbol}`, 'info');
                break;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            if (connected) {
                statusElement.className = 'status-indicator connected';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
            } else {
                statusElement.className = 'status-indicator disconnected';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
            }
        }
    }

    // ===== REAL-TIME UPDATES =====
    startRealTimeUpdates() {
        // Update data every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadQuote(this.currentSymbol);
            this.loadPortfolioSummary();
        }, 30000);
    }

    // ===== HELPER FUNCTIONS =====
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
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

    getRSIClass(rsi) {
        if (rsi > 70) return 'text-danger';
        if (rsi < 30) return 'text-success';
        return 'text-warning';
    }

    getConfidenceClass(confidence) {
        if (confidence > 70) return 'text-success';
        if (confidence > 50) return 'text-warning';
        return 'text-danger';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ===== DEMO DATA =====
    getDemoPortfolio() {
        return {
            portfolio_value: 52340,
            day_change: 1240,
            total_return_percent: 12.4,
            position_count: 8
        };
    }

    getDemoPositions() {
        return [
            { symbol: 'AAPL', qty: 100, avg_entry_price: 145.50, market_value: 15025, unrealized_pl: 525, unrealized_pl_percent: 3.6 },
            { symbol: 'MSFT', qty: 50, avg_entry_price: 285.20, market_value: 14260, unrealized_pl: -260, unrealized_pl_percent: -1.8 },
            { symbol: 'GOOGL', qty: 25, avg_entry_price: 132.80, market_value: 3320, unrealized_pl: 70, unrealized_pl_percent: 2.2 }
        ];
    }

    getDemoQuote(symbol) {
        return {
            symbol: symbol,
            price: 150.25,
            change_percent: 2.1
        };
    }

    getDemoIndicators() {
        return {
            indicators: {
                rsi: 67.3,
                macd: 0.45,
                sma_50: 148.22,
                sma_200: 142.85
            }
        };
    }

    getDemoAIInsights() {
        return {
            recommendation: 'BUY',
            confidence: 78,
            reasoning: 'Strong technical indicators suggest upward momentum. RSI oversold, MACD bullish crossover.'
        };
    }

    getDemoNews() {
        return [
            { title: 'Q3 Earnings Beat Expectations', published_at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { title: 'New Product Launch Announced', published_at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
            { title: 'Analyst Upgrade to Buy Rating', published_at: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ];
    }

    getDemoChartData(symbol) {
        const data = { dates: [], prices: [] };
        const basePrice = 150;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            data.dates.push(date.toISOString().split('T')[0]);
            data.prices.push(basePrice + (Math.random() - 0.5) * 20 + i * 0.5);
        }

        return data;
    }

    loadDemoData() {
        this.updatePortfolioSummary(this.getDemoPortfolio());
        this.updatePositionsTable(this.getDemoPositions());
        this.updateQuoteDisplay(this.getDemoQuote(this.currentSymbol));
        this.updateTechnicalIndicators(this.getDemoIndicators());
        this.updateAIInsights(this.getDemoAIInsights());
        this.updateRecentNews(this.getDemoNews());
        this.updateChart(this.getDemoChartData(this.currentSymbol));
    }
}

// Global functions for HTML onclick handlers
function toggleSidebar() {
    const sidebar = document.getElementById('tradingSidebar');
    const main = document.getElementById('tradingMain');

    sidebar.classList.toggle('collapsed');
    main.classList.toggle('sidebar-collapsed');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('tradingSidebar');
    sidebar.classList.toggle('open');
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

function quickBuy() {
    if (window.tradingDashboard) {
        window.tradingDashboard.quickBuy();
    }
}

function quickSell() {
    if (window.tradingDashboard) {
        window.tradingDashboard.quickSell();
    }
}

function setTradingMode(mode) {
    if (window.tradingDashboard) {
        if (mode === 'live') {
            window.tradingDashboard.isLiveTrading = true;
        } else {
            window.tradingDashboard.isLiveTrading = false;
        }
        window.tradingDashboard.toggleTradingMode();
    }
}

function changeTimeframe(timeframe) {
    if (window.tradingDashboard) {
        window.tradingDashboard.changeTimeframe(timeframe);
    }
}

function refreshPositions() {
    if (window.tradingDashboard) {
        window.tradingDashboard.refreshPositions();
    }
}

function refreshAI() {
    if (window.tradingDashboard) {
        window.tradingDashboard.loadAIInsights(window.tradingDashboard.currentSymbol);
    }
}

function showSettings() {
    console.log('Opening settings...');
    // Implement settings modal
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.tradingDashboard = new TradingDashboard();
    console.log('Trading Dashboard initialized');
});

// Add notification styles
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-success { background: #00C851; }
.notification-danger { background: #FF4444; }
.notification-warning { background: #FFA726; }
.notification-info { background: #29B6F6; }

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);