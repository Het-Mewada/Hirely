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
    primary: { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)' },
    secondary: { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.12)' },
    outline: { backgroundColor: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.2)' },
    ghost: { backgroundColor: 'transparent', color: '#94a3b8', border: 'none' },
    destructive: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', border: 'none', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.75rem', gap: '0.375rem' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem', gap: '0.5rem' },
    lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1rem', gap: '0.625rem' },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: '0.5rem',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg style={{ animation: 'spin 1s linear infinite', width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24">
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

