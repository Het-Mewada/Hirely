import React, { useEffect, useRef } from 'react';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function ModalShell({ isOpen, onClose, children, maxWidth = '440px' }: ModalShellProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusedElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Shift focus into modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (previousFocusedElement.current && typeof previousFocusedElement.current.focus === 'function') {
          previousFocusedElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1.25rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          maxWidth,
          width: '100%',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
          color: 'var(--ink-primary)',
          padding: '1.5rem',
          outline: 'none',
          animation: 'scaleIn 0.15s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
