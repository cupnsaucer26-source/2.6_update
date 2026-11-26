import React from 'react'
import { Truck, ChevronUp, ChevronDown } from 'lucide-react'

export default function TransportDetailsCard({
  showTransportSection,
  setShowTransportSection,
  motorVehicleNo,
  setMotorVehicleNo,
  despatchedThrough,
  setDespatchedThrough,
  destination,
  setDestination,
  billOfLading,
  setBillOfLading,
  buyersOrderNo,
  setBuyersOrderNo,
  orderDate,
  setOrderDate,
  despatchDocNo,
  setDespatchDocNo,
  termsOfDelivery,
  setTermsOfDelivery
}) {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setShowTransportSection(!showTransportSection)}
      >
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
          <Truck size={18} color="#f59e0b" /> Despatch &amp; Transport Details
        </div>
        <button className="btn btn-ghost btn-sm" type="button">
          {showTransportSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showTransportSection && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Motor Vehicle No.</label>
            <input
              className="form-input"
              value={motorVehicleNo}
              onChange={e => setMotorVehicleNo(e.target.value.toUpperCase())}
              placeholder="TN58DW0090"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Despatched Through</label>
            <input
              className="form-input"
              value={despatchedThrough}
              onChange={e => setDespatchedThrough(e.target.value)}
              placeholder="Eicher / VRL Logistics"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Destination</label>
            <input
              className="form-input"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Mettupalayam"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Bill of Lading / LR No.</label>
            <input
              className="form-input"
              value={billOfLading}
              onChange={e => setBillOfLading(e.target.value)}
              placeholder="LR-77889"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyers Order No.</label>
            <input
              className="form-input"
              value={buyersOrderNo}
              onChange={e => setBuyersOrderNo(e.target.value)}
              placeholder="PO-2026/09"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Order Date</label>
            <input
              type="date"
              className="form-input"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Despatch Doc No.</label>
            <input
              className="form-input"
              value={despatchDocNo}
              onChange={e => setDespatchDocNo(e.target.value)}
              placeholder="DSP-4412"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Terms of Delivery</label>
            <input
              className="form-input"
              value={termsOfDelivery}
              onChange={e => setTermsOfDelivery(e.target.value)}
              placeholder="Door Delivery"
            />
          </div>
        </div>
      )}
    </div>
  )
}
