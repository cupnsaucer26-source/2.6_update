import React from 'react'
import { User } from 'lucide-react'

export default function BuyerConsigneeCard({
  buyerName,
  setBuyerName,
  buyerPhone,
  setBuyerPhone,
  buyerGstin,
  setBuyerGstin,
  buyerAddress,
  setBuyerAddress,
  buyerCityState,
  setBuyerCityState,
  buyerPincode,
  setBuyerPincode,
  buyerStateCode,
  setBuyerStateCode,
  sameAsBuyer,
  setSameAsBuyer,
  consigneeName,
  setConsigneeName,
  consigneeSubName,
  setConsigneeSubName,
  consigneeGstin,
  setConsigneeGstin,
  consigneeAddress,
  setConsigneeAddress,
  consigneeCityState,
  setConsigneeCityState,
  consigneePincode,
  setConsigneePincode,
  consigneePhone,
  setConsigneePhone
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
          <User size={18} color="#34d399" /> Buyer (Bill To) &amp; Consignee (Ship To)
        </div>
      </div>

      {/* Buyer Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer / Business Name *</label>
          <input
            className="form-input"
            value={buyerName}
            onChange={e => setBuyerName(e.target.value)}
            placeholder="Walk-in Customer"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone Number</label>
          <input
            className="form-input"
            value={buyerPhone}
            onChange={e => setBuyerPhone(e.target.value)}
            placeholder="9876543210"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyer GSTIN / UIN</label>
          <input
            className="form-input"
            value={buyerGstin}
            onChange={e => setBuyerGstin(e.target.value.toUpperCase())}
            placeholder="e.g. 33ABCDE1234F1Z5"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Billing Address</label>
          <input
            className="form-input"
            value={buyerAddress}
            onChange={e => setBuyerAddress(e.target.value)}
            placeholder="No12, Ghouse Enclave, 70ft Road, Ellis Nagar"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>City / District &amp; State</label>
          <input
            className="form-input"
            value={buyerCityState}
            onChange={e => setBuyerCityState(e.target.value)}
            placeholder="Madurai-625016, Tamil Nadu"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Pincode &amp; State Code</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="form-input"
              value={buyerPincode}
              onChange={e => setBuyerPincode(e.target.value)}
              placeholder="625016"
              style={{ width: '60%' }}
            />
            <input
              className="form-input"
              value={buyerStateCode}
              onChange={e => setBuyerStateCode(e.target.value)}
              placeholder="33"
              style={{ width: '40%' }}
            />
          </div>
        </div>
      </div>

      {/* Consignee Toggle */}
      <div style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid var(--surface-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={sameAsBuyer}
            onChange={e => setSameAsBuyer(e.target.checked)}
            style={{ accentColor: 'var(--brand-500)', width: 16, height: 16 }}
          />
          <span style={{ fontWeight: 600 }}>Consignee (Ship To) is same as Buyer</span>
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {sameAsBuyer ? 'Shipping address matched with billing' : 'Custom shipping address enabled'}
        </span>
      </div>

      {/* Consignee Fields (shown if not same as buyer) */}
      {!sameAsBuyer && (
        <div style={{
          marginTop: 12,
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--surface-border)',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Consignee Name</label>
            <input
              className="form-input"
              value={consigneeName}
              onChange={e => setConsigneeName(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Branch / Unit</label>
            <input
              className="form-input"
              value={consigneeSubName}
              onChange={e => setConsigneeSubName(e.target.value)}
              placeholder="Mettupalayam_Retail"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Consignee GSTIN</label>
            <input
              className="form-input"
              value={consigneeGstin}
              onChange={e => setConsigneeGstin(e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Ship To Address</label>
            <input
              className="form-input"
              value={consigneeAddress}
              onChange={e => setConsigneeAddress(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>City &amp; State</label>
            <input
              className="form-input"
              value={consigneeCityState}
              onChange={e => setConsigneeCityState(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Pincode &amp; Phone</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="form-input"
                value={consigneePincode}
                onChange={e => setConsigneePincode(e.target.value)}
                placeholder="641104"
                style={{ width: '45%' }}
              />
              <input
                className="form-input"
                value={consigneePhone}
                onChange={e => setConsigneePhone(e.target.value)}
                placeholder="e.g. 98765 43210"
                style={{ width: '55%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
