import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', style = {}, ...props }: AlertProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    info: { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--ink-primary)' },
    success: { backgroundColor: 'var(--status-matched-bg)', borderColor: 'var(--status-matched-border)', color: 'var(--status-matched)' },
    warning: { backgroundColor: 'var(--status-pending-bg)', borderColor: 'var(--status-pending-border)', color: 'var(--status-pending)' },
    destructive: { backgroundColor: 'var(--status-rejected-bg)', borderColor: 'var(--status-rejected-border)', color: 'var(--status-rejected)' },
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '4px',
        border: '1px solid',
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        ...variantStyles[variant],
        ...style,
      }}
      role="alert"
      {...props}
    >
      <div style={{ flex: 1, fontSize: '0.8125rem' }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
