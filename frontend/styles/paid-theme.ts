export const paidTheme = {
  colors: {
    // Primary palette - Deep blues with electric accents
    primary: '#0A1628',
    primaryLight: '#1a2844',
    accent: '#00d4ff',
    accentGlow: 'rgba(0, 212, 255, 0.3)',

    // Status colors
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff3366',
    info: '#00d4ff',

    // Glass morphism
    glass: 'rgba(255, 255, 255, 0.05)',
    glassHover: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',

    // Text
    text: '#e0e6ed',
    textMuted: '#8b98a8',
    textDim: '#5a6575',

    // Backgrounds
    background: '#050a14',
    backgroundElevated: '#0d1420',

    // Chart colors
    chartGreen: '#00ff88',
    chartRed: '#ff3366',
    chartBlue: '#00d4ff',
    chartPurple: '#b084ff',
    chartOrange: '#ffaa00',
  },

  effects: {
    glow: (color: string) => `0 0 20px ${color}, 0 0 40px ${color}33`,
    glowSubtle: (color: string) => `0 0 10px ${color}33`,
    blur: 'blur(20px)',
    blurStrong: 'blur(40px)',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  typography: {
    fontFamily: {
      main: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

export type PaidTheme = typeof paidTheme;
