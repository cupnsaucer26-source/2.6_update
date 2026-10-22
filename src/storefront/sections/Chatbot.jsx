import { memo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useStore } from '../StoreContext'
import { WHATSAPP_EXPERT_URL } from '../data'
export const CHAT_OPEN_EVENT = 'sb:open-chat'

// Crop Assistant: Powered by Grounded Gemini AI with a seamless local rule-based fallback.
const QUICK_CHATS = [
  ['What is the best pesticide for Paddy Blast?', '🌾 Paddy Blast Remedy'],
  ['How to control Cotton Whitefly?', '🐛 Cotton Whitefly'],
  ['How to test soil health?', '🌱 Soil Test Guide'],
  ['I want to speak with an agronomist', '📞 Call Agronomist'],
]

// Fallback canned answers when offline or AI key is not yet set
function replyTo(text, addToCart, findRemedyProduct) {
  const lower = text.toLowerCase()
  const remedyButton = keyword => {
    const product = findRemedyProduct(keyword)
    if (!product) return null
    return (
      <button key="remedy" className="chat-action" onClick={() => addToCart(product.id)}>
        <i className="fa-solid fa-cart-plus"></i> Add {product.name} to Cart
      </button>
    )
  }
  const pageButton = (to, label) => (
    <Link key={to} className="chat-action" to={to}>
      {label} <i className="fa-solid fa-arrow-right"></i>
    </Link>
  )
  const whatsAppButton = label => (
    <a key="wa" className="chat-action chat-action--wa" href={WHATSAPP_EXPERT_URL} target="_blank" rel="noopener noreferrer">
      <i className="fa-brands fa-whatsapp"></i> {label}
    </a>
  )

  if (lower.includes('blast') || lower.includes('paddy')) {
    return (
      <>
        🌾 <strong>Paddy Blast:</strong> Filter the products by Paddy and Blast, or ask our agronomist which suits your field.<br />
        {remedyButton('blast') || whatsAppButton('Ask an Agronomist')}
      </>
    )
  }
  if (lower.includes('whitefly') || lower.includes('cotton')) {
    return (
      <>
        🐛 <strong>Cotton Whitefly:</strong> Filter the products by Cotton and Whitefly, or ask our agronomist which suits your field.<br />
        {remedyButton('whitefly') || whatsAppButton('Ask an Agronomist')}
      </>
    )
  }
  if (lower.includes('soil')) {
    return (
      <>
        🌱 <strong>Soil Health:</strong> Enter values from your soil test card for nutrient advice and products from our catalogue.<br />
        {pageButton('/soil-test-report', 'Check my soil report')} {whatsAppButton('Ask on WhatsApp')}
      </>
    )
  }
  if (lower.includes('agronomist') || lower.includes('speak') || lower.includes('doctor')) {
    return (
      <>
        📞 <strong>Senior Agronomist Consultation:</strong> Book a free callback from our agronomy experts, call <strong>+91 87786 13372</strong>, or chat on WhatsApp.<br />
        {pageButton('/agronomy-experts', 'Book a callback')} {whatsAppButton('Chat on WhatsApp')}
      </>
    )
  }
  if (lower.includes('weed') || lower.includes('herbicide')) {
    return (
      <>
        🌿 <strong>Weed Control:</strong> Ask our agronomist which weed control suits your crop.<br />
        {remedyButton('weed') || whatsAppButton('Ask an Agronomist')}
      </>
    )
  }
  return (
    <>
      🌿 <strong>Sathyam Agro Mart Crop Assistant:</strong> Filter our products by crop or disease, or ask an agronomist on WhatsApp.<br />
      {whatsAppButton('Ask an Agronomist')}
    </>
  )
}

