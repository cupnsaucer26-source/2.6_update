import { memo } from 'react'
import { cmsText, useCms } from '../../context/CmsContext'
import { useLanguage } from '../../context/LanguageContext'
import { telHref, SUPPORT_PHONE } from '../../shared/phoneLink'

// A round "Call us" button on every store page, bottom right, above the AI
// chat bubble where the page has one. The number is the CMS contact phone,
// the same one the phone Menu's call link uses. It hides while the basket,
// checkout, sign-in or any other sheet is open (body.overlay-open), and under
// the phone Menu and the welcome poster, so it never sits over a total or a
// Pay button.
// Styles: storefront.css & phase2.css, "Floating call button".

const CALL_LABELS = {
  en: 'Call us:',
  ta: 'அழைக்க:',
  kn: 'ಕರೆ ಮಾಡಿ:',
  te: 'కాల్ చేయండి:',
  hi: 'कॉल करें:',
}

function formatPhoneDisplay(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`
  }
  return phone.replace('-', ' ')
}

export default memo(function CallFab() {
  const { cms } = useCms()
  const { lang } = useLanguage()
  const phone = cmsText(cms, 'phone', SUPPORT_PHONE)
  const href = telHref(phone)
  if (!href) return null

  const callLabel = CALL_LABELS[lang] || CALL_LABELS.en
  const displayPhone = formatPhoneDisplay(phone)
  const accessibleLabel = `Call Sathyam Agro Mart at ${displayPhone}`

  return (
    <a
      id="callFab"
      className="call-fab"
      href={href}
      aria-label={accessibleLabel}
      title=""
    >
      <i className="fa-solid fa-phone" aria-hidden="true"></i>
      <span className="call-fab-label" role="tooltip" aria-hidden="true">
        <span className="call-fab-icon-pill" aria-hidden="true">
          <i className="fa-solid fa-phone"></i>
        </span>
        <span className="call-fab-text">{callLabel}</span>
        <strong className="call-fab-number notranslate">{displayPhone}</strong>
      </span>
    </a>
  )
})
