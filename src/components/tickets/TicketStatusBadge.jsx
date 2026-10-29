import { CheckCircle2, Clock, RefreshCw, X, AlertCircle } from 'lucide-react'

export function getTicketStatusChipClass(status) {
  const s = (status || '').toLowerCase().trim()
  if (s === 'resolved' || s === 'closed') return 'p2-chip--green'
  if (s === 'in progress') return 'p2-chip--blue'
  if (s === 'rejected') return 'p2-chip--red'
  return 'p2-chip--amber'
}

export function getTicketPriorityChipClass(priority) {
  const p = (priority || '').toLowerCase().trim()
  if (p === 'urgent' || p === 'high') return 'p2-chip--red'
  if (p === 'medium') return 'p2-chip--amber'
  return ''
}

export default function TicketStatusBadge({
  status,
  priority,
  type = status !== undefined ? 'status' : 'priority',
  showIcon = false,
  className = '',
  style
}) {
  if (type === 'priority' || (priority !== undefined && status === undefined)) {
    const val = priority || 'Medium'
    const colorClass = getTicketPriorityChipClass(val)
    return (
      <span
        className={`p2-chip ${colorClass} ${className}`.trim()}
        style={style}
      >
        {showIcon && (val.toLowerCase() === 'urgent' || val.toLowerCase() === 'high') && (
          <AlertCircle size={12} aria-hidden="true" style={{ marginRight: 4 }} />
        )}
        {val.toUpperCase()}
      </span>
    )
  }

  const val = status || 'Pending'
  const colorClass = getTicketStatusChipClass(val)
  const s = val.toLowerCase().trim()

  const renderIcon = () => {
    if (!showIcon) return null
    if (s === 'resolved' || s === 'closed') {
      return <CheckCircle2 size={12} aria-hidden="true" style={{ marginRight: 4 }} />
    }
    if (s === 'in progress') {
      return <RefreshCw size={12} aria-hidden="true" style={{ marginRight: 4 }} />
    }
    if (s === 'rejected') {
      return <X size={12} aria-hidden="true" style={{ marginRight: 4 }} />
    }
    return <Clock size={12} aria-hidden="true" style={{ marginRight: 4 }} />
  }

  const label = showIcon
    ? (s === 'closed' ? 'Closed' : s === 'resolved' ? 'Resolved' : s === 'in progress' ? 'In Progress' : s === 'rejected' ? 'Rejected' : 'Open')
    : val.toUpperCase()

  return (
    <span
      className={`p2-chip ${colorClass} ${className}`.trim()}
      style={style}
    >
      {renderIcon()}
      {label}
    </span>
  )
}
