"use client";

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Palette, Shield, Database, Activity, Save, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight, FileText, Bell, TrendingUp, Lock, BookOpen, Clock } from 'lucide-react';
import TradingJournal from './TradingJournal';
import RiskDashboard from './RiskDashboard';
import SchedulerSettings from './SchedulerSettings';
import ApprovalQueue from './ApprovalQueue';
import { getCurrentUser, getUserAnalytics, clearUserData } from '../lib/userManagement';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'beta' | 'alpha' | 'user';
  tradingMode: 'paper' | 'live';
  permissions: {
    canTrade: boolean;
    canBacktest: boolean;
    canViewAnalytics: boolean;
    canModifyStrategies: boolean;
  };
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

interface ThemeCustomization {
  primaryColor: string;
  accentColor: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
}

interface TelemetryData {
  sessionId: string;
  userId: string;
  action: string;
  component: string;
  timestamp: string;
  metadata: any;
}

interface SettingsData {
  defaultExecutionMode: 'requires_approval' | 'autopilot';
  enableSMSAlerts: boolean;
  enableEmailAlerts: boolean;
  enablePushNotifications: boolean;
  enablePerformanceTracking: boolean;
  minTradesForPerformanceData: number;
  defaultSlippageBudget: number;
  defaultMaxReprices: number;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const currentUserData = getCurrentUser();
  const [currentUser] = useState({
    id: currentUserData?.userId || 'owner-001',
    role: 'owner' as const
  });
  const isOwner = currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'personal' | 'users' | 'theme' | 'permissions' | 'telemetry' | 'trading' | 'journal' | 'risk' | 'automation' | 'approvals'>('personal');

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

