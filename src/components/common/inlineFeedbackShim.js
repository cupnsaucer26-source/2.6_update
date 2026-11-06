/**
 * SATHYAM AGROMART — CONTEXTUAL INLINE FEEDBACK SHIM (REPLACING SONNER)
 * 
 * Permanent Architecture Rule: No Floating Toast Notifications.
 * All toast calls are intercepted and routed to the Contextual Inline Feedback System.
 * No floating DOM elements, no top-right banners, no corner popups.
 */

function dispatchInlineFeedback(message, type = 'info', opts = {}) {
  const detail = {
    message: typeof message === 'string' ? message : (message?.message || String(message || '')),
    type: type,
    description: opts.description || '',
    duration: opts.duration,
    id: opts.id || ('fb-' + Math.random().toString(36).substring(2, 9)),
    timestamp: Date.now()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sb:inline-feedback', { detail }))
  }

  // Also log to console in development for complete traceability
  if (type === 'error') {
    console.warn('[Contextual Inline Error]:', detail.message, opts)
  } else {
    console.info('[Contextual Inline Feedback]:', detail.type, detail.message)
  }

  return detail.id
}

export const toast = Object.assign(
  (message, opts) => dispatchInlineFeedback(message, 'info', opts),
  {
    success: (message, opts) => dispatchInlineFeedback(message, 'success', opts),
    error: (message, opts) => dispatchInlineFeedback(message, 'error', opts),
    warning: (message, opts) => dispatchInlineFeedback(message, 'warning', opts),
    info: (message, opts) => dispatchInlineFeedback(message, 'info', opts),
    loading: (message, opts) => dispatchInlineFeedback(message, 'loading', opts),
    promise: async (promise, { loading, success, error }) => {
      if (loading) dispatchInlineFeedback(loading, 'loading')
      try {
        const result = await promise
        const successMsg = typeof success === 'function' ? success(result) : success
        if (successMsg) dispatchInlineFeedback(successMsg, 'success')
        return result
      } catch (err) {
        const errorMsg = typeof error === 'function' ? error(err) : (error || err?.message || 'Operation failed')
        dispatchInlineFeedback(errorMsg, 'error')
        throw err
      }
    },
    dismiss: (id) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sb:inline-feedback-dismiss', { detail: { id } }))
      }
    },
    message: (message, opts) => dispatchInlineFeedback(message, 'info', opts),
    custom: () => ''
  }
)

// No-op component for Toaster to guarantee zero floating popups are rendered in the DOM
export function Toaster() {
  return null
}

export function useSonner() {
  return { toasts: [] }
}

export default toast
