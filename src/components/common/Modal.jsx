import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Universal Modal Dialog Component for Sathyam Agro Mart.
 * Handles overlay clicks, Escape key dismissal, accessibility roles, and customizable widths.
 * Supports both standard admin and superadmin visual themes.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Dismiss callback
 * @param {React.ReactNode} props.title - Modal title text or element
 * @param {string} [props.eyebrow] - Optional top tag/eyebrow text (common in SuperAdmin)
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.maxWidth='540px'] - CSS max-width
 * @param {'default'|'superadmin'} [props.variant='default'] - Visual theme
 * @param {string} [props.className=''] - Additional container classes
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  maxWidth = '540px',
  variant = 'default',
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  if (variant === 'superadmin') {
    return (
      <div className="sa-modal-overlay" onClick={onClose} role="presentation">
        <div
          className={`sa-modal ${className}`.trim()}
          style={{ maxWidth }}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Dialog'}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sa-modal-head">
            <div>
              {eyebrow && <div className="sa-eyebrow">{eyebrow}</div>}
              {typeof title === 'string' ? <h2 className="sa-card-title">{title}</h2> : title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="sa-icon-btn"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay active"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.7)', zIndex: 999 }}
      role="presentation"
    >
      <div
        className={`modal-card animate-fade-in ${className}`.trim()}
        style={{
          background: 'var(--surface-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          maxWidth,
          padding: '24px',
          width: '100%',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            borderBottom: '1px solid var(--surface-border-subtle, rgba(0,0,0,0.08))',
            paddingBottom: '12px',
          }}
        >
          <div>
            {eyebrow && (
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted, #64748b)',
                  marginBottom: 2,
                }}
              >
                {eyebrow}
              </div>
            )}
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{title}</h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: '4px 8px', color: 'inherit' }}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
