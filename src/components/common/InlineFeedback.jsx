import React from 'react'

/**
 * SATHYAM AGROMART — CONTEXTUAL INLINE FEEDBACK SYSTEM
 * 
 * Reusable, accessible (WCAG 2.2 AA), responsive inline feedback component
 * replacing all floating toast notifications across the entire platform.
 * 
 * Types supported:
 *  - 'success': Action completed successfully
 *  - 'error': Operation failed, action needed
 *  - 'warning': Cautionary notice or non-blocking validation
 *  - 'info': Relevant contextual guidance
 *  - 'loading': In-progress background mutation
 *  - 'empty': Empty state with optional action
 *  - 'validation': Field or section level validation alert
 */

export function InlineFeedback({
  type = 'info',
  title,
  message,
  description,
  action,
  onDismiss,
  className = '',
  style = {},
  compact = false,
  role,
  ariaLive
}) {
  const textMessage = message || description || ''
  if (!textMessage && !title) return null

  // Semantic role & aria-live determination
  const computedRole = role || (type === 'error' ? 'alert' : 'status')
  const computedLive = ariaLive || (type === 'error' ? 'assertive' : 'polite')

  const icons = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info',
    loading: 'fa-solid fa-spinner fa-spin',
    empty: 'fa-solid fa-inbox',
    validation: 'fa-solid fa-circle-exclamation'
  }

  const iconClass = icons[type] || icons.info

  return (
    <div
      role={computedRole}
      aria-live={computedLive}
      className={`inline-feedback inline-feedback--${type} ${compact ? 'inline-feedback--compact' : ''} ${className}`}
      style={style}
    >
      <div className="inline-feedback__icon-wrap" aria-hidden="true">
        <i className={iconClass}></i>
      </div>

      <div className="inline-feedback__content">
        {title && <h5 className="inline-feedback__title">{title}</h5>}
        {textMessage && <p className="inline-feedback__message">{textMessage}</p>}
        {action && (
          <div className="inline-feedback__action">
            <button
              type="button"
              className="inline-feedback__action-btn"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          className="inline-feedback__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss feedback"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      )}
    </div>
  )
}

// Specialized contextual variants
export function InlineSuccess(props) {
  return <InlineFeedback type="success" {...props} />
}

export function InlineError(props) {
  return <InlineFeedback type="error" {...props} />
}

export function InlineWarning(props) {
  return <InlineFeedback type="warning" {...props} />
}

export function InlineInfo(props) {
  return <InlineFeedback type="info" {...props} />
}

export function InlineLoading(props) {
  return <InlineFeedback type="loading" {...props} />
}

export function InlineValidation({ message, className = '', style = {} }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`inline-field-error ${className}`}
      style={style}
    >
      <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
      <span>{message}</span>
    </div>
  )
}

export function InlineEmptyState({ title, description, action, icon = 'fa-solid fa-inbox', className = '' }) {
  return (
    <div className={`inline-empty-state ${className}`}>
      <div className="inline-empty-state__icon">
        <i className={icon} aria-hidden="true"></i>
      </div>
      {title && <h4 className="inline-empty-state__title">{title}</h4>}
      {description && <p className="inline-empty-state__description">{description}</p>}
      {action && (
        <button
          type="button"
          className="inline-empty-state__btn"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default InlineFeedback