// Parses AI formatted text and tags into interactive React components
function formatAiText(text, addToCart) {
  if (!text) return null
  // Match tags like [[PRODUCT:id:Name]], [[PAGE:path:Label]], [[WHATSAPP:Label]]
  const tagRegex = /\[\[(PRODUCT|PAGE|WHATSAPP):([^:]+)(?::([^\]]+))?\]\]/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({
      type: match[1],
      target: match[2],
      label: match[3] || match[2]
    })
    lastIndex = tagRegex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'PRODUCT') {
          return (
            <button
              key={`prod-${index}`}
              type="button"
              className="chat-action"
              onClick={() => addToCart(part.target)}
            >
              <i className="fa-solid fa-cart-plus"></i> Add {part.label} to Cart
            </button>
          )
        }
        if (part.type === 'PAGE') {
          return (
            <Link key={`page-${index}`} className="chat-action" to={part.target}>
              {part.label} <i className="fa-solid fa-arrow-right"></i>
            </Link>
          )
        }
        if (part.type === 'WHATSAPP') {
          return (
            <a
              key={`wa-${index}`}
              className="chat-action chat-action--wa"
              href={WHATSAPP_EXPERT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-whatsapp"></i> {part.label}
            </a>
          )
        }
        return (
          <span key={`text-${index}`} style={{ whiteSpace: 'pre-line' }}>
            {part.value}
          </span>
        )
      })}
    </>
  )
}

export default memo(function Chatbot({ t }) {
  const { addToCart, findRemedyProduct } = useStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const messagesRef = useRef(null)
  const nextId = useRef(0)

  // Open chat event listener
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(CHAT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CHAT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const box = messagesRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [messages])

  const send = async (text) => {
    const userMsgId = nextId.current++
    setMessages(current => [...current, { id: userMsgId, sender: 'user', content: text }])

    // Temporary bot message with thinking state
    const botMsgId = nextId.current++
    setMessages(current => [...current, { id: botMsgId, sender: 'bot', loading: true }])

    try {
      const res = await axios.post('/api/chat/assistant', { message: text })
      if (res.data?.success && res.data?.reply) {
        setMessages(current =>
          current.map(m =>
            m.id === botMsgId
              ? { ...m, loading: false, content: formatAiText(res.data.reply, addToCart) }
              : m
          )
        )
        return
      }
    } catch {
      // Fallback
    }

    // Graceful fallback to deterministic agronomy rule engine
    setMessages(current =>
      current.map(m =>
        m.id === botMsgId
          ? { ...m, loading: false, content: replyTo(text, addToCart, findRemedyProduct) }
          : m
      )
    )
  }

  const sendDraft = () => {
    const text = draft.trim()
    if (!text) return
    send(text)
    setDraft('')
  }

  return (
    <>
      <div
        className="chatbot-trigger-btn"
        id="chatbotTriggerBtn"
        onClick={() => setOpen(current => !current)}
        role="button"
        tabIndex={0}
        aria-label="Chat assistant"
        aria-expanded={open}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(current => !current)
          }
        }}
      >
        <i className={open ? 'fa-solid fa-xmark' : 'fa-solid fa-comments'}></i>
      </div>
      <div className={`chatbot-window${open ? ' active' : ''}`} id="chatbotWindow">
        <div className="chatbot-header">
          <div className="chatbot-id">
            <span className="chatbot-avatar" aria-hidden="true"><i className="fa-solid fa-seedling"></i></span>
            <div>
              <span className="chatbot-title" data-i18n="chatbot_title">{t('chatbot_title')}</span>
              <span className="chatbot-status">● Online 24/7 (Instant AI Advisory)</span>
            </div>
          </div>
          <button id="chatbotCloseBtn" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">&times;</button>
        </div>
        <div className="chatbot-messages" id="chatbotMessages" ref={messagesRef}>
          <div className="chat-msg bot-msg" data-i18n="chat_welcome">{t('chat_welcome')}</div>
          <div className="chat-chip-container">
            {QUICK_CHATS.map(([question, label]) => (
              <button
                key={question}
                className="chat-quick-chip"
                onClick={() => { setOpen(true); send(question) }}
              >
                {label}
              </button>
            ))}
          </div>
          {messages.map(message => (
            <div
              key={message.id}
              className={`chat-msg ${message.sender === 'user' ? 'user-msg' : 'bot-msg'}`}
            >
              {message.loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Consulting Crop Doctor...
                </span>
              ) : (
                message.content
              )}
            </div>
          ))}
        </div>
        <div className="chatbot-input-row">
          <input
            ref={inputRef}
            type="text"
            id="chatbotInput"
            data-i18n-placeholder="chat_placeholder"
            placeholder={t('chat_placeholder')}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') sendDraft() }}
          />
          <button id="chatbotSendBtn" onClick={sendDraft} aria-label="Send"><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </>
  )
})
