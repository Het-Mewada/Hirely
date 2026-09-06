import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900 icon-blue-600',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 icon-emerald-600',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 icon-amber-600',
    destructive: 'bg-rose-50 border-rose-200 text-rose-900 icon-rose-600',
  };

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border ${styles[variant]} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex-1 text-sm">
        {title && <h5 className="font-bold mb-1 tracking-wide">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
}
