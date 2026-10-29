import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useStore } from '../StoreContext'
import { useAuth } from '../../context/AuthContext'
import { WHATSAPP_EXPERT_URL } from '../data'

export const CHAT_OPEN_EVENT = 'sb:open-chat'

const SESSION_STORAGE_KEY = 'sathyam_chat_session_id'
const MESSAGE_STORAGE_PREFIX = 'sathyam_chat_history_v2_'

// Default starter quick questions for guests
const GUEST_QUICK_CHATS = [
  ['What is the best pesticide for Paddy Blast?', '🌾 Paddy Blast Remedy'],
  ['How to control Cotton Whitefly?', '🐛 Cotton Whitefly Control'],
  ['How to test soil health & get fertilizer advice?', '🌱 Soil Test Guide'],
  ['I want to speak with an agronomy doctor', '👨‍⚕️ Consult Agronomist'],
]

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
  const { addToCart } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || ('SES-' + Date.now().toString(36).toUpperCase())
    } catch {
      return 'SES-' + Date.now().toString(36).toUpperCase()
    }
  })

  // Generates initial welcome payload tailored to user's registered crop
  const getInitialMessage = useCallback(() => {
    const cropName = user?.crop
    const farmerName = user?.name ? `${user.name} ji` : 'விவசாயி'

    if (cropName) {
      return {
        id: 'welcome',
        sender: 'bot',
        rawText: `வணக்கம் ${farmerName}! Welcome to Sathyam Agro Mart AI Crop Assistant. How is your ${cropName} crop progressing? Ask any pest, disease, or fertilizer question below.`,
        content: `வணக்கம் ${farmerName}! Welcome to Sathyam Agro Mart AI Crop Assistant. How is your **${cropName}** crop progressing? Ask any pest, disease, or fertilizer question below.`,
        followUp: `What would you like help with for your ${cropName} farm?`,
        suggestions: [
          { id: 'crop_pest', label: `🌾 ${cropName} Pest & Disease remedies`, category: 'crop' },
          { id: 'crop_fert', label: `🌱 ${cropName} Fertilizer & Growth Schedule`, category: 'crop' },
          { id: 'crop_soil', label: '🧪 Check Soil Health Card', category: 'action' },
          { id: 'crop_expert', label: '👨‍⚕️ Book Agronomy Doctor Consultation', category: 'action' }
        ],
        offerExpert: false
      }
    }

    return {
      id: 'welcome',
      sender: 'bot',
      rawText: t('chat_welcome') || 'வணக்கம்! Welcome to Sathyam Agro Mart AI Assistant. How can we help your farm today?',
      content: t('chat_welcome') || 'வணக்கம்! Welcome to Sathyam Agro Mart AI Assistant. How can we help your farm today?',
      followUp: 'Select a common topic below or type your crop question:',
      suggestions: [
        { id: 'start_paddy', label: '🌾 Paddy Blast & Yellow Leaf Diagnosis', category: 'crop' },
        { id: 'start_cotton', label: '🐛 Cotton Whitefly & Pest Control', category: 'crop' },
        { id: 'start_soil', label: '🌱 Soil Test Guidance & Fertilizer Dosage', category: 'soil' },
        { id: 'start_expert', label: '👨‍⚕️ Consult an Agronomy Specialist', category: 'expert' }
      ],
      offerExpert: false
    }
  }, [user, t])

  // Initialize messages from persistent storage or default welcome
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(MESSAGE_STORAGE_PREFIX + sessionId)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}
    return [getInitialMessage()]
  })

  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef(null)
  const messagesRef = useRef(null)
  const nextId = useRef(Date.now())

  // Persist session ID
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    } catch {}
  }, [sessionId])

  // Persist messages across page reloads
  useEffect(() => {
    try {
      if (messages.length > 0) {
        // Strip non-serializable elements before storing
        const serializable = messages.map(m => ({
          id: m.id,
          sender: m.sender,
          rawText: m.rawText || (typeof m.content === 'string' ? m.content : ''),
          followUp: m.followUp || '',
          suggestions: m.suggestions || [],
          offerExpert: m.offerExpert || false,
          expertReason: m.expertReason || '',
          detectedCrop: m.detectedCrop || '',
          detectedTopic: m.detectedTopic || ''
        }))
        localStorage.setItem(MESSAGE_STORAGE_PREFIX + sessionId, JSON.stringify(serializable))
      }
    } catch {}
  }, [messages, sessionId])

  // Open chat event listener from outside triggers
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
  }, [messages, isSending])

  // Start fresh conversation
  const startNewConversation = useCallback(() => {
    const newSession = 'SES-' + Date.now().toString(36).toUpperCase()
    setSessionId(newSession)
    const initial = getInitialMessage()
    setMessages([initial])
    setDraft('')
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, newSession)
      localStorage.setItem(MESSAGE_STORAGE_PREFIX + newSession, JSON.stringify([initial]))
    } catch {}
  }, [getInitialMessage])

  // Core send function
  const send = async (text, selectedOption = null) => {
    const trimmed = String(text || '').trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    const userMsgId = nextId.current++
    const newHistory = [
      ...messages,
      { id: userMsgId, sender: 'user', content: trimmed, rawText: trimmed }
    ]
    setMessages(newHistory)

    // Temporary bot message with animated thinking state
    const botMsgId = nextId.current++
    setMessages(current => [
      ...current,
      { id: botMsgId, sender: 'bot', loading: true }
    ])

    // Format history turns for backend context
    const historyPayload = messages
      .filter(m => m.rawText && !m.loading)
      .slice(-6)
      .map(m => ({
        sender: m.sender,
        text: m.rawText
      }))

    try {
      const res = await axios.post('/api/chat/assistant', {
        message: trimmed,
        sessionId,
        selectedOption,
        history: historyPayload
      })

      if (res.data?.success && res.data?.reply) {
        const { reply, followUp, suggestions, offerExpert, expertReason, detectedCrop, detectedTopic } = res.data

        setMessages(current =>
          current.map(m =>
            m.id === botMsgId
              ? {
                  ...m,
                  loading: false,
                  rawText: reply,
                  content: formatAiText(reply, addToCart),
                  followUp: followUp || '',
                  suggestions: Array.isArray(suggestions) ? suggestions : [],
                  offerExpert: Boolean(offerExpert),
                  expertReason: expertReason || '',
                  detectedCrop: detectedCrop || '',
                  detectedTopic: detectedTopic || ''
                }
              : m
          )
        )
        setIsSending(false)
        return
      }
    } catch {
      // Handled by client-side fallback below
    }

    // Local rule-based fallback when server assistant fails
    const fallbackReply = `🌿 **Sathyam Agro Mart AI Assistant:**
We are experiencing a temporary network delay with our AI service. For crop pests and disease remedies, you can explore our catalog or book an agronomist callback directly: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]`

    setMessages(current =>
      current.map(m =>
        m.id === botMsgId
          ? {
              ...m,
              loading: false,
              rawText: fallbackReply,
              content: formatAiText(fallbackReply, addToCart),
              followUp: 'Would you like to schedule an Agronomy Expert consultation?',
              suggestions: [
                { id: 'fb_expert', label: '👨‍⚕️ Schedule Agronomist Consultation', category: 'action' },
                { id: 'fb_soil', label: '🌱 Check Soil Test Calculator', category: 'action' }
              ],
              offerExpert: true,
              expertReason: 'Direct callback ensures timely assistance during network downtime.'
            }
          : m
      )
    )
    setIsSending(false)
  }

  const sendDraft = () => {
    const text = draft.trim()
    if (!text) return
    send(text)
    setDraft('')
  }

  // Navigate to existing Agronomy Expert consultation booking page with pre-filled context
  const handleBookExpert = (msg) => {
    setOpen(false)
    navigate('/agronomy-experts', {
      state: {
        fromChat: true,
        topic: msg.detectedTopic || 'Crop Pest & Disease Consultation',
        crop: msg.detectedCrop || user?.crop || 'Paddy/Rice',
        notes: `Referral from AI Crop Assistant (Session: ${sessionId}). Discussed ${msg.detectedTopic || 'crop issue'} on ${msg.detectedCrop || 'crop'}.`
      }
    })
  }

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div
        className="chatbot-trigger-btn"
        id="chatbotTriggerBtn"
        onClick={() => setOpen(current => !current)}
        role="button"
        tabIndex={0}
        aria-label="Crop Assistant"
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

      {/* Chatbot Window */}
      <div className={`chatbot-window${open ? ' active' : ''}`} id="chatbotWindow">
        <div className="chatbot-header">
          <div className="chatbot-id">
            <span className="chatbot-avatar" aria-hidden="true">
              <i className="fa-solid fa-seedling"></i>
            </span>
            <div>
              <span className="chatbot-title" data-i18n="chatbot_title">
                {t('chatbot_title') || 'AI Crop Doctor'}
              </span>
              <span className="chatbot-status">
                ● Online 24/7 (Sathyam Agri-AI)
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="chatbot-header-btn"
              onClick={startNewConversation}
              title="Start a new conversation"
              aria-label="New chat"
              type="button"
            >
              <i className="fa-solid fa-rotate-right"></i> New
            </button>
            <button
              id="chatbotCloseBtn"
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              type="button"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="chatbot-messages" id="chatbotMessages" ref={messagesRef}>
          {messages.map((message, idx) => (
            <div key={message.id || idx}>
              <div className={`chat-msg ${message.sender === 'user' ? 'user-msg' : 'bot-msg'}`}>
                {message.loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Consulting Crop Doctor...
                  </span>
                ) : (
                  <div>
                    {typeof message.content === 'string'
                      ? formatAiText(message.content, addToCart)
                      : message.content}

                    {/* Follow-up question callout */}
                    {message.followUp && !message.loading && (
                      <div className="chat-followup-box">
                        <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                        {message.followUp}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Contextual Suggestions for Latest Bot Message */}
              {!message.loading && message.sender === 'bot' && idx === messages.length - 1 && (
                <>
                  {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                    <div className="chat-suggestions-container" style={{ margin: '8px 4px 12px 4px' }}>
                      {message.suggestions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          className="chat-suggestion-chip"
                          onClick={() => send(opt.label, opt)}
                          disabled={isSending}
                        >
                          <i className="fa-solid fa-arrow-right" style={{ color: '#16A34A', fontSize: '0.75rem' }}></i>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Optional Agronomy Expert Consultation Action */}
                  {message.offerExpert && (
                    <div className="chat-expert-card" style={{ margin: '6px 4px 12px 4px' }}>
                      <div className="chat-expert-header">
                        <i className="fa-solid fa-user-doctor"></i>
                        <span>Need Expert Field Diagnosis?</span>
                      </div>
                      <p className="chat-expert-desc">
                        {message.expertReason || 'Our qualified agronomists provide personalized 1-on-1 guidance for severe or complex field issues.'}
                      </p>
                      <button
                        type="button"
                        className="chat-expert-btn"
                        onClick={() => handleBookExpert(message)}
                      >
                        <i className="fa-solid fa-calendar-days"></i> Schedule Consultation Call
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Input Row */}
        <div className="chatbot-input-row">
          <input
            ref={inputRef}
            type="text"
            id="chatbotInput"
            data-i18n-placeholder="chat_placeholder"
            placeholder={isSending ? 'Crop Doctor is thinking...' : (t('chat_placeholder') || 'Ask any crop question or symptom...')}
            value={draft}
            disabled={isSending}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') sendDraft()
            }}
          />
          <button
            id="chatbotSendBtn"
            onClick={sendDraft}
            aria-label="Send"
            disabled={isSending || !draft.trim()}
            type="button"
          >
            {isSending ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane"></i>
            )}
          </button>
        </div>
      </div>
    </>
  )
})
