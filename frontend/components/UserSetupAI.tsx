/**
 * AI-Guided User Setup
 * Conversational onboarding with Claude AI
 */

import { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  MessageCircle,
  Send,
  Loader2,
  Check,
  ArrowRight,
  Target,
  Shield,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { theme } from '../styles/theme';
import { claudeAI, UserPreferences } from '../lib/aiAdapter';
import { createUser } from '../lib/userManagement';
import { AILogoTrigger } from './AIChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserSetupAIProps {
  onComplete: () => void;
}

export default function UserSetupAI({ onComplete }: UserSetupAIProps) {
  const [setupMethod, setSetupMethod] = useState<'manual' | 'ai' | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedPrefs, setExtractedPrefs] = useState<Partial<UserPreferences> | null>(null);
  const [showReview, setShowReview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize AI setup
  const startAISetup = () => {
    setSetupMethod('ai');
    setMessages([
      {
        role: 'assistant',
        content: `Hi! I'm your AI trading assistant. I'll help you set up your account by asking a few questions.\n\nTo get started, tell me about your trading goals. For example:\n\n• "I want to day-trade tech stocks with $25K, focusing on momentum"\n• "I'm interested in swing trading with $5K, moderate risk"\n• "I want to learn options trading with $1000"\n\nWhat are your goals?`,
      },
    ]);
  };

  // Handle AI conversation
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // Extract preferences from user's message
      const prefs = await claudeAI.extractSetupPreferences(userMessage);
      setExtractedPrefs(prefs);

      // Generate confirmation message
      const responseMessage = `Great! Based on what you told me, here's what I understood:\n\n${
        prefs.investmentAmount?.value
          ? `💰 Investment Amount: $${prefs.investmentAmount.value.toLocaleString()}`
          : prefs.investmentAmount?.mode === 'unlimited'
          ? '💰 Investment Amount: Unlimited'
          : ''
      }\n${prefs.riskTolerance ? `🛡️ Risk Tolerance: ${prefs.riskTolerance}` : ''}\n${
        prefs.tradingStyle ? `📈 Trading Style: ${prefs.tradingStyle}` : ''
      }\n${prefs.instruments ? `🎯 Instruments: ${prefs.instruments.join(', ')}` : ''}\n${
        prefs.watchlist ? `👀 Watchlist: ${prefs.watchlist.join(', ')}` : ''
      }\n\nDoes this look correct? You can review and make changes on the next screen.`;

      setMessages((prev) => [...prev, { role: 'assistant', content: responseMessage }]);
      setShowReview(true);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having trouble understanding. Could you try rephrasing your trading goals? For example: "I want to trade stocks with $10K, moderate risk, swing trading style."`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete setup
  const handleComplete = () => {
    if (!extractedPrefs) return;

    // Create user with AI-extracted preferences
    const user = createUser(
      'Trader', // Default name, can be customized later
      undefined,
      undefined,
      {
        setupMethod: 'ai-guided',
        aiConversation: messages.map((m) => ({ role: m.role, content: m.content })),
        riskTolerance: extractedPrefs.riskTolerance,
        preferredStrategy: extractedPrefs.tradingStyle,
        investmentAmount: extractedPrefs.investmentAmount,
        investmentTypes: extractedPrefs.instruments,
        completedAt: new Date().toISOString(),
      }
    );

    console.log('[UserSetupAI] User created:', user);
    onComplete();
  };

  // Method selection screen
  if (!setupMethod) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: theme.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <div style={{ maxWidth: '800px', width: '100%' }}>
          {/* Logo */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <AILogoTrigger onClick={() => {}} />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
              <div
                style={{
                  padding: theme.spacing.md,
                  background: `${theme.colors.accent}20`,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: theme.glow.purple,
                }}
              >
                <Brain style={{ width: '32px', height: '32px', color: theme.colors.accent }} />
              </div>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  margin: 0,
                }}
              >
                Welcome to PaiD
              </h1>
            </div>
            <p style={{ color: theme.colors.textMuted, fontSize: '16px', margin: 0 }}>
              Let's set up your trading account
            </p>
          </div>

          {/* Method Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
            {/* AI-Guided Setup */}
            <button
              onClick={startAISetup}
              style={{
                padding: theme.spacing.xl,
                background: theme.background.glass,
                backdropFilter: theme.blur.light,
                border: `2px solid ${theme.workflow.strategyBuilder}40`,
                borderRadius: theme.borderRadius.xl,
                cursor: 'pointer',
                transition: theme.transitions.normal,
                textAlign: 'center',
                boxShadow: theme.glow.darkPurple,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${theme.workflow.strategyBuilder}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme.glow.darkPurple;
              }}
            >
              <Brain
                style={{
                  width: '64px',
                  height: '64px',
                  color: theme.workflow.strategyBuilder,
                  margin: `0 auto ${theme.spacing.md}`,
                }}
              />
              <h3 style={{ color: theme.colors.text, marginBottom: theme.spacing.sm, fontSize: '24px' }}>
                AI-Guided Setup
              </h3>
              <p style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.md, lineHeight: 1.6 }}>
                Chat with Claude AI to set up your account. Just describe your trading goals naturally.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  color: theme.workflow.strategyBuilder,
                  fontWeight: '600',
                }}
              >
                <Sparkles style={{ width: '16px', height: '16px' }} />
                Recommended
              </div>
            </button>

            {/* Manual Setup */}
            <button
              onClick={() => setSetupMethod('manual')}
              style={{
                padding: theme.spacing.xl,
                background: theme.background.glass,
                backdropFilter: theme.blur.light,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.xl,
                cursor: 'pointer',
                transition: theme.transitions.normal,
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <Target
                style={{ width: '64px', height: '64px', color: theme.colors.primary, margin: `0 auto ${theme.spacing.md}` }}
              />
              <h3 style={{ color: theme.colors.text, marginBottom: theme.spacing.sm, fontSize: '24px' }}>
                Manual Setup
              </h3>
              <p style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.md, lineHeight: 1.6 }}>
                Fill out a traditional form with dropdowns and inputs. More control over each field.
              </p>
              <div style={{ height: '24px' }}></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AI Chat Interface
  if (setupMethod === 'ai' && !showReview) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: theme.background.primary,
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.lg,
        }}
      >
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <AILogoTrigger onClick={() => {}} />
          </div>

          {/* Header */}
          <div
            style={{
              background: theme.background.glass,
              backdropFilter: theme.blur.light,
              border: `1px solid ${theme.workflow.strategyBuilder}40`,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}
          >
            <Brain style={{ width: '32px', height: '32px', color: theme.workflow.strategyBuilder }} />
            <div>
              <h2 style={{ color: theme.colors.text, margin: 0, fontSize: '24px' }}>AI Setup Assistant</h2>
              <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: '14px' }}>
                Tell me about your trading goals
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: theme.background.glass,
              backdropFilter: theme.blur.light,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.md,
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.lg,
                    background:
                      msg.role === 'user'
                        ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                        : `${theme.workflow.strategyBuilder}20`,
                    border: msg.role === 'user' ? 'none' : `1px solid ${theme.workflow.strategyBuilder}40`,
                    color: theme.colors.text,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: theme.spacing.md }}>
                <div
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.lg,
                    background: `${theme.workflow.strategyBuilder}20`,
                    border: `1px solid ${theme.workflow.strategyBuilder}40`,
                  }}
                >
                  <Loader2
                    className="animate-spin"
                    style={{ width: '20px', height: '20px', color: theme.workflow.strategyBuilder }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your trading goals..."
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.text,
                fontSize: '16px',
                outline: 'none',
                transition: theme.transitions.fast,
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                border: 'none',
                borderRadius: theme.borderRadius.lg,
                color: '#ffffff',
                fontWeight: '600',
                cursor: !input.trim() || isProcessing ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isProcessing ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                transition: theme.transitions.fast,
              }}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" style={{ width: '20px', height: '20px' }} />
              ) : (
                <Send style={{ width: '20px', height: '20px' }} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Screen
  if (showReview && extractedPrefs) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: theme.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <div style={{ maxWidth: '700px', width: '100%' }}>
          {/* Logo */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <AILogoTrigger onClick={() => {}} />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
            <Check
              style={{
                width: '64px',
                height: '64px',
                color: theme.colors.primary,
                margin: `0 auto ${theme.spacing.md}`,
              }}
            />
            <h2 style={{ color: theme.colors.text, margin: `0 0 ${theme.spacing.sm} 0`, fontSize: '32px' }}>
              Review Your Setup
            </h2>
            <p style={{ color: theme.colors.textMuted }}>Here's what we configured for you</p>
          </div>

          {/* Preferences Card */}
          <div
            style={{
              background: theme.background.glass,
              backdropFilter: theme.blur.light,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.lg,
            }}
          >
            <div style={{ display: 'grid', gap: theme.spacing.lg }}>
              {/* Investment Amount */}
              {extractedPrefs.investmentAmount && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <DollarSign style={{ width: '20px', height: '20px', color: theme.colors.primary }} />
                    <h4 style={{ color: theme.colors.text, margin: 0 }}>Investment Amount</h4>
                  </div>
                  <p style={{ color: theme.colors.textMuted, margin: 0, paddingLeft: '28px' }}>
                    {extractedPrefs.investmentAmount.mode === 'unlimited'
                      ? 'Unlimited'
                      : `$${extractedPrefs.investmentAmount.value?.toLocaleString()}`}
                  </p>
                </div>
              )}

              {/* Risk Tolerance */}
              {extractedPrefs.riskTolerance && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <Shield style={{ width: '20px', height: '20px', color: theme.colors.warning }} />
                    <h4 style={{ color: theme.colors.text, margin: 0 }}>Risk Tolerance</h4>
                  </div>
                  <p style={{ color: theme.colors.textMuted, margin: 0, paddingLeft: '28px', textTransform: 'capitalize' }}>
                    {extractedPrefs.riskTolerance}
                  </p>
                </div>
              )}

              {/* Trading Style */}
              {extractedPrefs.tradingStyle && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <TrendingUp style={{ width: '20px', height: '20px', color: theme.colors.secondary }} />
                    <h4 style={{ color: theme.colors.text, margin: 0 }}>Trading Style</h4>
                  </div>
                  <p style={{ color: theme.colors.textMuted, margin: 0, paddingLeft: '28px', textTransform: 'capitalize' }}>
                    {extractedPrefs.tradingStyle}
                  </p>
                </div>
              )}

              {/* Instruments */}
              {extractedPrefs.instruments && extractedPrefs.instruments.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <Target style={{ width: '20px', height: '20px', color: theme.workflow.strategyBuilder }} />
                    <h4 style={{ color: theme.colors.text, margin: 0 }}>Instruments</h4>
                  </div>
                  <p style={{ color: theme.colors.textMuted, margin: 0, paddingLeft: '28px' }}>
                    {extractedPrefs.instruments.join(', ')}
                  </p>
                </div>
              )}

              {/* Watchlist */}
              {extractedPrefs.watchlist && extractedPrefs.watchlist.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <MessageCircle style={{ width: '20px', height: '20px', color: theme.colors.info }} />
                    <h4 style={{ color: theme.colors.text, margin: 0 }}>Watchlist</h4>
                  </div>
                  <p style={{ color: theme.colors.textMuted, margin: 0, paddingLeft: '28px' }}>
                    {extractedPrefs.watchlist.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <button
              onClick={() => {
                setShowReview(false);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: "No problem! What would you like to change? Just describe your updated preferences.",
                  },
                ]);
              }}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: theme.background.glass,
                backdropFilter: theme.blur.light,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.text,
                fontWeight: '600',
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              Make Changes
            </button>
            <button
              onClick={handleComplete}
              style={{
                flex: 2,
                padding: theme.spacing.md,
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                border: 'none',
                borderRadius: theme.borderRadius.lg,
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
                transition: theme.transitions.fast,
              }}
            >
              Complete Setup
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual setup fallback (use existing UserSetup)
  return null;
}
