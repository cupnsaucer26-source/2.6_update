import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Standard loading indicator for data tables and list views.
 *
 * @param {object} props
 * @param {string} [props.message='Loading records...'] - Accessible status text
 * @param {number} [props.colSpan] - If rendered inside a <tr>, table colSpan
 * @param {number} [props.size=20] - Spinner size in pixels
 * @param {string} [props.className=''] - Additional CSS classes
 */
export default function TableLoader({
  message = 'Loading records...',
  colSpan,
  size = 20,
  className = '',
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '32px 16px',
        color: '#64748b',
        fontSize: '0.88rem',
      }}
      role="status"
      aria-live="polite"
    >
      <RefreshCw size={size} className="animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );

  if (colSpan) {
    return (
      <tr className={className}>
        <td colSpan={colSpan} style={{ textAlign: 'center' }}>
          {content}
        </td>
      </tr>
    );
  }

  return <div className={className}>{content}</div>;
}
