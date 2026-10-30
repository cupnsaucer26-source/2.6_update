import { memo, useState, useRef } from 'react'
import { cmsText, useCms } from '../../context/CmsContext'
import { useLanguage } from '../../context/LanguageContext'
import { telHref, SUPPORT_PHONE, CALL_LABELS, formatPhoneDisplay } from '../../shared/phoneLink'

// A round "Call us" button on every store page, bottom right, above the AI
// chat bubble where the page has one. The number is the CMS contact phone,
// the same one the phone Menu's call link uses. It hides while the basket,
// checkout, sign-in or any other sheet is open (body.overlay-open), and under
// the phone Menu and the welcome poster, so it never sits over a total or a
// Pay button.
// Styles: storefront.css & phase2.css, "Floating call button".

export { CALL_LABELS, formatPhoneDisplay }

export default memo(function CallFab() {
  const { cms } = useCms()
  const { lang } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef(null)

  const phone = cmsText(cms, 'phone', SUPPORT_PHONE)
  const href = telHref(phone)
  if (!href) return null

  const callLabel = CALL_LABELS[lang] || CALL_LABELS.en
  const displayPhone = formatPhoneDisplay(phone)
  const accessibleLabel = `Call Sathyam Agro Mart at ${displayPhone}`

  const showLabel = () => {
    setExpanded(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setExpanded(false), 3500)
  }

  const hideLabel = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setExpanded(false)
  }

  return (
    <a
      id="callFab"
      className={`call-fab ${expanded ? 'is-expanded' : ''}`}
      href={href}
      aria-label={accessibleLabel}
      title=""
      onPointerDown={showLabel}
      onPointerEnter={showLabel}
      onPointerLeave={hideLabel}
      onFocus={showLabel}
      onBlur={hideLabel}
    >
      <i className="fa-solid fa-phone" aria-hidden="true"></i>
      <span className="call-fab-label keep-pad" role="tooltip" aria-hidden="true">
        <span className="call-fab-icon-pill" aria-hidden="true">
          <i className="fa-solid fa-phone"></i>
        </span>
        <span className="call-fab-text">{callLabel}</span>
        <strong className="call-fab-number notranslate">{displayPhone}</strong>
      </span>
    </a>
  )
})
