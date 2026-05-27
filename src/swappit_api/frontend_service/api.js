/**
 * src/services/api.js
 *
 * Drop-in replacement for AppContext in-memory operations.
 * Every function mirrors the exact API surface the components use:
 *   signup(), signin(), signout(), updateProfile()
 *   addItem(), deleteItem()
 *   proposeExchange(), respondExchange()
 *   addReview(), getUserReviews()
 *   getMyNotifications(), markNotifRead(), markAllNotifsRead()
 *   getSuggestions(), getFairness()
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ── Token storage ─────────────────────────────────────────────────────────────
// Tokens stored in memory (safer than localStorage for XSS).
// On page reload the user must sign in again — or use refresh token in cookie.
let ACCESS_TOKEN  = null
let REFRESH_TOKEN = null

export function setTokens({ access, refresh }) {
  ACCESS_TOKEN  = access
  REFRESH_TOKEN = refresh
}

export function clearTokens() {
  ACCESS_TOKEN  = null
  REFRESH_TOKEN = null
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function req(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  if (ACCESS_TOKEN) headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`

  let fetchBody = undefined
  if (form) {
    // multipart/form-data for file uploads (photo, item image)
    fetchBody = form
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    fetchBody = JSON.stringify(body)
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: fetchBody })

  // Attempt token refresh on 401
  if (res.status === 401 && REFRESH_TOKEN) {
    const refreshed = await fetch(`${BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: REFRESH_TOKEN }),
    })
    if (refreshed.ok) {
      const data = await refreshed.json()
      ACCESS_TOKEN = data.access
      // Retry original request
      const retry = await fetch(`${BASE}${path}`, {
        method, headers: { ...headers, Authorization: `Bearer ${ACCESS_TOKEN}` }, body: fetchBody,
      })
      return retry.json()
    } else {
      clearTokens()
      throw new Error('Session expired. Please sign in again.')
    }
  }

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.detail || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return { ok: true }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * signup({ firstName, lastName, email, contact, password, bio })
 * → { ok, tokens, user } | { ok: false, error }
 */
export async function signup(formData) {
  const data = await req('/auth/signup/', { method: 'POST', body: formData })
  if (data.ok) setTokens(data.tokens)
  return data
}

/**
 * signin(email, password)
 * → { ok, tokens, user } | { ok: false, error }
 */
export async function signin(email, password) {
  const data = await req('/auth/signin/', { method: 'POST', body: { email, password } })
  if (data.ok) setTokens(data.tokens)
  return data
}

/**
 * signout()
 * Blacklists refresh token on the server.
 */
export async function signout() {
  if (REFRESH_TOKEN) {
    await req('/auth/signout/', { method: 'POST', body: { refresh: REFRESH_TOKEN } })
  }
  clearTokens()
}

/** GET /auth/me/ → current user object */
export const getMe = () => req('/auth/me/')

/**
 * updateProfile({ firstName, lastName, bio, contact, photo (File) })
 * Uses FormData if a photo file is included.
 */
export async function updateProfile(fields) {
  if (fields.photo instanceof File) {
    const form = new FormData()
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined) form.append(k, v) })
    return req('/auth/me/', { method: 'PATCH', form })
  }
  return req('/auth/me/', { method: 'PATCH', body: fields })
}

/** GET /auth/users/<id>/ → public profile */
export const getUserById = (id) => req(`/auth/users/${id}/`)

// ── Items ─────────────────────────────────────────────────────────────────────

/**
 * getItems({ search, category, sort })
 * Explorer page item list.
 */
export function getItems({ search = '', category = 'All', sort = 'recent' } = {}) {
  const params = new URLSearchParams()
  if (search)   params.set('search',   search)
  if (category && category !== 'All') params.set('category', category)
  if (sort)     params.set('sort',     sort)
  const qs = params.toString()
  return req(`/items/${qs ? '?' + qs : ''}`)
}

/** GET /items/<id>/ → ItemDetail */
export const getItemById = (id) => req(`/items/${id}/`)

/** GET /items/mine/ → MySpace items tab */
export const getMyItems = () => req('/items/mine/')

/**
 * addItem({ name, category, description, condition, value, emoji, image (File) })
 */
export function addItem(itemData) {
  if (itemData.image instanceof File) {
    const form = new FormData()
    Object.entries(itemData).forEach(([k, v]) => { if (v !== undefined) form.append(k, v) })
    return req('/items/', { method: 'POST', form })
  }
  return req('/items/', { method: 'POST', body: itemData })
}

/** DELETE /items/<id>/ */
export const deleteItem = (id) => req(`/items/${id}/`, { method: 'DELETE' })

/** GET /items/suggestions/ → smart swap matches */
export const getSuggestions = () => req('/items/suggestions/')

// ── Exchanges ─────────────────────────────────────────────────────────────────

/** GET /exchanges/ → all user exchanges */
export const getMyExchanges = () => req('/exchanges/')

/**
 * proposeExchange({ offeredItemId, requestedItemId })
 * Mirrors AppContext.proposeExchange().
 */
export const proposeExchange = (data) =>
  req('/exchanges/', { method: 'POST', body: data })

/**
 * respondExchange(exchangeId, accepted)
 * Mirrors AppContext.respondExchange().
 */
export const respondExchange = (exchangeId, accepted) =>
  req(`/exchanges/${exchangeId}/respond/`, { method: 'POST', body: { accepted } })

// ── Reviews ───────────────────────────────────────────────────────────────────

/** GET /reviews/?userId=<id> → reviews for a user */
export const getUserReviews = (userId) => req(`/reviews/?userId=${userId}`)

/**
 * addReview({ targetUserId, exchangeId, stars, comment })
 * Mirrors AppContext.addReview().
 */
export const addReview = (data) =>
  req('/reviews/', { method: 'POST', body: data })

// ── Notifications ─────────────────────────────────────────────────────────────

/** GET /notifications/ → { notifications, unreadCount } */
export const getMyNotifications = () => req('/notifications/')

/** POST /notifications/<id>/read/ */
export const markNotifRead = (id) =>
  req(`/notifications/${id}/read/`, { method: 'POST' })

/** POST /notifications/read-all/ */
export const markAllNotifsRead = () =>
  req('/notifications/read-all/', { method: 'POST' })

// ── Fairness helper (pure client-side — no API needed) ────────────────────────
/**
 * getFairness(val1, val2)
 * Kept client-side: it's just math and returns UI tokens.
 */
export function getFairness(val1, val2) {
  if (!val1 || !val2) return null
  const ratio = val1 / val2
  if (ratio >= 0.92 && ratio <= 1.08) return { label: 'Balanced',   color: 'var(--green)',  bg: 'var(--green-soft)',  icon: '⚖️' }
  if (ratio >= 0.72 && ratio <= 1.39) return { label: 'Acceptable', color: 'var(--orange)', bg: 'var(--orange-soft)', icon: '〜' }
  return                                      { label: 'Unfair',     color: 'var(--red)',    bg: 'var(--red-soft)',    icon: '⚠️' }
}
