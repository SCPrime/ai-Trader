'use client';

import { useState } from 'react';
import { Rocket, User, Mail, Users } from 'lucide-react';
import { createUser } from '../lib/userManagement';
import { GlassCard, GlassButton, GlassInput } from './GlassmorphicComponents';
import { theme } from '../styles/theme';

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
      const user = createUser(
        displayName.trim(),
        email.trim() || undefined,
        testGroup || undefined
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

  const accentColor = theme.workflow.morningRoutine;

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
        maxWidth: '500px',
        margin: 'auto',
      }}>
        <GlassCard style={{
          position: 'relative',
          zIndex: 1,
        }} glow="teal">
          {/* Header with PaiD Logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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

            <h1 style={{
              color: theme.colors.text,
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 6px',
            }}>
              Welcome to PaiD
            </h1>
            <p style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
              margin: 0,
            }}>
              AI-Powered Options Trading Platform
            </p>
          </div>

          {/* Info Banner */}
          <div style={{
            padding: '12px',
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}50`,
            borderRadius: theme.borderRadius.md,
            marginBottom: '20px',
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

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Display Name */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme.colors.textMuted,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
              }}>
                <User size={14} style={{ color: accentColor }} />
                Display Name <span style={{ color: theme.colors.danger }}>*</span>
              </label>
              <GlassInput
                value={displayName}
                onChange={setDisplayName}
                placeholder="e.g., John Doe"
              />
              {errors.displayName && (
                <p style={{
                  color: theme.colors.danger,
                  fontSize: '11px',
                  marginTop: '4px',
                  margin: 0,
                }}>
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme.colors.textMuted,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
              }}>
                <Mail size={14} style={{ color: accentColor }} />
                Email <span style={{ fontSize: '10px', opacity: 0.7 }}>(Optional)</span>
              </label>
              <GlassInput
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p style={{
                  color: theme.colors.danger,
                  fontSize: '11px',
                  marginTop: '4px',
                  margin: 0,
                }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Test Group (Optional) */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme.colors.textMuted,
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
              }}>
                <Users size={14} style={{ color: accentColor }} />
                Test Group <span style={{ fontSize: '10px', opacity: 0.7 }}>(Optional)</span>
              </label>
              <select
                value={testGroup}
                onChange={(e) => setTestGroup(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: theme.background.input,
                  backdropFilter: theme.blur.light,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  padding: '10px 12px',
                  color: theme.colors.text,
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                }}
              >
                <option value="">No group</option>
                <option value="alpha">Alpha Testers</option>
                <option value="beta">Beta Testers</option>
                <option value="control">Control Group</option>
                <option value="advanced">Advanced Users</option>
              </select>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div style={{
                padding: '10px',
                background: `${theme.colors.danger}20`,
                border: `1px solid ${theme.colors.danger}50`,
                borderRadius: theme.borderRadius.md,
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

            {/* Start Trading Button */}
            <GlassButton
              onClick={handleSubmit}
              disabled={!displayName.trim() || isSubmitting}
              variant="primary"
              style={{
                width: '100%',
                fontSize: '15px',
                padding: '12px 20px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: theme.glow.teal,
              }}
            >
              <Rocket size={16} />
              {isSubmitting ? 'Setting up...' : 'Start Trading'}
            </GlassButton>

            {/* Terms Notice */}
            <p style={{
              color: theme.colors.textMuted,
              fontSize: '10px',
              textAlign: 'center',
              margin: '4px 0 0',
              lineHeight: '1.4',
              opacity: 0.7,
            }}>
              By continuing, you agree to participate in paper trading testing
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
