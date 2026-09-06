import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple' | 'indigo' | 'matched' | 'pending' | 'rejected';
}

export function Badge({ className = '', variant = 'default', children, style = {}, ...props }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: 'var(--bg-surface)', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
    secondary: { backgroundColor: 'var(--bg-surface)', color: 'var(--ink-muted)', border: '1px solid var(--border-color)' },
    success: { backgroundColor: 'var(--status-matched-bg)', color: 'var(--status-matched)', border: '1px solid var(--status-matched-border)' },
    matched: { backgroundColor: 'var(--status-matched-bg)', color: 'var(--status-matched)', border: '1px solid var(--status-matched-border)' },
    warning: { backgroundColor: 'var(--status-pending-bg)', color: 'var(--status-pending)', border: '1px solid var(--status-pending-border)' },
    pending: { backgroundColor: 'var(--status-pending-bg)', color: 'var(--status-pending)', border: '1px solid var(--status-pending-border)' },
    destructive: { backgroundColor: 'var(--status-rejected-bg)', color: 'var(--status-rejected)', border: '1px solid var(--status-rejected-border)' },
    rejected: { backgroundColor: 'var(--status-rejected-bg)', color: 'var(--status-rejected)', border: '1px solid var(--status-rejected-border)' },
    outline: { backgroundColor: 'transparent', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
    purple: { backgroundColor: 'var(--bg-surface)', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
    indigo: { backgroundColor: 'var(--bg-surface)', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.5rem',
        borderRadius: '3px',
        fontSize: '0.75rem',
        fontWeight: 500,
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        lineHeight: 1.4,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
