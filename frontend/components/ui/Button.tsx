import React from 'react';
import { theme } from '../../styles/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: {
      background: theme.colors.primary,
      color: '#fff',
      boxShadow: theme.glow.green,
    },
    secondary: {
      background: theme.background.card,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    },
    danger: {
      background: theme.colors.danger,
      color: '#fff',
      boxShadow: theme.glow.red,
    },
  };

  const sizeStyles = {
    sm: {
      padding: '8px 16px',
      fontSize: '13px',
    },
    md: {
      padding: '12px 24px',
      fontSize: '14px',
    },
    lg: {
      padding: '16px 32px',
      fontSize: '16px',
    },
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: theme.borderRadius.sm,
        fontWeight: '600',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: `all ${theme.transitions.normal}`,
        border: 'none',
        outline: 'none',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.opacity = '0.9';
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.opacity = '1';
        }
        props.onMouseLeave?.(e);
      }}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
