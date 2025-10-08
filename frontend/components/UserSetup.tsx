'use client';

import { useState } from 'react';
import { Rocket, User, Mail, Users, Info, ChevronLeft, ArrowRight, Target, DollarSign, TrendingUp, BookOpen } from 'lucide-react';
import { createUser } from '../lib/userManagement';
import { GlassCard, GlassButton, GlassInput } from './GlassmorphicComponents';
import { theme } from '../styles/theme';

interface UserSetupProps {
  onComplete: () => void;
}

interface OnboardingField {
  name: string;
  label: string;
  type: 'select' | 'input';
  options?: string[];
  tooltip: string;
  icon?: any;
}

interface OnboardingPage {
  title: string;
  subtitle: string;
  fields: OnboardingField[];
}

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
    preferredStrategy: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const onboardingPages: OnboardingPage[] = [
    {
      title: 'Welcome to PaiD',
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
    }
  ];

  const page = onboardingPages[currentPage];
  const progress = ((currentPage + 1) / onboardingPages.length) * 100;
  const accentColor = theme.workflow.morningRoutine;

  const updateUserData = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentPage = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    page.fields.forEach(field => {
      const value = userData[field.name as keyof typeof userData];

      // Required fields validation (page 0 requires displayName, others require all fields)
      if (currentPage === 0) {
        if (field.name === 'displayName' && !value.trim()) {
          newErrors[field.name] = 'Display name is required';
        } else if (field.name === 'displayName' && value.trim().length < 2) {
          newErrors[field.name] = 'Display name must be at least 2 characters';
        }
        if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.name] = 'Invalid email format';
        }
      } else {
        if (!value || value.trim() === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isPageComplete = (): boolean => {
    if (currentPage === 0) {
      // Page 0 only requires displayName
      return userData.displayName.trim().length >= 2;
    }
    // Other pages require all fields to be filled
    return page.fields.every(field => {
      const value = userData[field.name as keyof typeof userData];
      return value && value.trim() !== '';
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
    if (!validateCurrentPage()) return;

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
      <div style={{
        width: '100%',
        maxWidth: '600px',
        margin: 'auto',
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{
              color: theme.colors.textMuted,
              fontSize: '12px',
            }}>
              Step {currentPage + 1} of {onboardingPages.length}
            </span>
            <span style={{
              color: theme.colors.textMuted,
              fontSize: '12px',
            }}>
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
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '900',
                fontStyle: 'italic',
                lineHeight: '1',
                marginBottom: '12px',
              }}>
                <span style={{ color: '#1a7560' }}>P</span>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  color: '#45f0c0',
                  textShadow: '0 0 20px #45f0c0',
                }}>a</span>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  color: '#58ffda',
                  textShadow: '0 0 25px #58ffda',
                }}>i</span>
                <span style={{ color: '#0d5a4a' }}>D</span>
              </div>
              <p style={{
                color: theme.colors.textMuted,
                fontSize: '13px',
                margin: 0,
              }}>
                AI-Powered Options Trading Platform
              </p>
            </div>
          )}

          <h1 style={{
            color: theme.colors.text,
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 8px',
          }}>
            {page.title}
          </h1>
          <p style={{
            color: theme.colors.textMuted,
            fontSize: '14px',
            margin: '0 0 24px',
          }}>
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
            {page.fields.map((field, idx) => {
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
                      {(currentPage === 0 && field.name === 'displayName') && (
                        <span style={{ color: theme.colors.danger, marginLeft: '4px' }}>*</span>
                      )}
                      {currentPage > 0 && (
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

                  {field.type === 'input' ? (
                    <GlassInput
                      value={value}
                      onChange={(val) => updateUserData(field.name, val)}
                      placeholder={field.name === 'email' ? 'your.email@example.com' : 'Enter your ' + field.label.toLowerCase()}
                      type={field.name === 'email' ? 'email' : 'text'}
                    />
                  ) : (
                    <select
                      value={value}
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
                      marginTop: '4px',
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
              <p style={{
                color: theme.colors.danger,
                fontSize: '12px',
                margin: 0,
              }}>
                {errors.submit}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
          }}>
            {currentPage > 0 && (
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
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
              {isSubmitting ? (
                'Setting up...'
              ) : currentPage === onboardingPages.length - 1 ? (
                <>
                  <Rocket size={16} />
                  Get Started!
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '20px',
        }}>
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
