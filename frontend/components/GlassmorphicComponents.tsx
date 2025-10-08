import { ReactNode, CSSProperties } from 'react';
import { theme } from '../styles/theme';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: keyof typeof theme.glow;
}

export function GlassCard({ children, className = '', style, glow }: GlassCardProps) {
  const glassStyle: CSSProperties = {
    background: theme.background.glass,
    backdropFilter: theme.blur.light,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    boxShadow: glow ? theme.glow[glow] : undefined,
    transition: theme.transitions.normal,
    ...style,
  };

  return (
    <div className={className} style={glassStyle}>
      {children}
    </div>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'workflow';
  workflowColor?: keyof typeof theme.workflow;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
}

export function GlassButton({
  children,
  onClick,
  variant = 'primary',
  workflowColor,
  className = '',
  disabled = false,
  type = 'button',
  style: customStyle
}: GlassButtonProps) {
  const getButtonStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      borderRadius: theme.borderRadius.lg,
      fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: theme.transitions.fast,
      border: 'none',
      outline: 'none',
      ...customStyle,
    };

    if (workflowColor && variant === 'workflow') {
      const color = theme.workflow[workflowColor];
      return {
        ...baseStyle,
        background: `${color}20`,
        border: `1px solid ${color}50`,
        color: color,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.accent})`,
          color: '#ffffff',
        };
      case 'secondary':
        return {
          ...baseStyle,
          background: `${theme.colors.secondary}20`,
          border: `1px solid ${theme.colors.secondary}50`,
          color: theme.colors.secondary,
        };
      case 'danger':
        return {
          ...baseStyle,
          background: `${theme.colors.danger}20`,
          border: `1px solid ${theme.colors.danger}50`,
          color: theme.colors.danger,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <button
      type={type}
      className={className}
      style={getButtonStyle()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface GlassInputProps {
  value: string | number;
  onChange: ((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | ((value: string) => void);
  type?: string;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function GlassInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  multiline = false,
  rows,
  min,
  max,
  step
}: GlassInputProps) {
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: theme.spacing.md,
    background: theme.background.input,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text,
    fontSize: '14px',
    outline: 'none',
    transition: theme.transitions.fast,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange.length === 1) {
      // If function expects 1 arg, pass the value directly
      (onChange as (value: string) => void)(e.target.value);
    } else {
      // Otherwise pass the event
      (onChange as (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void)(e);
    }
  };

  if (multiline) {
    return (
      <textarea
        className={className}
        style={inputStyle}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows || 3}
      />
    );
  }

  return (
    <input
      className={className}
      style={inputStyle}
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
    />
  );
}

interface GlassBadgeProps {
  children: ReactNode;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'custom';
  customColor?: string;
  className?: string;
}

export function GlassBadge({ children, variant, customColor, className = '' }: GlassBadgeProps) {
  const getColor = () => {
    if (variant === 'custom' && customColor) return customColor;
    switch (variant) {
      case 'success': return theme.colors.primary;
      case 'warning': return theme.colors.warning;
      case 'danger': return theme.colors.danger;
      case 'info': return theme.colors.info;
      default: return theme.colors.textMuted;
    }
  };

  const color = getColor();
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: `${color}20`,
    border: `1px solid ${color}50`,
    borderRadius: theme.borderRadius.sm,
    color: color,
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  };

  return (
    <span className={className} style={badgeStyle}>
      {children}
    </span>
  );
}
