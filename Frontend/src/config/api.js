/**
 * api.js — Frontend ↔ Django REST API bridge
 *
 * Fixes applied:
 * 1. request() handles 204 No Content (DELETE) without crashing on JSON parse
 * 2. Token refresh uses correct endpoint
 * 3. All endpoint paths match swappit_api/urls.py exactly
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// ── Token helpers ─────────────────────────────────────────────────────────────
export const tokens = {
  getAccess:  ()      => localStorage.getItem('swappit_access'),
  getRefresh: ()      => localStorage.getItem('swappit_refresh'),
  set:        (a, r)  => {
    localStorage.setItem('swappit_access', a)
    localStorage.setItem('swappit_refresh', r)
  },
  clear: () => {
    localStorage.removeItem('swappit_access')
    localStorage.removeItem('swappit_refresh')
  },
}

// ── Core request ──────────────────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const access  = tokens.getAccess()
  if (access) headers['Authorization'] = `Bearer ${access}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // 401 → try refresh once, then redirect to sign-in
  if (res.status === 401 && retry) {
    const refreshed = await _refreshToken()
    if (refreshed) return request(path, options, false)
    tokens.clear()
    window.location.href = '/signin'
    return null
  }

  // FIX: 204 No Content (DELETE) — don't try to parse empty body
  if (res.status === 204) return null

  // FIX: safely parse JSON, fall back to empty object
  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Extract the most descriptive error message Django provides
    const msg =
      payload.detail ||
      payload.error  ||
      (typeof payload === 'object'
        ? Object.values(payload).flat().join(' ')
        : 'Request failed')
    throw new Error(msg)
  }

  return payload
}

async function _refreshToken() {
  const refresh = tokens.getRefresh()
  if (!refresh) return false
  try {
    const res  = await fetch(`${API_BASE}/auth/token/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh }),
    })
    const data = await res.json()
    if (data.access) {
      tokens.set(data.access, data.refresh || refresh)
      return true
    }
    return false
  } catch {
    return false
  }
}

// ── Public API surface ────────────────────────────────────────────────────────
export const api = {

  // Health
  health: () => request('/health'),

  // Auth
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => request('/auth/logout',   {
    method: 'POST',
    body: JSON.stringify({ refresh: tokens.getRefresh() }),
  }),
  refreshToken: _refreshToken,

  // Users
  getUsers: ()     => request('/users'),
  getMe:    ()     => request('/users/me'),
  updateMe: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getUser:  (id)   => request(`/users/${id}`),

  // Items
  getItems: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString()
    return request(`/items${qs ? '?' + qs : ''}`)
  },
  getMyItems:     ()       => request('/items/mine'),
  getSuggestions: ()       => request('/items/suggestions'),
  getItem:        (id)     => request(`/items/${id}`),
  createItem:     (body)   => request('/items',       { method: 'POST',   body: JSON.stringify(body) }),
  updateItem:     (id, b)  => request(`/items/${id}`, { method: 'PATCH',  body: JSON.stringify(b) }),
  deleteItem:     (id)     => request(`/items/${id}`, { method: 'DELETE' }),  // returns null (204)

  // Exchanges
  getExchanges: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/exchanges${qs ? '?' + qs : ''}`)
  },
  createExchange:  (body)        => request('/exchanges',                { method: 'POST', body: JSON.stringify(body) }),
  respondExchange: (id, action)  => request(`/exchanges/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
  checkFairness:   (off, req)    => request(`/exchanges/fairness?offered=${off}&requested=${req}`),

  // Reviews
  getReviews:   (userId) => request(`/reviews${userId ? '?user=' + userId : ''}`),
  createReview: (body)   => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Notifications
  getNotifications: (unreadOnly = false) => request(`/notifications${unreadOnly ? '?unread=true' : ''}`),
  getUnreadCount:   ()   => request('/notifications/unread-count'),
  markRead:         (id) => request(`/notifications/${id}/read`,  { method: 'POST' }),
  markAllRead:      ()   => request('/notifications/read-all',    { method: 'POST' }),
}