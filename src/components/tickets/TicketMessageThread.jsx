export default function TicketMessageThread({
  replies = [],
  mode = 'staff', // 'staff' | 'customer'
  showRole = false,
  compact = true,
  headerLabel = null,
  className = '',
  style
}) {
  const containerClass = [
    'p2-messages',
    compact ? 'p2-messages--compact' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass} style={style}>
      {headerLabel && (
        <div className="p2-messages-label">{headerLabel}</div>
      )}

      {(!replies || replies.length === 0) ? (
        <div className="p2-hint" style={{ padding: '8px 0' }}>
          No messages in this thread yet.
        </div>
      ) : (
        replies.map((rep, idx) => {
          if (!rep) return null
          const isSystem = rep.senderRole === 'system'
          const key = rep.id || idx

          if (isSystem) {
            return (
              <div key={key} className="p2-sys">
                {mode === 'customer' ? '🔔 ' : ''}{rep.text} · {rep.time}
              </div>
            )
          }

          const isFarmer = rep.senderRole === 'farmer'
          const isMe = mode === 'customer' ? isFarmer : !isFarmer
          const isInternal = Boolean(rep.isInternal)

          let senderTitle
          if (mode === 'customer') {
            senderTitle = isFarmer ? 'You (Customer)' : `👨‍🌾 ${rep.senderName || 'Staff'}`
          } else {
            senderTitle = rep.senderName || 'Staff'
            if (showRole && rep.senderRole) {
              senderTitle += ` (${rep.senderRole.toUpperCase()})`
            }
          }

          return (
            <div
              key={key}
              className={`p2-msg${isMe ? ' p2-msg--me' : ''}`}
              style={isInternal ? { borderLeft: '3px solid #f59e0b', background: '#fffbeb' } : undefined}
            >
              <div className="p2-msg-who">
                <strong>{senderTitle}</strong>
                {isInternal && (
                  <span
                    className="p2-chip p2-chip--amber"
                    style={{ fontSize: '0.68rem', padding: '2px 6px', marginLeft: 6 }}
                  >
                    🔒 Internal Staff Note
                  </span>
                )}
                {rep.time && <span>· {rep.time}</span>}
              </div>

              <div
                className="p2-bubble"
                style={isInternal ? { background: '#fef3c7', color: '#92400e' } : undefined}
              >
                {typeof rep === 'string' ? rep : rep.text}
                {rep.attachment?.url && (
                  <div style={{ marginTop: mode === 'customer' ? 8 : 6 }}>
                    <img
                      src={rep.attachment.url}
                      alt="Attachment"
                      style={{
                        maxWidth: 200,
                        maxHeight: 150,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(rep.attachment.url, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
