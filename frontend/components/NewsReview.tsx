import React, { useState, useEffect } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: string;
  sentiment_score: number;
  symbols: string[];
  category: string;
  image_url?: string;
  provider: string;
}

interface NewsResponse {
  category?: string;
  articles: NewsArticle[];
  count: number;
  sources: string[];
}

const NewsReview: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/proxy/news/providers', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data.providers.map((p: any) => p.name));
    } catch (err) {
      console.error('[NEWS] Provider fetch error:', err);
    }
  };

  const fetchNews = async (symbol?: string) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = symbol
        ? `/api/proxy/news/company/${symbol}?days_back=7`
        : `/api/proxy/news/market?category=general&limit=50`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data: NewsResponse = await response.json();
      setNews(data.articles);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
      console.error('[NEWS] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchNews();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchNews(searchSymbol || undefined);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchSymbol.trim()) {
      fetchNews(searchSymbol.trim().toUpperCase());
    } else {
      fetchNews();
    }
  };

  const filteredNews = news.filter(article => {
    if (filter === 'all') return true;
    return article.sentiment === filter;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return '#10b981'; // green
      case 'bearish':
        return '#ef4444'; // red
      case 'neutral':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  };

  const getSentimentBadge = (sentiment: string, score: number) => (
    <div style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      backgroundColor: `${getSentimentColor(sentiment)}22`,
      border: `1px solid ${getSentimentColor(sentiment)}`,
      fontSize: '12px',
      fontWeight: '600',
      color: getSentimentColor(sentiment),
    }}>
      {sentiment.toUpperCase()} ({score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%)
    </div>
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      padding: '24px',
      color: '#e2e8f0',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #3B82F6, #A855F7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          News Review
        </h2>
        <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', gap: '16px' }}>
          <span>{filteredNews.length} articles</span>
          <span>•</span>
          <span>{providers.length} providers: {providers.join(', ')}</span>
          <span>•</span>
          <span>Updated {formatDate(lastUpdate.toISOString())}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search by symbol (e.g., AAPL)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#e2e8f0',
              fontSize: '14px',
              minWidth: '220px',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {searchSymbol && (
            <button
              onClick={() => {
                setSearchSymbol('');
                fetchNews();
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #6b7280',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Sentiment Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'bullish', 'neutral', 'bearish'] as const).map((sentiment) => (
            <button
              key={sentiment}
              onClick={() => setFilter(sentiment)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === sentiment ? `1px solid ${getSentimentColor(sentiment)}` : '1px solid #334155',
                backgroundColor: filter === sentiment
                  ? `${getSentimentColor(sentiment)}22`
                  : 'rgba(15, 23, 42, 0.6)',
                color: filter === sentiment ? getSentimentColor(sentiment) : '#94a3b8',
                fontSize: '13px',
                fontWeight: filter === sentiment ? '600' : '400',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {sentiment}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchNews(searchSymbol || undefined)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginLeft: 'auto',
          }}
        >
          {loading ? '⟳ Loading...' : '↻ Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#ef4444',
          marginBottom: '24px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading news...
        </div>
      )}

      {/* News Articles */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredNews.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}>
              No articles found matching your criteria.
            </div>
          ) : (
            filteredNews.map((article) => (
              <div
                key={article.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #334155',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => window.open(article.url, '_blank')}
              >
                {/* Article Header */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      style={{
                        width: '120px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      color: '#e2e8f0',
                      lineHeight: '1.4',
                    }}>
                      {article.title}
                    </h3>
                    <div style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{formatDate(article.published_at)}</span>
                      {article.symbols.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{article.symbols.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Article Summary */}
                {article.summary && (
                  <p style={{
                    fontSize: '14px',
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    margin: '0 0 12px 0',
                  }}>
                    {article.summary}
                  </p>
                )}

                {/* Article Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {getSentimentBadge(article.sentiment, article.sentiment_score)}
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      via {article.provider}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#3B82F6',
                    fontWeight: '500',
                  }}>
                    Read more →
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsReview;
