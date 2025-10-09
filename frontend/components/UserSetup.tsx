'use client';

import { useState } from 'react';
import { Rocket, User, Mail, Users, Info, ChevronLeft, ChevronRight, ArrowRight, Target, DollarSign, TrendingUp, BookOpen, Clock, Zap, Save, X, CheckCircle, Activity, Search, Book, AlertCircle, BarChart3, Bell } from 'lucide-react';
import { createUser } from '../lib/userManagement';
import { GlassCard, GlassButton, GlassInput } from './GlassmorphicComponents';
import { theme } from '../styles/theme';

interface UserSetupProps {
  onComplete: () => void;
}

interface OnboardingField {
  name: string;
  label: string;
  type: 'select' | 'input' | 'multiselect';
  options?: string[];
  tooltip: string;
  icon?: any;
}

interface OnboardingPage {
  title: string;
  subtitle: string;
  fields?: OnboardingField[];
  type?: 'workflow' | 'preview';
}

// Available workflow wedges
const availableWedges = [
  { id: 'morning-routine', icon: Clock, label: 'Market Review', color: '#00ACC1' },
  { id: 'active-positions', icon: Target, label: 'Check Positions', color: '#00C851' },
  { id: 'research', icon: Search, label: 'Research Stocks', color: '#F97316' },
  { id: 'news-review', icon: Book, label: 'News Review', color: '#7E57C2' },
  { id: 'proposals', icon: Activity, label: 'AI Recommendations', color: '#0097A7' },
  { id: 'risk', icon: AlertCircle, label: 'Risk Check', color: '#FF8800' },
  { id: 'pnl-dashboard', icon: BarChart3, label: 'P&L Review', color: '#00BCD4' },
  { id: 'alerts', icon: Bell, label: 'Check Alerts', color: '#64748b' }
];

