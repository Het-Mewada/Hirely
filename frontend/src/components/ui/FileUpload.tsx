import React, { useRef, useState } from 'react';
import { Paperclip, Check } from 'lucide-react';
import { Button } from './button';

export interface FileUploadProps {
  value?: File | null;
  existingFileUrl?: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  value,
  existingFileUrl,
  onChange,
  accept = '.pdf,.docx,.txt',
  maxSizeMB = 10,
  label,
  isProcessing = false,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = (file: File | null) => {
    setError(null);
    if (!file) {
      onChange(null);
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB`);
      onChange(null);
      return;
    }

    // Validate format extension
    if (accept) {
      const allowedExts = accept.split(',').map((e) => e.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const isValidExt = allowedExts.some((ext) => fileName.endsWith(ext));
      if (!isValidExt) {
        setError(`PDF, DOCX, or TXT files only`);
        onChange(null);
        return;
      }
    }

    onChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files?.[0] || null;
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasFile = Boolean(value || existingFileUrl);
  const displayFileName = value ? value.name : existingFileUrl ? existingFileUrl.split('/').pop() || 'Uploaded file' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '0.1rem' }}>
          {label}
        </label>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {hasFile ? (
        /* Uploaded State: Compact Single Row */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-surface)',
            border: error ? '1px solid var(--status-rejected-border)' : '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            transition: 'border-color 0.15s ease, background-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-matched-bg)',
              color: 'var(--status-matched)',
              border: '1px solid var(--status-matched-border)',
              flexShrink: 0
            }}>
              <Check style={{ width: '11px', height: '11px' }} />
            </span>

            <span style={{
              fontWeight: 600,
              color: 'var(--ink-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px'
            }}>
              {displayFileName}
            </span>

            {value && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', flexShrink: 0 }}>
                ({formatFileSize(value.size)})
              </span>
            )}

            {isProcessing && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-pending)', fontWeight: 500, flexShrink: 0, marginLeft: '0.25rem' }}>
                Processing…
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={disabled}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-navy)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Replace
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--status-rejected)',
                fontWeight: 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Default State: Single Horizontal Row inside border [Icon] [Text] [Browse Button] */
        <div
          onClick={handleBrowseClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.125rem',
            backgroundColor: isDragOver ? 'var(--bg-hover)' : 'var(--bg-surface)',
            border: error
              ? '1px solid var(--status-rejected-border)'
              : isDragOver
              ? '1px solid var(--accent-navy)'
              : '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            gap: '1rem'
          }}
        >
          {/* Fixed-size Icon vertically centered */}
          <Paperclip style={{ width: '20px', height: '20px', color: 'var(--ink-muted)', flexShrink: 0 }} />

          {/* Primary Instruction Text */}
          <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--ink-primary)', fontWeight: 400 }}>
            Drag and drop your resume here.
          </div>

          {/* Right-aligned Browse Button */}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            disabled={disabled}
            style={{ flexShrink: 0 }}
          >
            Browse
          </Button>
        </div>
      )}

      {/* Helper Text below border */}
      {!hasFile && (
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
          PDF, DOCX, or TXT files, up to {maxSizeMB}MB.
        </div>
      )}

      {/* Specific Inline Error Text */}
      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--status-rejected)', fontWeight: 500, marginTop: '0.15rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
