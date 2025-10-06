import React from 'react';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: keyof typeof theme.glow;
}

export const Card: React.FC<CardProps> = ({ children, className, style, glow }) => {
  return (
    <div
      className={className}
      style={{
        background: theme.background.card,
        backdropFilter: theme.blur.medium,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        transition: `all ${theme.transitions.normal}`,
        boxShadow: glow ? theme.glow[glow] : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