export default function UserSetup({ onComplete }: UserSetupProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    testGroup: '',
    financialGoals: '',
    investmentHorizon: '',
    availableCapital: '',
    currentAssets: '',
    riskTolerance: '',
    tradingExperience: '',
    preferredStrategy: '',
    // New fields
    investmentTypes: [] as string[],
    investmentRangeMin: '',
    investmentRangeMax: '',
    amountToInvest: '',
    automationLevel: '',
    executionMode: '',
    morningRoutineWorkflow: [] as string[]
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const onboardingPages: OnboardingPage[] = [
    {
      title: 'Welcome to PaiiD',
      subtitle: 'Let\'s get started with your profile',
      fields: [
        {
          name: 'displayName',
          label: 'Display Name',
          type: 'input',
          tooltip: 'This is how you\'ll be identified in the platform. Choose a name you\'re comfortable with.',
          icon: User
        },
        {
          name: 'email',
          label: 'Email (Optional)',
          type: 'input',
          tooltip: 'We\'ll use this to send you important updates and notifications. Your email is kept private.',
          icon: Mail
        },
        {
          name: 'testGroup',
          label: 'Test Group (Optional)',
          type: 'select',
          options: ['', 'alpha', 'beta', 'control', 'advanced'],
          tooltip: 'Select your tester group if you were assigned one. This helps us organize feedback.',
          icon: Users
        }
      ]
    },
    {
      title: 'Financial Goals',
      subtitle: 'Help us personalize your experience',
      fields: [
        {
          name: 'financialGoals',
          label: 'What are your primary financial goals?',
          type: 'select',
          options: ['', 'Wealth Building', 'Retirement Planning', 'Income Generation', 'Capital Preservation', 'Mix of Goals'],
          tooltip: 'This helps us recommend appropriate strategies and risk levels aligned with your objectives.',
          icon: Target
        },
        {
          name: 'investmentHorizon',
          label: 'Investment Time Horizon',
          type: 'select',
          options: ['', 'Short-term (< 1 year)', 'Medium-term (1-5 years)', 'Long-term (5+ years)'],
          tooltip: 'Your time horizon affects strategy selection - longer horizons typically allow for more growth-oriented approaches.',
          icon: TrendingUp
        }
      ]
    },
    {
      title: 'Financial Profile',
      subtitle: 'Understanding your investment capacity',
      fields: [
        {
          name: 'availableCapital',
          label: 'Available Investment Capital',
          type: 'select',
          options: ['', '$0 - $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', '$500K+'],
          tooltip: 'This determines position sizing recommendations and helps us calibrate portfolio metrics. Your information is encrypted and private.',
          icon: DollarSign
        },
        {
          name: 'currentAssets',
          label: 'Current Investment Holdings',
          type: 'select',
          options: ['', 'None (Starting fresh)', 'Stocks only', 'Stocks & Bonds', 'Diversified Portfolio', 'Alternative Investments'],
          tooltip: 'Understanding your existing holdings helps us avoid over-concentration and suggest complementary strategies.',
          icon: BookOpen
        }
      ]
    },
    {
      title: 'Risk & Experience',
      subtitle: 'Define your trading approach',
      fields: [
        {
          name: 'riskTolerance',
          label: 'Risk Tolerance',
          type: 'select',
          options: ['', 'Conservative', 'Moderate', 'Aggressive', 'Very Aggressive'],
          tooltip: 'This sets default stop-loss levels, position sizes, and strategy recommendations. You can adjust individual trades later.',
          icon: TrendingUp
        },
        {
          name: 'tradingExperience',
          label: 'Trading Experience Level',
          type: 'select',
          options: ['', 'Beginner (< 1 year)', 'Intermediate (1-3 years)', 'Advanced (3-5 years)', 'Expert (5+ years)'],
          tooltip: 'We\'ll customize the interface complexity and provide educational resources matched to your experience level.',
          icon: BookOpen
        },
        {
          name: 'preferredStrategy',
          label: 'Preferred Trading Strategy',
          type: 'select',
          options: ['', 'Value Investing', 'Growth Investing', 'Dividend Income', 'Momentum Trading', 'Swing Trading', 'Day Trading', 'Mix of Strategies'],
          tooltip: 'Your initial strategy selection configures default screens, alerts, and workflow priorities. You can create multiple strategies later.',
          icon: Target
        }
      ]
    },
    {
      title: 'Investment Details',
      subtitle: 'Define your investment parameters',
      fields: [
        {
          name: 'investmentTypes',
          label: 'Types of Investments',
          type: 'multiselect',
          options: ['Individual Stocks', 'ETFs', 'Options', 'Bonds', 'Crypto', 'Commodities'],
          tooltip: 'Select all asset types you want to trade. This configures available research tools and screening options.'
        },
        {
          name: 'investmentRangeMin',
          label: 'Minimum Investment per Position',
          type: 'select',
          options: ['', '$100', '$500', '$1,000', '$5,000', '$10,000'],
          tooltip: 'Sets the minimum amount for each individual position. Helps with diversification and position sizing.'
        },
        {
          name: 'investmentRangeMax',
          label: 'Maximum Investment per Position',
          type: 'select',
          options: ['', '$1,000', '$5,000', '$10,000', '$25,000', '$50,000', 'No Limit'],
          tooltip: 'Sets the maximum amount for each position. Prevents over-concentration in single positions.'
        },
        {
          name: 'amountToInvest',
          label: 'Initial Amount to Deploy',
          type: 'select',
          options: ['', '25% of capital', '50% of capital', '75% of capital', '100% of capital', 'Custom amount'],
          tooltip: 'How much of your available capital to deploy initially. Remaining capital stays as buying power for opportunities.'
        }
      ]
    },
    {
      title: 'Automation & Execution',
      subtitle: 'How hands-on do you want to be?',
      fields: [
        {
          name: 'automationLevel',
          label: 'Automation Level',
          type: 'select',
          options: ['', 'Manual (I control everything)', 'Mixed (AI suggests, I approve)', 'Auto (AI executes within limits)'],
          tooltip: 'Manual: You make all decisions. Mixed: AI provides recommendations you review. Auto: AI trades automatically within your risk parameters and requires your approval for large trades.'
        },
        {
          name: 'executionMode',
          label: 'Trade Execution Mode',
          type: 'select',
          options: ['', 'Manual Approval Required', 'Auto-Execute Small Trades', 'Auto-Execute All Trades'],
          tooltip: 'Manual: Confirm every trade. Auto Small: Trades under $1K execute automatically. Auto All: All trades execute per strategy (you can always override).'
        }
      ]
    },
    {
      title: 'Build Your Morning Routine',
      subtitle: 'Customize your daily workflow',
      type: 'workflow'
    },
    {
      title: 'Strategy Preview',
      subtitle: 'Review your projected performance',
      type: 'preview'
    }
  ];

  const page = onboardingPages[currentPage];
  const progress = ((currentPage + 1) / onboardingPages.length) * 100;
  const accentColor = theme.workflow.morningRoutine;

  const updateUserData = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleInvestmentType = (type: string) => {
    setUserData(prev => ({
      ...prev,
      investmentTypes: prev.investmentTypes.includes(type)
        ? prev.investmentTypes.filter(t => t !== type)
        : [...prev.investmentTypes, type]
    }));
  };

  const addToWorkflow = (wedgeId: string) => {
    if (!userData.morningRoutineWorkflow.includes(wedgeId)) {
      setUserData(prev => ({
        ...prev,
        morningRoutineWorkflow: [...prev.morningRoutineWorkflow, wedgeId]
      }));
    }
  };

  const removeFromWorkflow = (wedgeId: string) => {
    setUserData(prev => ({
      ...prev,
      morningRoutineWorkflow: prev.morningRoutineWorkflow.filter(id => id !== wedgeId)
    }));
  };

  const moveWorkflowItem = (index: number, direction: 'up' | 'down') => {
    const newWorkflow = [...userData.morningRoutineWorkflow];
    if (direction === 'up' && index > 0) {
      [newWorkflow[index], newWorkflow[index - 1]] = [newWorkflow[index - 1], newWorkflow[index]];
    } else if (direction === 'down' && index < newWorkflow.length - 1) {
      [newWorkflow[index], newWorkflow[index + 1]] = [newWorkflow[index + 1], newWorkflow[index]];
    }
    setUserData(prev => ({ ...prev, morningRoutineWorkflow: newWorkflow }));
  };

  const calculateProjectedPL = () => {
    const capitalMap: { [key: string]: number } = {
      '$0 - $10K': 5000,
      '$10K - $50K': 30000,
      '$50K - $100K': 75000,
      '$100K - $500K': 300000,
      '$500K+': 750000
    };

    const riskMultiplier: { [key: string]: number } = {
      'Conservative': 0.05,
      'Moderate': 0.08,
      'Aggressive': 0.12,
      'Very Aggressive': 0.18
    };

    const strategyMultiplier: { [key: string]: number } = {
      'Value Investing': 1.0,
      'Growth Investing': 1.2,
      'Dividend Income': 0.8,
      'Momentum Trading': 1.5,
      'Swing Trading': 1.3,
      'Day Trading': 1.8,
      'Mix of Strategies': 1.1
    };

    const capital = capitalMap[userData.availableCapital] || 50000;
    const risk = riskMultiplier[userData.riskTolerance] || 0.08;
    const strategy = strategyMultiplier[userData.preferredStrategy] || 1.0;

    const projectedMonthly = capital * risk * strategy;
    const projectedYearly = projectedMonthly * 12;

    return {
      monthly: projectedMonthly,
      yearly: projectedYearly,
      dailyAvg: projectedMonthly / 20
    };
  };

  const validateCurrentPage = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!page.fields) return true;

    page.fields.forEach(field => {
      if (field.type === 'multiselect') {
        if (userData.investmentTypes.length === 0) {
          newErrors[field.name] = 'Please select at least one investment type';
        }
      } else {
        const value = userData[field.name as keyof typeof userData];

        if (currentPage === 0) {
          if (field.name === 'displayName' && !String(value).trim()) {
            newErrors[field.name] = 'Display name is required';
          } else if (field.name === 'displayName' && String(value).trim().length < 2) {
            newErrors[field.name] = 'Display name must be at least 2 characters';
          }
          if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            newErrors[field.name] = 'Invalid email format';
          }
        } else {
          if (!value || String(value).trim() === '') {
            newErrors[field.name] = `${field.label} is required`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isPageComplete = (): boolean => {
    if (page.type === 'workflow') {
      return userData.morningRoutineWorkflow.length > 0;
    }
    if (page.type === 'preview') {
      return true;
    }
    if (currentPage === 0) {
      return userData.displayName.trim().length >= 2;
    }
    if (!page.fields) return false;

    return page.fields.every(field => {
      if (field.type === 'multiselect') {
        return userData.investmentTypes.length > 0;
      }
      const value = userData[field.name as keyof typeof userData];
      return value && String(value).trim() !== '';
    });
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;

    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    try {
      const user = createUser(
        userData.displayName.trim(),
        userData.email.trim() || undefined,
        userData.testGroup || undefined,
        {
          financialGoals: userData.financialGoals,
          investmentHorizon: userData.investmentHorizon,
          availableCapital: userData.availableCapital,
          currentAssets: userData.currentAssets,
          riskTolerance: userData.riskTolerance,
          tradingExperience: userData.tradingExperience,
          preferredStrategy: userData.preferredStrategy,
          investmentTypes: userData.investmentTypes,
          investmentRangeMin: userData.investmentRangeMin,
          investmentRangeMax: userData.investmentRangeMax,
          amountToInvest: userData.amountToInvest,
          automationLevel: userData.automationLevel,
          executionMode: userData.executionMode,
          morningRoutineWorkflow: userData.morningRoutineWorkflow,
        }
      );

      console.log('User created successfully:', user.userId);

      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors({ submit: 'Failed to create user. Please try again.' });
      setIsSubmitting(false);
    }
  };

  // Workflow Builder Page
  if (page.type === 'workflow') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: theme.background.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '900px', margin: 'auto' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
                Step {currentPage + 1} of {onboardingPages.length}
              </span>
              <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: theme.background.input,
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(to right, ${accentColor}, ${theme.colors.primary})`,
                transition: 'width 0.5s ease',
                borderRadius: '10px',
              }} />
            </div>
          </div>

          <GlassCard glow="teal">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h1 style={{ color: theme.colors.text, fontSize: '28px', fontWeight: 700, margin: 0 }}>
                {page.title}
              </h1>
              <div
                style={{ cursor: 'help', position: 'relative' }}
                onMouseEnter={() => setShowTooltip('workflow')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <Info size={20} style={{ color: theme.colors.textMuted }} />
                {showTooltip === 'workflow' && (
                  <div style={{
                    position: 'absolute',
                    left: '28px',
                    top: 0,
                    width: '320px',
                    background: theme.background.glass,
                    backdropFilter: theme.blur.light,
                    border: `1px solid ${accentColor}50`,
                    borderRadius: theme.borderRadius.md,
                    padding: '12px',
                    fontSize: '11px',
                    color: theme.colors.text,
                    lineHeight: '1.4',
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}>
                    Your morning routine is the workflow you'll follow each trading day. Select steps in the order you want to complete them. This helps establish consistent habits and ensures you don't miss critical steps.
                  </div>
                )}
              </div>
            </div>
            <p style={{ color: theme.colors.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
              {page.subtitle}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Available Steps */}
              <div>
                <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  Available Steps
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableWedges.map(wedge => {
                    const Icon = wedge.icon;
                    const isAdded = userData.morningRoutineWorkflow.includes(wedge.id);
                    return (
                      <button
                        key={wedge.id}
                        onClick={() => addToWorkflow(wedge.id)}
                        disabled={isAdded}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: isAdded ? theme.background.input : theme.background.glass,
                          border: `1px solid ${isAdded ? theme.colors.border : `${wedge.color}50`}`,
                          borderRadius: theme.borderRadius.md,
                          color: isAdded ? theme.colors.textMuted : theme.colors.text,
                          cursor: isAdded ? 'not-allowed' : 'pointer',
                          transition: theme.transitions.fast,
                          opacity: isAdded ? 0.5 : 1,
                        }}
                      >
                        <Icon size={20} style={{ color: wedge.color }} />
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '14px' }}>{wedge.label}</span>
                        {isAdded && <CheckCircle size={18} style={{ color: theme.colors.primary }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Your Workflow */}
              <div>
                <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  Your Morning Routine ({userData.morningRoutineWorkflow.length} steps)
                </h3>
                {userData.morningRoutineWorkflow.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '400px',
                    background: theme.background.input,
                    border: `2px dashed ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.textMuted,
                    textAlign: 'center',
                    fontSize: '14px',
                  }}>
                    Click steps on the left<br />to build your routine
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userData.morningRoutineWorkflow.map((wedgeId, idx) => {
                      const wedge = availableWedges.find(w => w.id === wedgeId);
                      if (!wedge) return null;
                      const Icon = wedge.icon;
                      return (
                        <div
                          key={wedgeId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: `${theme.colors.primary}20`,
                            border: `1px solid ${theme.colors.primary}50`,
                            borderRadius: theme.borderRadius.md,
                          }}
                        >
                          <span style={{ color: theme.colors.primary, fontWeight: 700, width: '24px' }}>{idx + 1}.</span>
                          <Icon size={20} style={{ color: wedge.color }} />
                          <span style={{ flex: 1, color: theme.colors.text, fontSize: '14px' }}>{wedge.label}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => moveWorkflowItem(idx, 'up')}
                              disabled={idx === 0}
                              style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                opacity: idx === 0 ? 0.3 : 1,
                              }}
                            >
                              <ChevronLeft size={16} style={{ color: theme.colors.text, transform: 'rotate(90deg)' }} />
                            </button>
                            <button
                              onClick={() => moveWorkflowItem(idx, 'down')}
                              disabled={idx === userData.morningRoutineWorkflow.length - 1}
                              style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: idx === userData.morningRoutineWorkflow.length - 1 ? 'not-allowed' : 'pointer',
                                opacity: idx === userData.morningRoutineWorkflow.length - 1 ? 0.3 : 1,
                              }}
                            >
                              <ChevronRight size={16} style={{ color: theme.colors.text, transform: 'rotate(90deg)' }} />
                            </button>
                            <button
                              onClick={() => removeFromWorkflow(wedgeId)}
                              style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={16} style={{ color: theme.colors.danger }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={16} />
                Back
              </GlassButton>

              <GlassButton
                onClick={handleNext}
                disabled={!isPageComplete()}
                variant="primary"
                style={{
                  flex: 1,
                  fontSize: '15px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isPageComplete() ? theme.glow.teal : 'none',
                }}
              >
                Continue
                <ArrowRight size={16} />
              </GlassButton>
            </div>
          </GlassCard>

          {/* Page Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {onboardingPages.map((_, idx) => (
              <div
                key={idx}
                style={{
                  height: '8px',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                  ...(idx === currentPage
                    ? { width: '32px', background: accentColor }
                    : idx < currentPage
                    ? { width: '8px', background: theme.colors.primary }
                    : { width: '8px', background: theme.colors.border }),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Preview Page
  if (page.type === 'preview') {
    const projections = calculateProjectedPL();

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: theme.background.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '800px', margin: 'auto' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
                Step {currentPage + 1} of {onboardingPages.length}
              </span>
              <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: theme.background.input,
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(to right, ${accentColor}, ${theme.colors.primary})`,
                transition: 'width 0.5s ease',
                borderRadius: '10px',
              }} />
            </div>
          </div>

          <GlassCard glow="teal">
            <h1 style={{ color: theme.colors.text, fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>
              {page.title}
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
              {page.subtitle}
            </p>

            {/* Profile Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                padding: '16px',
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
              }}>
                <h3 style={{
                  color: theme.colors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <User size={16} style={{ color: accentColor }} />
                  Your Profile
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Goal:</span>
                    <span style={{ color: theme.colors.text }}>{userData.financialGoals}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Risk:</span>
                    <span style={{ color: theme.colors.text }}>{userData.riskTolerance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Strategy:</span>
                    <span style={{ color: theme.colors.text }}>{userData.preferredStrategy}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Capital:</span>
                    <span style={{ color: theme.colors.text }}>{userData.availableCapital}</span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
              }}>
                <h3 style={{
                  color: theme.colors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Zap size={16} style={{ color: theme.colors.warning }} />
                  Automation Setup
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Level:</span>
                    <span style={{ color: theme.colors.text }}>{userData.automationLevel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Execution:</span>
                    <span style={{ color: theme.colors.text }}>{userData.executionMode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.colors.textMuted }}>Range:</span>
                    <span style={{ color: theme.colors.text }}>{userData.investmentRangeMin} - {userData.investmentRangeMax}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Projected P/L */}
            <div style={{
              padding: '16px',
              background: `${theme.colors.primary}20`,
              border: `1px solid ${theme.colors.primary}50`,
              borderRadius: theme.borderRadius.md,
              marginBottom: '20px',
            }}>
              <h3 style={{
                color: theme.colors.text,
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <TrendingUp size={16} style={{ color: theme.colors.primary }} />
                Projected Performance
              </h3>
              <p style={{ color: theme.colors.textMuted, fontSize: '11px', marginBottom: '12px' }}>
                Based on your {userData.riskTolerance} risk tolerance and {userData.preferredStrategy} strategy:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: theme.background.input,
                  borderRadius: theme.borderRadius.md,
                  textAlign: 'center',
                }}>
                  <p style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '4px' }}>Daily Avg</p>
                  <p style={{ color: theme.colors.primary, fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    +${projections.dailyAvg.toFixed(2)}
                  </p>
                </div>
                <div style={{
                  padding: '12px',
                  background: theme.background.input,
                  borderRadius: theme.borderRadius.md,
                  textAlign: 'center',
                }}>
                  <p style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '4px' }}>Monthly</p>
                  <p style={{ color: theme.colors.primary, fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    +${projections.monthly.toFixed(2)}
                  </p>
                </div>
                <div style={{
                  padding: '12px',
                  background: theme.background.input,
                  borderRadius: theme.borderRadius.md,
                  textAlign: 'center',
                }}>
                  <p style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '4px' }}>Yearly</p>
                  <p style={{ color: theme.colors.primary, fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    +${projections.yearly.toFixed(2)}
                  </p>
                </div>
              </div>
              <p style={{ color: theme.colors.textMuted, fontSize: '10px', marginTop: '12px', opacity: 0.7 }}>
                * Estimates based on historical performance. Past performance does not guarantee future results.
              </p>
            </div>

            {/* Morning Routine */}
            <div style={{
              padding: '16px',
              background: theme.background.input,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              marginBottom: '20px',
            }}>
              <h3 style={{
                color: theme.colors.text,
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Clock size={16} style={{ color: accentColor }} />
                Your Morning Routine
              </h3>
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {userData.morningRoutineWorkflow.map((wedgeId) => {
                  const wedge = availableWedges.find(w => w.id === wedgeId);
                  if (!wedge) return null;
                  const Icon = wedge.icon;
                  return (
                    <li key={wedgeId} style={{ color: theme.colors.text, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={14} style={{ color: wedge.color }} />
                      {wedge.label}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={16} />
                Back
              </GlassButton>

              <GlassButton
                onClick={handleNext}
                disabled={isSubmitting}
                variant="primary"
                style={{
                  flex: 1,
                  fontSize: '16px',
                  padding: '14px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: theme.glow.green,
                  background: `linear-gradient(to right, ${theme.colors.primary}, #00C851)`,
                }}
              >
                <Save size={18} />
                {isSubmitting ? 'Setting up...' : 'Get Started & Save Profile!'}
              </GlassButton>
            </div>
          </GlassCard>

          {/* Page Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {onboardingPages.map((_, idx) => (
              <div
                key={idx}
                style={{
                  height: '8px',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                  ...(idx === currentPage
                    ? { width: '32px', background: accentColor }
                    : idx < currentPage
                    ? { width: '8px', background: theme.colors.primary }
                    : { width: '8px', background: theme.colors.border }),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Standard Form Pages (Pages 0-5)
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: theme.background.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
              Step {currentPage + 1} of {onboardingPages.length}
            </span>
            <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: theme.background.input,
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: `linear-gradient(to right, ${accentColor}, ${theme.colors.primary})`,
              transition: 'width 0.5s ease',
              borderRadius: '10px',
            }} />
          </div>
        </div>

        <GlassCard glow="teal">
          {/* Header */}
          {currentPage === 0 && (
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              {/* Main Logo */}
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                letterSpacing: '2px',
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  P
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  a
                </span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.5)',
                    animation: 'glow-ai 3s ease-in-out infinite',
                    fontStyle: 'italic',
                  }}
                >
                  aii
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  D
                </span>
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: '16px',
                color: '#94a3b8',
                margin: '0 0 8px 0',
                letterSpacing: '0.5px',
              }}>
                Personal <span style={{ color: '#45f0c0', fontStyle: 'italic' }}>artificial intelligence</span>/investment Dashboard
              </p>

              {/* Sub-subtitle */}
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
              }}>
                Let's set up your trading account
              </p>
            </div>
          )}

          <h1 style={{ color: theme.colors.text, fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>
            {page.title}
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
            {page.subtitle}
          </p>

          {/* Info Banner (page 0 only) */}
          {currentPage === 0 && (
            <div style={{
              padding: '12px',
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              borderRadius: theme.borderRadius.md,
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</div>
                <div>
                  <div style={{
                    color: theme.colors.text,
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}>
                    Paper Trading Mode
                  </div>
                  <div style={{
                    color: theme.colors.textMuted,
                    fontSize: '11px',
                    lineHeight: '1.4',
                  }}>
                    Testing environment - All trades are simulated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {page.fields?.map((field, idx) => {
              const Icon = field.icon;
              const value = userData[field.name as keyof typeof userData];

              return (
                <div key={idx}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}>
                    {Icon && <Icon size={16} style={{ color: accentColor }} />}
                    <label style={{
                      color: theme.colors.textMuted,
                      fontSize: '13px',
                      fontWeight: 600,
                      flex: 1,
                    }}>
                      {field.label}
                      {((currentPage === 0 && field.name === 'displayName') || currentPage > 0) && (
                        <span style={{ color: theme.colors.danger, marginLeft: '4px' }}>*</span>
                      )}
                    </label>
                    <div
                      style={{ position: 'relative', cursor: 'help' }}
                      onMouseEnter={() => setShowTooltip(field.name)}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <Info size={14} style={{ color: theme.colors.textMuted }} />
                      {showTooltip === field.name && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '24px',
                          width: '280px',
                          background: theme.background.glass,
                          backdropFilter: theme.blur.light,
                          border: `1px solid ${accentColor}50`,
                          borderRadius: theme.borderRadius.md,
                          padding: '12px',
                          fontSize: '11px',
                          color: theme.colors.text,
                          lineHeight: '1.4',
                          zIndex: 100,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        }}>
                          {field.tooltip}
                        </div>
                      )}
                    </div>
                  </div>

                  {field.type === 'multiselect' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {field.options?.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => toggleInvestmentType(option)}
                          style={{
                            padding: '12px',
                            background: userData.investmentTypes.includes(option)
                              ? `${theme.colors.primary}40`
                              : theme.background.input,
                            border: `1px solid ${userData.investmentTypes.includes(option)
                              ? theme.colors.primary
                              : theme.colors.border}`,
                            borderRadius: theme.borderRadius.md,
                            color: theme.colors.text,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: theme.transitions.fast,
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          {option}
                          {userData.investmentTypes.includes(option) && (
                            <CheckCircle size={16} style={{ color: theme.colors.primary }} />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'input' ? (
                    <GlassInput
                      value={String(value)}
                      onChange={(val) => updateUserData(field.name, val)}
                      placeholder={field.name === 'email' ? 'your.email@example.com' : 'Enter your ' + field.label.toLowerCase()}
                      type={field.name === 'email' ? 'email' : 'text'}
                    />
                  ) : (
                    <select
                      value={String(value)}
                      onChange={(e) => updateUserData(field.name, e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        background: theme.background.input,
                        backdropFilter: theme.blur.light,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        padding: '12px',
                        color: theme.colors.text,
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: theme.transitions.fast,
                      }}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.slice(1).map((option, optIdx) => (
                        <option key={optIdx} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {errors[field.name] && (
                    <p style={{
                      color: theme.colors.danger,
                      fontSize: '11px',
                      margin: '4px 0 0',
                    }}>
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div style={{
              padding: '12px',
              background: `${theme.colors.danger}20`,
              border: `1px solid ${theme.colors.danger}50`,
              borderRadius: theme.borderRadius.md,
              marginTop: '16px',
            }}>
              <p style={{ color: theme.colors.danger, fontSize: '12px', margin: 0 }}>
                {errors.submit}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            {currentPage > 0 && (
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={16} />
                Back
              </GlassButton>
            )}

            <GlassButton
              onClick={handleNext}
              disabled={!isPageComplete() || isSubmitting}
              variant="primary"
              style={{
                flex: 1,
                fontSize: '15px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isPageComplete() ? theme.glow.teal : 'none',
              }}
            >
              Continue
              <ArrowRight size={16} />
            </GlassButton>
          </div>

          {/* Terms Notice (page 0 only) */}
          {currentPage === 0 && (
            <p style={{
              color: theme.colors.textMuted,
              fontSize: '10px',
              textAlign: 'center',
              margin: '12px 0 0',
              lineHeight: '1.4',
              opacity: 0.7,
            }}>
              By continuing, you agree to participate in paper trading testing
            </p>
          )}
        </GlassCard>

        {/* Page Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {onboardingPages.map((_, idx) => (
            <div
              key={idx}
              style={{
                height: '8px',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                ...(idx === currentPage
                  ? { width: '32px', background: accentColor }
                  : idx < currentPage
                  ? { width: '8px', background: theme.colors.primary }
                  : { width: '8px', background: theme.colors.border }),
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes glow-ai {
          0%, 100% {
            text-shadow: 0 0 15px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.4);
          }
          50% {
            text-shadow: 0 0 25px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.6), 0 0 75px rgba(16, 185, 129, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
