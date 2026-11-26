import React from 'react'
import { User } from 'lucide-react'

export default function VisibilitySection({
  form,
  setForm,
  users = []
}) {
  return (
    <section className="pform-section" id="pform-visibility">
      <div className="pform-section-head">
        <span className="pform-section-icon"><User size={15} /></span>
        <div>
          <h3>Targeting &amp; Visibility</h3>
          <span className="pform-section-sub">Who sees it first, and whether it is sold online</span>
        </div>
      </div>
      <div className="pform-field">
        <label>Assign to user <em>(personalizes their catalog &amp; prioritizes it on their store page)</em></label>
        <select
          value={form.targetUserId}
          onChange={e => setForm({ ...form, targetUserId: e.target.value })}
        >
          <option value="all">🌐 All Users (General Public E-Commerce)</option>
          <optgroup label="Assign to Registered Farmer">
            {users.filter(u => u.role === 'farmer').map(u => (
              <option key={u.id} value={u.id}>
                👤 {u.name} — {u.phone} ({u.crop || 'Farmer'}, {u.village || 'Tamil Nadu'})
              </option>
            ))}
          </optgroup>
          <optgroup label="Assign to Staff / Operations">
            {users.filter(u => u.role !== 'farmer').map(u => (
              <option key={u.id} value={u.id}>
                🛡️ {u.name} ({u.role})
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="product-visibility-panel" style={{ marginTop: '14px' }}>
        <div>
          <label className="product-visibility-title">Product Channel &amp; Visibility</label>
          <p>Choose where this formulation is sold and stocked.</p>
        </div>
        <div className="product-visibility-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          <label className={`product-visibility-option ${form.visibility === 'both' ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="radio" name="product-visibility" checked={form.visibility === 'both'} onChange={() => setForm({ ...form, visibility: 'both', online: true })} />
            <strong>🔄 Both (Web &amp; POS)</strong>
            <span>Available on website &amp; billing counter</span>
          </label>
          <label className={`product-visibility-option ${form.visibility === 'online' ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="radio" name="product-visibility" checked={form.visibility === 'online'} onChange={() => setForm({ ...form, visibility: 'online', online: true })} />
            <strong>🌐 Online Only</strong>
            <span>Customer e-commerce website only</span>
          </label>
          <label className={`product-visibility-option ${form.visibility === 'offline' ? 'active offline' : ''}`} style={{ cursor: 'pointer' }}>
            <input type="radio" name="product-visibility" checked={form.visibility === 'offline'} onChange={() => setForm({ ...form, visibility: 'offline', online: false })} />
            <strong>🏬 Offline Only</strong>
            <span>Billing portal only, hidden from store</span>
          </label>
        </div>
      </div>
    </section>
  )
}
