import React from 'react';
import { theme } from '../../styles/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.xs,
            fontSize: '13px',
            fontWeight: '600',
            color: theme.colors.textMuted,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: theme.background.input,
          border: `1px solid ${error ? theme.colors.danger : theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.text,
          fontSize: '14px',
          transition: `all ${theme.transitions.fast}`,
          outline: 'none',
          ...props.style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = theme.colors.primary;
          e.target.style.boxShadow = theme.glow.green;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.border;
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && (
        <div
          style={{
            marginTop: theme.spacing.xs,
            fontSize: '12px',
            color: theme.colors.danger,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
