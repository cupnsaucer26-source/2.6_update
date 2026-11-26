import React from 'react'
import { Film, X } from 'lucide-react'
import { toast } from 'sonner'

export default function VideosSection({
  form,
  setForm,
  availableVideos = [],
  customVideoTitle,
  setCustomVideoTitle,
  customVideoUrl,
  setCustomVideoUrl
}) {
  return (
    <section className="pform-section">
      <div className="pform-section-head">
        <span className="pform-section-icon"><Film size={15} /></span>
        <div>
          <h3>Product Videos &amp; Demonstrations</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Attach application demos or explainer videos. These appear in an interactive video player below the single product view on the customer website.
          </p>
        </div>
      </div>

      {/* Attached videos list */}
      {Array.isArray(form.taggedVideos) && form.taggedVideos.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Attached Videos ({form.taggedVideos.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.taggedVideos.map((vid, idx) => (
              <div key={vid.id || vid.url || idx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(74, 222, 128, 0.25)', borderRadius: '8px', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Film size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vid.title || 'Demonstration Video'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vid.category ? `[${vid.category}] ` : ''}{vid.url}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm(curr => ({
                      ...curr,
                      taggedVideos: curr.taggedVideos.filter((_, i) => i !== idx)
                    }))
                  }}
                  style={{
                    background: 'transparent', border: 'none', color: '#f87171',
                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                  }}
                  title="Remove video attachment"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pick from existing media library */}
      {availableVideos.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Select from Uploaded Media Library
          </label>
          <div style={{
            maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--dark-600)',
            borderRadius: '8px', padding: '8px', background: 'var(--dark-900)'
          }}>
            {availableVideos.map(v => {
              const isSelected = form.taggedVideos?.some(tv => tv.id === (v._id || v.id) || tv.url === (v.videoUrl || v.url))
              return (
                <div
                  key={v._id || v.id}
                  onClick={() => {
                    if (isSelected) {
                      setForm(curr => ({
                        ...curr,
                        taggedVideos: (curr.taggedVideos || []).filter(tv => tv.id !== (v._id || v.id) && tv.url !== (v.videoUrl || v.url))
                      }))
                    } else {
                      setForm(curr => ({
                        ...curr,
                        taggedVideos: [
                          ...(curr.taggedVideos || []),
                          {
                            id: v._id || v.id,
                            title: v.title || 'Product Demo',
                            url: v.videoUrl || v.url || '',
                            category: v.category || 'Product Demo',
                            thumbnailUrl: v.thumbnailUrl || ''
                          }
                        ]
                      }))
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? 'rgba(74, 222, 128, 0.12)' : 'transparent',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => {}} // Handled by parent onClick
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--brand-400)' : 'var(--text-primary)' }}>
                      {v.title}
                    </span>
                    {v.category && <span className="badge badge-gray" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>{v.category}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Or add custom video URL */}
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          Or Attach Custom Video URL / File
        </label>
        <div className="pform-adder" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            placeholder="Video Title (e.g. Field Application Demo)"
            value={customVideoTitle}
            onChange={e => setCustomVideoTitle(e.target.value)}
            style={{ flex: '1 1 180px' }}
          />
          <input
            placeholder="Video URL (YouTube or /api/upload/... or MP4 link)"
            value={customVideoUrl}
            onChange={e => setCustomVideoUrl(e.target.value)}
            style={{ flex: '2 1 240px' }}
          />
          <button
            type="button"
            onClick={() => {
              if (!customVideoUrl.trim()) { toast.error('Please enter a video URL'); return }
              const newVid = {
                id: `custom-${Date.now()}`,
                title: customVideoTitle.trim() || 'Product Demonstration',
                url: customVideoUrl.trim(),
                category: 'Product Demo'
              }
              setForm(curr => ({
                ...curr,
                taggedVideos: [...(curr.taggedVideos || []), newVid]
              }))
              setCustomVideoTitle('')
              setCustomVideoUrl('')
              toast.success('Video attached to product!')
            }}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Attach Video
          </button>
        </div>
      </div>
    </section>
  )
}
