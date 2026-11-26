import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Ticket,
  Search,
  Filter,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  User,
  ShieldAlert,
  Building,
  RefreshCw,
  Phone,
  Mail,
  Package,
  Calendar,
  Layers,
  ChevronDown,
  Paperclip,
  Lock
} from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../context/AuthContext'
import TicketAssignControls from '../../components/tickets/TicketAssignControls'
import TicketStatusBadge, { getTicketStatusChipClass, getTicketPriorityChipClass } from '../../components/tickets/TicketStatusBadge'
import TicketAttachmentPreview from '../../components/tickets/TicketAttachmentPreview'
import TicketMessageThread from '../../components/tickets/TicketMessageThread'

export default function SupportTicketSystem() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Assignment Modal / Controls
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Reply state
  const [adminReply, setAdminReply] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)

  // Load tickets
  // Read the selection through a ref so loadTickets stays stable; depending
  // on selectedTicket re-ran the load effect after every refresh, forever.
  const selectedRef = useRef(null)
  useEffect(() => { selectedRef.current = selectedTicket }, [selectedTicket])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const list = await ticketService.getTickets()
      setTickets(list)
      const selectedTicket = selectedRef.current
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0])
      } else if (selectedTicket) {
        const refreshed = list.find(t => t.id === selectedTicket.id)
        if (refreshed) setSelectedTicket(refreshed)
      }
    } catch (err) {
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()

    const handleUpdate = () => loadTickets()
    window.addEventListener('sathyam:tickets-updated', handleUpdate)
    return () => window.removeEventListener('sathyam:tickets-updated', handleUpdate)
  }, [loadTickets])

  // Update Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return
    try {
      const updated = await ticketService.updateTicketStatus(selectedTicket.id, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      setSelectedTicket(updated)
      await loadTickets()
    } catch {
      toast.error('Could not update status')
    }
  }

  // Update Priority
  const handlePriorityChange = async (newPriority) => {
    if (!selectedTicket) return
    try {
      const updated = await ticketService.updateTicketPriority(selectedTicket.id, newPriority)
      toast.success(`Priority updated to ${newPriority}`)
      setSelectedTicket(updated)
      await loadTickets()
    } catch {
      toast.error('Could not update priority')
    }
  }

  // Reply as Super Admin
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!adminReply.trim() || !selectedTicket) return

    setSendingReply(true)
    try {
      const updated = await ticketService.addReply(selectedTicket.id, {
        senderName: 'Super Admin Executive Desk',
        senderRole: 'superadmin',
        text: adminReply.trim(),
        isInternal: isInternalNote
      })
      setAdminReply('')
      setIsInternalNote(false)
      setSelectedTicket(updated)
      toast.success(isInternalNote ? 'Internal staff note logged' : 'Reply broadcasted to ticket thread')
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  // Computed KPI Metrics
  const totalCount = tickets.length
  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length
  const progressCount = tickets.filter(t => t.status === 'In Progress').length
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
  const unassignedCount = tickets.filter(t => !t.assignedToId || t.assignedToName === 'Unassigned').length
  const urgentCount = tickets.filter(t => t.priority === 'Urgent' || t.priority === 'High').length

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    // Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && t.status !== 'Open' && t.status !== 'Pending') return false
      if (statusFilter === 'progress' && t.status !== 'In Progress') return false
      if (statusFilter === 'resolved' && t.status !== 'Resolved' && t.status !== 'Closed') return false
    }

    // Priority
    if (priorityFilter !== 'all' && t.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false

    // Assignee
    if (assigneeFilter === 'unassigned') {
      if (t.assignedToId && t.assignedToName !== 'Unassigned') return false
    } else if (assigneeFilter === 'admin') {
      if (t.assignedRole !== 'admin') return false
    } else if (assigneeFilter === 'employee') {
      if (t.assignedRole !== 'employee') return false
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const match =
        t.id.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q)) ||
        (t.farmerName && t.farmerName.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(q))
      if (!match) return false
    }

    return true
  })

  const KPIS = [
    ['Total Tickets', totalCount, 'All-time customer requests', '', <Ticket size={18} key="i" />, () => { setStatusFilter('all'); setAssigneeFilter('all') }, statusFilter === 'all' && assigneeFilter === 'all'],
    ['Unassigned Tickets', unassignedCount, 'Require Super Admin delegation', 'is-red', <AlertTriangle size={18} key="i" />, () => setAssigneeFilter('unassigned'), assigneeFilter === 'unassigned'],
    ['Open / Pending', openCount, 'Awaiting initial triage', 'is-amber', <Clock size={18} key="i" />, () => setStatusFilter('open'), statusFilter === 'open'],
    ['In Progress', progressCount, 'Under active staff handling', 'is-blue', <RefreshCw size={18} key="i" />, () => setStatusFilter('progress'), statusFilter === 'progress'],
    ['Resolved & Closed', resolvedCount, `${totalCount ? Math.round((resolvedCount / totalCount) * 100) : 0}% resolution rate`, 'is-green', <CheckCircle2 size={18} key="i" />, () => setStatusFilter('resolved'), statusFilter === 'resolved'],
    ['High & Urgent Priority', urgentCount, 'Requires rapid escalation', 'is-red', <ShieldAlert size={18} key="i" />, () => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent'), priorityFilter === 'urgent']
  ]
  const statusChip = getTicketStatusChipClass
  const priorityChip = getTicketPriorityChipClass
  const assignedOf = t => t?.assignedToName && t.assignedToName !== 'Unassigned'

  return (
    <div className="animate-fade-in p2-staff">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow p2-inline-icon">
            <ShieldAlert size={14} /> ENTERPRISE SURVEILLANCE &amp; SUPPORT
          </div>
          <h1>🎫 Central Support Ticket System</h1>
          <p>
            Real-time monitoring of all customer order grievances, quality issues, and agronomic advisory tickets. Direct Super Admin assignment to Admins &amp; Employees.
          </p>
        </div>

        <button type="button" onClick={loadTickets} className="p2-btn p2-btn--outline p2-btn--sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Live Feed
        </button>
      </div>

      {/* KPI Monitoring Stat Cards (tap to filter) */}
      <div className="p2-stats p2-stats--6">
        {KPIS.map(([label, value, hint, tone, icon, onClick, pressed]) => (
          <button key={label} type="button" className={`p2-stat ${tone}`} aria-pressed={pressed} onClick={onClick} title={hint}>
            <span className="p2-stat-icon">{icon}</span>
            <span className="p2-stat-value">{value}</span>
            <span className="p2-stat-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Grid: Queue + Inspection Panel */}
      <div className="p2-split">
        <div className="p2-card p2-queue">
          <div className="p2-queue-head">
            <div className="p2-section-head" style={{ margin: 0 }}>
              <strong>Support Queue ({filteredTickets.length} tickets)</strong>
              <span className="p2-hint">Super Admin View: Company-Wide Visibility</span>
            </div>
            <div className="p2-search">
              <Search size={16} />
              <input
                type="text"
                className="p2-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ticket ID, order ID, farmer name, mobile..."
              />
            </div>

            <div className="p2-filter-3">
              <select className="p2-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="open">Open / Pending</option>
                <option value="progress">In Progress</option>
                <option value="resolved">Resolved / Closed</option>
              </select>
              <select className="p2-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="p2-input" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
                <option value="all">All Assignments</option>
                <option value="unassigned">⚠️ Unassigned Only</option>
                <option value="admin">Assigned to Admin</option>
                <option value="employee">Assigned to Employee</option>
              </select>
            </div>
          </div>

          <div className="p2-queue-list">
            {filteredTickets.length === 0 ? (
              <div className="p2-empty">
                <div className="p2-empty-icon"><Ticket size={28} /></div>
                <h3>No tickets match your filter criteria</h3>
                <p>Adjust search or filters above</p>
              </div>
            ) : (
              filteredTickets.map(t => (
                <div key={t.id} className={`p2-list-row${assignedOf(t) ? '' : ' is-unassigned'}`}>
                  <button
                    type="button"
                    className="p2-list-item"
                    aria-current={selectedTicket?.id === t.id}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <span className="p2-list-top">
                      <span className="p2-list-id">{t.id}</span>
                      <span className="p2-list-chips">
                        <TicketStatusBadge priority={t.priority} />
                        <TicketStatusBadge status={t.status} />
                      </span>
                    </span>
                    <span className="p2-list-title">{t.subject}</span>
                    <span className="p2-list-meta">
                      <span><User size={13} /> {t.farmerName} · 📱 {t.phone || '—'}</span>
                    </span>
                    <span className="p2-list-meta" style={{ marginTop: 4 }}>
                      <span>{t.category} {t.crop ? `· ${t.crop}` : ''}</span>
                    </span>
                    {t.orderId && <span className="p2-list-assigned p2-list-order"><Package size={12} /> {t.orderId}</span>}
                    <span className="p2-list-assigned">
                      {assignedOf(t)
                        ? <><UserCheck size={12} /> {t.assignedToName} <small>({t.assignedRole})</small></>
                        : <span className="p2-tone-red">⚠️ Unassigned</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="p2-btn p2-btn--ghost p2-btn--sm p2-list-quick"
                    onClick={() => { setSelectedTicket(t); setShowAssignModal(true) }}
                  >
                    Assign ▾
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Inspection & Super Admin Action Console */}
        {selectedTicket && (
          <div className="p2-card p2-thread">
            <div className="p2-thread-head">
              <div className="p2-thread-ids">
                <span className="p2-thread-id">{selectedTicket.id}</span>
                <span className="p2-chip p2-chip--line">Order: {selectedTicket.orderId || 'Direct'}</span>
                <TicketStatusBadge status={selectedTicket.status} />
              </div>
              <h2>{selectedTicket.subject}</h2>
              <div className="p2-hint" style={{ marginTop: 4 }}>
                Raised by <strong>{selectedTicket.farmerName}</strong> (📱 {selectedTicket.phone})
              </div>

              {/* Problem Description */}
              {selectedTicket.description && (
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '10px 0 6px', border: '1px solid #e2e8f0' }}>
                  {selectedTicket.description}
                </div>
              )}

              {/* Attachment if present */}
              <TicketAttachmentPreview attachment={selectedTicket.attachment} />
            </div>

            <div className="p2-detail-pad p2-stack">
              {/* SUPER ADMIN ASSIGNMENT BOX */}
              <div className="p2-form-box">
                <div className="p2-section-head" style={{ marginBottom: 6 }}>
                  <span className="p2-label p2-inline-icon" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                    <UserCheck size={16} /> Super Admin Delegation
                  </span>
                  {assignedOf(selectedTicket) && <span className="p2-chip p2-chip--green">Active Assignment</span>}
                </div>
                <div className="p2-hint" style={{ marginBottom: 10 }}>
                  Current Handler:{' '}
                  <strong>
                    {assignedOf(selectedTicket)
                      ? `${selectedTicket.assignedToName} (${selectedTicket.assignedRole?.toUpperCase()})`
                      : 'Not assigned to any staff member'}
                  </strong>
                </div>
                {/* Store first, then one of that store's admins (TicketAssignControls). */}
                <TicketAssignControls ticket={selectedTicket} onAssigned={updated => { if (updated) setSelectedTicket(updated); loadTickets() }} />
              </div>

              {/* Priority & Status Controls */}
              <div className="p2-grid-2" style={{ gap: 12 }}>
                <div>
                  <div className="p2-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', marginBottom: 6 }}>
                    Ticket Priority
                  </div>
                  <select
                    className="p2-input"
                    value={selectedTicket.priority || 'Medium'}
                    onChange={e => handlePriorityChange(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <div className="p2-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', marginBottom: 6 }}>
                    Ticket Status
                  </div>
                  <select
                    className="p2-input"
                    value={selectedTicket.status || 'Open'}
                    onChange={e => handleStatusChange(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Quick Status Setter Tabs */}
              <div>
                <div className="p2-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', marginBottom: 8 }}>
                  Quick Status Selector
                </div>
                <div className="p2-tabs p2-tabs--fill" role="group">
                  {['Pending', 'In Progress', 'Resolved', 'Closed'].map(st => (
                    <button key={st} type="button" className="p2-tab" aria-selected={selectedTicket.status === st} onClick={() => handleStatusChange(st)}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discussion Thread */}
              <div>
                <div className="p2-label" style={{ textTransform: 'uppercase', fontSize: '0.72rem', marginBottom: 8 }}>
                  Live Message Stream ({selectedTicket.replies?.length || 0})
                </div>
                <TicketMessageThread replies={selectedTicket.replies} mode="staff" showRole={true} />

                {/* Super Admin Direct Message / Reply with Internal Note toggle */}
                <form onSubmit={handleSendReply} className="p2-reply p2-reply--flat" style={{ flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input
                      type="text"
                      className="p2-input"
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      placeholder={isInternalNote ? "Post private staff note (hidden from customer)..." : "Post reply visible to customer..."}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="p2-btn p2-btn--primary" disabled={sendingReply || !adminReply.trim()}>
                      <Send size={15} /> Send
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: isInternalNote ? '#b45309' : '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>🔒 <strong>Internal Staff Note</strong> (Private — visible to staff only, hidden from farmer)</span>
                  </label>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ASSIGN MODAL */}
      {showAssignModal && selectedTicket && (
        <div className="p2-backdrop" onClick={() => setShowAssignModal(false)}>
          <div className="p2-modal p2-modal--narrow p2-staff" role="dialog" aria-modal="true" aria-labelledby="p2-tassign-title" onClick={e => e.stopPropagation()}>
            <div className="p2-modal-head">
              <div>
                <h3 id="p2-tassign-title">Assign Ticket {selectedTicket.id}</h3>
                <p>Choose the store this ticket belongs to, then one of that store's admins. They see it in their portal and can hand it to their own staff.</p>
              </div>
              <button type="button" className="p2-close" aria-label="Close" onClick={() => setShowAssignModal(false)}>&times;</button>
            </div>
            <div className="p2-modal-body">
              <TicketAssignControls ticket={selectedTicket} onAssigned={updated => { if (updated) setSelectedTicket(updated); setShowAssignModal(false); loadTickets() }} />
            </div>
            <div className="p2-modal-foot">
              <button type="button" className="p2-btn p2-btn--ghost" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
