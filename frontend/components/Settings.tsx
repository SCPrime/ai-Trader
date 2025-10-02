'use client';

import { useState, useEffect } from 'react';

/**
 * Settings Component
 *
 * Allows user to configure:
 * - Trading mode (requires_approval vs autopilot)
 * - Global execution preferences
 * - Performance tracking preferences
 *
 * All settings are user-controlled - no enforcement gates.
 */

interface SettingsData {
  // Trading Mode
  defaultExecutionMode: 'requires_approval' | 'autopilot';

  // Notifications
  enableSMSAlerts: boolean;
  enableEmailAlerts: boolean;
  enablePushNotifications: boolean;

  // Performance Tracking
  enablePerformanceTracking: boolean;
  minTradesForPerformanceData: number;

  // Risk Preferences (informational)
  defaultSlippageBudget: number;
  defaultMaxReprices: number;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsData>({
    defaultExecutionMode: 'requires_approval',
    enableSMSAlerts: true,
    enableEmailAlerts: true,
    enablePushNotifications: false,
    enablePerformanceTracking: true,
    minTradesForPerformanceData: 10,
    defaultSlippageBudget: 0.4,
    defaultMaxReprices: 4,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('allessandra_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    // Save to localStorage (in production, also save to backend)
    localStorage.setItem('allessandra_settings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    setSaveSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    const defaultSettings: SettingsData = {
      defaultExecutionMode: 'requires_approval',
      enableSMSAlerts: true,
      enableEmailAlerts: true,
      enablePushNotifications: false,
      enablePerformanceTracking: true,
      minTradesForPerformanceData: 10,
      defaultSlippageBudget: 0.4,
      defaultMaxReprices: 4,
    };
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">⚙️ Settings</h2>
              <p className="text-sm text-slate-300">
                Configure global trading preferences and automation behavior
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              ✕ Close
            </button>
          </div>

          {saveSuccess && (
            <div className="mt-3 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded text-sm text-green-400">
              ✓ Settings saved successfully!
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trading Mode Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🤖</span>
              Trading Mode
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Default Execution Mode
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                    <input
                      type="radio"
                      name="executionMode"
                      value="requires_approval"
                      checked={settings.defaultExecutionMode === 'requires_approval'}
                      onChange={() => updateSetting('defaultExecutionMode', 'requires_approval')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">
                        Requires Approval (Recommended)
                      </div>
                      <div className="text-xs text-slate-400">
                        All trades require your manual approval via SMS/Email before execution.
                        You maintain full control over every trade.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all">
                    <input
                      type="radio"
                      name="executionMode"
                      value="autopilot"
                      checked={settings.defaultExecutionMode === 'autopilot'}
                      onChange={() => updateSetting('defaultExecutionMode', 'autopilot')}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">
                        Autopilot Mode
                      </div>
                      <div className="text-xs text-slate-400">
                        Trades execute automatically based on strategy rules. You can set
                        performance thresholds for informational tracking. Full control remains
                        with you to enable/disable at any time.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">ℹ️</span>
                  <div className="text-xs text-blue-300">
                    <strong>Note:</strong> This sets the default mode for new strategies. You can
                    override this on a per-strategy basis in the Strategy Builder. You can change
                    modes at any time.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🔔</span>
              Notifications
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="text-sm font-medium text-white">SMS Alerts</div>
                  <div className="text-xs text-slate-400">
                    Receive text messages for trade proposals and fills
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSMSAlerts}
                  onChange={e => updateSetting('enableSMSAlerts', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="text-sm font-medium text-white">Email Alerts</div>
                  <div className="text-xs text-slate-400">
                    Receive email notifications for trade activity
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={e => updateSetting('enableEmailAlerts', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="text-sm font-medium text-white">Push Notifications</div>
                  <div className="text-xs text-slate-400">
                    Browser push notifications for real-time updates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enablePushNotifications}
                  onChange={e => updateSetting('enablePushNotifications', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          {/* Performance Tracking Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Performance Tracking
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="text-sm font-medium text-white">Enable Performance Tracking</div>
                  <div className="text-xs text-slate-400">
                    Track win rate, Sharpe ratio, and other metrics for your strategies
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enablePerformanceTracking}
                  onChange={e => updateSetting('enablePerformanceTracking', e.target.checked)}
                  className="w-5 h-5"
                />
              </label>

              {settings.enablePerformanceTracking && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Minimum Trades for Performance Data
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.minTradesForPerformanceData}
                    onChange={e =>
                      updateSetting('minTradesForPerformanceData', Number(e.target.value))
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    Minimum number of closed trades needed before showing performance statistics
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Risk Preferences Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              Default Risk Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Slippage Budget (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.defaultSlippageBudget}
                  onChange={e => updateSetting('defaultSlippageBudget', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Maximum acceptable slippage as a percentage of trade value (0-100%)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Order Reprices
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.defaultMaxReprices}
                  onChange={e => updateSetting('defaultMaxReprices', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Number of times to reprice an order before giving up
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasUnsavedChanges ? '💾 Save Changes' : '✓ Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
