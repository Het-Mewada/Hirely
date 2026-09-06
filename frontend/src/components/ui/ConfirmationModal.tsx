import { ModalShell } from './ModalShell';
import { Button } from './button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onClose
}: ConfirmationModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Modal Title & Description */}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              margin: 0
            }}
          >
            {title}
          </h2>

          {description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.375rem', lineHeight: '1.45', margin: '0.375rem 0 0 0' }}>
              {description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
