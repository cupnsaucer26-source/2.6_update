import React from 'react'
import { Package, Search as SearchIcon, AlertTriangle, Plus } from 'lucide-react'

export default function AddItemCard({
  productSearch,
  setProductSearch,
  selectedProduct,
  setSelectedProduct,
  handleProductDropdownChange,
  filteredCatalog,
  catalog,
  itemBatch,
  setItemBatch,
  itemHsn,
  setItemHsn,
  itemQty,
  setItemQty,
  itemRate,
  setItemRate,
  itemUnit,
  setItemUnit,
  addItem
}) {
  const sp = selectedProduct ? catalog.find(p => p.id === selectedProduct) : null

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
          <Package size={18} color="#ec4899" /> Add Goods &amp; Services
        </div>
      </div>

      {/* Row 1: Product Search + Select */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 10, marginBottom: 10 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <SearchIcon size={13} /> Search Product
          </label>
          <input
            className="form-input"
            value={productSearch}
            onChange={e => {
              setProductSearch(e.target.value)
              setSelectedProduct('')
            }}
            placeholder="Type product name, HSN, category..."
            style={{ fontSize: '0.85rem' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Product / Search</label>
          <select
            className="form-select"
            value={selectedProduct}
            onChange={e => {
              setProductSearch('')
              handleProductDropdownChange(e)
            }}
          >
            <option value="">-- Select a product --</option>
            {filteredCatalog.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{p.price} [HSN: {p.hsnCode}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected product info banner */}
      {sp && (
        <div style={{
          padding: '6px 12px',
          borderRadius: 6,
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.3)',
          fontSize: '0.8rem',
          color: '#34d399',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontWeight: 700 }}>✓ {sp.name}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>₹{sp.price} / {sp.unit || 'Nos'}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>HSN: {sp.hsnCode}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>GST: {sp.gstRate}%</span>
        </div>
      )}

      {/* Custom product name (shown when no product selected from catalog) */}
      {!selectedProduct && (
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label" style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={13} /> No product selected — Enter custom product name
          </label>
          <input
            className="form-input"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Custom product / service name"
            style={{ borderColor: 'rgba(245,158,11,0.4)', fontSize: '0.88rem' }}
          />
        </div>
      )}

      {/* Row 2: Batch, HSN, Qty, Rate, Unit, Add button */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 90px 80px auto', gap: 10, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Batch Name</label>
          <input
            className="form-input"
            value={itemBatch}
            onChange={e => setItemBatch(e.target.value)}
            placeholder="Primary Batch"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>HSN/SAC</label>
          <input
            className="form-input"
            value={itemHsn}
            onChange={e => setItemHsn(e.target.value)}
            placeholder="31010099"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
          <input
            type="number"
            min="1"
            className="form-input"
            value={itemQty}
            onChange={e => setItemQty(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-input"
            value={itemRate}
            onChange={e => setItemRate(e.target.value)}
            style={!itemRate ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit</label>
          <select className="form-select" value={itemUnit} onChange={e => setItemUnit(e.target.value)}>
            <option>Nos</option>
            <option>Kg</option>
            <option>Ltr</option>
            <option>Box</option>
            <option>Bags</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={addItem}
          disabled={!itemRate && itemRate !== 0}
          style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40 }}
        >
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  )
}
