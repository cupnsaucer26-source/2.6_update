import { useEffect, memo } from 'react'
import { rupees } from '../data'

const I18N = {
  en: {
    addedBadge: 'Added to Basket',
    title: 'Item Added to Cart!',
    question: 'What would you like to do next?',
    addMoreBtn: 'Add More Products',
    viewCartBtn: 'Go to Cart & Checkout',
    closeAria: 'Close',
    qtyLabel: 'Qty'
  },
  ta: {
    addedBadge: 'கூடையில் சேர்க்கப்பட்டது',
    title: 'பொருள் கூடையில் சேர்க்கப்பட்டது!',
    question: 'அடுத்து என்ன செய்ய விரும்புகிறீர்கள்?',
    addMoreBtn: 'மேலும் வாங்க',
    viewCartBtn: 'கூடைக்குச் செல்',
    closeAria: 'மூடவும்',
    qtyLabel: 'அளவு'
  },
  te: {
    addedBadge: 'కార్ట్‌కు జోడించబడింది',
    title: 'వస్తువు కార్ట్‌కు జోడించబడింది!',
    question: 'తరువాత ఏమి చేయాలనుకుంటున్నారు?',
    addMoreBtn: 'మరిన్ని కొనండి',
    viewCartBtn: 'కార్ట్‌కు వెళ్లండి',
    closeAria: 'మూసివేయి',
    qtyLabel: 'పరిమాణం'
  },
  kn: {
    addedBadge: 'ಬುಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ',
    title: 'ಉತ್ಪನ್ನ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!',
    question: 'ಮುಂದೆ ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
    addMoreBtn: 'ಇನ್ನಷ್ಟು ಖರೀದಿಸಿ',
    viewCartBtn: 'ಕಾರ್ಟ್‌ಗೆ ಹೋಗಿ',
    closeAria: 'ಮುಚ್ಚಿ',
    qtyLabel: 'ಪ್ರಮಾಣ'
  },
  hi: {
    addedBadge: 'कार्ट में जोड़ा गया',
    title: 'सामान कार्ट में जोड़ा गया!',
    question: 'आगे आप क्या करना चाहते हैं?',
    addMoreBtn: 'और उत्पाद खरीदें',
    viewCartBtn: 'कार्ट पर जाएं',
    closeAria: 'बंद करें',
    qtyLabel: 'मात्रा'
  },
  ml: {
    addedBadge: 'കാർട്ടിൽ ചേർത്തു',
    title: 'സാധനം കാർട്ടിൽ ചേർത്തു!',
    question: 'അടുത്തതായി എന്ത് ചെയ്യണം?',
    addMoreBtn: 'കൂടുതൽ വാങ്ങുക',
    viewCartBtn: 'കാർട്ടിലേക്ക് പോകുക',
    closeAria: 'അടയ്ക്കുക',
    qtyLabel: 'അളവ്'
  },
  tulu: {
    addedBadge: 'ಕಾರ್ಟ್‌ಗ್ ಸೇರ್ಪಾವಾಯ್ಂಡ್',
    title: 'ಸಾಮಾನು ಕಾರ್ಟ್‌ಗ್ ಸೇರ್ಪಾವಾಯ್ಂಡ್!',
    question: 'ದುಂಬು ದಾದ ಮಲ್ಪೆರೆ ಉಂಡು?',
    addMoreBtn: 'ಕುಡೊಂಜಿ ದೆತೊನ್ಲೆ',
    viewCartBtn: 'ಕಾರ್ಟ್‌ಗ್ ಪೋಲೆ',
    closeAria: 'ಮುಚ್ಚಿ',
    qtyLabel: 'ಪ್ರಮಾಣ'
  }
}

export default memo(function AddedToCartModal({ item, onClose, onViewCart, lang = 'en' }) {
  const activeLang = String(lang || 'en').trim().toLowerCase().slice(0, 5)
  const loc = I18N[activeLang] || I18N.en

  useEffect(() => {
    if (!item) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, onClose])

  if (!item) return null

  const qty = Number(item.qty) || 1
  const price = Number(item.price) || 0
  const originalPrice = Number(item.originalPrice) || 0
  const displayPrice = price ? rupees(price * qty) : ''
  const displayOriginalPrice = originalPrice && originalPrice > price ? rupees(originalPrice * qty) : ''
  const hasSavings = Boolean(displayOriginalPrice)
  const discountPercent = hasSavings ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const imgSrc = item.image || (item.product && item.product.image) || '/assets/brand/logo-mark.png'

  return (
    <div
      className="added-cart-overlay active"
      id="addedToCartModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addedCartTitle"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="added-cart-card">
        {/* Header: Status Badge & Close Button */}
        <div className="added-cart-header">
          <div className="added-cart-badge">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span>{loc.addedBadge}</span>
          </div>
          <button
            type="button"
            className="added-cart-close"
            onClick={onClose}
            aria-label={loc.closeAria}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {/* Product Details Box */}
        <div className="added-cart-product">
          <div className="added-cart-img-wrap">
            <img
              src={imgSrc}
              alt={item.name || 'Product'}
              className="added-cart-img"
              loading="lazy"
              onError={e => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/assets/brand/logo-mark.png'
              }}
            />
          </div>
          <div className="added-cart-info">
            <h4 id="addedCartTitle" className="added-cart-name">
              {item.name}
            </h4>
            <div className="added-cart-meta">
              {item.selectedPack && (
                <span className="added-cart-pack">{item.selectedPack}</span>
              )}
              <span className="added-cart-qty">
                {loc.qtyLabel}: {qty}
              </span>
            </div>
            <div className="added-cart-price-row">
              {displayPrice && (
                <span className="added-cart-price">{displayPrice}</span>
              )}
              {hasSavings && (
                <>
                  <span className="added-cart-mrp">{displayOriginalPrice}</span>
                  <span className="added-cart-discount">{discountPercent}% OFF</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Question Prompt */}
        <p className="added-cart-question">{loc.question}</p>

        {/* Action Buttons */}
        <div className="added-cart-actions">
          <button
            type="button"
            className="btn-add-more"
            onClick={onClose}
            autoFocus
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            <span>{loc.addMoreBtn}</span>
          </button>

          <button
            type="button"
            className="btn-view-cart"
            onClick={onViewCart}
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true"></i>
            <span>{loc.viewCartBtn}</span>
          </button>
        </div>
      </div>
    </div>
  )
})
