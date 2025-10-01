"use client";

import { useEffect, useState } from "react";

interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/api/portfolio/positions", {
        method: "GET",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Positions failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      console.log('API response data:', data);

      // Accept either {positions:[...]} or plain array
      const rawPositions = Array.isArray(data) ? data : Array.isArray(data?.positions) ? data.positions : [];

      // Calculate enhanced metrics
      const enhanced: Position[] = rawPositions.map((p: any) => {
        const qty = p.qty || p.quantity || 0;
        const avgPrice = p.avgPrice || p.average_price || p.avg_entry_price || 0;
        const currentPrice = p.marketPrice || p.market_price || p.currentPrice || p.current_price || 0;
        const marketValue = p.marketValue || p.market_value || (currentPrice * qty);
        const costBasis = avgPrice * qty;
        const unrealizedPnL = marketValue - costBasis;
        const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        return {
          symbol: p.symbol || 'N/A',
          qty,
          avgPrice,
          currentPrice,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPercent,
        };
      });

      console.log('Enhanced positions:', enhanced);
      setPositions(enhanced);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + (p.avgPrice * p.qty), 0);
  const totalPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>📊 Active Positions</h3>
          <p style={styles.subtitle}>
            {positions.length} position{positions.length !== 1 ? 's' : ''} •
            Total Value: ${totalMarketValue.toFixed(2)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {lastRefreshed && <span style={styles.muted}>Refreshed {lastRefreshed}</span>}
          <button onClick={load} disabled={loading} style={styles.btnPrimary}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total P&L</div>
          <div style={{...styles.summaryValue, color: totalUnrealizedPnL >= 0 ? '#10b981' : '#ef4444'}}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
          </div>
          <div style={{...styles.summaryPercent, color: totalUnrealizedPnL >= 0 ? '#10b981' : '#ef4444'}}>
            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Cost Basis</div>
          <div style={styles.summaryValue}>${totalCostBasis.toFixed(2)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Market Value</div>
          <div style={styles.summaryValue}>${totalMarketValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>❌ {error}</div>}

      {/* Empty State */}
      {!error && positions.length === 0 && !loading && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={styles.emptyTitle}>No Positions</div>
          <div style={styles.emptyText}>You don't have any open positions yet.</div>
        </div>
      )}

      {/* Table */}
      {!error && positions.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Symbol</th>
                <th style={{...styles.th, textAlign: 'right'}}>Quantity</th>
                <th style={{...styles.th, textAlign: 'right'}}>Avg Price</th>
                <th style={{...styles.th, textAlign: 'right'}}>Current Price</th>
                <th style={{...styles.th, textAlign: 'right'}}>Market Value</th>
                <th style={{...styles.th, textAlign: 'right'}}>Unrealized P&L</th>
                <th style={{...styles.th, textAlign: 'right'}}>P&L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => {
                const isProfit = pos.unrealizedPnL >= 0;
                const pnlColor = isProfit ? '#10b981' : '#ef4444';

                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.symbol}>{pos.symbol}</span>
                    </td>
                    <td style={{...styles.td, textAlign: 'right'}}>{pos.qty}</td>
                    <td style={{...styles.td, textAlign: 'right'}}>${pos.avgPrice.toFixed(2)}</td>
                    <td style={{...styles.td, textAlign: 'right'}}>${pos.currentPrice.toFixed(2)}</td>
                    <td style={{...styles.td, textAlign: 'right', fontWeight: 600}}>${pos.marketValue.toFixed(2)}</td>
                    <td style={{...styles.td, textAlign: 'right', color: pnlColor, fontWeight: 600}}>
                      {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                    </td>
                    <td style={{...styles.td, textAlign: 'right', color: pnlColor, fontWeight: 600}}>
                      {isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Dark theme styles
const styles = {
  card: { padding: 24, background: "#1f2937", border: "1px solid #374151", borderRadius: 12 } as React.CSSProperties,
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 } as React.CSSProperties,
  title: { margin: 0, fontSize: 24, color: "#f9fafb", fontWeight: 700 } as React.CSSProperties,
  subtitle: { margin: "4px 0 0 0", fontSize: 14, color: "#9ca3af" } as React.CSSProperties,
  muted: { color: "#9ca3af", fontSize: 13 } as React.CSSProperties,
  btnPrimary: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 } as React.CSSProperties,

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 } as React.CSSProperties,
  summaryCard: { padding: 16, background: "#374151", borderRadius: 8, border: "1px solid #4b5563" } as React.CSSProperties,
  summaryLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 } as React.CSSProperties,
  summaryValue: { fontSize: 24, color: "#f9fafb", fontWeight: 700, marginBottom: 4 } as React.CSSProperties,
  summaryPercent: { fontSize: 14, fontWeight: 600 } as React.CSSProperties,

  errorBox: { padding: 16, border: "1px solid #ef4444", background: "#7f1d1d", color: "#fecaca", borderRadius: 8, marginBottom: 20 } as React.CSSProperties,

  emptyState: { padding: 60, textAlign: "center" } as React.CSSProperties,
  emptyTitle: { fontSize: 20, fontWeight: 600, color: "#f9fafb", marginBottom: 8 } as React.CSSProperties,
  emptyText: { fontSize: 14, color: "#9ca3af" } as React.CSSProperties,

  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 } as React.CSSProperties,
  th: { padding: "12px 16px", borderBottom: "2px solid #374151", color: "#9ca3af", fontWeight: 600, fontSize: 12, textTransform: "uppercase", background: "#374151" } as React.CSSProperties,
  tr: { borderBottom: "1px solid #374151", transition: "background 0.2s" } as React.CSSProperties,
  td: { padding: "16px", color: "#f9fafb" } as React.CSSProperties,
  symbol: { fontWeight: 700, fontSize: 16, color: "#60a5fa" } as React.CSSProperties,
};
