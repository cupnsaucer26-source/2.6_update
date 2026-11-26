/**
 * SATHYAM AGROMART — CONTEXTUAL INLINE FEEDBACK DISPATCHER (STOREFRONT)
 * 
 * Replaces floating Sonner toasts with contextual inline feedback events.
 * Dispatches 'sb:inline-feedback' to communicate with inline feedback containers.
 */

export function showToast(message, type = 'info', duration) {
  const detail = {
    message: typeof message === 'string' ? message : (message?.message || String(message || '')),
    type: type || 'info',
    duration: duration,
    id: 'fb-' + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sb:inline-feedback', { detail }))
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sb:inline-feedback-dismiss', { detail: { id: detail.id } }))
    }
  }
}
