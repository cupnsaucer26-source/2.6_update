import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

const AuthContext = createContext(null)

export const useAuth = () => {
const ctx = useContext(AuthContext)
if (!ctx) throw new Error('useAuth must be used within AuthProvider')
return ctx
}

// Role → Default Route mapping
// Farmers have no separate portal - the storefront homepage is their home.
export const ROLE_HOME = {
  superadmin: '/superadmin',
  farmer: '/',
  admin: '/admin',
  employee: '/employee',
  delivery: '/delivery',
  billing: '/billing',
}

const TOKEN_KEY = 'sathya_token'
const USER_KEY = 'sathya_user'

const readStoredUser = () => {
try {
const cached = localStorage.getItem(USER_KEY)
return cached ? JSON.parse(cached) : null
} catch {
return null
}
}

// Attach the current token to every API call at the moment it is sent. Setting
// a default header from an effect was too late: pages fire their first
// requests before the provider's effects have run.
axios.interceptors.request.use(config => {
const token = localStorage.getItem(TOKEN_KEY)
if (token) config.headers.Authorization = `Bearer ${token}`
return config
})

export function AuthProvider({ children }) {
const [user, setUser] = useState(readStoredUser)
const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
// While a stored session is being confirmed with the server, protected pages wait.
const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY))

const saveSession = (nextToken, nextUser) => {
localStorage.setItem(TOKEN_KEY, nextToken)
localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
setToken(nextToken)
setUser(nextUser)
}

const clearSession = () => {
localStorage.removeItem(TOKEN_KEY)
localStorage.removeItem(USER_KEY)
setToken(null)
setUser(null)
}

// A stored session may have expired, been revoked, or come from before tokens
// were signed; the server is the only judge of that.
useEffect(() => {
if (!token) {
setLoading(false)
return
}
let cancelled = false
axios.get('/api/auth/me')
.then(({ data }) => {
if (cancelled) return
localStorage.setItem(USER_KEY, JSON.stringify(data.data))
setUser(data.data)
})
.catch(err => {
if (!cancelled && err.response?.status === 401) clearSession()
})
.finally(() => {
if (!cancelled) setLoading(false)
})
return () => { cancelled = true }
}, [])

// Any API call rejected for a missing or stale session signs the user out, so
// protected pages send them back to login instead of showing empty data.
useEffect(() => {
const interceptor = axios.interceptors.response.use(
response => response,
err => {
const url = err.config?.url || ''
if (err.response?.status === 401 && !url.startsWith('/api/auth/')) clearSession()
return Promise.reject(err)
}
)
return () => axios.interceptors.response.eject(interceptor)
}, [])

// Staff only. Customers have no password: they sign in with a WhatsApp code on
// the storefront - a farmer account is never a candidate for this login, even
// on the same number as a staff account, so the server never turns one away
// here for being a customer.
const login = async (identifier, password) => {
try {
const { data } = await axios.post('/api/auth/login', { identifier: identifier.trim(), password })
saveSession(data.token, data.user)
return data.user
} catch (err) {
throw new Error(err.response?.data?.message || 'Could not reach the server. Please try again.')
}
}

// Send the WhatsApp code. The same code signs in and signs up, so this never
// says whether the number already has an account.
const sendAuthOtp = async (phone) => {
const { data } = await axios.post('/api/auth/send-otp', { phone, purpose: 'auth' })
if (data?.directLogin && data?.token) saveSession(data.token, data.user)
return data
}

// A correct code signs in a number we already know, and comes back with
// isNewUser for one we do not: that number is now verified, and the details
// form finishes the account through register() below. Only a reply carrying a
// token is a session.
const verifyAuthOtp = async (phone, otp) => {
const { data } = await axios.post('/api/auth/verify-otp', { phone, otp })
if (data.token) saveSession(data.token, data.user)
return data
}

// Creates the account for a number verified moments ago, and signs them in.
// onReply sees the whole answer (e.g. whether a referral code was applied).
const register = async (payload, { onReply } = {}) => {
const { data } = await axios.post('/api/auth/register', payload)
saveSession(data.token, data.user)
onReply?.(data)
return data.user
}

const logout = (showToast = true) => {
clearSession()
if (showToast) toast.success('Logged out successfully')
}

return (
<AuthContext.Provider value={{ user, token, login, sendAuthOtp, verifyAuthOtp, register, logout, setSession: saveSession, loading, isAuth: !!user }}>
{children}
</AuthContext.Provider>
)
}