  const [users, setUsers] = useState<User[]>([]);
  const [themeCustom, setThemeCustom] = useState<ThemeCustomization>({
    primaryColor: '#10b981',
    accentColor: '#7E57C2',
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#14b8a6',
  });
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const savedSettings = localStorage.getItem('allessandra_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    if (isAdmin) {
      loadMockUsers();
      loadTelemetryData();
    }
  }, [isOpen, isAdmin]);

  const loadMockUsers = () => {
    setUsers([
      {
        id: 'owner-001',
        email: 'owner@paid.com',
        name: 'System Owner',
        role: 'owner',
        tradingMode: 'paper',
        permissions: {
          canTrade: true,
          canBacktest: true,
          canViewAnalytics: true,
          canModifyStrategies: true,
        },
        status: 'active',
        createdAt: '2025-01-01',
        lastLogin: new Date().toISOString().split('T')[0],
      },
      {
        id: 'beta-001',
        email: 'beta.tester1@paid.com',
        name: 'Beta Tester 1',
        role: 'beta',
        tradingMode: 'paper',
        permissions: {
          canTrade: true,
          canBacktest: true,
          canViewAnalytics: true,
          canModifyStrategies: false,
        },
        status: 'active',
        createdAt: '2025-09-15',
        lastLogin: '2025-10-05',
      },
    ]);
  };

  const loadTelemetryData = () => {
    const mockData: TelemetryData[] = [
      {
        sessionId: 'sess-001',
        userId: 'beta-001',
        action: 'execute_trade',
        component: 'ExecuteTradeForm',
        timestamp: new Date().toISOString(),
        metadata: { symbol: 'AAPL', side: 'buy', quantity: 10 },
      },
    ];
    setTelemetryData(mockData);
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    localStorage.setItem('allessandra_settings', JSON.stringify(settings));

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSaving(false);
    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    setSaveMessage('Settings saved successfully!');

    setTimeout(() => {
      setSaveMessage('');
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

  const toggleUserStatus = (userId: string) => {
    if (!isOwner) return;
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
        : user
    ));
    setHasUnsavedChanges(true);
  };

  const updateUserPermission = (userId: string, permission: keyof User['permissions'], value: boolean) => {
    if (!isOwner) return;
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, permissions: { ...user.permissions, [permission]: value } }
        : user
    ));
    setHasUnsavedChanges(true);
  };

  const toggleTradingMode = (userId: string) => {
    if (!isOwner && userId !== currentUser.id) return;
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, tradingMode: user.tradingMode === 'paper' ? 'live' : 'paper' }
        : user
    ));
    setHasUnsavedChanges(true);
  };

  const exportTelemetryReport = () => {
    const dataStr = JSON.stringify(telemetryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetry-${new Date().toISOString()}.json`;
    link.click();
  };

  if (!isOpen) return null;

  const analytics = currentUserData ? getUserAnalytics() : null;

  const tabs = [
    { id: 'personal', label: 'Personal Settings', icon: SettingsIcon, alwaysShow: true },
    { id: 'journal', label: 'Trading Journal', icon: BookOpen, alwaysShow: true },
    { id: 'risk', label: 'Risk Control', icon: Shield, alwaysShow: true },
    { id: 'automation', label: 'Automation', icon: Clock, alwaysShow: true },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2, alwaysShow: true },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'theme', label: 'Theme', icon: Palette, adminOnly: true },
    { id: 'permissions', label: 'Permissions', icon: Lock, adminOnly: true },
    { id: 'telemetry', label: 'Telemetry', icon: Database, adminOnly: true },
    { id: 'trading', label: 'Trading Control', icon: Activity, adminOnly: true },
  ].filter(tab => tab.alwaysShow || (tab.adminOnly && isAdmin));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      overflowY: 'auto',
      color: '#e2e8f0',
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: '32px 0',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0, 172, 193, 0.2)',
          background: 'linear-gradient(to right, rgba(0, 172, 193, 0.1), rgba(126, 87, 194, 0.1), rgba(0, 172, 193, 0.1))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SettingsIcon size={28} style={{ color: '#00ACC1' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {isOwner ? 'Master Control Panel' : 'Settings'}
                </h2>
              </div>
              <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px', marginBottom: 0 }}>
                {isOwner
                  ? 'System-wide configuration and user management'
                  : 'Configure your trading preferences and automation'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.5)',
                color: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✕ Close
            </button>
          </div>

          {isOwner && (
            <div className="mt-3 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded flex items-center gap-2">
              <Shield size={16} className="text-purple-400" />
              <p className="text-sm text-purple-400 font-semibold">
                System Owner Access - Full Control Enabled
              </p>
            </div>
          )}

          {saveMessage && (
            <div className="mt-3 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <p className="text-sm text-green-400 font-semibold">{saveMessage}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-cyan-500/20 bg-slate-900/50 flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 border-2 border-slate-700/30 hover:border-cyan-400/30'
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.2)',
          color: '#e2e8f0',
        }}>
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {currentUserData && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    User Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/30 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Display Name</div>
                        <div className="text-sm font-medium text-white">{currentUserData.displayName}</div>
                      </div>
                    </div>

                    {currentUserData.email && (
                      <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/30 rounded-lg">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Email</div>
                          <div className="text-sm font-medium text-white">{currentUserData.email}</div>
                        </div>
                      </div>
                    )}

                    {analytics && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-900/40 border border-slate-700/30 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Account Age</div>
                          <div className="text-sm font-semibold text-cyan-400">{analytics.accountAge}</div>
                        </div>
                        <div className="p-3 bg-slate-900/40 border border-slate-700/30 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Total Sessions</div>
                          <div className="text-sm font-semibold text-purple-400">{analytics.totalSessions}</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all user data? This will log you out.')) {
                          clearUserData();
                          window.location.reload();
                        }
                      }}
                      className="w-full mt-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all text-sm font-medium"
                    >
                      🗑️ Clear User Data & Logout
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  Trading Mode
                </h3>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 bg-slate-900/40 border border-slate-700/30 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
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
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-slate-900/40 border border-slate-700/30 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all">
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
                        Trades execute automatically based on strategy rules.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell size={20} />
                  Notifications
                </h3>

                <div className="space-y-3">
                  {[
                    { key: 'enableSMSAlerts', label: 'SMS Alerts', desc: 'Text messages for trade proposals' },
                    { key: 'enableEmailAlerts', label: 'Email Alerts', desc: 'Email notifications for trades' },
                    { key: 'enablePushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/30 rounded-lg cursor-pointer hover:border-cyan-500/30 transition-all">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-slate-400">{desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings[key as keyof SettingsData] as boolean}
                        onChange={e => updateSetting(key as any, e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock size={20} />
                  Risk Parameters
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
                      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
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
                      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'journal' && <TradingJournal />}
          {activeTab === 'risk' && <RiskDashboard />}
          {activeTab === 'automation' && (
            <div className="min-h-[500px]">
              <SchedulerSettings />
            </div>
          )}
          {activeTab === 'approvals' && (
            <div className="min-h-[500px]">
              <ApprovalQueue />
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <UserManagementTab
              users={users}
              isOwner={isOwner}
              currentUserId={currentUser.id}
              onToggleStatus={toggleUserStatus}
            />
          )}

          {activeTab === 'theme' && isAdmin && (
            <ThemeCustomizationTab
              themeCustom={themeCustom}
              onUpdate={(key, value) => {
                setThemeCustom({ ...themeCustom, [key]: value });
                setHasUnsavedChanges(true);
              }}
            />
          )}

          {activeTab === 'permissions' && isAdmin && (
            <PermissionsTab
              users={users}
              isOwner={isOwner}
              onUpdatePermission={updateUserPermission}
            />
          )}

          {activeTab === 'telemetry' && isAdmin && (
            <TelemetryTab
              enabled={telemetryEnabled}
              data={telemetryData}
              users={users}
              onToggle={() => setTelemetryEnabled(!telemetryEnabled)}
              onExport={exportTelemetryReport}
            />
          )}

          {activeTab === 'trading' && isAdmin && (
            <TradingControlTab
              users={users}
              isOwner={isOwner}
              currentUserId={currentUser.id}
              onToggleTradingMode={toggleTradingMode}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0, 172, 193, 0.2)',
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontSize: '14px',
            }}
          >
            Reset to Defaults
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.5)',
                color: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(to right, #00ACC1, #7E57C2)',
                color: '#ffffff',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : '✓ Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserManagementTab({ users, isOwner, currentUserId, onToggleStatus }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Users size={20} />
        User Management
      </h3>

      {users.map((user: User) => (
        <div key={user.id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-semibold">{user.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  user.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                  user.role === 'beta' ? 'bg-cyan-500/20 text-cyan-400' :
                  user.role === 'alpha' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {user.role.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>

            {isOwner && user.id !== currentUserId && (
              <button
                onClick={() => onToggleStatus(user.id)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  user.status === 'active'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-slate-500">Created</div>
              <div className="text-white">{user.createdAt}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Last Login</div>
              <div className="text-white">{user.lastLogin}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Trading Mode</div>
              <div className={`font-semibold ${user.tradingMode === 'live' ? 'text-red-400' : 'text-yellow-400'}`}>
                {user.tradingMode.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemeCustomizationTab({ themeCustom, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Palette size={20} />
        Theme Customization
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(themeCustom).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={value as string}
                onChange={(e) => onUpdate(key, e.target.value)}
                className="w-16 h-10 rounded border border-slate-700/50 cursor-pointer"
              />
              <input
                type="text"
                value={value as string}
                onChange={(e) => onUpdate(key, e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded text-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded flex items-start gap-2">
        <AlertTriangle size={16} className="text-purple-400 mt-0.5" />
        <p className="text-sm text-purple-400">
          Theme changes will apply system-wide to all users after saving.
        </p>
      </div>
    </div>
  );
}

function PermissionsTab({ users, isOwner, onUpdatePermission }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Shield size={20} />
        User Permissions
      </h3>

      {users.map((user: User) => (
        <div key={user.id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <h4 className="text-white font-semibold mb-3">{user.name} ({user.role})</h4>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(user.permissions).map(([permission, enabled]) => (
              <label
                key={permission}
                className="flex items-center gap-2 cursor-pointer"
                style={{ opacity: isOwner ? 1 : 0.6 }}
              >
                <input
                  type="checkbox"
                  checked={enabled as boolean}
                  onChange={(e) => isOwner && onUpdatePermission(user.id, permission, e.target.checked)}
                  disabled={!isOwner}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white">
                  {permission.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TelemetryTab({ enabled, data, users, onToggle, onExport }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Database size={20} />
          Telemetry & Usage Logs
        </h3>

        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            enabled
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
          }`}
        >
          {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {enabled && data.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">Time</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">User</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">Component</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-400 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log: TelemetryData, i: number) => (
                  <tr key={i} className="border-b border-slate-700/30">
                    <td className="px-3 py-2 text-sm text-white">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      {users.find((u: User) => u.id === log.userId)?.name || log.userId}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-400">{log.component}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all"
          >
            <FileText size={18} />
            Export Report
          </button>
        </>
      )}
    </div>
  );
}

