import React from 'react'
import { FileText } from 'lucide-react'

export default function DocumentMetaCard({
  documentType,
  handleDocTypeChange,
  invoiceNo,
  setInvoiceNo,
  invoiceDate,
  setInvoiceDate,
  ackNo,
  setAckNo,
  ackDate,
  setAckDate,
  irn,
  setIrn
}) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
          <FileText size={18} color="#60a5fa" /> Document &amp; e-Invoice Details
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['TAX INVOICE', 'CREDIT NOTE', 'BILL OF SUPPLY'].map(type => (
            <button
              key={type}
              type="button"
              className={`btn btn-sm ${documentType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.72rem', padding: '3px 10px' }}
              onClick={() => handleDocTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>
            {documentType === 'CREDIT NOTE' ? 'Credit Note No.' : 'Invoice No.'}
          </label>
          <input
            className="form-input"
            value={invoiceNo}
            onChange={e => setInvoiceNo(e.target.value)}
            style={{ fontWeight: 700, fontFamily: 'monospace' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Dated</label>
          <input
            type="date"
            className="form-input"
            value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Ack No.</label>
          <input
            className="form-input"
            value={ackNo}
            onChange={e => setAckNo(e.target.value)}
            placeholder="Only for e-invoices"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Ack Date</label>
          <input
            className="form-input"
            value={ackDate}
            onChange={e => setAckDate(e.target.value)}
            placeholder="07 Aug 26"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          e-Invoice IRN (Invoice Reference Number)
        </label>
        <input
          className="form-input"
          value={irn}
          onChange={e => setIrn(e.target.value)}
          style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  )
}
