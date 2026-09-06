import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: string;
  showLabel?: boolean;
}

export function Progress({ value, color = '#6366f1', showLabel = false, className = '', style = {}, ...props }: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div style={{ width: '100%', ...style }} {...props}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
          <span>Progress</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', height: '0.625rem', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            transition: 'width 0.5s ease-out',
            width: `${clampedValue}%`,
            background: color
          }}
        />
      </div>
    </div>
  );
}

