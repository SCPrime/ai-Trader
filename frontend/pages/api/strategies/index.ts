import type { NextApiRequest, NextApiResponse } from 'next';
import type { Strategy, ValidationResult } from '@/strategies/schema';
import { validateStrategy } from '@/strategies/validator';

/**
 * Strategies API Endpoint
 *
 * POST /api/strategies - Create or update a strategy
 * GET /api/strategies - List all user strategies
 *
 * Validates strategy JSON, saves to database with version management
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  } else if (req.method === 'GET') {
    return handleList(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * POST /api/strategies
 * Create or update a strategy with validation
 */
async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const strategyData = req.body;

    // Server-side validation
    const validation: ValidationResult = validateStrategy(strategyData);

    // If there are errors, reject
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Check if this is an update (has strategy_id) or new strategy
    const isUpdate = !!strategyData.strategy_id;

    // In production, save to database
    const savedStrategy = await saveStrategy(strategyData, isUpdate);

    return res.status(200).json({
      success: true,
      strategyId: savedStrategy.strategy_id,
      version: savedStrategy.version,
      warnings: validation.warnings, // Include warnings even on success
    });
  } catch (error) {
    console.error('Strategy save error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save strategy',
      detail: String(error),
    });
  }
}

/**
 * GET /api/strategies
 * List all strategies for the user
 */
async function handleList(req: NextApiRequest, res: NextApiResponse) {
  try {
    // In production, fetch from database filtered by user_id
    const strategies = await listStrategies();

    return res.status(200).json({
      success: true,
      strategies,
    });
  } catch (error) {
    console.error('Strategy list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list strategies',
      detail: String(error),
    });
  }
}

/**
 * Save strategy to database (mock)
 */
interface StrategyRecord {
  strategy_id: string;
  version: number;
  user_id: string;
  name: string;
  strategy_json: Strategy;
  created_at: string;
  updated_at: string;
  active: boolean;
}

async function saveStrategy(
  strategy: Strategy,
  isUpdate: boolean
): Promise<StrategyRecord> {
  // Mock implementation - in production:
  // 1. Check if strategy_id exists
  // 2. If update, increment version
  // 3. Store in strategies table with user_id, version, timestamp
  // 4. Return saved record

  const now = new Date().toISOString();

  // Generate strategy_id if new
  if (!isUpdate || !strategy.strategy_id) {
    strategy.strategy_id = `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock version management
  const currentVersion = await getCurrentVersion(strategy.strategy_id);
  const newVersion = currentVersion + 1;

  const record: StrategyRecord = {
    strategy_id: strategy.strategy_id,
    version: newVersion,
    user_id: 'mock_user_1', // In production, get from auth session
    name: strategy.name,
    strategy_json: strategy,
    created_at: isUpdate ? await getCreatedAt(strategy.strategy_id) : now,
    updated_at: now,
    active: true,
  };

  // Mock: Store in database
  console.log('Saving strategy:', record.strategy_id, 'version:', record.version);

  return record;
}

/**
 * Get current version number for a strategy
 */
async function getCurrentVersion(strategyId: string): Promise<number> {
  // Mock - in production, query database:
  // SELECT MAX(version) FROM strategies WHERE strategy_id = $1
  return 0; // New strategy starts at version 1
}

/**
 * Get creation timestamp for existing strategy
 */
async function getCreatedAt(strategyId: string): Promise<string> {
  // Mock - in production, query database
  return new Date().toISOString();
}

/**
 * List all strategies for user
 */
async function listStrategies(): Promise<StrategyRecord[]> {
  // Mock - in production, query database:
  // SELECT * FROM strategies WHERE user_id = $1 AND active = true
  // GROUP BY strategy_id, version ORDER BY updated_at DESC

  return [
    {
      strategy_id: 'micro_collar_sub4_v1',
      version: 1,
      user_id: 'mock_user_1',
      name: 'Micro Protective Collar – Sub-$4',
      strategy_json: {} as Strategy, // Would include full JSON
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
      active: true,
    },
  ];
}
