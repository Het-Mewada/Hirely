import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple' | 'indigo';
}

export function Badge({ className = '', variant = 'default', children, style = {}, ...props }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.15)' },
    success: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' },
    warning: { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' },
    destructive: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' },
    outline: { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.2)' },
    purple: { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' },
    indigo: { backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.025em',
        transition: 'all 0.15s ease',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

