"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "./ui";
import { theme } from "../styles/theme";

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
      const res = await fetch("/api/proxy/api/positions", {
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
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.lg
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: theme.glow.green,
            marginBottom: theme.spacing.xs
          }}>
            📊 Active Positions
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: theme.colors.textMuted
          }}>
            {positions.length} position{positions.length !== 1 ? 's' : ''} • Total Value: ${totalMarketValue.toFixed(2)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          {lastRefreshed && (
            <span style={{ color: theme.colors.textMuted, fontSize: '13px' }}>
              Refreshed {lastRefreshed}
            </span>
          )}
          <Button onClick={load} loading={loading} variant="primary">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg
      }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '12px',
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600'
            }}>
              Total P&L
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: totalUnrealizedPnL >= 0 ? theme.colors.primary : theme.colors.danger,
              marginBottom: theme.spacing.xs
            }}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: totalUnrealizedPnL >= 0 ? theme.colors.primary : theme.colors.danger
            }}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '12px',
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600'
            }}>
              Cost Basis
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: theme.colors.text
            }}>
              ${totalCostBasis.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '12px',
              color: theme.colors.textMuted,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600'
            }}>
              Market Value
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: theme.colors.text
            }}>
              ${totalMarketValue.toFixed(2)}
            </div>
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: theme.spacing.md,
          background: 'rgba(255, 68, 68, 0.2)',
          border: `1px solid ${theme.colors.danger}`,
          borderRadius: theme.borderRadius.md,
          color: theme.colors.text,
          marginBottom: theme.spacing.lg,
          boxShadow: theme.glow.red
        }}>
          ❌ {error}
        </div>
      )}

      {/* Empty State */}
      {!error && positions.length === 0 && !loading && (
        <Card>
          <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📭</div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: theme.spacing.sm
            }}>
              No Positions
            </div>
            <div style={{ fontSize: '14px', color: theme.colors.textMuted }}>
              You don't have any open positions yet.
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {!error && positions.length > 0 && (
        <Card glow="green">
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    letterSpacing: '0.5px'
                  }}>
                    Symbol
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    Quantity
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    Avg Price
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    Current Price
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    Market Value
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    Unrealized P&L
                  </th>
                  <th style={{
                    padding: theme.spacing.md,
                    color: theme.colors.textMuted,
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    letterSpacing: '0.5px'
                  }}>
                    P&L %
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  const pnlColor = isProfit ? theme.colors.primary : theme.colors.danger;

                  return (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                      transition: 'background 0.2s'
                    }}>
                      <td style={{ padding: theme.spacing.md }}>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '16px',
                          color: theme.colors.secondary
                        }}>
                          {pos.symbol}
                        </span>
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        textAlign: 'right'
                      }}>
                        {pos.qty}
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        textAlign: 'right'
                      }}>
                        ${pos.avgPrice.toFixed(2)}
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        textAlign: 'right'
                      }}>
                        ${pos.currentPrice.toFixed(2)}
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: theme.colors.text,
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        ${pos.marketValue.toFixed(2)}
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: pnlColor,
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                      </td>
                      <td style={{
                        padding: theme.spacing.md,
                        color: pnlColor,
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        {isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
