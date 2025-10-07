"use client";

import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Clock, Bookmark, ExternalLink, Filter } from 'lucide-react';
import { Card, Button } from './ui';
import { theme } from '../styles/theme';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  symbols: string[];
  url: string;
  saved: boolean;
}

export default function NewsReview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral' | 'saved'>('all');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);

    // Mock news data
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'Fed Signals Rate Cuts May Come Sooner Than Expected',
        summary: 'Federal Reserve officials indicate potential rate reductions in Q2 2025 as inflation continues to moderate.',
        source: 'Bloomberg',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        sentiment: 'bullish',
        symbols: ['SPY', 'QQQ'],
        url: '#',
        saved: false,
      },
      {
        id: '2',
        title: 'Tech Earnings Beat Expectations Across Sector',
        summary: 'Major technology companies report stronger-than-expected Q4 earnings, driven by AI investments.',
        source: 'CNBC',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        sentiment: 'bullish',
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
        url: '#',
        saved: true,
      },
      {
        id: '3',
        title: 'Energy Stocks Decline on Crude Oil Price Drop',
        summary: 'Oil prices fall 3% amid concerns about global demand, weighing on energy sector stocks.',
        source: 'Reuters',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        sentiment: 'bearish',
        symbols: ['XLE', 'CVX', 'XOM'],
        url: '#',
        saved: false,
      },
      {
        id: '4',
        title: 'Banking Sector Maintains Stability Amid Economic Uncertainty',
        summary: 'Financial institutions report solid fundamentals despite mixed economic signals.',
        source: 'Wall Street Journal',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        sentiment: 'neutral',
        symbols: ['XLF', 'JPM', 'BAC'],
        url: '#',
        saved: false,
      },
      {
        id: '5',
        title: 'Retail Sales Surge Beyond Forecasts',
        summary: 'Consumer spending shows resilience with retail sales up 2.1% in latest report.',
        source: 'MarketWatch',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        sentiment: 'bullish',
        symbols: ['XRT', 'TGT', 'WMT'],
        url: '#',
        saved: false,
      },
    ];

    setTimeout(() => {
      setArticles(mockArticles);
      setLoading(false);
    }, 1000);
  };

  const toggleSave = (id: string) => {
    setArticles(articles.map(article =>
      article.id === id ? { ...article, saved: !article.saved } : article
    ));
  };

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true;
    if (filter === 'saved') return article.saved;
    return article.sentiment === filter;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: theme.colors.border,
          text: theme.colors.primary,
          icon: TrendingUp
        };
      case 'bearish':
        return {
          bg: 'rgba(255, 68, 68, 0.1)',
          border: `rgba(255, 68, 68, 0.3)`,
          text: theme.colors.danger,
          icon: TrendingDown
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.1)',
          border: `rgba(148, 163, 184, 0.3)`,
          text: theme.colors.textMuted,
          icon: null
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl
      }}>
        <div style={{
          padding: theme.spacing.md,
          background: 'rgba(126, 87, 194, 0.1)',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid rgba(126, 87, 194, 0.2)'
        }}>
          <Newspaper style={{ width: 32, height: 32, color: theme.colors.accent }} />
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: theme.glow.purple
          }}>
            News Review
          </h1>
          <p style={{
            margin: 0,
            marginTop: '4px',
            color: theme.colors.textMuted,
            fontSize: '14px'
          }}>
            Latest market news and sentiment analysis
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <Filter size={20} color={theme.colors.textMuted} />
            <span style={{ color: theme.colors.textMuted, fontSize: '14px', fontWeight: '600' }}>Filter:</span>
          </div>
          {(['all', 'bullish', 'bearish', 'neutral', 'saved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: filter === f ? theme.colors.primary : theme.background.input,
                color: filter === f ? 'white' : theme.colors.textMuted,
                fontWeight: filter === f ? '600' : '500',
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${filter === f ? theme.colors.primary : theme.colors.border}`,
                cursor: 'pointer',
                fontSize: '14px',
                textTransform: 'capitalize',
                transition: theme.transitions.normal,
              }}
              onMouseEnter={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.background = theme.background.cardHover;
                  e.currentTarget.style.borderColor = theme.colors.borderHover;
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.background = theme.background.input;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <Card>
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.textMuted
          }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📰</div>
            <div style={{ fontSize: '16px' }}>Loading news...</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {filteredArticles.length === 0 ? (
            <Card>
              <div style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.textMuted,
              }}>
                <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🔍</div>
                <p style={{ fontSize: '16px' }}>No articles found for this filter.</p>
              </div>
            </Card>
          ) : (
            filteredArticles.map((article) => {
              const sentiment = getSentimentColor(article.sentiment);
              const SentimentIcon = sentiment.icon;

              return (
                <Card key={article.id} glow="purple">
                  {/* Article Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.md
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: theme.colors.text,
                      margin: 0,
                      flex: 1,
                      lineHeight: '1.4'
                    }}>
                      {article.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(article.id);
                      }}
                      style={{
                        padding: theme.spacing.sm,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: theme.spacing.md
                      }}
                    >
                      <Bookmark
                        size={20}
                        color={article.saved ? theme.colors.warning : theme.colors.textMuted}
                        fill={article.saved ? theme.colors.warning : 'none'}
                      />
                    </button>
                  </div>

                  {/* Article Summary */}
                  <p style={{
                    fontSize: '14px',
                    color: theme.colors.textMuted,
                    margin: `0 0 ${theme.spacing.md} 0`,
                    lineHeight: '1.6',
                  }}>
                    {article.summary}
                  </p>

                  {/* Article Metadata */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: theme.spacing.md
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      flexWrap: 'wrap'
                    }}>
                      {/* Source & Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Clock size={14} color={theme.colors.textMuted} />
                        <span style={{ fontSize: '12px', color: theme.colors.textMuted }}>
                          {article.source} • {formatTimestamp(article.timestamp)}
                        </span>
                      </div>

                      {/* Sentiment Badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: `4px ${theme.spacing.sm}`,
                        background: sentiment.bg,
                        border: `1px solid ${sentiment.border}`,
                        borderRadius: theme.borderRadius.lg,
                      }}>
                        {SentimentIcon && <SentimentIcon size={14} color={sentiment.text} />}
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: sentiment.text,
                          textTransform: 'capitalize',
                        }}>
                          {article.sentiment}
                        </span>
                      </div>

                      {/* Symbols */}
                      <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                        {article.symbols.map((symbol) => (
                          <span
                            key={symbol}
                            style={{
                              padding: `4px ${theme.spacing.sm}`,
                              background: theme.background.input,
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: '12px',
                              fontWeight: '600',
                              color: theme.colors.secondary,
                            }}
                          >
                            {symbol}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Read More Link */}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: theme.colors.secondary,
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: theme.transitions.normal
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.secondary;
                      }}
                    >
                      Read more
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.lg }}>
        <Button onClick={loadNews} loading={loading} variant="primary">
          Refresh News
        </Button>
      </div>
    </div>
  );
}
