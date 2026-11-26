import React from 'react';

/**
 * EmptyState component for consistent empty data views across tables and lists.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Icon displayed at the top of the empty state
 * @param {string} [props.title='No records found'] - Heading
 * @param {string} [props.description] - Subtext or help instructions
 * @param {React.ReactNode} [props.action] - Optional action button or link
 * @param {string} [props.className=''] - Additional CSS classes
 */
export default function EmptyState({
  icon,
  title = 'No records found',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`empty-state ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        textAlign: 'center',
        color: '#64748b',
      }}
      role="status"
    >
      {icon && (
        <div style={{ marginBottom: 12, opacity: 0.8, color: '#94a3b8' }}>
          {icon}
        </div>
      )}
      <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: '#334155' }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '0.82rem', margin: '6px 0 0', color: '#64748b', maxWidth: 420 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
