from fastapi import APIRouter, HTTPException, Depends
from app.core.auth import require_bearer

router = APIRouter()

# Initialize news aggregator at module level
news_aggregator = None

try:
    from app.services.news.news_aggregator import NewsAggregator
    news_aggregator = NewsAggregator()
    print("[OK] News aggregator initialized with available providers")
except Exception as e:
    print(f"[WARNING] News aggregator failed to initialize: {e}")

@router.get("/news/company/{symbol}")
async def get_company_news(symbol: str, days_back: int = 7, _: str = Depends(require_bearer)):
    """Get aggregated news for specific company"""
    if not news_aggregator:
        raise HTTPException(status_code=503, detail="News service unavailable")

    try:
        articles = news_aggregator.get_company_news(symbol, days_back)
        return {
            "symbol": symbol,
            "articles": articles,
            "count": len(articles),
            "sources": [p.get_provider_name() for p in news_aggregator.providers]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news/market")
async def get_market_news(category: str = 'general', limit: int = 50, _: str = Depends(require_bearer)):
    """Get aggregated market news"""
    if not news_aggregator:
        raise HTTPException(status_code=503, detail="News service unavailable")

    try:
        articles = news_aggregator.get_market_news(category, limit)
        return {
            "category": category,
            "articles": articles,
            "count": len(articles),
            "sources": [p.get_provider_name() for p in news_aggregator.providers]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news/providers")
async def get_news_providers(_: str = Depends(require_bearer)):
    """List active news providers"""
    if not news_aggregator:
        return {"providers": [], "status": "unavailable"}

    return {
        "providers": [
            {"name": p.get_provider_name(), "status": "active"}
            for p in news_aggregator.providers
        ],
        "total": len(news_aggregator.providers)
    }
