import React from 'react'
import { Info } from 'lucide-react'

export default function AdvancedSection({
  form,
  setForm
}) {
  return (
    <details className="pform-advanced" id="pform-advanced">
      <summary>
        <span className="pform-section-icon pform-advanced-tile"><Info size={15} /></span>
        <Info size={15} className="pform-advanced-info" /> Advanced details
        <span>Ingredient, dosage, usage guidance, related content, reviews</span>
      </summary>
      <div className="pform-advanced-body">
        <div className="pform-field pform-grid-2">
          <div>
            <label>Active Ingredient</label>
            <input
              placeholder="Active Chemical/Bio ingredient"
              value={form.activeIngredient}
              onChange={e => setForm({ ...form, activeIngredient: e.target.value })}
            />
          </div>
          <div>
            <label>Dosage</label>
            <input
              placeholder="Dosage e.g. 250g per Acre"
              value={form.dosage}
              onChange={e => setForm({ ...form, dosage: e.target.value })}
            />
          </div>
        </div>

        <div className="product-detail-fields">
          <div className="product-detail-grid">
            <div>
              <label>How to use</label>
              <textarea
                rows="4"
                value={form.howToUse}
                onChange={e => setForm({ ...form, howToUse: e.target.value })}
                placeholder="Application method, dosage, dilution and safety steps"
              />
            </div>
            <div>
              <label>When to use</label>
              <textarea
                rows="4"
                value={form.whenToUse}
                onChange={e => setForm({ ...form, whenToUse: e.target.value })}
                placeholder="Crop stage, symptoms, weather or timing guidance"
              />
            </div>
          </div>

          <label>Related blogs <span>(one per line: Blog title | https://example.com/blog)</span></label>
          <textarea
            rows="3"
            value={form.relatedBlogs}
            onChange={e => setForm({ ...form, relatedBlogs: e.target.value })}
            placeholder="Paddy blast prevention | /blogs/paddy-blast-prevention"
          />

          <label>Related product IDs <span>(comma separated)</span></label>
          <input
            value={form.relatedProductIds}
            onChange={e => setForm({ ...form, relatedProductIds: e.target.value })}
            placeholder="sb-1234, sb-5678"
          />

          <label className="review-toggle">
            <input
              type="checkbox"
              checked={form.reviewsEnabled}
              onChange={e => setForm({ ...form, reviewsEnabled: e.target.checked })}
            />
            Enable verified customer reviews for this product
          </label>
          <small>Ratings stay hidden until genuine review records are submitted. No seeded or random reviews are shown.</small>
        </div>
      </div>
    </details>
  )
}
