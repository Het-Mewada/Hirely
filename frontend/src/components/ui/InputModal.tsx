import React, { useState, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import { Button } from './button';

export interface InputModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function InputModal({
  isOpen,
  title,
  description,
  label,
  placeholder,
  defaultValue = '',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onClose
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('Please provide a valid input value.');
      return;
    }
    setError(null);
    onConfirm(value.trim());
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidth="420px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

        <div>
          {label && (
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>
              {label}
            </label>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            autoFocus
            style={{ width: '100%' }}
          />

          {error && (
            <div style={{ fontSize: '0.75rem', color: 'var(--status-rejected)', fontWeight: 500, marginTop: '0.25rem' }}>
              {error}
            </div>
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
            type="submit"
            variant="primary"
            size="sm"
            disabled={!value.trim() || loading}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
