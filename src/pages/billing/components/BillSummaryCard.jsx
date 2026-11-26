import React from 'react'
import { Banknote, Tag, Printer, Eye } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

/**
 * BillSummaryCard - Renders POS bill breakdown, coupon code input & validation,
 * manual discount control, tax breakdown (CGST/SGST), round-off, grand total,
 * total in Indian words, and invoice finalization / preview action triggers.
 *
 * State ownership remains strictly in the parent container (Dashboard.jsx).
 */
export default function BillSummaryCard({
  // Coupon state & handlers
  appliedCoupon = null,
  couponDiscountAmount = 0,
  couponCodeInput = '',
  setCouponCodeInput,
  validatingCoupon = false,
  applyCoupon,
  removeCoupon,
  onApplyCoupon,
  onRemoveCoupon,

  // Manual discount state & handler
  globalDiscountPercent = 0,
  setGlobalDiscountPercent,
  onDiscountChange,

  // Calculated summary object or discrete props
  summary,
  itemsSubtotal: propItemsSubtotal,
  manualDiscAmt: propManualDiscAmt,
  taxableSubtotal: propTaxableSubtotal,
  totalCgst: propTotalCgst,
  totalSgst: propTotalSgst,
  roundOff: propRoundOff,
  roundedGrandTotal: propRoundedGrandTotal,
  grandTotalWords: propGrandTotalWords,

  // Line items or count
  items = [],
  itemsCount: propItemsCount,

  // Invoice actions
  handleSaveAndPrintInvoice,
  handlePreviewCurrentBill,
  onSaveAndPrint,
  onPreview
}) {
  const handleApply = onApplyCoupon || applyCoupon
  const handleRemove = onRemoveCoupon || removeCoupon
  const handleDiscount = onDiscountChange || setGlobalDiscountPercent
  const handlePrint = onSaveAndPrint || handleSaveAndPrintInvoice
  const handlePreview = onPreview || handlePreviewCurrentBill

  const count = Number.isFinite(propItemsCount)
    ? propItemsCount
    : (Array.isArray(items) ? items.length : 0)
  const isBillEmpty = count === 0

  const itemsSubtotal = Number(summary?.itemsSubtotal ?? propItemsSubtotal ?? 0)
  const manualDiscAmt = Number(summary?.manualDiscAmt ?? propManualDiscAmt ?? 0)
  const couponDiscount = Number(summary?.couponDiscountAmount ?? couponDiscountAmount ?? 0)
  const taxableSubtotal = Number(summary?.taxableSubtotal ?? propTaxableSubtotal ?? 0)
  const totalCgst = Number(summary?.totalCgst ?? propTotalCgst ?? 0)
  const totalSgst = Number(summary?.totalSgst ?? propTotalSgst ?? 0)
  const roundOff = Number(summary?.roundOff ?? propRoundOff ?? 0)
  const roundedGrandTotal = Number(summary?.roundedGrandTotal ?? propRoundedGrandTotal ?? 0)
  const grandTotalWords = summary?.grandTotalWords ?? propGrandTotalWords ?? ''

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Banknote size={16} /> Bill Summary
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
          <Tag size={13} color="#a78bfa" /> Apply Coupon Code
        </label>
        {appliedCoupon ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid #a78bfa', padding: '6px 10px', borderRadius: '6px' }}>
            <div>
              <strong style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{appliedCoupon.code}</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Saved {formatCurrency(couponDiscount)}</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '0.72rem', color: '#f87171' }}
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              className="form-input"
              placeholder="Enter CODE"
              value={couponCodeInput}
              onChange={e => setCouponCodeInput && setCouponCodeInput(e.target.value.toUpperCase())}
              style={{ fontSize: '0.82rem', textTransform: 'uppercase' }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleApply}
              disabled={validatingCoupon}
              style={{ padding: '0 10px', fontSize: '0.78rem' }}
            >
              {validatingCoupon ? '…' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Manual Discount */}
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label" style={{ fontSize: '0.78rem' }}>Discount (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          className="form-input"
          value={globalDiscountPercent}
          onChange={e => handleDiscount && handleDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
          style={{ fontSize: '0.85rem' }}
        />
      </div>

      {/* Calculations Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: '0.84rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Subtotal ({count} items)</span>
          <span>₹{itemsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        {manualDiscAmt > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
            <span>Discount ({globalDiscountPercent}%)</span>
            <span>-₹{manualDiscAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {couponDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a78bfa' }}>
            <span>Coupon ({appliedCoupon?.code})</span>
            <span>-₹{couponDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Taxable Amount</span>
          <span>₹{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa', fontSize: '0.8rem' }}>
          <span>CGST (Central Tax)</span>
          <span>+₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa', fontSize: '0.8rem' }}>
          <span>SGST (State Tax)</span>
          <span>+₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        {roundOff !== 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <span>Round Off</span>
            <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 800,
          fontSize: '1.25rem',
          color: 'var(--text-primary)',
          borderTop: '1px solid var(--surface-border-subtle)',
          paddingTop: 10,
          marginTop: 4
        }}>
          <span>Grand Total</span>
          <span style={{ color: '#34d399' }}>
            ₹{roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
          {grandTotalWords}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-full btn-lg"
          onClick={handlePrint}
          disabled={isBillEmpty}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Printer size={18} /> Generate &amp; Print Bill
        </button>

        <button
          type="button"
          className="btn btn-outline btn-full"
          onClick={handlePreview}
          disabled={isBillEmpty}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Eye size={16} /> Preview Exact Template
        </button>
      </div>
    </div>
  )
}
