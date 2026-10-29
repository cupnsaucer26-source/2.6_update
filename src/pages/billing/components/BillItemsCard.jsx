import React from 'react'
import { Trash2, ReceiptText } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import { formatCurrency } from '../../../utils/formatters'
import { formatItemRate } from '../../../shared/billingItems'

/**
 * BillItemsCard - Displays the active bill draft line items table,
 * quantity increment/decrement controls, item removal, and empty state.
 */
export default function BillItemsCard({
  items = [],
  updateItemQty,
  removeItem,
  clearCurrentBill,
  onUpdateQty,
  onRemoveItem,
  onClearBill
}) {
  const handleUpdateQty = onUpdateQty || updateItemQty
  const handleRemoveItem = onRemoveItem || removeItem
  const handleClearBill = onClearBill || clearCurrentBill
  const billItems = Array.isArray(items) ? items : []

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title" style={{ fontSize: '0.95rem' }}>
          Bill Items ({billItems.length})
        </div>
        {billItems.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleClearBill}
            style={{ color: '#f87171' }}
          >
            Clear Bill
          </button>
        )}
      </div>

      {billItems.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={32} />}
          title="No products added yet"
          description="Use the selector above to add items to this bill."
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th>Description of Goods</th>
                <th>HSN/SAC</th>
                <th>Rate</th>
                <th>Qty</th>
                <th>GST</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((i, idx) => (
                <tr key={i.id || `item-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{i.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Batch: {i.batch} · per {i.unit}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {i.hsnCode}
                    </span>
                  </td>
                  <td>{formatItemRate(i.rate)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 7px', minWidth: 24 }}
                        onClick={() => handleUpdateQty?.(i.id, i.qty - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{i.qty}</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 7px', minWidth: 24 }}
                        onClick={() => handleUpdateQty?.(i.id, i.qty + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    <span className="badge badge-blue">{i.gstRate}%</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-400)' }}>
                    {formatCurrency(i.amount)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#f87171', padding: '4px 6px' }}
                      onClick={() => handleRemoveItem?.(i.id)}
                      aria-label={`Remove ${i.name || 'item'} from bill`}
                    >
                      <Trash2 size={15} />
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
