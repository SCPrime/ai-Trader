import type { NextApiRequest, NextApiResponse } from 'next';
import { Strategy } from '@/strategies/schema';

/**
 * AI Strategy Suggestion Endpoint
 *
 * Analyzes current market conditions and recommends optimal strategies
 * from the Allessandra library based on:
 * - Technical indicators alignment
 * - IV percentile and options liquidity
 * - Upcoming earnings and news sentiment
 * - Risk/reward profile
 */

interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  iv_percentile?: number;
  hv_20?: number;
}

interface OptionsMetrics {
  avgCallIV?: number;
  avgPutIV?: number;
  atmCallOI?: number;
  atmPutOI?: number;
  avgSpread?: number;
}

interface SuggestStrategyRequest {
  symbol: string;
  currentPrice: number;
  technicals?: TechnicalIndicators;
  optionsChain?: OptionsMetrics;
  earningsDate?: string;
}

interface StrategyLeg {
  type: 'STOCK' | 'CALL' | 'PUT';
  side: 'BUY' | 'SELL';
  qty?: number;
  strike?: number;
  dte?: number;
  delta?: number;
}

interface StrategySuggestion {
  strategyId: string;
  strategyName: string;
  confidence: number; // 0-100
  reasoning: string;
  proposedLegs: StrategyLeg[];
  maxRisk: number;
  maxProfit: number;
  breakevens: number[];
  riskRewardRatio: number;
}

interface SuggestStrategyResponse {
  symbol: string;
  currentPrice: number;
  suggestions: StrategySuggestion[];
  analysis: {
    technicalSetup: string;
    ivEnvironment: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, currentPrice, technicals, optionsChain, earningsDate }: SuggestStrategyRequest = req.body;

  if (!symbol || !currentPrice) {
    return res.status(400).json({ error: 'Missing required parameters: symbol, currentPrice' });
  }

  try {
    // Load Allessandra seed strategies
    const strategies = await loadSeedStrategies();

    // Score each strategy based on current conditions
    const scoredStrategies = strategies.map(strategy => ({
      strategy,
      score: scoreStrategy(strategy, {
        symbol,
        currentPrice,
        technicals,
        optionsChain,
        earningsDate,
      }),
    }));

    // Sort by score and take top 3
    const topStrategies = scoredStrategies
      .sort((a, b) => b.score.confidence - a.score.confidence)
      .slice(0, 3)
      .map(({ strategy, score }) => {
        const suggestion = generateStrategyProposal(strategy, currentPrice, score);
        return suggestion;
      });

    // Generate analysis summary
    const analysis = generateAnalysis(technicals, optionsChain);

    res.status(200).json({
      symbol,
      currentPrice,
      suggestions: topStrategies,
      analysis,
    } as SuggestStrategyResponse);
  } catch (error) {
    console.error('Strategy suggestion error:', error);
    res.status(500).json({
      error: 'Failed to generate strategy suggestions',
      detail: String(error),
    });
  }
}

/**
 * Load seed strategies from the Allessandra library
 */
async function loadSeedStrategies(): Promise<Strategy[]> {
  // In production, load from database or filesystem
  // For now, return mock strategy definitions
  return [
    {
      strategy_id: 'micro_collar_sub4_v1',
      name: 'Micro Protective Collar – Sub-$4',
      goal: 'Income with capped downside on cheap stocks',
    } as Strategy,
    {
      strategy_id: 'pc_spread_sub4_v1',
      name: 'Put Credit Spread – Sub-$4',
      goal: 'Defined-risk premium capture',
    } as Strategy,
    {
      strategy_id: 'csp_wheel_sub4_v1',
      name: 'Cash-Secured Put Wheel – Sub-$4',
      goal: 'Premium income willing-to-own',
    } as Strategy,
    {
      strategy_id: 'spy_iron_condor_v1',
      name: 'SPY Iron Condor – Range-bound',
      goal: 'High-probability income in low volatility',
    } as Strategy,
  ];
}

/**
 * Score a strategy based on current market conditions
 */
