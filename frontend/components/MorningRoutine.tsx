"use client";

import { useState } from "react";
import { Card, Button } from "./ui";
import { theme } from "../styles/theme";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Target, DollarSign } from "lucide-react";

type Result = {
  name: string;
  ok: boolean;
  status: number | "n/a";
  ms: number | "n/a";
  body?: any;
  error?: string;
};

type Opportunity = {
  symbol: string;
  type: 'stock' | 'option' | 'multileg';
  strategy: string;
  reason: string;
  currentPrice: number;
  targetPrice?: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
};

type MarketCondition = {
  name: string;
  value: string;
  status: 'favorable' | 'neutral' | 'unfavorable';
};

async function timedJson(url: string, init?: RequestInit): Promise<Result> {
  const name = url.split("/api/").pop() || url;
  const t0 = performance.now();
  try {
    const res = await fetch(url, { ...init, headers: { "cache-control": "no-store", ...(init?.headers || {}) } });
    const ms = Math.round(performance.now() - t0);
    const ok = res.ok;
    let body: any = undefined;
    try { body = await res.json(); } catch {}
    return { name, ok, status: res.status, ms, body };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t0);
    return { name, ok: false, status: "n/a", ms, error: e?.message || String(e) };
  }
}

export default function MorningRoutine() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketConditions, setMarketConditions] = useState<MarketCondition[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);

  async function run() {
    setRunning(true);
    setResults([]);
    setSummary("");
    setOpportunities([]);
    setMarketConditions([]);
    setPortfolioAnalysis(null);

    const out: Result[] = [];

    // 1) System Health Checks
    out.push(await timedJson("/api/proxy/api/health"));
    out.push(await timedJson("/api/proxy/api/settings"));
    out.push(await timedJson("/api/proxy/api/portfolio/positions"));

    setResults(out);
    const okCount = out.filter((r) => r.ok).length;
    setSummary(`${okCount}/${out.length} system checks passed`);

    // 2) Strategy-Based Opportunity Screening
    try {
      const oppResult = await timedJson("/api/proxy/screening/opportunities");
      if (oppResult.ok && oppResult.body?.opportunities) {
        setOpportunities(oppResult.body.opportunities);
      }
    } catch (e) {
      console.error("Failed to fetch opportunities:", e);
    }

    // 3) Market Conditions Analysis
    try {
      const condResult = await timedJson("/api/proxy/market/conditions");
      if (condResult.ok && condResult.body?.conditions) {
        setMarketConditions(condResult.body.conditions);
      }
    } catch (e) {
      console.error("Failed to fetch market conditions:", e);
    }

    // 4) Portfolio Analysis (from positions data)
    const positionsResult = out.find(r => r.name === 'portfolio/positions');
    if (positionsResult?.ok && positionsResult.body) {
      const positions = Array.isArray(positionsResult.body) ? positionsResult.body : [];
      const totalValue = positions.reduce((sum: number, pos: any) =>
        sum + (pos.qty * pos.marketPrice), 0
      );
      const totalUnrealized = positions.reduce((sum: number, pos: any) =>
        sum + (pos.unrealized || 0), 0
      );

      setPortfolioAnalysis({
        positionCount: positions.length,
        totalValue,
        totalUnrealized,
        percentGain: totalValue > 0 ? (totalUnrealized / totalValue) * 100 : 0
      });
    }

    setRunning(false);
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return theme.colors.primary;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.danger;
      default: return theme.colors.textMuted;
    }
  };

  const getConditionColor = (status: string) => {
    switch (status) {
      case 'favorable': return theme.colors.primary;
      case 'neutral': return theme.colors.warning;
      case 'unfavorable': return theme.colors.danger;
      default: return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: theme.colors.text,
          textShadow: theme.glow.teal
        }}>
          🌅 Morning Routine
        </h2>
        <Button onClick={run} loading={running} variant="primary">
          {running ? 'Running Analysis...' : 'Run Morning Checks'}
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          color: theme.colors.textMuted,
          fontSize: '14px',
          marginBottom: theme.spacing.lg,
          fontWeight: '600'
        }}>
          {summary}
        </div>
      )}

      {/* Portfolio Overview */}
      {portfolioAnalysis && (
        <Card glow="green" style={{ marginBottom: theme.spacing.lg }}>
          <h3 style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            fontSize: '20px',
            fontWeight: '600',
            color: theme.colors.text
          }}>
            📊 Portfolio Overview
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: theme.spacing.md
          }}>
            <div>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginBottom: '4px' }}>
                Positions
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.text }}>
                {portfolioAnalysis.positionCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginBottom: '4px' }}>
                Total Value
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.text }}>
                ${portfolioAnalysis.totalValue.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginBottom: '4px' }}>
                Unrealized P/L
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: portfolioAnalysis.totalUnrealized >= 0 ? theme.colors.primary : theme.colors.danger
              }}>
                {portfolioAnalysis.totalUnrealized >= 0 ? '+' : ''}${portfolioAnalysis.totalUnrealized.toFixed(2)}
                <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                  ({portfolioAnalysis.percentGain >= 0 ? '+' : ''}{portfolioAnalysis.percentGain.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Market Conditions */}
      {marketConditions.length > 0 && (
        <Card glow="teal" style={{ marginBottom: theme.spacing.lg }}>
          <h3 style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            fontSize: '20px',
            fontWeight: '600',
            color: theme.colors.text
          }}>
            🌐 Market Conditions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.md
          }}>
            {marketConditions.map((condition, i) => (
              <div
                key={i}
                style={{
                  padding: theme.spacing.md,
                  background: theme.background.input,
                  border: `1px solid ${getConditionColor(condition.status)}`,
                  borderRadius: theme.borderRadius.md
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginBottom: '4px'
                }}>
                  {condition.status === 'favorable' && <CheckCircle size={16} color={theme.colors.primary} />}
                  {condition.status === 'neutral' && <Clock size={16} color={theme.colors.warning} />}
                  {condition.status === 'unfavorable' && <AlertCircle size={16} color={theme.colors.danger} />}
                  <span style={{
                    fontSize: '12px',
                    color: theme.colors.textMuted,
                    fontWeight: '600'
                  }}>
                    {condition.name}
                  </span>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: getConditionColor(condition.status)
                }}>
                  {condition.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trading Opportunities */}
      {opportunities.length > 0 && (
        <Card glow="purple" style={{ marginBottom: theme.spacing.lg }}>
          <h3 style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            fontSize: '20px',
            fontWeight: '600',
            color: theme.colors.text
          }}>
            🎯 Strategy-Based Opportunities
          </h3>
          <div style={{ display: 'grid', gap: theme.spacing.md }}>
            {opportunities.map((opp, i) => (
              <div
                key={i}
                style={{
                  padding: theme.spacing.md,
                  background: theme.background.input,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  transition: theme.transitions.normal
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: theme.spacing.sm
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: theme.colors.text,
                      marginBottom: '4px'
                    }}>
                      {opp.symbol}
                      <span style={{
                        marginLeft: theme.spacing.sm,
                        padding: `2px ${theme.spacing.sm}`,
                        background: theme.background.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: theme.colors.secondary,
                        textTransform: 'uppercase'
                      }}>
                        {opp.type}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.colors.secondary
                    }}>
                      {opp.strategy}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.textMuted,
                      marginBottom: '4px'
                    }}>
                      Confidence
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: opp.confidence >= 80 ? theme.colors.primary : theme.colors.warning
                    }}>
                      {opp.confidence}%
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: theme.colors.textMuted,
                  marginBottom: theme.spacing.sm,
                  lineHeight: '1.5'
                }}>
                  {opp.reason}
                </div>

                <div style={{
                  display: 'flex',
                  gap: theme.spacing.lg,
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ color: theme.colors.textMuted }}>Current: </span>
                    <span style={{ color: theme.colors.text, fontWeight: '600' }}>
                      ${opp.currentPrice.toFixed(2)}
                    </span>
                  </div>
                  {opp.targetPrice && (
                    <>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Target: </span>
                        <span style={{ color: theme.colors.primary, fontWeight: '600' }}>
                          ${opp.targetPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Potential: </span>
                        <span style={{ color: theme.colors.primary, fontWeight: '600' }}>
                          +{(((opp.targetPrice - opp.currentPrice) / opp.currentPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span style={{ color: theme.colors.textMuted }}>Risk: </span>
                    <span style={{
                      color: getRiskColor(opp.risk),
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {opp.risk}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* System Health Checks */}
      {results.length > 0 && (
        <Card glow="green">
          <h3 style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            fontSize: '20px',
            fontWeight: '600',
            color: theme.colors.text
          }}>
            ⚙️ System Health
          </h3>
          <div style={{ display: 'grid', gap: theme.spacing.sm }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${r.ok ? theme.colors.primary : theme.colors.danger}`,
                  background: r.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  boxShadow: r.ok ? theme.glow.green : theme.glow.red
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ color: theme.colors.text, fontSize: '16px' }}>
                    {r.name}
                  </strong>
                  <span style={{
                    color: r.ok ? theme.colors.primary : theme.colors.danger,
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {r.ok ? "✅" : "❌"} {r.status} / {r.ms}ms
                  </span>
                </div>
                {r.error && (
                  <div style={{ color: theme.colors.danger, fontSize: '14px', marginTop: theme.spacing.xs }}>
                    Error: {r.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !running && (
        <Card glow="teal">
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.textMuted
          }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>☀️</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: theme.spacing.sm
            }}>
              Ready to Start Your Trading Day
            </h3>
            <p style={{ fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              Run your morning checks to:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} auto 0`,
              maxWidth: '400px',
              textAlign: 'left'
            }}>
              <li style={{ marginBottom: theme.spacing.sm }}>✅ Verify system health</li>
              <li style={{ marginBottom: theme.spacing.sm }}>📊 Analyze portfolio positions</li>
              <li style={{ marginBottom: theme.spacing.sm }}>🌐 Check market conditions</li>
              <li style={{ marginBottom: theme.spacing.sm }}>🎯 Find strategy-based opportunities</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
