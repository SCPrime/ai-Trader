/**
 * Morning Routine with AI Scheduler
 * Schedule custom morning trading routines with AI assistance
 */

import { useState, useEffect } from 'react';
import {
  Sun,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Bell,
  Loader2,
  Brain,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassBadge } from './GlassmorphicComponents';
import { theme } from '../styles/theme';
import { claudeAI, MorningRoutine as MorningRoutineType } from '../lib/aiAdapter';
import { getCurrentUser, updateUser } from '../lib/userManagement';
import { AILogoTrigger } from './AIChat';

interface PortfolioMetrics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  buyingPower: number;
}

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface NewsItem {
  title: string;
  impact: 'high' | 'medium' | 'low';
  time: string;
}

export default function MorningRoutineAI() {
  const [view, setView] = useState<'dashboard' | 'scheduler'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Dashboard data
  const [systemChecks] = useState<SystemCheck[]>([
    { name: 'API Connection', status: 'pass', message: 'Connected to Alpaca' },
    { name: 'Market Data', status: 'pass', message: 'Real-time feed active' },
    { name: 'Account Status', status: 'pass', message: 'Paper trading account active' },
    { name: 'Risk Limits', status: 'warning', message: 'Daily loss at 75%' },
  ]);

  const [portfolio] = useState<PortfolioMetrics>({
    totalValue: 18234.56,
    dayChange: 156.23,
    dayChangePercent: 0.86,
    buyingPower: 8500.0,
  });

  const [todaysNews] = useState<NewsItem[]>([
    { title: 'Fed Interest Rate Decision', impact: 'high', time: '2:00 PM ET' },
    { title: 'Tech Earnings: AAPL, MSFT', impact: 'high', time: 'After Close' },
    { title: 'Unemployment Claims', impact: 'medium', time: '8:30 AM ET' },
    { title: 'Oil Inventory Report', impact: 'low', time: '10:30 AM ET' },
  ]);

  // Scheduler data
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('07:00');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekdays' | 'custom'>('weekdays');
  const [customDays, setCustomDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [selectedSteps, setSelectedSteps] = useState<string[]>(['briefing', 'recommendations', 'portfolio']);

  // AI Routine Builder
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved schedule from user profile
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.onboarding?.morningRoutine) {
      const routine = user.onboarding.morningRoutine;
      setScheduleEnabled(routine.enabled);
      setScheduleTime(routine.time);
      if (routine.briefing) setSelectedSteps((prev) => [...prev, 'briefing']);
      if (routine.recommendations) setSelectedSteps((prev) => [...prev, 'recommendations']);
      if (routine.portfolioReview) setSelectedSteps((prev) => [...prev, 'portfolio']);
    }
  }, []);

  const getMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 9 && hour < 16;

    return {
      isOpen: isWeekday && isMarketHours,
      nextEvent: isWeekday && !isMarketHours ? 'Opens at 9:30 AM ET' : 'Closes at 4:00 PM ET',
      currentTime: now.toLocaleTimeString('en-US'),
    };
  };

  const runMorningChecks = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleSaveSchedule = () => {
    const user = getCurrentUser();
    if (!user) return;

    updateUser({
      onboarding: {
        ...user.onboarding,
        morningRoutine: {
          enabled: scheduleEnabled,
          time: scheduleTime,
          briefing: selectedSteps.includes('briefing'),
          recommendations: selectedSteps.includes('recommendations'),
          portfolioReview: selectedSteps.includes('portfolio'),
        },
      },
    });

    alert('Morning routine schedule saved!');
    setView('dashboard');
  };

  const handleGenerateAIRoutine = async () => {
    if (!aiInput.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const routine = await claudeAI.generateMorningRoutine(aiInput);

      // Map AI-generated routine to schedule settings
      setScheduleTime(routine.schedule.startTime);
      setScheduleFrequency(routine.schedule.frequency);

      // Extract step types from AI routine
      const stepTypes = routine.steps.map((step) => step.type);
      setSelectedSteps(stepTypes);

      setShowAIBuilder(false);
      setAiInput('');
      alert(`AI generated routine: "${routine.name}"`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate routine');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStep = (step: string) => {
    setSelectedSteps((prev) => (prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]));
  };

  const market = getMarketStatus();
  const accentColor = theme.workflow.morningRoutine;

  const availableSteps = [
    { id: 'briefing', label: 'Market Overview', icon: '📊', desc: 'Pre-market analysis and news' },
    { id: 'recommendations', label: 'AI Recommendations', icon: '🤖', desc: 'Personalized stock picks' },
    { id: 'portfolio', label: 'Portfolio Review', icon: '💼', desc: 'Overnight changes' },
    { id: 'news', label: 'News Review', icon: '📰', desc: 'Breaking market news' },
    { id: 'alerts', label: 'Check Alerts', icon: '🔔', desc: 'Price and volume alerts' },
    { id: 'scan', label: 'Pre-Market Scan', icon: '🔍', desc: 'Top movers and volume' },
  ];

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div
        style={{
          height: '100%',
          background: theme.background.primary,
          padding: theme.spacing.lg,
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div
                style={{
                  padding: theme.spacing.md,
                  background: `${accentColor}20`,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: theme.glow.teal,
                }}
              >
                <Sun style={{ width: '32px', height: '32px', color: accentColor }} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    margin: 0,
                  }}
                >
                  Morning Routine
                </h1>
                <p
                  style={{
                    color: theme.colors.textMuted,
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                  }}
                >
                  {currentTime.toLocaleTimeString('en-US')} • {market.nextEvent}
                </p>
              </div>
            </div>

            <GlassButton onClick={() => setView('scheduler')} variant="workflow" workflowColor="morningRoutine">
              <Calendar style={{ width: '18px', height: '18px' }} />
              Schedule Routine
            </GlassButton>
          </div>

          {/* Market Status */}
          <GlassCard glow="teal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>Market Status</h3>
              <GlassBadge variant={market.isOpen ? 'success' : 'warning'}>{market.isOpen ? 'OPEN' : 'CLOSED'}</GlassBadge>
            </div>
            <p style={{ color: theme.colors.textMuted, margin: 0 }}>{market.nextEvent}</p>
          </GlassCard>

          {/* Portfolio Snapshot */}
          <GlassCard>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.md }}>
              Portfolio Snapshot
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Total Value</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                  ${portfolio.totalValue.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Day Change</p>
                <p
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: portfolio.dayChange >= 0 ? theme.colors.primary : theme.colors.danger,
                    margin: 0,
                  }}
                >
                  {portfolio.dayChange >= 0 ? '+' : ''}${portfolio.dayChange.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Day %</p>
                <p
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: portfolio.dayChangePercent >= 0 ? theme.colors.primary : theme.colors.danger,
                    margin: 0,
                  }}
                >
                  {portfolio.dayChangePercent >= 0 ? '+' : ''}
                  {portfolio.dayChangePercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Buying Power</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                  ${portfolio.buyingPower.toLocaleString()}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* System Checks */}
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>System Checks</h3>
              <GlassButton onClick={runMorningChecks} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} /> : 'Run Checks'}
              </GlassButton>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {systemChecks.map((check, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: theme.spacing.sm,
                    background: `${
                      check.status === 'pass'
                        ? theme.colors.primary
                        : check.status === 'warning'
                        ? theme.colors.warning
                        : theme.colors.danger
                    }10`,
                    border: `1px solid ${
                      check.status === 'pass'
                        ? theme.colors.primary
                        : check.status === 'warning'
                        ? theme.colors.warning
                        : theme.colors.danger
                    }30`,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    {check.status === 'pass' && <CheckCircle style={{ width: '18px', height: '18px', color: theme.colors.primary }} />}
                    {check.status === 'warning' && <AlertCircle style={{ width: '18px', height: '18px', color: theme.colors.warning }} />}
                    {check.status === 'fail' && <XCircle style={{ width: '18px', height: '18px', color: theme.colors.danger }} />}
                    <span style={{ color: theme.colors.text, fontWeight: '600' }}>{check.name}</span>
                  </div>
                  <span style={{ color: theme.colors.textMuted, fontSize: '14px' }}>{check.message}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Today's News */}
          <GlassCard>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.md }}>
              Today's Market Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {todaysNews.map((news, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: theme.spacing.sm,
                    background: theme.background.glass,
                    borderRadius: theme.borderRadius.sm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <GlassBadge
                      variant={news.impact === 'high' ? 'danger' : news.impact === 'medium' ? 'warning' : 'info'}
                    >
                      {news.impact}
                    </GlassBadge>
                    <span style={{ color: theme.colors.text }}>{news.title}</span>
                  </div>
                  <span style={{ color: theme.colors.textMuted, fontSize: '14px' }}>{news.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Scheduler View
  return (
    <div
      style={{
        height: '100%',
        background: theme.background.primary,
        padding: theme.spacing.lg,
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Logo */}
        <div>
          <AILogoTrigger onClick={() => {}} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div
              style={{
                padding: theme.spacing.md,
                background: `${accentColor}20`,
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.glow.teal,
              }}
            >
              <Calendar style={{ width: '32px', height: '32px', color: accentColor }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  margin: 0,
                }}
              >
                Morning Routine Scheduler
              </h1>
              <p
                style={{
                  color: theme.colors.textMuted,
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                }}
              >
                Automate your daily trading routine
              </p>
            </div>
          </div>

          <GlassButton onClick={() => setView('dashboard')} variant="secondary">
            Back to Dashboard
          </GlassButton>
        </div>

        {/* Enable Toggle */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: `0 0 ${theme.spacing.xs} 0` }}>
                Enable Morning Routine
              </h3>
              <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: '14px' }}>
                Get daily briefings and recommendations at your scheduled time
              </p>
            </div>
            <button
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              style={{
                width: '56px',
                height: '32px',
                borderRadius: '16px',
                border: 'none',
                background: scheduleEnabled ? theme.colors.primary : theme.colors.border,
                cursor: 'pointer',
                position: 'relative',
                transition: theme.transitions.fast,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '4px',
                  left: scheduleEnabled ? '28px' : '4px',
                  transition: theme.transitions.fast,
                }}
              />
            </button>
          </div>
        </GlassCard>

        {scheduleEnabled && (
          <>
            {/* Schedule Time */}
            <GlassCard>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.md }}>
                Schedule Time
              </h3>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: '24px',
                  fontWeight: '600',
                  textAlign: 'center',
                  background: theme.background.input,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text,
                  outline: 'none',
                }}
              />
            </GlassCard>

            {/* Frequency */}
            <GlassCard>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.md }}>
                Frequency
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm }}>
                {(['daily', 'weekdays', 'custom'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setScheduleFrequency(freq)}
                    style={{
                      padding: theme.spacing.md,
                      background: scheduleFrequency === freq ? `${accentColor}20` : theme.background.glass,
                      border: `2px solid ${scheduleFrequency === freq ? accentColor : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: theme.transitions.fast,
                    }}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Routine Steps */}
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>Routine Steps</h3>
                <GlassButton onClick={() => setShowAIBuilder(!showAIBuilder)} variant="workflow" workflowColor="strategyBuilder">
                  <Sparkles style={{ width: '16px', height: '16px' }} />
                  AI Builder
                </GlassButton>
              </div>

              {showAIBuilder && (
                <div style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md, background: `${accentColor}10`, borderRadius: theme.borderRadius.md }}>
                  <p style={{ color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.sm} 0`, fontSize: '14px' }}>
                    Describe your ideal morning routine:
                  </p>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Example: Show me top 3 pre-market movers, check news on my positions, alert me if any earnings today"
                    disabled={isGenerating}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      color: theme.colors.text,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      marginBottom: theme.spacing.sm,
                    }}
                  />
                  <GlassButton onClick={handleGenerateAIRoutine} disabled={!aiInput.trim() || isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain style={{ width: '16px', height: '16px' }} />
                        Generate Routine
                      </>
                    )}
                  </GlassButton>
                  {error && (
                    <p style={{ color: theme.colors.danger, margin: `${theme.spacing.sm} 0 0 0`, fontSize: '14px' }}>{error}</p>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.sm }}>
                {availableSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    style={{
                      padding: theme.spacing.md,
                      background: selectedSteps.includes(step.id) ? `${accentColor}20` : theme.background.glass,
                      border: `2px solid ${selectedSteps.includes(step.id) ? accentColor : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: theme.transitions.fast,
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: theme.spacing.xs }}>{step.icon}</div>
                    <div style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '4px' }}>{step.label}</div>
                    <div style={{ color: theme.colors.textMuted, fontSize: '12px' }}>{step.desc}</div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Preview */}
            <GlassCard style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}40` }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <Bell style={{ width: '20px', height: '20px', color: accentColor }} />
                Morning Briefing Preview
              </h3>
              <div
                style={{
                  padding: theme.spacing.md,
                  background: theme.background.glass,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <p style={{ color: theme.colors.text, fontWeight: '600', marginBottom: theme.spacing.sm }}>
                  Good morning! Here's your {scheduleTime} briefing:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, color: theme.colors.textMuted, fontSize: '14px' }}>
                  {selectedSteps.map((stepId) => {
                    const step = availableSteps.find((s) => s.id === stepId);
                    return step ? (
                      <div key={stepId}>
                        {step.icon} {step.label}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Save Button */}
            <GlassButton onClick={handleSaveSchedule}>
              <CheckCircle style={{ width: '18px', height: '18px' }} />
              Save Morning Routine
            </GlassButton>
          </>
        )}
      </div>
    </div>
  );
}
