import React from 'react';
import { theme } from '../../styles/theme';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ label, error, options, ...props }) => {
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
      <select
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
          cursor: 'pointer',
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
