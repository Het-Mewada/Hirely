import React from 'react';

export function Card({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        color: 'var(--ink-primary)',
        boxShadow: 'none',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-canvas)',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
        fontSize: '1.125rem',
        fontWeight: 600,
        color: 'var(--ink-primary)',
        letterSpacing: '-0.015em',
        margin: 0,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        fontSize: '0.8125rem',
        color: 'var(--ink-muted)',
        marginTop: '0.25rem',
        margin: 0,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: '1.5rem',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ className = '', style = {}, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
