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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/10">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Allessandra</h2>
            <p className="text-sm text-slate-300">
              AI-Powered Options Trading Platform
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">ℹ️</span>
              <div className="text-xs text-blue-300">
                <strong>Paper Trading Mode:</strong> This is a testing environment. All trades are
                simulated. Your unique user ID will track your performance across sessions.
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g., John Doe"
              className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.displayName
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-white/20 focus:ring-cyan-500/50'
              }`}
              disabled={isSubmitting}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-400">{errors.displayName}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-white/20 focus:ring-cyan-500/50'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Optional: For notifications and updates
            </p>
          </div>

          {/* Test Group (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Test Group <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <select
              value={testGroup}
              onChange={e => setTestGroup(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              disabled={isSubmitting}
            >
              <option value="">No group</option>
              <option value="alpha">Alpha Testers</option>
              <option value="beta">Beta Testers</option>
              <option value="control">Control Group</option>
              <option value="advanced">Advanced Users</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Optional: For organizing test cohorts
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
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '⏳ Setting up...' : '🚀 Start Trading'}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            By continuing, you agree to participate in paper trading testing. Your data will be
            used to improve the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
