import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export default function ChatRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/api/chat/records')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data)
      } else {
        setRecords([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load chat records'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase().trim()
    return records.filter(r => {
      const sid = String(r.sessionId || r.session || r.id || '').toLowerCase()
      const usr = String(r.user || r.farmerName || '').toLowerCase()
      const crp = String(r.crop || r.topic || '').toLowerCase()
      const prv = String(r.preview || '').toLowerCase()
      return sid.includes(q) || usr.includes(q) || crp.includes(q) || prv.includes(q)
    })
  }, [records, search])

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No chat records to export')
      return
    }

    const headers = ['Session ID', 'Farmer / User', 'Phone', 'Crop / Topic', 'Date & Time', 'Messages', 'Status', 'Preview']
    const rows = filteredRecords.map(r => [
      `"${String(r.sessionId || r.session || r.id || '').replace(/"/g, '""')}"`,
      `"${String(r.user || r.farmerName || 'Visitor').replace(/"/g, '""')}"`,
      `"${String(r.farmerPhone || r.phone || '').replace(/"/g, '""')}"`,
      `"${String(r.crop || r.topic || 'General').replace(/"/g, '""')}"`,
      `"${String(r.date || r.updatedAt || '').replace(/"/g, '""')}"`,
      Number(r.messages || 1),
      r.resolved ? '"Resolved"' : '"Open"',
      `"${String(r.preview || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sathyam_chat_records_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Chat records exported to CSV!')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>💬 Chat Records</h1>
          <p>{loading ? 'Loading sessions...' : `${filteredRecords.length} recorded session${filteredRecords.length === 1 ? '' : 's'}`}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search session, farmer, crop..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ minWidth: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
          />
          <button
            className="btn btn-secondary"
            onClick={exportCSV}
            disabled={loading || filteredRecords.length === 0}
            type="button"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Loading chat records from database...
            </span>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '12px' }}>⚠️ {error}</p>
            <button className="btn btn-primary" onClick={fetchRecords} type="button">
              🔄 Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>🌾 No chat records found</p>
            <p style={{ fontSize: '0.85rem' }}>{search ? 'Try adjusting your search query.' : 'New conversations from the AI Assistant will appear here automatically.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>User / Farmer</th>
                  <th>Crop / Topic</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'center' }}>Messages</th>
                  <th>Status</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const sid = r.sessionId || r.session || r.id
                  const userLabel = r.user || r.farmerName || 'Visitor'
                  const isResolved = Boolean(r.resolved)
                  return (
                    <tr key={sid}>
                      <td>
                        <code style={{ color: 'var(--brand-400)', fontSize: '0.8rem', fontWeight: 600 }}>{sid}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{userLabel}</div>
                        {r.farmerPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.farmerPhone}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                          {r.crop || r.topic || 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {r.date || (r.updatedAt ? r.updatedAt.slice(0, 16).replace('T', ' ') : 'Just now')}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.messages || 1}</td>
                      <td>
                        <span className={`badge ${isResolved ? 'badge-green' : 'badge-yellow'}`}>
                          {isResolved ? '✓ Resolved' : '⏳ Ongoing'}
                        </span>
                      </td>
                      <td
                        style={{
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)'
                        }}
                        title={r.preview}
                      >
                        {r.preview || 'No preview available'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
