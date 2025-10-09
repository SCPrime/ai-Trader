"use client";

import { useState } from "react";
import { Card, Button } from "./ui";
import { theme } from "../styles/theme";

interface Recommendation {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reason: string;
  targetPrice: number;
  currentPrice: number;
}

export default function AIRecommendations() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/proxy/ai/recommendations");

      if (!res.ok) {
        throw new Error(`Failed to fetch recommendations: ${res.status}`);
      }

      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load AI recommendations. Please ensure backend is running.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return theme.colors.primary;
      case "SELL": return theme.colors.danger;
      case "HOLD": return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
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
            textShadow: theme.glow.purple,
            marginBottom: theme.spacing.xs
          }}>
            🤖 AI Recommendations
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: theme.colors.textMuted
          }}>
            AI-powered trading suggestions based on market analysis
          </p>
        </div>

        <Button onClick={fetchRecommendations} loading={loading} variant="primary">
          Generate Recommendations
        </Button>
      </div>

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

      {recommendations.length === 0 && !loading && !error && (
        <Card>
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.textMuted
          }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🎯</div>
            <div style={{ fontSize: '16px' }}>
              Click "Generate Recommendations" to get AI-powered trading suggestions
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {recommendations.map((rec, idx) => (
          <Card key={idx} glow="purple">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr auto',
              gap: theme.spacing.lg,
              alignItems: 'center'
            }}>
              {/* Symbol */}
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: theme.colors.secondary
                }}>
                  {rec.symbol}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.textMuted,
                  marginTop: theme.spacing.xs
                }}>
                  ${rec.currentPrice.toFixed(2)}
                </div>
              </div>

              {/* Reason */}
              <div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text,
                  lineHeight: '1.5'
                }}>
                  {rec.reason}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.textMuted,
                  marginBottom: theme.spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Target Price
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: theme.colors.primary
                }}>
                  ${rec.targetPrice.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.textMuted,
                  marginTop: theme.spacing.xs
                }}>
                  Confidence: {getConfidenceLabel(rec.confidence)} ({rec.confidence}%)
                </div>
              </div>

              {/* Action */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: `${getActionColor(rec.action)}20`,
                  border: `2px solid ${getActionColor(rec.action)}`,
                  borderRadius: theme.borderRadius.md,
                  color: getActionColor(rec.action),
                  fontWeight: '700',
                  fontSize: '16px',
                  marginBottom: theme.spacing.md
                }}>
                  {rec.action}
                </div>
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