function scoreStrategy(
  strategy: Strategy,
  context: SuggestStrategyRequest
): { confidence: number; reasoning: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const { symbol, currentPrice, technicals, optionsChain, earningsDate } = context;

  // Check price range filter
  if (strategy.universe?.filters?.price_between) {
    const [min, max] = strategy.universe.filters.price_between;
    if (currentPrice >= min && currentPrice <= max) {
      score += 25;
      reasons.push(`Price $${currentPrice.toFixed(2)} fits ${strategy.name} target range ($${min}-$${max})`);
    } else {
      score -= 30;
      reasons.push(`Price $${currentPrice.toFixed(2)} outside target range ($${min}-$${max})`);
      return { confidence: Math.max(0, score), reasoning: reasons };
    }
  }

  // Check options liquidity
  if (strategy.universe?.filters?.min_option_oi_per_strike && optionsChain?.atmCallOI) {
    if (optionsChain.atmCallOI >= strategy.universe.filters.min_option_oi_per_strike) {
      score += 20;
      reasons.push(`Options liquidity sufficient (OI: ${optionsChain.atmCallOI.toLocaleString()})`);
    } else {
      score -= 20;
      reasons.push(`Low options liquidity (OI: ${optionsChain.atmCallOI.toLocaleString()})`);
    }
  }

  // Check spread tolerance
  if (strategy.universe?.filters?.max_option_spread && optionsChain?.avgSpread) {
    if (optionsChain.avgSpread <= strategy.universe.filters.max_option_spread) {
      score += 15;
      reasons.push(`Tight spreads (${(optionsChain.avgSpread * 100).toFixed(1)}%)`);
    } else {
      score -= 15;
      reasons.push(`Wide spreads (${(optionsChain.avgSpread * 100).toFixed(1)}%)`);
    }
  }

  // Check technical indicators
  if (technicals?.rsi) {
    if (strategy.strategy_id.includes('put') && technicals.rsi < 40) {
      score += 15;
      reasons.push(`RSI oversold (${technicals.rsi.toFixed(1)}) - bullish setup for put selling`);
    } else if (strategy.strategy_id.includes('call') && technicals.rsi > 60) {
      score += 15;
      reasons.push(`RSI overbought (${technicals.rsi.toFixed(1)}) - bearish setup for call selling`);
    }
  }

  // Check earnings proximity
  if (earningsDate && strategy.exits?.time_exit_before_earnings_days) {
    const daysToEarnings = Math.floor(
      (new Date(earningsDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToEarnings > strategy.exits.time_exit_before_earnings_days + 7) {
      score += 10;
      reasons.push(`Sufficient time before earnings (${daysToEarnings} days)`);
    } else {
      score -= 20;
      reasons.push(`Too close to earnings (${daysToEarnings} days)`);
    }
  }

  // IV environment check
  if (technicals?.iv_percentile) {
    if (strategy.strategy_id.includes('credit') || strategy.strategy_id.includes('wheel')) {
      // Premium selling strategies prefer high IV
      if (technicals.iv_percentile > 50) {
        score += 15;
        reasons.push(`High IV environment (${technicals.iv_percentile.toFixed(0)}th percentile) - good for premium selling`);
      } else {
        score -= 10;
        reasons.push(`Low IV environment (${technicals.iv_percentile.toFixed(0)}th percentile) - less attractive for premium selling`);
      }
    }
  }

  return {
    confidence: Math.max(0, Math.min(100, score)),
    reasoning: reasons,
  };
}

/**
 * Generate strategy proposal with specific legs and risk metrics
 */
function generateStrategyProposal(
  strategy: Strategy,
  currentPrice: number,
  scoreData: { confidence: number; reasoning: string[] }
): StrategySuggestion {
  const atmStrike = Math.round(currentPrice / 5) * 5;

  let proposedLegs: StrategyLeg[] = [];
  let maxRisk = 0;
  let maxProfit = 0;
  let breakevens: number[] = [];

  // Generate legs based on strategy type
  if (strategy.strategy_id.includes('collar')) {
    // Protective Collar: Long stock + Long put + Short call
    proposedLegs = [
      { type: 'STOCK', side: 'BUY', qty: 100 },
      { type: 'PUT', side: 'BUY', strike: atmStrike - 5, dte: 35, delta: -0.20 },
      { type: 'CALL', side: 'SELL', strike: atmStrike + 5, dte: 14, delta: 0.30 },
    ];
    maxRisk = 500; // Stock can drop $5 to put strike
    maxProfit = 500; // Stock can rise $5 to call strike
    breakevens = [currentPrice];
  } else if (strategy.strategy_id.includes('pc_spread')) {
    // Put Credit Spread
    const shortStrike = atmStrike - 5;
    const longStrike = atmStrike - 10;
    proposedLegs = [
      { type: 'PUT', side: 'SELL', strike: shortStrike, dte: 28, delta: -0.25 },
      { type: 'PUT', side: 'BUY', strike: longStrike, dte: 28, delta: -0.10 },
    ];
    maxRisk = (shortStrike - longStrike) * 100 - 150; // Width minus credit
    maxProfit = 150; // Credit received
    breakevens = [shortStrike - 1.5];
  } else if (strategy.strategy_id.includes('csp')) {
    // Cash-Secured Put
    const strike = atmStrike - 5;
    proposedLegs = [{ type: 'PUT', side: 'SELL', strike, dte: 28, delta: -0.25 }];
    maxRisk = strike * 100 - 150; // Strike minus credit
    maxProfit = 150; // Credit received
    breakevens = [strike - 1.5];
  } else if (strategy.strategy_id.includes('condor')) {
    // Iron Condor
    proposedLegs = [
      { type: 'PUT', side: 'SELL', strike: atmStrike - 10, dte: 30, delta: -0.20 },
      { type: 'PUT', side: 'BUY', strike: atmStrike - 15, dte: 30, delta: -0.10 },
      { type: 'CALL', side: 'SELL', strike: atmStrike + 10, dte: 30, delta: 0.20 },
      { type: 'CALL', side: 'BUY', strike: atmStrike + 15, dte: 30, delta: 0.10 },
    ];
    maxRisk = 350;
    maxProfit = 150;
    breakevens = [atmStrike - 8.5, atmStrike + 8.5];
  }

  return {
    strategyId: strategy.strategy_id,
    strategyName: strategy.name,
    confidence: scoreData.confidence,
    reasoning: scoreData.reasoning.join('\n'),
    proposedLegs,
    maxRisk,
    maxProfit,
    breakevens,
    riskRewardRatio: maxProfit / Math.max(maxRisk, 1),
  };
}

/**
 * Generate analysis summary
 */
function generateAnalysis(
  technicals?: TechnicalIndicators,
  optionsChain?: OptionsMetrics
): { technicalSetup: string; ivEnvironment: string; riskLevel: 'low' | 'medium' | 'high' } {
  let technicalSetup = 'Neutral';
  let ivEnvironment = 'Normal';
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';

  // Technical setup
  if (technicals?.rsi) {
    if (technicals.rsi < 30) {
      technicalSetup = 'Oversold - Bullish reversal potential';
      riskLevel = 'low';
    } else if (technicals.rsi > 70) {
      technicalSetup = 'Overbought - Bearish reversal potential';
      riskLevel = 'high';
    } else if (technicals.sma20 && technicals.sma50) {
      if (technicals.sma20 > technicals.sma50) {
        technicalSetup = 'Uptrend - Bullish momentum';
      } else {
        technicalSetup = 'Downtrend - Bearish momentum';
      }
    }
  }

  // IV environment
  if (technicals?.iv_percentile) {
    if (technicals.iv_percentile > 75) {
      ivEnvironment = 'Elevated IV - Favorable for premium selling';
      riskLevel = 'high';
    } else if (technicals.iv_percentile < 25) {
      ivEnvironment = 'Low IV - Favorable for premium buying';
      riskLevel = 'low';
    } else {
      ivEnvironment = `Moderate IV (${technicals.iv_percentile.toFixed(0)}th percentile)`;
    }
  }

  return {
    technicalSetup,
    ivEnvironment,
    riskLevel,
  };
}
