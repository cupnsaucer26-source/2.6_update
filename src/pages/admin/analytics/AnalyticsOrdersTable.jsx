import React, { useState, useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import EmptyState from '../../../components/common/EmptyState';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../../utils/formatters.js';

/**
 * Actual Transactions Data Table for Omnichannel Sales Analytics.
 * Renders verified transaction rows with search filtering, status badges, and Excel export.
 *
 * @param {object} props
 * @param {Array} props.orders - Full transaction records list
 * @param {string} props.periodLabel - Label of selected time window (e.g. 'This Month')
 * @param {string} props.channel - Active channel filter ('both', 'online', 'offline')
 * @param {() => void} props.onExportCSV - Excel export callback
 */
export default function AnalyticsOrdersTable({
  orders = [],
  periodLabel = 'This Month',
  channel = 'both',
  onExportCSV,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const lower = searchTerm.toLowerCase();
    return orders.filter((o) =>
      [o.id, o.customer, o.phone, o.district, o.state, o.deliveryStatus, o.paymentMethod, o.channel].some(
        (v) => String(v || '').toLowerCase().includes(lower)
      )
    );
  }, [orders, searchTerm]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="card-title">📋 Actual Orders — {periodLabel}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="filter-select"
            placeholder="Search orders…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 220, padding: '6px 12px', borderRadius: 8 }}
          />
          <span className="badge badge-blue">{filteredOrders.length} rows</span>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onExportCSV}
          >
            ⬇ Export Excel
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Channel</th>
              <th>Order/Bill ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Location / Counter</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '24px' }}>
                  <EmptyState
                    icon={<FileSpreadsheet size={32} />}
                    title="No transactions found"
                    description="No transactions match this period and channel filter."
                  />
                </td>
              </tr>
            ) : (
              filteredOrders.map((o, i) => (
                <tr key={o.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                  <td>
                    {o.channel === 'offline' ? (
                      <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                        🏬 POS Bill
                      </span>
                    ) : (
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                        🌐 Online
                      </span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--brand-400)' }}>{o.id}</strong>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {formatDateTime(o.date, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{o.customer}</td>
                  <td style={{ fontSize: '0.8rem' }}>{o.phone || '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {o.channel === 'offline'
                      ? 'Billing Counter'
                      : o.district || o.state || 'Web Store'}
                  </td>
                  <td
                    style={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.78rem',
                    }}
                    title={o.items}
                  >
                    {o.items || '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-400)' }}>
                    {formatCurrency(o.total)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <StatusBadge
                        status={o.paymentStatus}
                        style={{ fontSize: '0.7rem' }}
                      />
                      {o.paymentMethod && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {o.paymentMethod}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge
                      status={o.deliveryStatus}
                      style={{ fontSize: '0.72rem' }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
