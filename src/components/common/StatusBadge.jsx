import React from 'react';

/**
 * Status colors mapping across all Sathyam Agro Mart modules.
 * Standard badge classes: badge badge-green, badge badge-yellow, badge badge-red,
 * badge badge-blue, badge badge-teal, badge badge-purple, badge badge-gray.
 */
const STATUS_COLOR_MAP = {
  // Orders & Delivery
  pending: 'yellow',
  assigned: 'teal',
  confirmed: 'blue',
  dispatched: 'purple',
  'out for delivery': 'blue',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
  failed: 'red',

  // Payment Status
  paid: 'green',
  prepaid: 'green',
  unpaid: 'yellow',
  refunded: 'purple',
  cod: 'yellow',

  // Tickets
  open: 'yellow',
  'in progress': 'blue',
  resolved: 'green',
  closed: 'gray',

  // Staff / User / Store status
  active: 'green',
  inactive: 'gray',
  disabled: 'red',

  // Reports
  'in review': 'blue',
  analyzing: 'yellow',
  submitted: 'yellow',
};

/**
 * Standard StatusBadge component.
 * Renders high-contrast, accessible status pill tags.
 *
 * @param {object} props
 * @param {string} props.status - The raw status string (e.g., 'Pending', 'Delivered')
 * @param {string} [props.label] - Optional display override for the status text
 * @param {string} [props.color] - Explicit color override ('green', 'yellow', 'red', 'blue', 'teal', 'purple', 'gray')
 * @param {React.ReactNode} [props.icon] - Optional leading icon
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.title] - Hover tooltip
 * @param {React.CSSProperties} [props.style] - Inline style override
 */
export default function StatusBadge({
  status,
  label,
  color,
  icon,
  className = '',
  title,
  style,
}) {
  const displayLabel = label || status || 'Unknown';
  const normalized = String(status || '').trim().toLowerCase();
  const badgeColor = color || STATUS_COLOR_MAP[normalized] || 'gray';

  return (
    <span
      className={`badge badge-${badgeColor} ${className}`.trim()}
      title={title}
      style={style}
    >
      {icon && <span style={{ display: 'inline-flex', marginRight: 4 }}>{icon}</span>}
      {displayLabel}
    </span>
  );
}

export { STATUS_COLOR_MAP };
