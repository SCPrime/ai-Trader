import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Reject Proposal API
 *
 * POST /api/proposals/{id}/reject
 * Rejects a pending proposal
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
    // 1. Validate proposal exists
    // 2. Update proposal status to 'rejected'
    // 3. Track rejection in analytics
    // 4. Optionally notify strategy engine

    console.log(`Rejecting proposal: ${id}`);

    // Mock rejection logic
    await new Promise((resolve) => setTimeout(resolve, 100));

    return res.status(200).json({
      success: true,
      message: 'Proposal rejected',
      proposal_id: id,
    });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject proposal',
    });
  }
}
