/**
 * PaiiD Trading Platform - Global Theme System
 * Matches the radial menu glassmorphic design
 */

export const theme = {
  background: {
    primary: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
    card: 'rgba(30, 41, 59, 0.8)',
    cardHover: 'rgba(30, 41, 59, 0.95)',
    input: 'rgba(15, 24, 40, 0.9)',
    glass: 'rgba(30, 41, 59, 0.8)',
  },
  colors: {
    primary: '#16a394',      // Teal accent (prototype primary)
    secondary: '#00ACC1',    // Teal
    accent: '#7E57C2',       // Purple
    aiGlow: '#45f0c0',       // Bright cyan for AI logo glow
    warning: '#FF8800',      // Orange
    danger: '#FF4444',       // Red
    info: '#00BCD4',         // Cyan
    text: '#f1f5f9',         // Bright light text
    textMuted: '#cbd5e1',    // Muted text
    border: 'rgba(22, 163, 148, 0.3)',
    borderHover: 'rgba(22, 163, 148, 0.6)',
  },
  // Exact workflow colors from RadialMenu.tsx
  workflow: {
    morningRoutine: '#00ACC1',    // Teal
    newsReview: '#7E57C2',        // Purple
    proposals: '#0097A7',          // Dark Teal
    activePositions: '#00C851',   // Green
    pnl: '#FF8800',               // Orange
    strategyBuilder: '#5E35B1',   // Purple
    backtesting: '#00BCD4',       // Cyan
    execute: '#FF4444',           // Red
    research: '#F97316',          // Orange
    settings: '#64748b',          // Slate Gray
  },
  glow: {
    green: '0 0 20px rgba(22, 163, 148, 0.3), 0 0 40px rgba(22, 163, 148, 0.15)',
    teal: '0 0 20px rgba(22, 163, 148, 0.3), 0 0 40px rgba(22, 163, 148, 0.15)',
    aiGlow: '0 0 15px rgba(69, 240, 192, 0.8), 0 0 25px rgba(88, 255, 218, 0.5)',
    purple: '0 0 20px rgba(126, 87, 194, 0.3), 0 0 40px rgba(126, 87, 194, 0.15)',
    darkPurple: '0 0 20px rgba(94, 53, 177, 0.3), 0 0 40px rgba(94, 53, 177, 0.15)',
    orange: '0 0 20px rgba(255, 136, 0, 0.3), 0 0 40px rgba(255, 136, 0, 0.15)',
    red: '0 0 20px rgba(255, 68, 68, 0.3), 0 0 40px rgba(255, 68, 68, 0.15)',
    cyan: '0 0 20px rgba(0, 188, 212, 0.3), 0 0 40px rgba(0, 188, 212, 0.15)',
  },
  blur: {
    light: 'blur(10px)',
    medium: 'blur(20px)',
    heavy: 'blur(30px)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};

export type Theme = typeof theme;
