import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: string;
  showLabel?: boolean;
}

export function Progress({ value, color = 'var(--accent-navy)', showLabel = false, className = '', style = {}, ...props }: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div style={{ width: '100%', ...style }} {...props}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>
          <span>Progress</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', height: '0.5rem', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '3px',
            transition: 'width 0.3s ease-out',
            width: `${clampedValue}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}
