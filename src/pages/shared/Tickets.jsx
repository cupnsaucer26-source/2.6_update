import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Ticket, User, CheckCircle2, Clock, AlertTriangle, RefreshCw, Send, Filter, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ticketService } from '../../services/ticketService'
import TicketAttachmentPreview from '../../components/tickets/TicketAttachmentPreview'

export default function Tickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [filterMode, setFilterMode] = useState('assigned_to_me') // 'assigned_to_me' | 'all'
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState({})
  const [isInternalReply, setIsInternalReply] = useState({})
  const [loading, setLoading] = useState(true)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const list = await ticketService.getTickets({
        role: user?.role || 'employee',
        userId: user?.id || user?._id
      })
      setTickets(list)
    } catch {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadTickets()
    const onUpdate = () => loadTickets()
    window.addEventListener('sathyam:tickets-updated', onUpdate)
    return () => window.removeEventListener('sathyam:tickets-updated', onUpdate)
  }, [loadTickets])

  const addReply = async (id) => {
    const text = replyText[id]
    if (!text?.trim()) return

    const isInternal = Boolean(isInternalReply[id])
    try {
      await ticketService.addReply(id, {
        senderName: user?.name || 'Assigned Staff',
        senderRole: user?.role || 'employee',
        text: text.trim(),
        isInternal
      })
      setReplyText(r => ({ ...r, [id]: '' }))
      setIsInternalReply(r => ({ ...r, [id]: false }))
      toast.success(isInternal ? 'Internal staff note added' : 'Reply submitted to customer and Super Admin')
      await loadTickets()
    } catch {
      toast.error('Could not send reply')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await ticketService.updateTicketStatus(id, status)
      toast.success(`Ticket marked as ${status}`)
      await loadTickets()
    } catch {
      toast.error('Could not update status')
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const currentUserId = user?.id || user?._id

    // Filter by assigned to me vs all
    if (filterMode === 'assigned_to_me') {
      const isAssignedToMe = ticket.assignedToId === currentUserId ||
        (ticket.assignedToName && user?.name && ticket.assignedToName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]))
      if (!isAssignedToMe) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      const s = (ticket.status || '').toLowerCase()
      if (statusFilter === 'open' && s !== 'open' && s !== 'pending') return false
      if (statusFilter === 'progress' && s !== 'in progress') return false
      if (statusFilter === 'resolved' && s !== 'resolved' && s !== 'closed') return false
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      const match =
        ticket.id.toLowerCase().includes(q) ||
        (ticket.orderId && ticket.orderId.toLowerCase().includes(q)) ||
        (ticket.farmerName && ticket.farmerName.toLowerCase().includes(q)) ||
        (ticket.subject && ticket.subject.toLowerCase().includes(q)) ||
        (ticket.category && ticket.category.toLowerCase().includes(q))
      if (!match) return false
    }

    return true
  })

  return (
    <div className="animate-fade-in" style={{ padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Ticket size={24} /> Support Tickets &amp; Inquiries
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {user?.role === 'employee' ? 'Directly handle customer support requests and agronomic doubts assigned to you' : 'Store tickets and staff assignments'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="p2-tabs" style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className="p2-tab"
              aria-selected={filterMode === 'assigned_to_me'}
              onClick={() => setFilterMode('assigned_to_me')}
            >
              Assigned to Me
            </button>
            <button
              type="button"
              className="p2-tab"
              aria-selected={filterMode === 'all'}
              onClick={() => setFilterMode('all')}
            >
              All Visible Tickets ({tickets.length})
            </button>
          </div>

          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 130, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open / Pending</option>
            <option value="progress">In Progress</option>
            <option value="resolved">Resolved / Closed</option>
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search tickets, orders, crops..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            Loading assigned support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Ticket size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No tickets found</h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              {filterMode === 'assigned_to_me'
                ? 'No tickets currently assigned to you. Click "All Visible Tickets" to see the store queue.'
                : 'No tickets match the selected filters.'}
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="card" style={{ padding: '20px', borderLeft: '4px solid #16a34a' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--brand-600)', fontSize: '0.95rem' }}>{ticket.id}</strong>
                  {ticket.orderId && (
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      Order: {ticket.orderId}
                    </span>
                  )}
                  <span className={`badge ${ticket.priority === 'High' || ticket.priority === 'Urgent' ? 'badge-red' : ticket.priority === 'Medium' ? 'badge-yellow' : 'badge-gray'}`}>
                    {ticket.priority?.toUpperCase()}
                  </span>
                  <span className={`badge ${ticket.status === 'Open' || ticket.status === 'Pending' ? 'badge-orange' : ticket.status === 'In Progress' ? 'badge-blue' : 'badge-green'}`}>
                    {ticket.status?.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📅 {new Date(ticket.createdAt || ticket.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Subject & Reporter */}
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                {ticket.subject || ticket.issue}
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
                <span>👤 Farmer: <strong>{ticket.farmerName || ticket.farmer}</strong></span>
                {ticket.phone && <span>📱 {ticket.phone}</span>}
                {ticket.crop && <span>🌾 Crop: <strong>{ticket.crop}</strong></span>}
                {ticket.category && <span>📂 Category: <strong>{ticket.category}</strong></span>}
                {ticket.assignedToName && (
                  <span style={{ color: '#0284c7' }}>
                    👨‍🌾 Handler: <strong>{ticket.assignedToName}</strong>
                  </span>
                )}
              </div>

              {/* Problem Description */}
              {ticket.description && (
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                  {ticket.description}
                </div>
              )}

              {/* Attached Photo */}
              <TicketAttachmentPreview
                attachment={ticket.attachment}
                style={{ marginBottom: 14 }}
              />

              {/* Replies History */}
              {ticket.replies && ticket.replies.length > 0 && (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ticket.replies.map((r, i) => {
                    const isInternal = typeof r !== 'string' && r.isInternal
                    return (
                      <div
                        key={r.id || i}
                        style={{
                          background: isInternal ? '#fffbeb' : r.senderRole === 'employee' ? 'rgba(34,197,94,0.08)' : '#f8fafc',
                          border: isInternal ? '1px solid #fde68a' : '1px solid rgba(0,0,0,0.06)',
                          borderLeft: isInternal ? '3px solid #f59e0b' : undefined,
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          fontSize: '0.84rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, fontSize: '0.72rem', color: '#64748b' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <strong>{r.senderName || (typeof r === 'string' ? 'Note' : 'Message')}</strong>
                            {isInternal && (
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.68rem' }}>
                                🔒 Internal Note
                              </span>
                            )}
                          </span>
                          <span>{r.time || ''}</span>
                        </div>
                        <div style={{ color: isInternal ? '#92400e' : '#1e293b' }}>
                          {typeof r === 'string' ? r : r.text}
                          {r.attachment?.url && (
                            <div style={{ marginTop: 6 }}>
                              <img
                                src={r.attachment.url}
                                alt="Attachment"
                                style={{ maxWidth: 180, maxHeight: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                onClick={() => window.open(r.attachment.url, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Employee Actions: Status Updater & Reply */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mark Status:</span>
                    <button
                      type="button"
                      onClick={() => updateStatus(ticket.id, 'In Progress')}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 4, border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600 }}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(ticket.id, 'Resolved')}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 4, border: '1px solid #22c55e', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Resolved
                    </button>
                  </div>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: isInternalReply[ticket.id] ? '#b45309' : '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(isInternalReply[ticket.id])}
                      onChange={e => setIsInternalReply({ ...isInternalReply, [ticket.id]: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>🔒 Internal Staff Note (hidden from customer)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={isInternalReply[ticket.id] ? "Type private staff handover / internal note..." : "Type advisory reply or resolution message to customer..."}
                    value={replyText[ticket.id] || ''}
                    onChange={e => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addReply(ticket.id)}
                    style={{ padding: '7px 16px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Send size={14} /> Send
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
