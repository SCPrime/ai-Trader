import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface PendingTrade {
  id: string;
  execution_id: string;
  schedule_name: string;
  trade_type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  estimated_price: number;
  estimated_value: number;
  reason: string;
  risk_score: number;
  created_at: string;
  expires_at: string;
  ai_confidence: number;
  supporting_data?: {
    technical_signals?: string[];
    news_sentiment?: number;
    volatility?: number;
    risk_metrics?: any;
  };
}

export default function ApprovalQueue() {
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'low_risk'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPendingTrades();
    if (autoRefresh) {
      const interval = setInterval(fetchPendingTrades, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchPendingTrades = async () => {
    try {
      const response = await fetch('/api/proxy/scheduler/pending-approvals');
      const data = await response.json();
      setPendingTrades(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch pending trades:', error);
      setLoading(false);
    }
  };

  const approveTrade = async (id: string) => {
    try {
      await fetch(`/api/proxy/scheduler/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      fetchPendingTrades();
    } catch (error) {
      console.error('Failed to approve trade:', error);
    }
  };

  const rejectTrade = async (id: string, reason?: string) => {
    try {
      await fetch(`/api/proxy/scheduler/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      fetchPendingTrades();
    } catch (error) {
      console.error('Failed to reject trade:', error);
    }
  };

  const approveAll = async () => {
    if (!confirm(`Approve all ${filteredTrades.length} pending trades?`)) return;
    try {
      await Promise.all(filteredTrades.map(trade => approveTrade(trade.id)));
      fetchPendingTrades();
    } catch (error) {
      console.error('Failed to approve all trades:', error);
    }
  };

  const rejectAll = async () => {
    if (!confirm(`Reject all ${filteredTrades.length} pending trades?`)) return;
    try {
      await Promise.all(filteredTrades.map(trade => rejectTrade(trade.id, 'Bulk rejection')));
      fetchPendingTrades();
    } catch (error) {
      console.error('Failed to reject all trades:', error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-400 bg-red-500/20';
    if (score >= 4) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff < 0) return 'EXPIRED';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const filteredTrades = pendingTrades.filter(trade => {
    if (filter === 'high_risk') return trade.risk_score >= 7;
    if (filter === 'low_risk') return trade.risk_score < 4;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading approval queue...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <CheckCircle className="text-cyan-400" size={32} />
              Trade Approval Queue
            </h2>
            <p className="text-slate-400 mt-2">
              Review and approve automated trade recommendations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            {filteredTrades.length > 0 && (
              <>
                <button
                  onClick={approveAll}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve All ({filteredTrades.length})
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All ({pendingTrades.length})
          </button>
          <button
            onClick={() => setFilter('high_risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'high_risk'
                ? 'bg-red-500/20 text-red-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            High Risk ({pendingTrades.filter(t => t.risk_score >= 7).length})
          </button>
          <button
            onClick={() => setFilter('low_risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'low_risk'
                ? 'bg-green-500/20 text-green-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Low Risk ({pendingTrades.filter(t => t.risk_score < 4).length})
          </button>
        </div>

        {/* Trade Cards */}
        <div className="space-y-4">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No pending approvals</p>
              <p className="text-sm text-slate-500 mt-1">All automated trades have been processed</p>
            </div>
          ) : (
            filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${trade.trade_type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {trade.trade_type === 'buy' ? (
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {trade.trade_type.toUpperCase()} {trade.symbol}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(trade.risk_score)}`}>
                          Risk: {trade.risk_score}/10
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">From: {trade.schedule_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-orange-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{getTimeRemaining(trade.expires_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Expires: {new Date(trade.expires_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Quantity</p>
                    <p className="text-lg font-semibold text-white">{trade.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Est. Price</p>
                    <p className="text-lg font-semibold text-white">${trade.estimated_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Est. Value</p>
                    <p className="text-lg font-semibold text-white">
                      ${trade.estimated_value.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">AI Confidence</p>
                    <p className="text-lg font-semibold text-white">{trade.ai_confidence}%</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm font-medium text-cyan-300 mb-1">Trade Rationale:</p>
                  <p className="text-sm text-cyan-100">{trade.reason}</p>
                </div>

                {/* Supporting Data */}
                {trade.supporting_data && (
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {trade.supporting_data.technical_signals && (
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs font-medium text-slate-300 mb-2">Technical Signals</p>
                        <div className="space-y-1">
                          {trade.supporting_data.technical_signals.map((signal, i) => (
                            <p key={i} className="text-xs text-slate-400">• {signal}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {trade.supporting_data.news_sentiment !== undefined && (
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs font-medium text-slate-300 mb-2">Market Sentiment</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                trade.supporting_data.news_sentiment > 0 ? 'bg-green-400' : 'bg-red-400'
                              }`}
                              style={{
                                width: `${Math.abs(trade.supporting_data.news_sentiment) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-white">
                            {(trade.supporting_data.news_sentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => rejectTrade(trade.id)}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => approveTrade(trade.id)}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve & Execute
                  </button>
                </div>

                {/* Warning for high risk */}
                {trade.risk_score >= 7 && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-xs font-medium">
                      High risk trade - review carefully before approving
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
