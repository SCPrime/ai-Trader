import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Reprice Proposal API
 *
 * POST /api/proposals/{id}/reprice
 * Fetches current mid price and updates proposal entry price
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Proposal ID is required',
    });
  }

  try {
    // In production, this would:
    // 1. Fetch current options chain data
    // 2. Calculate new mid price for the spread
    // 3. Update proposal entry_price
    // 4. Recalculate risk metrics (max_risk, max_profit, breakevens)
    // 5. Extend approval deadline by a few minutes

    console.log(`Repricing proposal: ${id}`);

    // Mock reprice logic - simulate small price change
    const priceChange = (Math.random() - 0.5) * 0.20; // ±$0.10
    const new_price = Math.max(0.50, 1.25 + priceChange); // Keep above $0.50

    await new Promise((resolve) => setTimeout(resolve, 200));

    return res.status(200).json({
      success: true,
      message: 'Proposal repriced at current mid',
      proposal_id: id,
      new_price: parseFloat(new_price.toFixed(2)),
      repriced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error repricing proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reprice proposal',
    });
  }
}
