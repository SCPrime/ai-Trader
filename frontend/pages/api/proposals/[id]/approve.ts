import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Approve Proposal API
 *
 * POST /api/proposals/{id}/approve
 * Approves a pending proposal and submits it for execution
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
    // 1. Validate proposal exists and is pending
    // 2. Check approval deadline hasn't passed
    // 3. Update proposal status to 'approved'
    // 4. Submit to execution engine
    // 5. Track approval in analytics

    console.log(`Approving proposal: ${id}`);

    // Mock approval logic
    await new Promise((resolve) => setTimeout(resolve, 100));

    return res.status(200).json({
      success: true,
      message: 'Proposal approved successfully',
      proposal_id: id,
      execution_id: `exec_${Date.now()}`,
    });
  } catch (error) {
    console.error('Error approving proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve proposal',
    });
  }
}
