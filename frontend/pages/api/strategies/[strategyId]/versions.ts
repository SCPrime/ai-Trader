import type { NextApiRequest, NextApiResponse } from 'next';
import type { Strategy } from '@/strategies/schema';

/**
 * Strategy Versions Endpoint
 *
 * GET /api/strategies/[strategyId]/versions
 *
 * Returns all versions of a strategy for version management
 */

interface StrategyVersion {
  version: number;
  updated_at: string;
  updated_by: string;
  changes_summary?: string;
  strategy_json: Strategy;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { strategyId } = req.query;

  if (!strategyId || typeof strategyId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid strategyId' });
  }

  try {
    const versions = await getStrategyVersions(strategyId);

    if (versions.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.status(200).json({
      success: true,
      strategyId,
      versions,
    });
  } catch (error) {
    console.error('Strategy versions fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch strategy versions',
      detail: String(error),
    });
  }
}

/**
 * Fetch all versions of a strategy (mock)
 */
async function getStrategyVersions(strategyId: string): Promise<StrategyVersion[]> {
  // Mock data - in production, query database:
  // SELECT version, updated_at, updated_by, strategy_json
  // FROM strategies
  // WHERE strategy_id = $1
  // ORDER BY version DESC

  // Return empty if strategy doesn't exist
  if (!strategyId.startsWith('micro_collar')) {
    return [];
  }

  return [
    {
      version: 3,
      updated_at: '2025-02-10T14:30:00Z',
      updated_by: 'mock_user_1',
      changes_summary: 'Increased max_concurrent_positions to 10',
      strategy_json: {
        strategy_id: strategyId,
        name: 'Micro Protective Collar – Sub-$4',
        goal: 'Income with capped downside on cheap stocks',
        // ... full strategy JSON (would be complete in production)
      } as Strategy,
    },
    {
      version: 2,
      updated_at: '2025-02-05T10:15:00Z',
      updated_by: 'mock_user_1',
      changes_summary: 'Tightened profit target to 8%',
      strategy_json: {
        strategy_id: strategyId,
        name: 'Micro Protective Collar – Sub-$4',
        goal: 'Income with capped downside on cheap stocks',
      } as Strategy,
    },
    {
      version: 1,
      updated_at: '2025-01-15T10:00:00Z',
      updated_by: 'mock_user_1',
      changes_summary: 'Initial version',
      strategy_json: {
        strategy_id: strategyId,
        name: 'Micro Protective Collar – Sub-$4',
        goal: 'Income with capped downside on cheap stocks',
      } as Strategy,
    },
  ];
}