function TradingControlTab({ users, isOwner, currentUserId, onToggleTradingMode }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity size={20} />
        Trading Mode Control
      </h3>

      {!isOwner && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-400 mt-0.5" />
          <p className="text-sm text-red-400">
            Only the system owner can toggle between Paper and Live trading modes.
          </p>
        </div>
      )}

      {users.map((user: User) => (
        <div key={user.id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-white font-semibold">{user.name}</h4>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase">Trading Mode</div>
                <div className={`text-2xl font-bold ${user.tradingMode === 'live' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {user.tradingMode.toUpperCase()}
                </div>
              </div>

              <button
                onClick={() => onToggleTradingMode(user.id)}
                disabled={!isOwner && user.id !== currentUserId}
                className={`p-3 rounded-lg border-2 transition-all ${
                  user.tradingMode === 'live'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-yellow-500/20 border-yellow-500'
                } ${(!isOwner && user.id !== currentUserId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              >
                {user.tradingMode === 'live' ? (
                  <ToggleRight size={32} className="text-red-400" />
                ) : (
                  <ToggleLeft size={32} className="text-yellow-400" />
                )}
              </button>
            </div>
          </div>

          {user.tradingMode === 'live' && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-semibold">
                LIVE TRADING ACTIVE: Real money will be used for all trades.
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
