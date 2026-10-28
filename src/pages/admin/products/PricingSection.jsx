import React from 'react'
import { IndianRupee } from 'lucide-react'

export default function PricingSection({
  form,
  setForm,
  discountPercent
}) {
  return (
    <section className="pform-section" id="pform-pricing">
      <div className="pform-section-head">
        <span className="pform-section-icon"><IndianRupee size={15} /></span>
        <div>
          <h3>Pricing &amp; Stock</h3>
          <span className="pform-section-sub">MRP above the selling price shows a discount on the store</span>
        </div>
      </div>
      <div className="pform-grid-3">
        <div className="pform-field">
          <label>Selling Price (₹) *</label>
          <div className="pform-affix">
            <span className="pform-affix-pre" aria-hidden="true">₹</span>
            <input
              type="number"
              required
              placeholder="680"
              value={form.price}
              onChange={e => {
                const val = e.target.value
                setForm(current => {
                  const base = current.selectedPack || current.packDetails?.[0]?.size
                  const nextPacks = (current.packDetails || []).map(pd => {
                    if (!base || pd.size === base || current.packDetails.length === 1) {
                      return { ...pd, price: val }
                    }
                    return pd
                  })
                  return { ...current, price: val, packDetails: nextPacks }
                })
              }}
            />
          </div>
        </div>
        <div className="pform-field">
          <label>MRP (₹)</label>
          <div className="pform-affix">
            <span className="pform-affix-pre" aria-hidden="true">₹</span>
            <input
              type="number"
              placeholder="850"
              value={form.mrp}
              onChange={e => {
                const val = e.target.value
                setForm(current => {
                  const base = current.selectedPack || current.packDetails?.[0]?.size
                  const nextPacks = (current.packDetails || []).map(pd => {
                    if (!base || pd.size === base || current.packDetails.length === 1) {
                      return { ...pd, mrp: val }
                    }
                    return pd
                  })
                  return { ...current, mrp: val, packDetails: nextPacks }
                })
              }}
            />
          </div>
          <p className={`pform-hint pform-discount ${discountPercent > 0 ? 'on' : ''}`}>
            {discountPercent > 0 ? `${discountPercent}% off shown to shoppers` : 'No discount shown'}
          </p>
        </div>
        <div className="pform-field">
          <label>Stock Qty *</label>
          <div className="pform-affix">
            <input
              type="number"
              required
              placeholder="100"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
            />
            <span className="pform-affix-post" aria-hidden="true">units</span>
          </div>
        </div>
      </div>
      <div className="pform-grid-2" style={{ marginTop: '12px' }}>
        <div className="pform-field">
          <label>HSN Code * <em>(Tax Classification)</em></label>
          <input
            type="text"
            required
            placeholder="e.g. 3808, 3105"
            value={form.hsnCode || ''}
            onChange={e => setForm({ ...form, hsnCode: e.target.value })}
          />
        </div>
        <div className="pform-field">
          <label>GST Rate (%) *</label>
          <select
            required
            value={form.gstRate}
            onChange={e => setForm({ ...form, gstRate: Number(e.target.value) })}
          >
            <option value={18}>18% GST (Standard Bio-Pesticide)</option>
            <option value={12}>12% GST (Fertilizers / Micronutrients)</option>
            <option value={5}>5% GST (Bio-Seeds / Agro Inputs)</option>
            <option value={0}>0% GST (Exempt / Organic Raw)</option>
          </select>
        </div>
      </div>
      <div style={{
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.2)',
        padding: '8px 12px',
        borderRadius: '8px',
        marginTop: '10px',
        fontSize: '0.82rem',
        color: '#34d399',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>🧾 Tax Breakdown:</span>
        <strong>CGST: {(Number(form.gstRate || 18) / 2)}% &nbsp;|&nbsp; SGST: {(Number(form.gstRate || 18) / 2)}% &nbsp;|&nbsp; IGST: {Number(form.gstRate || 18)}%</strong>
      </div>
    </section>
  )
}
