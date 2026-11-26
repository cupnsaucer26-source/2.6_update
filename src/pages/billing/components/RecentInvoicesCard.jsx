import React from 'react'
import { Clock, RefreshCw, Printer } from 'lucide-react'
import TableLoader from '../../../components/common/TableLoader'
import EmptyState from '../../../components/common/EmptyState'
import { formatCurrency, formatShortDate } from '../../../utils/formatters'
import { getPaymentBadgeClass, prepareRecentInvoices } from '../../../shared/billingInvoices'

export { getPaymentBadgeClass, prepareRecentInvoices }

/**
 * RecentInvoicesCard - Displays recent POS invoice history table with
 * reprint/view capabilities, loading state, and empty state.
 */
export default function RecentInvoicesCard({
  invoiceHistory = [],
  historyLoading = false,
  onRefresh,
  onViewInvoice,
  limit = 10
}) {
  const displayedInvoices = (invoiceHistory || []).slice(0, limit)

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
          <Clock size={18} color="#a78bfa" /> Recent Invoices History
        </div>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={onRefresh}
          disabled={historyLoading}
        >
          <RefreshCw size={14} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {historyLoading ? (
        <div style={{ padding: '20px' }}>
          <TableLoader message="Loading records…" />
        </div>
      ) : displayedInvoices.length === 0 ? (
        <EmptyState
          title="No invoices created yet"
          description="Completed counter sales will appear here for reprinting and accounting."
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Buyer</th>
                <th>Payment Mode</th>
                <th>Tax</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map(inv => (
                <tr key={inv.id || inv._id}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-400)', fontSize: '0.82rem' }}>
                    {inv.invoiceNo || inv.id}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {formatShortDate(inv.date)}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{inv.customerName || 'Walk-in'}</td>
                  <td>
                    <span
                      className={`badge ${getPaymentBadgeClass(inv.paymentMode)}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {inv.paymentMode || 'Cash'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                    {formatCurrency(inv.totalGst || 0)}
                  </td>
                  <td style={{ fontWeight: 700, color: '#34d399' }}>
                    {formatCurrency(inv.grandTotal || 0)}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => onViewInvoice?.(inv)}
                    >
                      <Printer size={13} /> View &amp; Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
