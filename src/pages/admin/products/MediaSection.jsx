import React from 'react'
import { Image as ImageIcon } from 'lucide-react'

export default function MediaSection({
  form,
  setForm,
  photoList = [],
  handlePhotoUpload
}) {
  return (
    <section className="pform-section" id="pform-media">
      <div className="pform-section-head">
        <span className="pform-section-icon"><ImageIcon size={15} /></span>
        <div>
          <h3>Photos &amp; Description</h3>
          <span className="pform-section-sub">The first photo is the card image; the rest fill the detail gallery</span>
        </div>
      </div>
      <div className="pform-field">
        <label>Product Photos * <em>(one URL or asset path per line)</em></label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          onChange={handlePhotoUpload}
        />
        {photoList.length > 0 && (
          <div className="pform-thumbs">
            {photoList.map((src, index) => (
              <figure key={`${index}-${src.slice(0, 40)}`}>
                <img src={src} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                {index === 0 && <figcaption>Cover</figcaption>}
              </figure>
            ))}
          </div>
        )}
        <textarea
          rows="2"
          required
          value={form.images}
          onChange={e => setForm({ ...form, images: e.target.value })}
          placeholder="/assets/product-front.jpg&#10;/assets/product-label.jpg"
        />
        <p className="pform-hint">Use at least one photo. Select multiple files or add URLs/asset paths for the detail-page gallery and hover zoom.</p>
      </div>
      <div className="pform-field">
        <label>Product Description *</label>
        <textarea
          required
          rows="3"
          placeholder="Key farmer benefits, disease target, application instructions..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </section>
  )
}
