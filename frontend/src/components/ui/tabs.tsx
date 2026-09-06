import React, { createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  value,
  onValueChange,
  children,
  className = '',
}: {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
      <div style={{ width: '100%' }} className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        backgroundColor: 'var(--bg-surface)',
        padding: '0.25rem',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = '',
  style = {}
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.activeTab === value;

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        borderRadius: '3px',
        padding: '0.375rem 0.875rem',
        fontSize: '0.8125rem',
        fontWeight: isActive ? 600 : 500,
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        backgroundColor: isActive ? 'var(--bg-canvas)' : 'transparent',
        color: isActive ? 'var(--ink-primary)' : 'var(--ink-muted)',
        border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
        ...style
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return <div style={{ marginTop: '1rem' }} className={className}>{children}</div>;
}
