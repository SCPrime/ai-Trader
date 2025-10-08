/**
 * PaiD Trading Platform - Global Theme System
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
    primary: '#10b981',      // Green accent
    secondary: '#00ACC1',    // Teal (from radial menu)
    accent: '#7E57C2',       // Purple
    warning: '#FF8800',      // Orange
    danger: '#FF4444',       // Red
    info: '#00BCD4',         // Cyan
    text: '#f1f5f9',         // Bright light text
    textMuted: '#cbd5e1',    // Muted text
    border: 'rgba(16, 185, 129, 0.3)',
    borderHover: 'rgba(16, 185, 129, 0.6)',
  },
  glow: {
    green: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.15)',
    teal: '0 0 20px rgba(0, 172, 193, 0.3), 0 0 40px rgba(0, 172, 193, 0.15)',
    purple: '0 0 20px rgba(126, 87, 194, 0.3), 0 0 40px rgba(126, 87, 194, 0.15)',
    orange: '0 0 20px rgba(255, 136, 0, 0.3), 0 0 40px rgba(255, 136, 0, 0.15)',
    red: '0 0 20px rgba(255, 68, 68, 0.3), 0 0 40px rgba(255, 68, 68, 0.15)',
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
