import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Ticket,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Package,
  Send,
  Search,
  ArrowLeft,
  LifeBuoy,
  FileText,
  Calendar,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Paperclip,
  Check,
  RotateCcw,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ticketService } from '../services/ticketService'
import ServicesBottomNav from '../components/common/ServicesBottomNav'
import TicketStatusBadge from '../components/tickets/TicketStatusBadge'
import TicketAttachmentPreview from '../components/tickets/TicketAttachmentPreview'
import TicketMessageThread from '../components/tickets/TicketMessageThread'

const CATEGORIES = [
  'Product Quality',
  'Delivery Delay',
  'Damaged / Leaking Package',
  'Wrong Item Delivered',
  'Agronomy Advisory & Spray Doubt',
  'Billing & Refund',
  'Other Query'
]

export default function SupportTicketsCustomer() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Pre-selected orderId from query string (e.g. /support-tickets?orderId=SAM-ORD-8821)
  const queryParams = new URLSearchParams(location.search)
  const initialOrderId = queryParams.get('orderId') || ''

  const [tickets, setTickets] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const selectedTicketRef = useRef(null)

  // New ticket modal/form state
  const [showModal, setShowModal] = useState(Boolean(initialOrderId))
  const [newTicket, setNewTicket] = useState({
    orderId: initialOrderId,
    category: 'Product Quality',
    priority: 'Medium',
    crop: user?.crop || 'Paddy/Rice',
    subject: '',
    description: '',
    attachment: null
  })
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Load orders for the customer
  const loadOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders')
      setOrders(Array.isArray(res?.data?.data) ? res.data.data : [])
    } catch {
      // Ignored
    }
  }, [])

  // Keep a ref in sync with state so loadTickets can read it without being a dep
  useEffect(() => { selectedTicketRef.current = selectedTicket }, [selectedTicket])

  // Load tickets — intentionally only depends on `user`, not `selectedTicket`,
  // to avoid an infinite loop (setSelectedTicket → dep change → re-run → loop).
  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const list = await ticketService.getTickets()
      setTickets(list)
      const current = selectedTicketRef.current
      if (list.length > 0 && !current) {
        setSelectedTicket(list[0])
      } else if (current) {
        const refreshed = list.find(t => t.id === current.id)
        if (refreshed) setSelectedTicket(refreshed)
      }
    } catch {
      toast.error('Unable to fetch tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    loadTickets()

    const handleUpdate = () => loadTickets()
    window.addEventListener('sathyam:tickets-updated', handleUpdate)
    return () => window.removeEventListener('sathyam:tickets-updated', handleUpdate)
  }, [loadOrders, loadTickets])

  // If initialOrderId came through url, prefill it
  useEffect(() => {
    if (initialOrderId) {
      setNewTicket(prev => ({ ...prev, orderId: initialOrderId }))
      setShowModal(true)
    }
  }, [initialOrderId])

  // Handle file attachment selection and upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Attachment exceeds 5MB limit')
      return
    }
    setUploadingAttachment(true)
    try {
      const data = await ticketService.uploadAttachment(file)
      setNewTicket(prev => ({ ...prev, attachment: data }))
      toast.success('Photo attached successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploadingAttachment(false)
    }
  }

  // Handle new ticket submission
  const handleSubmitTicket = async (e) => {
    e.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Please enter a subject and problem description')
      return
    }

    setSubmitting(true)
    try {
      const chosenOrder = orders.find(o => o.id === newTicket.orderId)
      const created = await ticketService.createTicket({
        orderId: newTicket.orderId || '',
        farmerName: user?.name || '',
        phone: user?.phone || '',
        crop: newTicket.crop,
        category: newTicket.category,
        priority: newTicket.priority,
        subject: newTicket.subject,
        description: newTicket.description,
        orderItems: chosenOrder?.items || [],
        attachment: newTicket.attachment
      })

      toast.success(`Support Ticket ${created.id} raised successfully!`, {
        description: 'Your ticket has been logged and assigned to the support desk.'
      })

      setShowModal(false)
      setNewTicket({
        orderId: '',
        category: 'Product Quality',
        priority: 'Medium',
        crop: user?.crop || 'Paddy/Rice',
        subject: '',
        description: '',
        attachment: null
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadTickets()
      setSelectedTicket(created)
    } catch (err) {
      toast.error(err.message || 'Failed to submit support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle customer resolution confirmation
  const handleCustomerClose = async () => {
    if (!selectedTicket) return
    try {
      const updated = await ticketService.updateTicketStatus(selectedTicket.id, 'Closed')
      setSelectedTicket(updated)
      toast.success('Thank you! Ticket has been confirmed and closed.')
      await loadTickets()
    } catch (err) {
      toast.error(err.message || 'Failed to close ticket')
    }
  }

  // Handle customer reopen
  const handleCustomerReopen = async () => {
    if (!selectedTicket) return
    try {
      const updated = await ticketService.updateTicketStatus(selectedTicket.id, 'In Progress')
      setSelectedTicket(updated)
      toast.info('Ticket reopened. You can now post additional details below.')
      await loadTickets()
    } catch (err) {
      toast.error(err.message || 'Failed to reopen ticket')
    }
  }

  // Handle customer reply
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return

    setSendingReply(true)
    try {
      const updated = await ticketService.addReply(selectedTicket.id, {
        senderName: user?.name || 'Farmer Customer',
        senderRole: 'farmer',
        text: replyText.trim()
      })
      setReplyText('')
      setSelectedTicket(updated)
      toast.success('Your message has been added to the ticket thread')
    } catch {
      toast.error('Could not send reply')
    } finally {
      setSendingReply(false)
    }
  }

  // Filtered tickets
  const filtered = tickets.filter(t => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'open' && (t.status === 'Open' || t.status === 'Pending')) ||
      (activeFilter === 'progress' && t.status === 'In Progress') ||
      (activeFilter === 'resolved' && (t.status === 'Resolved' || t.status === 'Closed'))

    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      (t.orderId && t.orderId.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status) => <TicketStatusBadge status={status} showIcon />
  const getPriorityBadge = (priority) => <TicketStatusBadge priority={priority} />

  const assigned = selectedTicket?.assignedToName && selectedTicket.assignedToName !== 'Unassigned'

  return (
    <div className="p2-page">
      {/* Hero */}
      <section className="p2-hero p2-hero--row">
        <Ticket className="p2-hero-art" aria-hidden="true" />
        <div className="p2-hero-inner">
          <div className="p2-hero-copy">
            <Link to="/orders" className="p2-hero-back">
              <ArrowLeft size={16} /> Back to Orders
            </Link>
            <h1 className="p2-hero-title">Order Support Tickets</h1>
            <p className="p2-hero-text">
              Raise issues for any previous order with no time limit. Direct resolution overseen by Super Admin &amp; Agronomy Experts.
            </p>
          </div>
          <div className="p2-hero-actions">
            <button type="button" className="p2-btn p2-btn--light" onClick={() => setShowModal(true)}>
              <PlusCircle size={18} /> Raise Support Ticket
            </button>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <div className="p2-note">
        <div className="p2-note-body">
          <div className="p2-note-icon"><LifeBuoy size={20} /></div>
          <div>
            <strong>No Expiry or Time Limit on Order Queries</strong>
            <p>
              Whether your order was delivered yesterday or months ago, our team investigates quality, delivery, and dosage questions thoroughly.
            </p>
          </div>
        </div>
        <Link to="/agronomy-experts" className="p2-btn p2-btn--outline p2-btn--sm">
          <Sparkles size={14} /> Need Field Expert Callback?
        </Link>
      </div>

      {/* Main Grid: Ticket List + Selected Ticket Thread */}
      <div className="p2-split">
        {/* Left Column: Tickets Queue */}
        <div className="p2-card p2-queue">
          <div className="p2-queue-head">
            <div className="p2-tabs p2-tabs--fill" role="tablist">
              {[
                { key: 'all', label: 'All' },
                { key: 'open', label: 'Open' },
                { key: 'progress', label: 'In Progress' },
                { key: 'resolved', label: 'Resolved' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === f.key}
                  className="p2-tab"
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="p2-search">
              <Search size={16} />
              <input
                type="text"
                className="p2-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ticket ID, order ID, or topic..."
              />
            </div>
          </div>

          {/* Ticket Cards List */}
          <div className="p2-queue-list">
            {loading ? (
              <div className="p2-loading">Loading your tickets...</div>
            ) : filtered.length === 0 ? (
              <div className="p2-empty">
                <div className="p2-empty-icon"><Ticket size={28} /></div>
                <h4>No support tickets found</h4>
                <p>
                  {search ? 'Try adjusting your search criteria' : 'You have not raised any support requests yet.'}
                </p>
                <button type="button" className="p2-btn p2-btn--primary p2-btn--sm" onClick={() => setShowModal(true)}>
                  Raise Ticket for an Order
                </button>
              </div>
            ) : (
              filtered.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className="p2-list-item"
                  aria-current={selectedTicket?.id === t.id}
                  onClick={() => setSelectedTicket(t)}
                >
                  <span className="p2-list-top">
                    <span className="p2-list-id">{t.id}</span>
                    <span className="p2-list-chips">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </span>
                  </span>
                  <span className="p2-list-title">{t.subject}</span>
                  <span className="p2-list-meta">
                    <span><FileText size={13} /> {t.category}</span>
                    <span><Calendar size={13} /> {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </span>
                  {t.orderId && (
                    <span className="p2-list-assigned p2-list-order">
                      <Package size={12} /> {t.orderId}
                    </span>
                  )}
                  {t.assignedToName && t.assignedToName !== 'Unassigned' && (
                    <span className="p2-list-assigned">
                      <User size={12} /> Assigned: <strong>{t.assignedToName}</strong>
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Ticket Details & Conversation */}
        <div className="p2-card p2-thread">
          {selectedTicket ? (
            <div>
              {/* Ticket Details Header */}
              <div className="p2-thread-head">
                <div className="p2-thread-top">
                  <div>
                    <div className="p2-thread-ids">
                      <span className="p2-thread-id">{selectedTicket.id}</span>
                      {selectedTicket.orderId && (
                        <span className="p2-chip p2-chip--line">Order #{selectedTicket.orderId}</span>
                      )}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <h2>{selectedTicket.subject}</h2>
                  </div>

                  <div className="p2-thread-status">
                    {getStatusBadge(selectedTicket.status)}
                    <span>
                      Opened {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                {selectedTicket.description && (
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '12px 0', border: '1px solid #e2e8f0' }}>
                    {selectedTicket.description}
                  </div>
                )}

                {/* Attachment if present */}
                <TicketAttachmentPreview
                  attachment={selectedTicket.attachment}
                  label="Attached Photo"
                  thumbnailSize={60}
                  linkText="View full size"
                  style={{ marginTop: 10, padding: '10px 14px', gap: 12 }}
                />

                {/* Meta details strip */}
                <dl className="p2-meta-grid" style={{ marginTop: 12 }}>
                  <div>
                    <dt>Category</dt>
                    <dd>{selectedTicket.category}</dd>
                  </div>
                  <div>
                    <dt>Crop Involved</dt>
                    <dd>{selectedTicket.crop || 'General Farm'}</dd>
                  </div>
                  <div>
                    <dt>Handled By</dt>
                    <dd className={assigned ? 'is-assigned' : 'is-pending'}>
                      {assigned ? `${selectedTicket.assignedToName} (${selectedTicket.assignedRole || 'Staff'})` : 'Super Admin Triage Desk'}
                    </dd>
                  </div>
                  {selectedTicket.resolvedAt && (
                    <div>
                      <dt>Resolution Date</dt>
                      <dd className="is-done">{new Date(selectedTicket.resolvedAt).toLocaleDateString('en-IN')}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Resolution Confirmation Prompt for Customer */}
              {selectedTicket.status === 'Resolved' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '14px 16px', margin: '14px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 700, marginBottom: 6 }}>
                    <CheckCircle2 size={18} /> Resolution Provided
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: '#166534' }}>
                    Our Agronomy / Support team has provided a resolution for this issue. Are you satisfied with the solution?
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleCustomerClose}
                      className="p2-btn p2-btn--primary p2-btn--sm"
                      style={{ background: '#15803d' }}
                    >
                      <Check size={14} /> Confirm &amp; Close Ticket
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomerReopen}
                      className="p2-btn p2-btn--outline p2-btn--sm"
                      style={{ color: '#b45309', borderColor: '#f59e0b' }}
                    >
                      <RotateCcw size={14} /> Not Satisfied? Reopen Ticket
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation Messages Thread */}
              <TicketMessageThread
                replies={selectedTicket.replies}
                mode="customer"
                compact={false}
                headerLabel="— Conversation History & Support Updates —"
              />

              {/* Reply Box */}
              {selectedTicket.status === 'Closed' ? (
                <div className="p2-reply-done" style={{ background: '#f8fafc', color: '#64748b' }}>
                  🔒 This support ticket has been confirmed and <strong>Closed</strong>. If you still need help, feel free to raise a new ticket.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p2-reply">
                  <textarea
                    rows={2}
                    className="p2-input"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={selectedTicket.status === 'Resolved' ? "Type a reply to automatically reopen this ticket..." : "Type additional details, response, or question for the agronomist..."}
                  />
                  <button type="submit" className="p2-btn p2-btn--primary" disabled={sendingReply || !replyText.trim()}>
                    <Send size={16} /> Send
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p2-empty">
              <div className="p2-empty-icon"><MessageSquare size={28} /></div>
              <h3>Select a ticket from the left</h3>
              <p>View the full response history or message our agronomists directly.</p>
            </div>
          )}
        </div>
      </div>

      {/* Other Pages Bottom Navigation */}
      <ServicesBottomNav />

      {/* MODAL: Raise New Support Ticket */}
      {showModal && (
        <div className="p2-backdrop" onClick={() => setShowModal(false)}>
          <div className="p2-modal" role="dialog" aria-modal="true" aria-labelledby="p2-ticket-title" onClick={e => e.stopPropagation()}>
            <div className="p2-modal-head">
              <div>
                <h3 id="p2-ticket-title">🎫 Raise Order Support Ticket</h3>
                <p>Link your ticket to any past order. Super Admin and Agronomists will monitor and resolve it.</p>
              </div>
              <button type="button" className="p2-close" aria-label="Close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTicket}>
              <div className="p2-modal-body">
                {/* Order selector (No time limit) */}
                <div className="p2-field">
                  <label className="p2-label">
                    Select Previous Order * (No time limit on past orders)
                  </label>
                  <select
                    className="p2-input"
                    value={newTicket.orderId}
                    onChange={e => setNewTicket(p => ({ ...p, orderId: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose an Order --</option>
                    {orders.map(ord => (
                      <option key={ord.id} value={ord.id}>
                        {ord.id} — {ord.status || 'Confirmed'} (₹{Number(ord.total || 0).toLocaleString('en-IN')}) {ord.createdAt ? `· ${ord.createdAt.slice(0, 10)}` : ''}
                      </option>
                    ))}
                    <option value="GENERAL-INQUIRY">General Inquiry / Pre-Purchase Question</option>
                    <option value="OTHER-OFFLINE-ORDER">Other / Offline Counter Purchase</option>
                  </select>
                  <span className="p2-hint">
                    💡 You can raise a ticket for ANY past order, irrespective of when it was placed.
                  </span>
                </div>

                {/* Category & Priority Grid */}
                <div className="p2-grid-2">
                  <div className="p2-field">
                    <label className="p2-label">Issue Category *</label>
                    <select
                      className="p2-input"
                      value={newTicket.category}
                      onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="p2-field">
                    <label className="p2-label">Severity / Priority</label>
                    <select
                      className="p2-input"
                      value={newTicket.priority}
                      onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="Low">Low - General query</option>
                      <option value="Medium">Medium - Standard order query</option>
                      <option value="High">High - Damaged goods or delay</option>
                      <option value="Urgent">Urgent - Crop disease outbreak / active loss</option>
                    </select>
                  </div>
                </div>

                {/* Crop */}
                <div className="p2-field">
                  <label className="p2-label">Target Crop</label>
                  <input
                    type="text"
                    className="p2-input"
                    placeholder="e.g. Paddy, Cotton, Tomato, Sugarcane"
                    value={newTicket.crop}
                    onChange={e => setNewTicket(p => ({ ...p, crop: e.target.value }))}
                  />
                </div>

                {/* Subject */}
                <div className="p2-field">
                  <label className="p2-label">Ticket Subject / Title *</label>
                  <input
                    type="text"
                    className="p2-input"
                    required
                    placeholder="e.g. Broken seal on bottle / Delivery delayed"
                    value={newTicket.subject}
                    onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  />
                </div>

                {/* Detailed Description */}
                <div className="p2-field">
                  <label className="p2-label">Describe the Issue in Detail *</label>
                  <textarea
                    className="p2-input"
                    required
                    rows={4}
                    placeholder="Please describe symptoms, order package state, batch number if visible, or any agronomy questions..."
                    value={newTicket.description}
                    onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* Photo Attachment Picker */}
                <div className="p2-field">
                  <label className="p2-label">Attach Photo (Optional — Damaged package, leaf symptoms, batch stamp)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="ticket-photo-input"
                    />
                    <button
                      type="button"
                      className="p2-btn p2-btn--outline p2-btn--sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAttachment}
                    >
                      <Paperclip size={14} /> {uploadingAttachment ? 'Uploading Photo...' : newTicket.attachment ? 'Change Photo' : 'Select Photo (max 5MB)'}
                    </button>
                    {newTicket.attachment && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#15803d', background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                        <span>📎 {newTicket.attachment.filename}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTicket(p => ({ ...p, attachment: null }))
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="p2-hint">
                    Accepted formats: PNG, JPG, WebP. Maximum size 5MB.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="p2-modal-foot">
                <button type="button" className="p2-btn p2-btn--ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="p2-btn p2-btn--primary" disabled={submitting || uploadingAttachment}>
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
