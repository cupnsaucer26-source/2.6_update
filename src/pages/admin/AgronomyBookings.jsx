import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Sprout, RefreshCw, Phone, Calendar, CheckCircle2, Clock, Search, UserCheck, Building2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import { agronomyService } from '../../services/agronomyService'
import { useAuth } from '../../context/AuthContext'
import TableLoader from '../../components/common/TableLoader'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/formatters'

function formatExpertSpec(spec) {
  if (!spec) return ''
  const s = String(spec).toLowerCase()
  if (s.includes('disease') || s.includes('diagnostic')) return '(Diagnostics)'
  if (s.includes('soil')) return '(Soil Science)'
  if (s.includes('horticulture')) return '(Horticulture)'
  if (s.includes('pest') || s.includes('biological') || s.includes('entomology')) return '(Bio-Control)'
  return `(${spec.split(' ')[0]})`
}

export default function AgronomyBookings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stores, setStores] = useState([])
  const [experts, setExperts] = useState([])

  // Action states
  const [openId, setOpenId] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigningId, setAssigningId] = useState(null)

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlot, setRescheduleSlot] = useState('10:00 AM - 12:00 PM')
  const [rescheduling, setRescheduling] = useState(false)

  // Load stores & experts
  useEffect(() => {
    axios.get('/api/stores').then(res => {
      setStores(res.data?.data || [])
    }).catch(() => {})

    if (isAdmin) {
      agronomyService.getExperts().then(res => setExperts(res || [])).catch(() => {})
    }
  }, [isAdmin])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setBookings(await agronomyService.getAllBookings())
    } catch {
      toast.error('Failed to load agronomy bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('sathyam:bookings-updated', load)
    return () => window.removeEventListener('sathyam:bookings-updated', load)
  }, [load])

  const handleAssign = async (bookingId, expertId) => {
    if (!expertId) return
    setAssigningId(bookingId)
    try {
      await agronomyService.assignBooking(bookingId, expertId)
      const exp = experts.find(e => e.id === expertId)
      toast.success(`Booking assigned to ${exp?.name || 'expert'}`)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Could not reassign booking')
    } finally {
      setAssigningId(null)
    }
  }

  const complete = async (e, booking) => {
    e.preventDefault()
    setSaving(true)
    try {
      await agronomyService.completeCallback(booking.id, { callbackNotes: notes })
      toast.success('Callback marked as completed')
      setOpenId(null)
      setNotes('')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Could not update the booking')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (booking) => {
    const reason = window.prompt(`Cancel booking ${booking.id} for ${booking.farmerName}? Enter cancellation reason:`)
    if (reason === null) return
    try {
      await agronomyService.cancelBooking(booking.id, reason)
      toast.success('Booking cancelled')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Could not cancel booking')
    }
  }

  const handleRescheduleSubmit = async (e, bookingId) => {
    e.preventDefault()
    if (!rescheduleDate) {
      toast.error('Please pick a new date')
      return
    }
    setRescheduling(true)
    try {
      await agronomyService.rescheduleBooking(bookingId, {
        preferredDate: rescheduleDate,
        preferredSlot: rescheduleSlot
      })
      toast.success('Booking rescheduled successfully')
      setRescheduleId(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Could not reschedule booking')
    } finally {
      setRescheduling(false)
    }
  }

  // Filter experts eligible for this specific booking's store
  const getEligibleExpertsForBooking = (booking) => {
    const activeExperts = experts.filter(e => e.active !== false)
    if (!booking.storeId) return activeExperts
    const matched = activeExperts.filter(e => e.storeId === booking.storeId)
    // If super admin and no local agronomists assigned to that store, allow assigning any active agronomist as fallback
    if (matched.length === 0 && isSuperAdmin) return activeExperts
    return matched
  }

  const q = search.trim().toLowerCase()
  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (storeFilter !== 'all' && b.storeId !== storeFilter) return false
    if (!q) return true
    return [b.id, b.farmerName, b.farmerPhone, b.crop, b.expertName, b.topic, b.storeName]
      .some(v => String(v || '').toLowerCase().includes(q))
  })

  const countPending = bookings.filter(b => b.status === 'Pending').length
  const countScheduled = bookings.filter(b => b.status === 'Scheduled').length
  const countCompleted = bookings.filter(b => b.status === 'Completed').length
  const countCancelled = bookings.filter(b => b.status === 'Cancelled').length

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="animate-fade-in p2-staff">
      <div className="admin-hero">
        <div>
          <div className="eyebrow">Enterprise & Farmer Services</div>
          <h1>Agronomist Bookings</h1>
          <p>
            {isAdmin ? 'Manage, assign, and track farmer advisory callback sessions across stores.' : 'Advisory sessions scheduled with you.'}
          </p>
        </div>
        <button type="button" className="p2-btn p2-btn--outline p2-btn--sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status Counters */}
      <div className="p2-stats">
        <button type="button" className="p2-stat" style={{ borderLeft: statusFilter === 'Pending' ? '4px solid #f59e0b' : '' }} aria-pressed={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')}>
          <span className="p2-stat-icon" style={{ color: '#d97706' }}><Clock size={18} /></span>
          <span className="p2-stat-value">{countPending}</span>
          <span className="p2-stat-label">Pending Assignment</span>
        </button>

        <button type="button" className="p2-stat is-amber" aria-pressed={statusFilter === 'Scheduled'} onClick={() => setStatusFilter('Scheduled')}>
          <span className="p2-stat-icon"><Clock size={18} /></span>
          <span className="p2-stat-value">{countScheduled}</span>
          <span className="p2-stat-label">Waiting for Call</span>
        </button>

        <button type="button" className="p2-stat is-green" aria-pressed={statusFilter === 'Completed'} onClick={() => setStatusFilter('Completed')}>
          <span className="p2-stat-icon"><CheckCircle2 size={18} /></span>
          <span className="p2-stat-value">{countCompleted}</span>
          <span className="p2-stat-label">Completed</span>
        </button>

        <button type="button" className="p2-stat" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
          <span className="p2-stat-icon"><Sprout size={18} /></span>
          <span className="p2-stat-value">{bookings.length}</span>
          <span className="p2-stat-label">All ({countCancelled} Cancelled)</span>
        </button>
      </div>

      {/* Toolbar: Search, Status Filter & Store Filter */}
      <div className="p2-card p2-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div className="p2-search" style={{ flex: '1 1 250px' }}>
          <Search size={16} />
          <input className="p2-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmer, phone, crop, store, expert…" />
        </div>

        <select className="p2-input p2-select-fit" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Pending">Pending Assignment ({countPending})</option>
          <option value="Scheduled">Scheduled / Waiting for Call ({countScheduled})</option>
          <option value="Completed">Completed ({countCompleted})</option>
          <option value="Cancelled">Cancelled ({countCancelled})</option>
        </select>

        {stores.length > 0 && (
          <select className="p2-input p2-select-fit" value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all">All Stores (Global)</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <TableLoader message="Loading agronomy bookings…" size={24} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} />}
          title="No bookings found"
          description="No bookings match the selected filters."
        />
      ) : (
        <div className="p2-stack">
          {filtered.map(b => {
            const isDone = b.status === 'Completed'
            const isCancelled = b.status === 'Cancelled'
            const isPending = b.status === 'Pending'
            const eligibleExperts = getEligibleExpertsForBooking(b)

            return (
              <div key={b.id} className={`p2-booking${isDone ? ' is-done' : ''}`} style={{ borderLeft: isPending ? '4px solid #f59e0b' : isCancelled ? '4px solid #ef4444' : isDone ? '4px solid #16a34a' : '4px solid #0284c7' }}>
                <div className="p2-booking-top">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="p2-booking-id">{b.id}</span>
                      {b.storeName && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#334155', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                          <Building2 size={12} /> {b.storeName}
                        </span>
                      )}
                    </div>
                    <h4 style={{ marginTop: 4 }}>{b.farmerName}</h4>
                    <div className="p2-booking-topic">
                      {b.topic} · {b.crop} · {b.acreage} acre{Number(b.acreage) === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="p2-booking-actions">
                    <span className={`p2-chip ${isDone ? 'p2-chip--green' : isCancelled ? 'p2-chip--gray' : isPending ? 'p2-chip--amber' : 'p2-chip--blue'}`}>
                      {isDone ? <CheckCircle2 size={13} /> : isCancelled ? <XCircle size={13} /> : <Clock size={13} />} {b.status}
                    </span>

                    {!isDone && !isCancelled && openId !== b.id && b.status === 'Scheduled' && (
                      <button type="button" className="p2-btn p2-btn--primary p2-btn--sm" onClick={() => { setOpenId(b.id); setNotes('') }}>
                        Mark done
                      </button>
                    )}

                    {!isDone && !isCancelled && (
                      <button
                        type="button"
                        className="p2-btn p2-btn--ghost p2-btn--sm"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleCancel(b)}
                        title="Cancel this booking"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="p2-booking-meta" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <a href={`tel:+91${b.farmerPhone}`} className="p2-link" style={{ minHeight: 40, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Phone size={14} /> +91 {b.farmerPhone}
                  </a>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {b.preferredDate || 'Any day'}{b.preferredSlot ? `, ${b.preferredSlot}` : ''}
                    {!isDone && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(rescheduleId === b.id ? null : b.id)
                          setRescheduleDate(b.preferredDate || todayStr)
                          setRescheduleSlot(b.preferredSlot || '10:00 AM - 12:00 PM')
                        }}
                        className="p2-reschedule-trigger" title="Reschedule session slot"
                      >
                        Reschedule
                      </button>
                    )}
                  </span>

                  {isAdmin ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={14} style={{ color: 'var(--p2-green)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--p2-ink-2)' }}>Assigned to:</span>
                      {!isDone && !isCancelled ? (
                        eligibleExperts.length > 0 ? (
                          <select
                            className="p2-assign-select"
                            value={b.expertId || ''}
                            disabled={assigningId === b.id}
                            onChange={(e) => handleAssign(b.id, e.target.value)}
                            title="Assign or reassign an active Agronomist from this store"
                          >
                            <option value="">-- Choose Agronomist --</option>
                            {eligibleExperts.map(exp => (
                              <option key={exp.id} value={exp.id}>
                                {exp.name} {formatExpertSpec(exp.specialization)} {exp.storeName ? `[${exp.storeName}]` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#b45309', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={13} /> No active Agronomists at {b.storeName || 'this store'}
                          </span>
                        )
                      ) : (
                        <strong style={{ color: 'var(--p2-green-dark)' }}>{b.expertName || 'None'}</strong>
                      )}
                    </div>
                  ) : (
                    <span><UserCheck size={14} /> Expert: {b.expertName || 'Pending Assignment'}</span>
                  )}
                </div>

                {/* Inline Reschedule Form */}
                {rescheduleId === b.id && (
                  <form onSubmit={e => handleRescheduleSubmit(e, b.id)} style={{ marginTop: 10, padding: 10, background: '#f0f9ff', borderRadius: 6, border: '1px solid #bae6fd', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0369a1' }}>New Slot:</span>
                    <input
                      type="date"
                      min={todayStr}
                      required
                      className="p2-input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={rescheduleDate}
                      onChange={e => setRescheduleDate(e.target.value)}
                    />
                    <select
                      className="p2-input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={rescheduleSlot}
                      onChange={e => setRescheduleSlot(e.target.value)}
                    >
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                    </select>
                    <button type="submit" className="p2-btn p2-btn--primary p2-btn--sm" disabled={rescheduling}>
                      {rescheduling ? 'Saving…' : 'Save Slot'}
                    </button>
                    <button type="button" className="p2-btn p2-btn--ghost p2-btn--sm" onClick={() => setRescheduleId(null)}>
                      Cancel
                    </button>
                  </form>
                )}

                {b.notes && <div className="p2-quote" style={{ marginTop: 10 }}>Farmer's note: {b.notes}</div>}
                {isCancelled && b.cancellationReason && (
                  <div className="p2-quote" style={{ marginTop: 10, borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' }}>
                    Cancelled: {b.cancellationReason} {b.cancelledBy ? `(by ${b.cancelledBy})` : ''}
                  </div>
                )}
                {isDone && (
                  <div className="p2-quote p2-quote--green" style={{ marginTop: 10 }}>
                    Done by {b.completedBy || 'staff'}{b.completedAt ? ` on ${formatDate(b.completedAt)}` : ''}{b.callbackNotes ? `: ${b.callbackNotes}` : ''}
                  </div>
                )}

                {openId === b.id && (
                  <form onSubmit={e => complete(e, b)} className="p2-complete" style={{ marginTop: 12 }}>
                    <textarea className="p2-input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={2000}
                      placeholder="What did you advise the farmer? (e.g. Recommended Bio-NPK 500ml/acre with morning spray schedule)" />
                    <div className="p2-row" style={{ marginTop: 8 }}>
                      <button type="submit" className="p2-btn p2-btn--primary p2-btn--sm" disabled={saving}>
                        {saving ? 'Saving…' : 'Save & complete'}
                      </button>
                      <button type="button" className="p2-btn p2-btn--ghost p2-btn--sm" onClick={() => setOpenId(null)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
