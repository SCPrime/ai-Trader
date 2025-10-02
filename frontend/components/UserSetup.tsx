'use client';

import { useState } from 'react';
import { createUser } from '../lib/userManagement';

/**
 * User Setup Component
 *
 * First-time user onboarding for paper testing.
 * Collects user info and creates unique userId.
 */

interface UserSetupProps {
  onComplete: () => void;
}

export default function UserSetup({ onComplete }: UserSetupProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [testGroup, setTestGroup] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Create user with unique ID
      const user = createUser(
        displayName.trim(),
        email.trim() || undefined,
        testGroup || undefined
      );

      console.log('User created successfully:', user.userId);

      // Complete setup
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors({ submit: 'Failed to create user. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900"
      style={{
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-8 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          <div className="text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Allessandra</h2>
            <p className="text-sm text-slate-300">
              AI-Powered Options Trading Platform
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">ℹ️</span>
              <div className="text-sm text-slate-300">
                <strong className="text-cyan-400">Paper Trading Mode:</strong> This is a testing environment. All trades are
                simulated. Your unique user ID will track your performance across sessions.
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g., John Doe"
              className={`w-full px-4 py-3 bg-slate-900/80 border rounded-lg text-white placeholder-slate-500 outline-none focus:ring-2 transition-all ${
                errors.displayName
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/30'
              }`}
              disabled={isSubmitting}
            />
            {errors.displayName && (
              <p className="mt-2 text-sm text-red-400">{errors.displayName}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Email <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 bg-slate-900/80 border rounded-lg text-white placeholder-slate-500 outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/30'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
            <p className="mt-2 text-xs text-slate-500">
              For notifications and updates
            </p>
          </div>

          {/* Test Group (Optional) */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Test Group <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <select
              value={testGroup}
              onChange={e => setTestGroup(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-lg text-white outline-none focus:ring-2 focus:border-cyan-500/50 focus:ring-cyan-500/30 transition-all"
              disabled={isSubmitting}
            >
              <option value="">No group</option>
              <option value="alpha">Alpha Testers</option>
              <option value="beta">Beta Testers</option>
              <option value="control">Control Group</option>
              <option value="advanced">Advanced Users</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              For organizing test cohorts
            </p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 disabled:shadow-none"
          >
            {isSubmitting ? '⏳ Setting up...' : '🚀 Start Trading'}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            By continuing, you agree to participate in paper trading testing. Your data will be
            used to improve the platform.
          </p>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
