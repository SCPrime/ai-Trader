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
    // Use non-blocking confirmation - proceed directly for emergency stop
    try {
        await fetch('/api/supervisor/emergency', {method: 'POST'});
        showNotification('Emergency stop activated - All trading stopped!', 'warning');
        updateStatus();
    } catch (error) {
        showNotification('Emergency stop failed: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create non-blocking notification instead of alert()
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: ${type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#4caf50'};
        color: white; padding: 15px; border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        max-width: 300px; font-family: Arial, sans-serif;
    `;
    notification.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
    `;
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize
updateStatus();
setInterval(updateStatus, 5000);