import { ExternalLink } from 'lucide-react'

export default function TicketAttachmentPreview({
  attachment,
  label = 'Customer Attachment',
  thumbnailSize = 48,
  linkText = 'Open Full Image',
  className = '',
  style
}) {
  if (!attachment?.url) return null

  const size = typeof thumbnailSize === 'number' ? `${thumbnailSize}px` : thumbnailSize

  return (
    <div
      className={className}
      style={{
        margin: '8px 0',
        padding: '8px 12px',
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        ...style
      }}
    >
      <img
        src={attachment.url}
        alt={attachment.filename || label || 'Ticket attachment'}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid #cbd5e1',
          cursor: 'pointer'
        }}
        onClick={() => window.open(attachment.url, '_blank')}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
          📎 {label}: {attachment.filename || 'Photo'}
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.74rem',
            color: '#15803d',
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3
          }}
        >
          {linkText} <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
