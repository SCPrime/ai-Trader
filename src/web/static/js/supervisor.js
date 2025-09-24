// src/web/static/js/supervisor.js
async function updateStatus() {
    const response = await fetch('/api/supervisor/status');
    const data = await response.json();

    document.getElementById('current-mode').textContent = data.mode;
    document.getElementById('pending-count').textContent = data.pending_trades;

    const tradesHtml = data.pending_list.map(trade => {
        return `<div class="pending-trade">
            <h3>${trade.symbol} - ${trade.action} ${trade.quantity}</h3>
            <p>Strategy: ${trade.strategy}</p>
            <p>Confidence: ${trade.ai_confidence}%</p>
            <p>Reasoning: ${trade.reasoning}</p>
            <div class="trade-actions">
                <button class="approve" onclick="approveTrade('${trade.id}')">Approve</button>
                <button class="reject" onclick="rejectTrade('${trade.id}')">Reject</button>
            </div>
        </div>`;
    }).join('');

    document.getElementById('trades-list').innerHTML = tradesHtml || '<p>No pending trades</p>';
}

async function setMode(mode) {
    await fetch('/api/supervisor/mode', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({mode: mode})
    });
    updateStatus();
}

async function approveTrade(tradeId) {
    await fetch('/api/supervisor/approve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({trade_id: tradeId})
    });
    updateStatus();
}

async function rejectTrade(tradeId) {
    await fetch('/api/supervisor/reject', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({trade_id: tradeId, reason: 'Manual rejection'})
    });
    updateStatus();
}

async function emergencyStop() {
    if (confirm('Are you sure? This will stop ALL trading!')) {
        await fetch('/api/supervisor/emergency', {method: 'POST'});
        alert('Emergency stop activated!');
        updateStatus();
    }
}

// Initialize
updateStatus();
setInterval(updateStatus, 5000);