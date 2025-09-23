#!/usr/bin/env python3
"""
Additional Dashboard Components - Part 2
"""

def get_dashboard_components_js():
    """Return JavaScript for remaining dashboard components"""
    return """
        // Quick Trade Component with Enhanced Functionality
        function QuickTrade({ showToast }) {
            const [tradeSymbol, setTradeSymbol] = useState('AAPL');
            const [quantity, setQuantity] = useState('10');
            const [orderType, setOrderType] = useState('Market');
            const [isExecuting, setIsExecuting] = useState(false);

            const executeTrade = async (side) => {
                setIsExecuting(true);
                try {
                    const response = await fetch('/api/trading/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            symbol: tradeSymbol,
                            side: side,
                            quantity: parseInt(quantity),
                            order_type: orderType.toLowerCase()
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        showToast(data.message, 'success');
                    } else {
                        showToast('Trade execution failed', 'error');
                    }
                } catch (error) {
                    showToast('Network error during trade execution', 'error');
                } finally {
                    setIsExecuting(false);
                }
            };

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <i className="fas fa-bolt"></i>
                        <span>Quick Trade</span>
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1">Symbol</label>
                            <input
                                type="text"
                                value={tradeSymbol}
                                onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                placeholder="AAPL"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Order Type</label>
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            >
                                <option>Market</option>
                                <option>Limit</option>
                                <option>Stop</option>
                                <option>Stop Limit</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => executeTrade('buy')}
                                disabled={isExecuting}
                                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                                {isExecuting ? <i className="fas fa-spinner spinner"></i> : <i className="fas fa-arrow-up"></i>}
                                <span>Buy</span>
                            </button>
                            <button
                                onClick={() => executeTrade('sell')}
                                disabled={isExecuting}
                                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                                {isExecuting ? <i className="fas fa-spinner spinner"></i> : <i className="fas fa-arrow-down"></i>}
                                <span>Sell</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Portfolio Positions Component with Multi-leg Support
        function PortfolioPositions({ positions, onRefresh, showToast }) {
            const [isRefreshing, setIsRefreshing] = useState(false);

            const refreshPositions = async () => {
                setIsRefreshing(true);
                try {
                    await onRefresh();
                    showToast('Positions refreshed', 'success');
                } catch (error) {
                    showToast('Failed to refresh positions', 'error');
                } finally {
                    setIsRefreshing(false);
                }
            };

            const closePosition = async (symbol) => {
                if (confirm(`Are you sure you want to close position in ${symbol}?`)) {
                    showToast(`Closing position in ${symbol}`, 'info');
                    // Implement close position logic
                }
            };

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Portfolio Positions Snapshot</h3>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                                Last updated: {new Date().toLocaleTimeString()}
                            </span>
                            <button
                                onClick={refreshPositions}
                                disabled={isRefreshing}
                                className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                            >
                                <i className={`fas fa-sync-alt ${isRefreshing ? 'spinner' : ''}`}></i>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {positions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <i className="fas fa-inbox text-3xl mb-2"></i>
                            <div>No positions loaded</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left py-2">Symbol</th>
                                        <th className="text-left py-2">Type</th>
                                        <th className="text-right py-2">Qty</th>
                                        <th className="text-right py-2">Avg Price</th>
                                        <th className="text-right py-2">Current</th>
                                        <th className="text-right py-2">Market Value</th>
                                        <th className="text-right py-2">Day P&L</th>
                                        <th className="text-right py-2">Total P&L %</th>
                                        <th className="text-center py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position, index) => (
                                        <PositionRow
                                            key={index}
                                            position={position}
                                            onClose={closePosition}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }

        // Individual Position Row Component
        function PositionRow({ position, onClose }) {
            const [expanded, setExpanded] = useState(false);

            const getPnLColor = (value) => {
                return value >= 0 ? 'text-green-400' : 'text-red-400';
            };

            return (
                <>
                    <tr className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{position.symbol}</span>
                                {position.legs && position.legs.length > 1 && (
                                    <button
                                        onClick={() => setExpanded(!expanded)}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
                                    </button>
                                )}
                            </div>
                        </td>
                        <td className="py-3">
                            <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                {position.type}
                            </span>
                        </td>
                        <td className="py-3 text-right">{position.quantity}</td>
                        <td className="py-3 text-right">${position.avg_price}</td>
                        <td className="py-3 text-right">${position.current_price}</td>
                        <td className="py-3 text-right">${position.market_value?.toLocaleString()}</td>
                        <td className={`py-3 text-right ${getPnLColor(position.day_pnl)}`}>
                            ${position.day_pnl?.toFixed(2)}
                        </td>
                        <td className={`py-3 text-right ${getPnLColor(position.total_pnl_percent)}`}>
                            {position.total_pnl_percent?.toFixed(2)}%
                        </td>
                        <td className="py-3 text-center">
                            <button
                                onClick={() => onClose(position.symbol)}
                                className="text-red-400 hover:text-red-300 px-2 py-1"
                                title="Close Position"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>

                    {/* Multi-leg expansion */}
                    {expanded && position.legs && (
                        <tr>
                            <td colSpan="9" className="py-2 bg-gray-750">
                                <div className="pl-4">
                                    <h4 className="text-sm font-medium mb-2">Strategy Legs:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        {position.legs.map((leg, legIndex) => (
                                            <div key={legIndex} className="bg-gray-700 p-2 rounded">
                                                <span className="font-medium">
                                                    {leg.action.toUpperCase()} {leg.type?.toUpperCase()}
                                                    {leg.strike && ` $${leg.strike}`}
                                                </span>
                                                <div className="text-gray-400">
                                                    Qty: {leg.quantity} | Premium: ${leg.premium || 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </>
            );
        }

        // Strategy Creator Component
        function StrategyCreator({ strategies, setStrategies, showToast }) {
            const [strategyName, setStrategyName] = useState('');
            const [description, setDescription] = useState('');
            const [rules, setRules] = useState('');
            const [isCreating, setIsCreating] = useState(false);

            const createStrategy = async () => {
                if (!strategyName.trim() || !rules.trim()) {
                    showToast('Strategy name and rules are required', 'error');
                    return;
                }

                setIsCreating(true);
                try {
                    const response = await fetch('/api/strategy/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: strategyName,
                            description: description,
                            rules: rules
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        setStrategies([...strategies, data.strategy]);
                        setStrategyName('');
                        setDescription('');
                        setRules('');
                        showToast(data.message, 'success');
                    } else {
                        showToast('Failed to create strategy', 'error');
                    }
                } catch (error) {
                    showToast('Network error creating strategy', 'error');
                } finally {
                    setIsCreating(false);
                }
            };

            const loadExample = () => {
                setStrategyName('RSI Momentum Strategy');
                setDescription('Buy when RSI is oversold and crosses back above threshold');
                setRules('Buy AAPL when RSI drops below 30 and then crosses back above 35. Take profit at 5% gain. Stop loss at 3% loss. Use 2% position size.');
                showToast('Example strategy loaded', 'info');
            };

            return (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <i className="fas fa-comments"></i>
                        <span>AI Strategy Creator</span>
                    </h3>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Strategy Name"
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <textarea
                            placeholder="Natural Language Rules (e.g., Buy AAPL when RSI drops below 30 and then crosses back above 35...)"
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={createStrategy}
                                disabled={isCreating}
                                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-1"
                            >
                                {isCreating ? <i className="fas fa-spinner spinner"></i> : <i className="fas fa-plus"></i>}
                                <span>Create Strategy</span>
                            </button>
                            <button
                                onClick={loadExample}
                                className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
                            >
                                Load Example
                            </button>
                        </div>
                    </div>

                    {/* Saved Strategies List */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold">Saved Strategies</h4>
                            <i className="fas fa-sync-alt text-gray-400 cursor-pointer hover:text-white"></i>
                        </div>

                        {strategies.length === 0 ? (
                            <div className="text-gray-400 text-sm">No strategies created yet</div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {strategies.map((strategy, index) => (
                                    <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{strategy.name}</div>
                                            <div className="text-xs text-gray-400">{strategy.description}</div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="text-blue-400 hover:text-blue-300" title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="text-red-400 hover:text-red-300" title="Delete">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Continue with more components...
    """.strip()

if __name__ == "__main__":
    print(get_dashboard_components_js())