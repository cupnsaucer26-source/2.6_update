import { useEffect, memo } from 'react'
import { ShoppingCart, Plus, X, CheckCircle2 } from 'lucide-react'
import { rupees } from '../data'

const I18N = {
  en: {
    addedBadge: 'Added to Basket',
    title: 'Item Added to Cart!',
    question: 'What would you like to do next?',
    addMoreBtn: '+ Add More Products',
    viewCartBtn: 'Go to Cart & Checkout',
    closeAria: 'Close modal'
  },
  ta: {
    addedBadge: 'கூடையில் சேர்க்கப்பட்டது',
    title: 'பொருள் கூடையில் சேர்க்கப்பட்டது!',
    question: 'அடுத்து என்ன செய்ய விரும்புகிறீர்கள்?',
    addMoreBtn: '+ மேலும் வாங்க (Add More Products)',
    viewCartBtn: 'கூடைக்குச் செல் (Go to Cart)',
    closeAria: 'மூடவும்'
  },
  te: {
    addedBadge: 'కార్ట్‌కు జోడించబడింది',
    title: 'వస్తువు కార్ట్‌కు జోడించబడింది!',
    question: 'తరువాత మీరు ఏమి చేయాలనుకుంటున్నారు?',
    addMoreBtn: '+ మరిన్ని ఉత్పత్తులను జోడించండి',
    viewCartBtn: 'కార్ట్‌ను వీక్షించండి & చెక్అవుట్',
    closeAria: 'మూసివేయి'
  },
  kn: {
    addedBadge: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ',
    title: 'ಉತ್ಪನ್ನವನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!',
    question: 'ಮುಂದೆ ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?',
    addMoreBtn: '+ ಇನ್ನಷ್ಟು ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಿ',
    viewCartBtn: 'ಕಾರ್ಟ್ ನೋಡಿ & ಚೆಕ್‌ಔಟ್',
    closeAria: 'ಮುಚ್ಚಿ'
  },
  hi: {
    addedBadge: 'कार्ट में जोड़ा गया',
    title: 'सामान कार्ट में जोड़ा गया!',
    question: 'आगे आप क्या करना चाहते हैं?',
    addMoreBtn: '+ और उत्पाद जोड़ें (Add More)',
    viewCartBtn: 'कार्ट देखें और चेकआउट करें',
    closeAria: 'बंद करें'
  },
  ml: {
    addedBadge: 'കാർട്ടിൽ ചേർത്തു',
    title: 'സാധനം കാർട്ടിൽ ചേർത്തു!',
    question: 'അടുത്തതായി എന്താണ് ചെയ്യാൻ ആഗ്രഹിക്കുന്നത്?',
    addMoreBtn: '+ കൂടുതൽ ഉൽപ്പന്നങ്ങൾ ചേർക്കുക',
    viewCartBtn: 'കാർട്ട് കാണുക & ചെക്ക്ഔട്ട്',
    closeAria: 'അടയ്ക്കുക'
  },
  tulu: {
    addedBadge: 'ಕಾರ್ಟ್‌ಗ್ ಸೇರ್ಪಾವಾಯ್ಂಡ್',
    title: 'ಸಾಮಾನು ಕಾರ್ಟ್‌ಗ್ ಸೇರ್ಪಾವಾಯ್ಂಡ್!',
    question: 'ದುಂಬು ಈರ್ ದಾದ ಮಲ್ಪೆರೆ ಇಷ್ಟ ಪಡ್ಪರ್?',
    addMoreBtn: '+ ಕುಡೊಂಜಿ ಸಾಮಾನು ಸೇರ್ಪಾಲೆ',
    viewCartBtn: 'ಕಾರ್ಟ್‌ಗ್ ಪೋಲೆ',
    closeAria: 'ಮುಚ್ಚಿ'
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

  const displayPrice = item.price ? rupees(item.price * (item.qty || 1)) : ''
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
        {/* Header */}
        <div className="added-cart-header">
          <div className="added-cart-badge">
            <CheckCircle2 size={16} strokeWidth={2.5} />
            <span>{loc.addedBadge}</span>
          </div>
          <button
            type="button"
            className="added-cart-close"
            onClick={onClose}
            aria-label={loc.closeAria}
          >
            <X size={18} />
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
              {item.qty && item.qty > 1 && (
                <span className="added-cart-qty">× {item.qty}</span>
              )}
            </div>
            {displayPrice && (
              <div className="added-cart-price">{displayPrice}</div>
            )}
          </div>
        </div>

        {/* Prompt question */}
        <p className="added-cart-question">{loc.question}</p>

        {/* Action Buttons */}
        <div className="added-cart-actions">
          <button
            type="button"
            className="btn-add-more"
            onClick={onClose}
            autoFocus
          >
            <Plus size={18} strokeWidth={2.2} />
            <span>{loc.addMoreBtn}</span>
          </button>

          <button
            type="button"
            className="btn-view-cart"
            onClick={onViewCart}
          >
            <ShoppingCart size={18} strokeWidth={2.2} />
            <span>{loc.viewCartBtn}</span>
          </button>
        </div>
      </div>
    </div>
  )
})
