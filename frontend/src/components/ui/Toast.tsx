import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        maxWidth: '380px',
        width: 'calc(100vw - 2.5rem)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    // Errors stay until manually dismissed; Success & Info auto-dismiss after 2 seconds
    if (toast.type !== 'error') {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.type, onDismiss]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '0.875rem 1rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        color: 'var(--ink-primary)',
        fontSize: '0.8125rem',
        lineHeight: '1.4',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Status Icon */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {isSuccess && <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--status-matched)' }} />}
        {isError && <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--status-rejected)' }} />}
        {!isSuccess && !isError && <Info style={{ width: '18px', height: '18px', color: 'var(--accent-navy)' }} />}
      </div>

      {/* Toast Message */}
      <div style={{ flex: 1, wordBreak: 'break-word', fontWeight: 400 }}>
        {toast.message}
      </div>

      {/* Manual Dismiss Button for Errors / Persistent Notifications */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-muted)',
          cursor: 'pointer',
          padding: 0,
          marginLeft: '0.25rem',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
}
