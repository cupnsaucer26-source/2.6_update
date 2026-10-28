import React from 'react'
import { CreditCard } from 'lucide-react'

export default function PaymentModeCard({
  paymentOptions,
  paymentMode,
  setPaymentMode,
  paymentTerms,
  setPaymentTerms,
  buyerRef,
  setBuyerRef,
  otherReferences,
  setOtherReferences
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
          <CreditCard size={16} color="#34d399" /> Mode / Terms of Payment
        </div>
      </div>

      {/* Payment Mode Grid Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {paymentOptions.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setPaymentMode(opt.id)
              if (opt.id === 'Credit Purchase' && !paymentTerms) {
                setPaymentTerms('30 Days Credit')
              }
            }}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              border: paymentMode === opt.id ? '2px solid var(--brand-500)' : '1px solid var(--surface-border)',
              background: paymentMode === opt.id ? 'var(--brand-900)' : 'var(--surface-card)',
              color: paymentMode === opt.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: paymentMode === opt.id ? 700 : 500,
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* If Credit Purchase is selected, show credit terms */}
      {paymentMode === 'Credit Purchase' && (
        <div style={{
          padding: 10,
          borderRadius: 8,
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid #a78bfa',
          marginBottom: 12
        }}>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>
            Credit Terms / Due Duration
          </label>
          <select
            className="form-select"
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option>15 Days Net Credit</option>
            <option>30 Days Credit</option>
            <option>45 Days Credit</option>
            <option>60 Days Credit</option>
            <option>Custom Credit Agreement</option>
          </select>
        </div>
      )}

      {/* Buyer Reference & Other References */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Buyer&apos;s Ref</label>
          <input
            className="form-input"
            value={buyerRef}
            onChange={e => setBuyerRef(e.target.value)}
            placeholder="Ref No."
            style={{ fontSize: '0.8rem' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Other Ref(s)</label>
          <input
            className="form-input"
            value={otherReferences}
            onChange={e => setOtherReferences(e.target.value)}
            placeholder="Other notes"
            style={{ fontSize: '0.8rem' }}
          />
        </div>
      </div>
    </div>
  )
}
