import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  style = {},
  ...props
}: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--accent-navy)', color: 'var(--accent-navy-text)', border: '1px solid var(--accent-navy)' },
    secondary: { backgroundColor: 'var(--bg-surface)', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
    outline: { backgroundColor: 'transparent', color: 'var(--ink-primary)', border: '1px solid var(--border-color)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--ink-muted)', border: 'none' },
    destructive: { backgroundColor: 'var(--status-rejected)', color: '#ffffff', border: '1px solid var(--status-rejected)' },
    success: { backgroundColor: 'var(--status-matched)', color: '#ffffff', border: '1px solid var(--status-matched)' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.75rem', gap: '0.375rem' },
    md: { height: '2.25rem', padding: '0 1rem', fontSize: '0.8125rem', gap: '0.5rem' },
    lg: { height: '2.75rem', padding: '0 1.25rem', fontSize: '0.875rem', gap: '0.5rem' },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        fontWeight: 600,
        borderRadius: '4px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg style={{ animation: 'spin 1s linear infinite', width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} fill="none" viewBox="0 0 24 24">
            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
