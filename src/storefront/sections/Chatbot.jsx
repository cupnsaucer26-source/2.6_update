import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useStore } from '../StoreContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { WHATSAPP_EXPERT_URL } from '../data'

export const CHAT_OPEN_EVENT = 'sb:open-chat'

const SESSION_STORAGE_KEY = 'sathyam_chat_session_id'
const MESSAGE_STORAGE_PREFIX = 'sathyam_chat_history_v2_'

export const I18N_CHAT = {
  en: {
    title: 'AI Crop Doctor',
    online: '● Online 24/7 (Sathyam Agri-AI)',
    new: 'New',
    newChatAria: 'Start a new conversation',
    closeAria: 'Close chat',
    welcomeGuest: 'Hello! Welcome to Sathyam Agro Mart AI Crop Doctor. How can I assist your crop today? Ask any pest, disease, or fertilizer question below.',
    welcomeFarmer: (name, crop) => `Hello ${name ? name + '!' : 'Farmer!'} Welcome to Sathyam Agro Mart AI Crop Doctor. How is your ${crop ? crop + ' ' : ''}crop progressing? Ask any pest, disease, or fertilizer question below.`,
    followUp: 'Select a common topic below or type your crop question:',
    chips: [
      { id: 'start_paddy', label: '🌾 Paddy Blast & Yellow Leaf Diagnosis', category: 'crop' },
      { id: 'start_cotton', label: '🐛 Cotton Whitefly & Pest Control', category: 'crop' },
      { id: 'start_soil', label: '🌱 Soil Test Guidance & Fertilizer Dosage', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ Consult an Agronomy Specialist', category: 'expert' }
    ],
    placeholder: 'Ask any crop question or symptom...',
    thinking: 'Crop Doctor is thinking...',
    scheduleCall: 'Schedule Consultation Call',
    needExpert: 'Need Expert Field Diagnosis?',
    expertDesc: 'Our qualified agronomists provide personalized 1-on-1 guidance for severe or complex field issues.',
    fallbackError: 'We are experiencing a temporary network delay with our AI service. For crop pests and disease remedies, you can explore our catalog or book an agronomist callback directly: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]',
    addToCart: (name) => `Add ${name} to Cart`
  },
  ta: {
    title: 'AI பயிர் மருத்துவர்',
    online: '● 24/7 நேரலை (சத்யம் அக்ரோ-AI)',
    new: 'புதியது',
    newChatAria: 'புதிய உரையாடலைத் தொடங்கவும்',
    closeAria: 'அரட்டையை மூடவும்',
    welcomeGuest: 'வணக்கம்! சத்யம் அக்ரோ மார்ட் AI பயிர் மருத்துவருக்கு வரவேற்கிறோம். உங்கள் பயிரில் ஏதேனும் நோய், பூச்சி அல்லது உரத் தேவையா? கீழே கேளுங்கள்.',
    welcomeFarmer: (name, crop) => `வணக்கம் ${name ? name + ' அவர்களே!' : 'விவசாயி!'} சத்யம் அக்ரோ மார்ட் AI பயிர் மருத்துவருக்கு வரவேற்கிறோம். உங்கள் ${crop ? crop + ' ' : ''}பயிர் வளர்ச்சி எப்படி உள்ளது? ஏதேனும் பூச்சி, நோய் அல்லது உரத் தேவையா?`,
    followUp: 'கீழே உள்ள தலைப்பைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்:',
    chips: [
      { id: 'start_paddy', label: '🌾 நெல் இலை கருகல் & மஞ்சள் இலை', category: 'crop' },
      { id: 'start_cotton', label: '🐛 பருத்தி வெள்ளை ஈ & பூச்சி கட்டுப்பாடு', category: 'crop' },
      { id: 'start_soil', label: '🌱 மண் பரிசோதனை & உர பரிந்துரை', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ வேளாண் மருத்துவரிடம் ஆலோசனை பெற', category: 'expert' }
    ],
    placeholder: 'பயிர் நோய்கள் அல்லது கேள்விகளைக் கேட்கவும்...',
    thinking: 'பயிர் மருத்துவர் ஆலோசிக்கிறார்...',
    scheduleCall: 'ஆலோசனை முன்பதிவு செய்க',
    needExpert: 'துல்லியமான களப் பரிசோதனை தேவையா?',
    expertDesc: 'தீவிர பூச்சி மற்றும் நோய் பாதிப்புகளுக்கு எங்கள் வேளாண் நிபுணர்கள் நேரடி ஆலோசனை வழங்குகின்றனர்.',
    fallbackError: 'தற்காலிக இணைய தாமதம் ஏற்பட்டுள்ளது. பூச்சி, நோய் தீர்வுகளுக்கு எங்கள் மருந்துகளைப் பார்க்கவும் அல்லது வேளாண் மருத்துவரிடம் ஆலோசனை பெறவும்: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]',
    addToCart: (name) => `${name} - கூடையில் சேர்`
  },
  te: {
    title: 'AI పంట వైద్యుడు',
    online: '● 24/7 అందుబాటులో ఉంది',
    new: 'కొత్తది',
    newChatAria: 'కొత్త సంభాషణ ప్రారంభించండి',
    closeAria: 'మూసివేయి',
    welcomeGuest: 'నమస్కారం! సత్యం ఆగ్రో మార్ట్ AI పంట వైద్యునికి స్వాగతం. మీ పంటలో పురుగులు, తెగుళ్లు లేదా ఎరువుల సమస్య ఉందా? ఇక్కడ అడగండి.',
    welcomeFarmer: (name, crop) => `నమస్కారం ${name ? name + ' గారు!' : 'రైతు సోదరా!'} సత్యం ఆగ్రో మార్ట్ AI పంట వైద్యునికి స్వాగతం. మీ ${crop ? crop + ' ' : ''}పంట ఎలా ఉంది? ఏదైనా పురుగు, తెగులు లేదా ఎరువుల సందేహం ఉందా?`,
    followUp: 'క్రింది అంశాలలో ఒకదాన్ని ఎంచుకోండి లేదా మీ ప్రశ్నను టైప్ చేయండి:',
    chips: [
      { id: 'start_paddy', label: '🌾 వరి ఆకు తెగులు & పసుపు ఆకుల నివారణ', category: 'crop' },
      { id: 'start_cotton', label: '🐛 ప్రత్తి తెల్లదోమ & పురుగుల నివారణ', category: 'crop' },
      { id: 'start_soil', label: '🌱 నేల పరీక్ష & ఎరువుల మోతాదు', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ వ్యవసాయ నిపుణుడిని సంప్రదించండి', category: 'expert' }
    ],
    placeholder: 'పంట ప్రశ్న లేదా లక్షణాన్ని టైప్ చేయండి...',
    thinking: 'వైద్యుడు సమాధానం సిద్ధం చేస్తున్నారు...',
    scheduleCall: 'కాల్ షెడ్యూల్ చేయండి',
    needExpert: 'నిపుణుల క్షేత్ర నిర్ధారణ అవసరమా?',
    expertDesc: 'తీవ్రమైన పంట సమస్యల కోసం మా అర్హత కలిగిన వ్యవసాయ నిపుణులు ప్రత్యక్ష సలహాలు అందిస్తారు.',
    fallbackError: 'నెట్‌వర్క్ జాప్యం ఏర్పడింది. నిపుణుడి సలహా కోసం సంప్రదించండి: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]',
    addToCart: (name) => `${name} - కార్ట్‌కు జోడించు`
  },
  kn: {
    title: 'AI ಬೆಳೆ ವೈದ್ಯ',
    online: '● 24/7 ಲಭ್ಯವಿದೆ',
    new: 'ಹೊಸದು',
    newChatAria: 'ಹೊಸ ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ',
    closeAria: 'ಮುಚ್ಚಿ',
    welcomeGuest: 'ನಮಸ್ಕಾರ! ಸತ್ಯಂ ಅಗ್ರೋ ಮಾರ್ಟ್ AI ಬೆಳೆ ವೈದ್ಯರಿಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ ರೋಗ, ಕೀಟ ಅಥವಾ ರಸಗೊಬ್ಬರದ ಸಮಸ್ಯೆ ಇದೆಯೇ? ಕೆಳಗೆ ಕೇಳಿ.',
    welcomeFarmer: (name, crop) => `ನಮಸ್ಕಾರ ${name ? name + ' ಅವರೇ!' : 'ರೈತ ಬಾಂಧವರೇ!'} ಸತ್ಯಂ ಅಗ್ರೋ ಮಾರ್ಟ್ AI ಬೆಳೆ ವೈದ್ಯರಿಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ${crop ? crop + ' ' : ''}ಬೆಳೆ ಹೇಗಿದೆ? ರೋಗ ಅಥವಾ ಕೀಟ ನಿಯಂತ್ರಣದ ಬಗ್ಗೆ ಕೇಳಿ.`,
    followUp: 'ಕೆಳಗಿನ ವಿಷಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ:',
    chips: [
      { id: 'start_paddy', label: '🌾 ಭತ್ತದ ಬೆಂಕಿ ರೋಗ & ಹಳದಿ ಎಲೆ ಸಮಸ್ಯೆ', category: 'crop' },
      { id: 'start_cotton', label: '🐛 ಹತ್ತಿ ಬಿಳಿ ನೊಣ & ಕೀಟ ನಿಯಂತ್ರಣ', category: 'crop' },
      { id: 'start_soil', label: '🌱 ಮಣ್ಣು ಪರೀಕ್ಷೆ & ರಸಗೊಬ್ಬರ ಮಾಹಿತಿ', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ ಪಡೆಯಿರಿ', category: 'expert' }
    ],
    placeholder: 'ಬೆಳೆ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    thinking: 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    scheduleCall: 'ಸಲಹಾ ಕರೆ ನಿಗದಿಪಡಿಸಿ',
    needExpert: 'ತಜ್ಞರ ಸಲಹೆ ಅಗತ್ಯವಿದೆಯೇ?',
    expertDesc: 'ಗಂಭೀರ ಬೆಳೆ ಸಮಸ್ಯೆಗಳಿಗೆ ನಮ್ಮ ಕೃಷಿ ತಜ್ಞರು ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತಾರೆ.',
    fallbackError: 'ನೆಟ್‌ವರ್ಕ್ ತೊಂದರೆ ಉಂಟಾಗಿದೆ. ಕೃಷಿ ತಜ್ಞರ ಸಂಪರ್ಕ ಪಡೆಯಿರಿ: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]',
    addToCart: (name) => `${name} - ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ`
  },
  hi: {
    title: 'AI फसल डॉक्टर',
    online: '● 24/7 ऑनलाइन',
    new: 'नया',
    newChatAria: 'नई बातचीत शुरू करें',
    closeAria: 'बंद करें',
    welcomeGuest: 'नमस्ते! सत्यम एग्रो मार्ट AI फसल डॉक्टर में आपका स्वागत है। आपकी फसल में कीट, रोग या खाद से जुड़ा कोई भी सवाल नीचे पूछें।',
    welcomeFarmer: (name, crop) => `नमस्ते ${name ? name + ' जी!' : 'किसान भाई!'} सत्यम एग्रो मार्ट AI फसल डॉक्टर में आपका स्वागत है। आपकी ${crop ? crop + ' ' : ''}फसल कैसी चल रही है? कोई भी समस्या नीचे पूछें।`,
    followUp: 'नीचे दिए गए विषय को चुनें या अपना सवाल लिखें:',
    chips: [
      { id: 'start_paddy', label: '🌾 धान का झुलसा रोग व पीली पत्तियां', category: 'crop' },
      { id: 'start_cotton', label: '🐛 कपास में सफेद मक्खी व कीट नियंत्रण', category: 'crop' },
      { id: 'start_soil', label: '🌱 मिट्टी परीक्षण व खाद की सही मात्रा', category: 'soil' },
      { id: 'start_expert', label: '👨‍⚕️ कृषि विशेषज्ञ से सलाह लें', category: 'expert' }
    ],
    placeholder: 'फसल की बीमारी या सवाल लिखें...',
    thinking: 'फसल डॉक्टर जांच कर रहे हैं...',
    scheduleCall: 'कॉल परामर्श बुक करें',
    needExpert: 'क्या विशेषज्ञ परामर्श की आवश्यकता है?',
    expertDesc: 'गंभीर या जटिल फसल समस्याओं के लिए हमारे योग्य कृषि विशेषज्ञ 1-ऑन-1 मार्गदर्शन प्रदान करते हैं।',
    fallbackError: 'नेटवर्क में अस्थायी रुकावट है। विशेषज्ञ डॉक्टर से परामर्श लें: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]',
    addToCart: (name) => `${name} - कार्ट में जोड़ें`
  }
}

// Parses AI formatted text and tags into interactive React components
function formatAiText(text, addToCart, activeLang = 'en') {
  if (!text) return null
  const loc = I18N_CHAT[activeLang] || I18N_CHAT.en
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
              <i className="fa-solid fa-cart-plus"></i> {loc.addToCart ? loc.addToCart(part.label) : `Add ${part.label} to Cart`}
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
  const { lang: currentLang = 'en' } = useLanguage()
  const navigate = useNavigate()

  const activeLang = String(currentLang || 'en').trim().toLowerCase().slice(0, 5)
  const loc = I18N_CHAT[activeLang] || I18N_CHAT.en

  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || ('SES-' + Date.now().toString(36).toUpperCase())
    } catch {
      return 'SES-' + Date.now().toString(36).toUpperCase()
    }
  })

  // Generates initial welcome payload tailored to active language and user profile
  const getInitialMessage = useCallback((langCode = activeLang) => {
    const l = I18N_CHAT[langCode] || I18N_CHAT.en
    const cropName = user?.crop
    const farmerName = user?.name || ''

    if (cropName) {
      const text = l.welcomeFarmer(farmerName, cropName)
      return {
        id: 'welcome',
        sender: 'bot',
        rawText: text,
        content: text,
        followUp: l.followUp,
        suggestions: l.chips,
        offerExpert: false
      }
    }

    const text = l.welcomeGuest
    return {
      id: 'welcome',
      sender: 'bot',
      rawText: text,
      content: text,
      followUp: l.followUp,
      suggestions: l.chips,
      offerExpert: false
    }
  }, [user, activeLang])

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
    return [getInitialMessage(activeLang)]
  })

  // When language changes at top of site, automatically adapt initial welcome if not in an active conversation
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        const updated = getInitialMessage(activeLang)
        return [updated]
      }
      return prev
    })
  }, [activeLang, getInitialMessage])

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
    const initial = getInitialMessage(activeLang)
    setMessages([initial])
    setDraft('')
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, newSession)
      localStorage.setItem(MESSAGE_STORAGE_PREFIX + newSession, JSON.stringify([initial]))
    } catch {}
  }, [getInitialMessage, activeLang])

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
        history: historyPayload,
        lang: activeLang
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
                  content: formatAiText(reply, addToCart, activeLang),
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
    const fallbackReply = loc.fallbackError

    setMessages(current =>
      current.map(m =>
        m.id === botMsgId
          ? {
              ...m,
              loading: false,
              rawText: fallbackReply,
              content: formatAiText(fallbackReply, addToCart, activeLang),
              followUp: loc.followUp,
              suggestions: loc.chips.slice(0, 2),
              offerExpert: true,
              expertReason: loc.expertDesc
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
                {loc.title}
              </span>
              <span className="chatbot-status">
                {loc.online}
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="chatbot-header-btn"
              onClick={startNewConversation}
              title={loc.newChatAria}
              aria-label={loc.newChatAria}
              type="button"
            >
              <i className="fa-solid fa-rotate-right"></i> {loc.new}
            </button>
            <button
              id="chatbotCloseBtn"
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label={loc.closeAria}
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
                    <i className="fa-solid fa-spinner fa-spin"></i> {loc.thinking}
                  </span>
                ) : (
                  <div>
                    {typeof message.content === 'string'
                      ? formatAiText(message.content, addToCart, activeLang)
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
                        <span>{loc.needExpert}</span>
                      </div>
                      <p className="chat-expert-desc">
                        {message.expertReason || loc.expertDesc}
                      </p>
                      <button
                        type="button"
                        className="chat-expert-btn"
                        onClick={() => handleBookExpert(message)}
                      >
                        <i className="fa-solid fa-calendar-days"></i> {loc.scheduleCall}
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
            placeholder={isSending ? loc.thinking : loc.placeholder}
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
