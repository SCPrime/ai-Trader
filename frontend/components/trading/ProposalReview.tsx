'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/userManagement';

/**
 * Proposal Review Component
 *
 * Display AI-generated trade proposals for review and approval.
 * Each proposal shows risk metrics, legs, and inline editing capabilities.
 */

interface OptionLeg {
  strike: number;
  expiration: string;
  option_type: 'call' | 'put';
  side: 'buy' | 'sell';
  quantity: number;
}

interface Proposal {
  id: string;
  ticker: string;
  strategy_name: string;
  strategy_id: string;
  legs: OptionLeg[];
  entry_price: number;
  entry_tolerance: number;
  max_risk: number;
  max_profit: number;
  pop: number; // Probability of profit
  breakevens: number[];
  ivp: number; // IV percentile
  approval_deadline: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  budget_required: number;
}

interface ProposalCardProps {
  proposal: Proposal;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReprice: (id: string) => void;
  onEdit: (id: string, updates: Partial<Proposal>) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

function ProposalCard({
  proposal,
  onApprove,
  onReject,
  onReprice,
  onEdit,
  isSelected,
  onSelect,
}: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState(proposal);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const deadline = new Date(proposal.approval_deadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('EXPIRED');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [proposal.approval_deadline]);

  const handleStrikeEdit = (legIndex: number, newStrike: number) => {
    const newLegs = [...editedProposal.legs];
    newLegs[legIndex] = { ...newLegs[legIndex], strike: newStrike };
    setEditedProposal({ ...editedProposal, legs: newLegs });
  };

  const handleQuantityEdit = (legIndex: number, newQty: number) => {
    const newLegs = [...editedProposal.legs];
    newLegs[legIndex] = { ...newLegs[legIndex], quantity: newQty };
    setEditedProposal({ ...editedProposal, legs: newLegs });
  };

  const handleSaveEdits = () => {
    onEdit(proposal.id, editedProposal);
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditedProposal(proposal);
    setIsEditing(false);
  };

  const isExpired = timeRemaining === 'EXPIRED';

  return (
    <div
      className={`bg-slate-800/60 border rounded-xl p-5 transition-all ${
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/50'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(proposal.id, e.target.checked)}
            className="mt-1 w-5 h-5"
          />
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {proposal.ticker} • {proposal.strategy_name}
            </h3>
            <p className="text-sm text-slate-400">Strategy ID: {proposal.strategy_id}</p>
          </div>
        </div>

        {/* Timer */}
        <div
          className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            isExpired
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}
        >
          {isExpired ? '⏰ EXPIRED' : `⏱️ ${timeRemaining}`}
        </div>
      </div>

      {/* Legs */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Option Legs</h4>
        <div className="space-y-2">
          {(isEditing ? editedProposal.legs : proposal.legs).map((leg, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg text-sm"
            >
              <span
                className={`px-2 py-1 rounded font-semibold ${
                  leg.side === 'buy'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {leg.side.toUpperCase()}
              </span>
              <span className="text-white font-medium">
                {leg.quantity}x {leg.option_type.toUpperCase()}
              </span>
              {isEditing ? (
                <input
                  type="number"
                  value={leg.strike}
                  onChange={(e) => handleStrikeEdit(idx, Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-800 border border-white/20 rounded text-white text-center"
                />
              ) : (
                <span className="text-cyan-400 font-mono">${leg.strike}</span>
              )}
              <span className="text-slate-400">{leg.expiration}</span>
              {isEditing && (
                <input
                  type="number"
                  value={leg.quantity}
                  onChange={(e) => handleQuantityEdit(idx, Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-800 border border-white/20 rounded text-white text-center ml-auto"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Entry Price</div>
          <div className="text-lg font-bold text-white">
            ${proposal.entry_price.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">±${proposal.entry_tolerance.toFixed(2)}</div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Max Risk</div>
          <div className="text-lg font-bold text-red-400">
            ${proposal.max_risk.toFixed(0)}
          </div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Max Profit</div>
          <div className="text-lg font-bold text-green-400">
            ${proposal.max_profit.toFixed(0)}
          </div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">POP</div>
          <div className="text-lg font-bold text-purple-400">{proposal.pop.toFixed(1)}%</div>
        </div>
      </div>

      {/* Breakevens & IVP */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Breakevens</div>
          <div className="text-sm font-mono text-white">
            {proposal.breakevens.map((be) => `$${be.toFixed(2)}`).join(' / ')}
          </div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">IV Percentile</div>
          <div className="text-lg font-bold text-cyan-400">{proposal.ivp.toFixed(1)}%</div>
        </div>
      </div>

      {/* Actions */}
      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={handleSaveEdits}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all"
          >
            ✓ Save Changes
          </button>
          <button
            onClick={handleCancelEdits}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
          >
            ✕ Cancel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => onApprove(proposal.id)}
            disabled={isExpired}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onReject(proposal.id)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
          >
            ✕ Reject
          </button>
          <button
            onClick={() => setIsEditing(true)}
            disabled={isExpired}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onReprice(proposal.id)}
            disabled={isExpired}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
          >
            💱 Reprice
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProposalReview() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState<number>(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals?status=pending');
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals');

      // Mock data for testing
      setProposals([
        {
          id: 'prop_1',
          ticker: 'SPY',
          strategy_name: 'Iron Condor',
          strategy_id: 'strat_ic_001',
          legs: [
            { strike: 580, expiration: '2025-11-15', option_type: 'put', side: 'sell', quantity: 1 },
            { strike: 575, expiration: '2025-11-15', option_type: 'put', side: 'buy', quantity: 1 },
            { strike: 600, expiration: '2025-11-15', option_type: 'call', side: 'sell', quantity: 1 },
            { strike: 605, expiration: '2025-11-15', option_type: 'call', side: 'buy', quantity: 1 },
          ],
          entry_price: 1.25,
          entry_tolerance: 0.10,
          max_risk: -375,
          max_profit: 125,
          pop: 68.5,
          breakevens: [578.75, 601.25],
          ivp: 45.2,
          approval_deadline: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes
          status: 'pending',
          created_at: new Date().toISOString(),
          budget_required: 375,
        },
        {
          id: 'prop_2',
          ticker: 'AAPL',
          strategy_name: 'Bull Put Spread',
          strategy_id: 'strat_bps_002',
          legs: [
            { strike: 230, expiration: '2025-10-20', option_type: 'put', side: 'sell', quantity: 2 },
            { strike: 225, expiration: '2025-10-20', option_type: 'put', side: 'buy', quantity: 2 },
          ],
          entry_price: 1.50,
          entry_tolerance: 0.15,
          max_risk: -700,
          max_profit: 300,
          pop: 72.3,
          breakevens: [228.50],
          ivp: 38.7,
          approval_deadline: new Date(Date.now() + 10 * 60000).toISOString(), // 10 minutes
          status: 'pending',
          created_at: new Date().toISOString(),
          budget_required: 700,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setProposals((prev) => prev.filter((p) => p.id !== id));
        alert('✅ Proposal approved!');
      } else {
        throw new Error('Approval failed');
      }
    } catch (err) {
      console.error('Error approving proposal:', err);
      alert('❌ Failed to approve proposal');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setProposals((prev) => prev.filter((p) => p.id !== id));
        alert('🚫 Proposal rejected');
      } else {
        throw new Error('Rejection failed');
      }
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      alert('❌ Failed to reject proposal');
    }
  };

  const handleReprice = async (id: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}/reprice`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProposals((prev) =>
          prev.map((p) => (p.id === id ? { ...p, entry_price: data.new_price } : p))
        );
        alert(`💱 Repriced at mid: $${data.new_price.toFixed(2)}`);
      } else {
        throw new Error('Reprice failed');
      }
    } catch (err) {
      console.error('Error repricing proposal:', err);
      alert('❌ Failed to reprice proposal');
    }
  };

  const handleEdit = async (id: string, updates: Partial<Proposal>) => {
    // Update locally (in production, send to backend)
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    alert('✏️ Proposal updated (changes are local for demo)');
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedProposals((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkApprove = async () => {
    const selectedItems = proposals.filter(
      (p) => selectedProposals.has(p.id) && p.budget_required <= budget
    );

    if (selectedItems.length === 0) {
      alert('⚠️ No proposals within budget selected');
      return;
    }

    const totalBudget = selectedItems.reduce((sum, p) => sum + p.budget_required, 0);

    if (totalBudget > budget) {
      alert(`⚠️ Total budget required ($${totalBudget}) exceeds limit ($${budget})`);
      return;
    }

    if (
      !confirm(
        `Approve ${selectedItems.length} proposals requiring $${totalBudget} total budget?`
      )
    ) {
      return;
    }

    for (const proposal of selectedItems) {
      await handleApprove(proposal.id);
    }

    setSelectedProposals(new Set());
  };

  const totalBudgetRequired = proposals
    .filter((p) => selectedProposals.has(p.id))
    .reduce((sum, p) => sum + p.budget_required, 0);

  const withinBudgetCount = proposals.filter(
    (p) => selectedProposals.has(p.id) && p.budget_required <= budget
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-white font-semibold">Loading proposals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
        <h2 className="text-2xl font-bold text-white mb-2">📋 Proposal Review</h2>
        <p className="text-slate-300 text-sm">
          Review and approve AI-generated trade proposals. Each proposal has a deadline for
          approval.
        </p>
      </div>

      {/* Bulk Actions */}
      {proposals.length > 0 && (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget Limit ($)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex-1 min-w-[200px] flex items-end gap-3">
              <button
                onClick={handleBulkApprove}
                disabled={selectedProposals.size === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
              >
                ✓ Approve All ≤ Budget ({withinBudgetCount})
              </button>
            </div>

            {selectedProposals.size > 0 && (
              <div className="w-full md:w-auto text-sm">
                <div className="text-slate-400">
                  Selected: {selectedProposals.size} proposals
                </div>
                <div
                  className={`font-semibold ${
                    totalBudgetRequired <= budget ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  Total Budget: ${totalBudgetRequired}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Proposals */}
      {proposals.length === 0 ? (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <div className="text-white font-semibold mb-2">No pending proposals</div>
          <div className="text-slate-400 text-sm">
            AI-generated trade proposals will appear here for your review and approval.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={handleApprove}
              onReject={handleReject}
              onReprice={handleReprice}
              onEdit={handleEdit}
              isSelected={selectedProposals.has(proposal.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
