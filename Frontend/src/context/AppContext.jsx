/**
 * AppContext.jsx
 *
 * Normalizes Django snake_case API responses → camelCase so all
 * existing components (Navbar, MySpace, ItemDetail, etc.) keep working.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokens } from '../config/api'
import supabase from '../lib/supabase'

const AppContext = createContext(null)

// ── Normalizers: Django → component-friendly objects ──────────────────────────

/** Normalize a user object from Django (snake_case) to camelCase */
function normalizeUser(u) {
  if (!u) return null
  return {
    ...u,
    // camelCase aliases so components don't break
    firstName:   u.first_name   ?? u.firstName   ?? '',
    lastName:    u.last_name    ?? u.lastName     ?? '',
    fullName:    u.full_name    ?? u.fullName     ?? `${u.first_name||''} ${u.last_name||''}`.trim(),
    reviewCount: u.review_count ?? u.reviewCount  ?? 0,
    swapCount:   u.swap_count   ?? u.swapCount    ?? 0,
    trustLabel:  u.trust_label  ?? u.trustLabel   ?? 'New',
    dateJoined:  u.date_joined  ?? u.dateJoined   ?? '',
    photo:       u.photo ?? u.avatar ?? null,
  }
}

/** Normalize an item object from Django */
function normalizeItem(item) {
  if (!item) return null
  return {
    ...item,
    owner:       item.owner ? normalizeUser(item.owner) : item.owner,
    isAvailable: item.available !== false && item.is_available !== false,
    available:   item.available !== false,
    createdAt:   item.created_at ?? item.createdAt ?? '',
    updatedAt:   item.updated_at ?? item.updatedAt ?? '',
    // Keep userId for legacy checks
    userId:      item.owner?.id ?? item.owner_id ?? item.userId ?? null,
  }
}

/** Normalize an exchange from Django */
function normalizeExchange(ex) {
  if (!ex) return null
  return {
    ...ex,
    proposer:      ex.proposer      ? normalizeUser(ex.proposer)      : ex.proposer,
    owner:         ex.owner         ? normalizeUser(ex.owner)         : ex.owner,
    offered_item:  ex.offered_item  ? normalizeItem(ex.offered_item)  : ex.offered_item,
    requested_item:ex.requested_item? normalizeItem(ex.requested_item): ex.requested_item,
    offeredItem:   ex.offered_item  ? normalizeItem(ex.offered_item)  : null,
    requestedItem: ex.requested_item? normalizeItem(ex.requested_item): null,
    meetLocation:  ex.meet_location ?? ex.meetLocation ?? '',
    meetDate:      ex.meet_date     ?? ex.meetDate     ?? '',
    createdAt:     ex.created_at    ?? ex.createdAt    ?? '',
    // Keep ownerId / proposerId for legacy checks
    ownerId:       ex.owner?.id ?? ex.owner_id ?? null,
    proposerId:    ex.proposer?.id ?? ex.proposer_id ?? null,
  }
}

/** Unwrap paginated ({results:[]}) or plain array */
const unwrap = (data) => Array.isArray(data) ? data : (data?.results ?? [])

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [currentUser,   setCurrentUser]   = useState(null)
  const [users,         setUsers]         = useState([])
  const [items,         setItems]         = useState([])
  const [myItems,       setMyItems]       = useState([])
  const [exchanges,     setExchanges]     = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [apiError,      setApiError]      = useState(null)

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tokens.getAccess()) {
      api.getMe()
        .then(user => { setCurrentUser(normalizeUser(user)); return loadAll() })
        .catch(() => tokens.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [allUsers, allItems, myItemsData, myExchanges, notifs, unread] = await Promise.all([
        api.getUsers(),
        api.getItems({}),           // fetch ALL items — Explorer filters are done in the UI
        api.getMyItems(),
        api.getExchanges(),
        api.getNotifications(),
        api.getUnreadCount(),
      ])
      setUsers(unwrap(allUsers).map(normalizeUser))
      setItems(unwrap(allItems).map(normalizeItem))
      setMyItems(unwrap(myItemsData).map(normalizeItem))
      setExchanges(unwrap(myExchanges).map(normalizeExchange))
      setNotifications(unwrap(notifs))
      setUnreadCount(unread?.unread_count ?? 0)
    } catch (err) {
      console.error('loadAll error:', err)
      setApiError('Could not load data. Is the Django server running on port 8000?')
    }
  }, [])

  // ── Auth ───────────────────────────────────────────────────────────────────
  const signin = async ({ email, password }) => {
    const data = await api.login({ email, password })
    tokens.set(data.access, data.refresh)
    setCurrentUser(normalizeUser(data.user))
    await loadAll()
    return { ok: true }
  }

  const signup = async (formData) => {
    const data = await api.register({
      email:      formData.email,
      first_name: formData.firstName,
      last_name:  formData.lastName,
      contact:    formData.contact || '',
      bio:        formData.bio     || '',
      password:   formData.password,
    })
    tokens.set(data.access, data.refresh)
    setCurrentUser(normalizeUser(data.user))
    await loadAll()
    return { ok: true }
  }

  const signout = async () => {
    try { await api.logout() } catch {}
    tokens.clear()
    setCurrentUser(null)
    setUsers([]); setItems([]); setMyItems([])
    setExchanges([]); setNotifications([]); setUnreadCount(0)
  }

  const updateProfile = async (changes) => {
    // Send snake_case to Django
    const payload = {}
    if (changes.firstName  !== undefined) payload.first_name = changes.firstName
    if (changes.lastName   !== undefined) payload.last_name  = changes.lastName
    if (changes.bio        !== undefined) payload.bio        = changes.bio
    if (changes.contact    !== undefined) payload.contact    = changes.contact
    if (changes.photo      !== undefined) payload.avatar     = changes.photo  // Django field is "avatar"
    // Pass through any already-snake_case keys
    Object.keys(changes).forEach(k => { if (!payload[k]) payload[k] = changes[k] })
    const updated = await api.updateMe(payload)
    const norm = normalizeUser(updated)
    setCurrentUser(norm)
    return norm
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  const addItem = async (itemData) => {
    // Step 1: Upload image — try Django first, then Supabase, then base64 fallback
    let imageUrl = ''
    if (itemData.imageFile instanceof File) {
      try {
        // Primary: upload directly to Django backend (no external service needed)
        const formData = new FormData()
        formData.append('image', itemData.imageFile)
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/upload-image`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokens.getAccess()}` },
            body: formData,
          }
        )
        if (res.ok) {
          const data = await res.json()
          imageUrl = data.url || ''
        }
      } catch {}

      // Secondary: Supabase Storage if Django upload failed
      if (!imageUrl && supabase.isConfigured()) {
        const url = await supabase.uploadItemImage(itemData.imageFile, currentUser?.id)
        if (url) imageUrl = url
      }

      // Last resort: base64 Data URL so image always shows
      if (!imageUrl) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = () => resolve('')
          reader.readAsDataURL(itemData.imageFile)
        })
      }
    }

    // Step 2: Create item in Django — send public image URL (string)
    const created = await api.createItem({
      name:        itemData.name,
      description: itemData.description || '',
      category:    itemData.category    || 'General',
      condition:   itemData.condition   || 'Good',
      value:       Number(itemData.value) || 0,
      image:       imageUrl,
    })
    const norm = normalizeItem(created)

    // Step 3: Add to myItems immediately
    setMyItems(prev => [norm, ...prev])

    // Step 4: CRITICAL — refresh the Explorer items list so others can see it
    // We re-fetch all items (excluding own) to update the Explorer grid
    try {
      const allItems = await api.getItems({})
      setItems(unwrap(allItems).map(normalizeItem))
    } catch (e) {
      console.warn('Could not refresh explorer items:', e)
    }

    return norm
  }

  const deleteItem = async (itemId) => {
    await api.deleteItem(itemId)
    setMyItems(prev => prev.filter(i => i.id !== itemId))
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const refreshItems = async () => {
    const [all, mine] = await Promise.all([
      api.getItems({}),
      api.getMyItems(),
    ])
    setItems(unwrap(all).map(normalizeItem))
    setMyItems(unwrap(mine).map(normalizeItem))
  }

  // ── Exchanges ──────────────────────────────────────────────────────────────
  const proposeExchange = async ({ offeredItemId, requestedItemId, meetLocation = '', meetDate = '' }) => {
    const created = await api.createExchange({
      offered_item_id:   offeredItemId,
      requested_item_id: requestedItemId,
      meet_location:     meetLocation,
      meet_date:         meetDate,
    })
    const norm = normalizeExchange(created)
    setExchanges(prev => [norm, ...prev])
    return norm
  }

  const respondExchange = async (exchangeId, accepted) => {
    const updated = await api.respondExchange(exchangeId, accepted ? 'accept' : 'reject')
    const norm = normalizeExchange(updated)
    setExchanges(prev => prev.map(e => e.id === exchangeId ? norm : e))
    await refreshItems()
    const [notifs, unread] = await Promise.all([api.getNotifications(), api.getUnreadCount()])
    setNotifications(unwrap(notifs))
    setUnreadCount(unread?.unread_count ?? 0)
    return norm
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const markNotifRead = async (notifId) => {
    await api.markRead(notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllNotifsRead = async () => {
    await api.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  const addReview = async ({ exchangeId, recipientId, stars, comment }) => {
    return await api.createReview({
      exchange:  exchangeId,
      recipient: recipientId,
      stars,
      comment: comment || '',
    })
  }

  const getUserReviews = async (userId) => {
    try {
      const data = await api.getReviews(userId)
      return unwrap(data).map(r => ({
        ...r,
        author: r.author ? normalizeUser(r.author) : r.author,
      }))
    } catch { return [] }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getUserById = (id) => {
    if (!id) return null
    const numId = parseInt(id)
    return users.find(u => u.id === numId) || null
  }

  const getItemById = (id) => {
    if (!id) return null
    const numId = parseInt(id)
    return [...items, ...myItems].find(i => i.id === numId) || null
  }

  const getMyItems         = () => myItems
  const getMyExchanges     = () => exchanges
  const getMyNotifications = () => notifications
  const getUnreadCount     = () => unreadCount

  const getFairness = (offeredVal, requestedVal) => {
    if (!offeredVal || !requestedVal || Number(requestedVal) === 0) return null
    const ratio = Number(offeredVal) / Number(requestedVal)
    if (ratio >= 0.85 && ratio <= 1.15) return { label: 'Balanced',   icon: '⚖️',  color: '#059669', bg: 'rgba(16,185,129,0.08)', tier: 'balanced' }
    if (ratio >= 0.65 && ratio <= 1.35) return { label: 'Acceptable', icon: '🤝',  color: '#d97706', bg: 'rgba(245,158,11,0.08)', tier: 'acceptable' }
    return                                      { label: 'Unfair',     icon: '⚠️', color: '#dc2626', bg: 'rgba(239,68,68,0.08)',  tier: 'unfair' }
  }

  const getSuggestions = async () => {
    try {
      const data = await api.getSuggestions()
      const list = Array.isArray(data) ? data : (data?.results ?? data ?? [])
      return list.map(s => ({
        ...s,
        my_item:    s.my_item    ? normalizeItem(s.my_item)    : s.myItem,
        their_item: s.their_item ? normalizeItem(s.their_item) : s.theirItem,
        myItem:     s.my_item    ? normalizeItem(s.my_item)    : s.myItem,
        theirItem:  s.their_item ? normalizeItem(s.their_item) : s.theirItem,
      }))
    } catch { return [] }
  }

  const getTrustScore = (user) => {
    if (!user) return null
    const s = parseFloat(user.stars) || 0
    const c = user.swapCount || user.swap_count || 0
    if (c >= 10 && s >= 4.5) return { score: 3, label: 'Top Swapper', color: '#059669' }
    if (c >= 5  && s >= 3.5) return { score: 2, label: 'Trusted',     color: '#0891b2' }
    if (c >= 1)               return { score: 1, label: 'Active',       color: '#d97706' }
    return                           { score: 0, label: 'New',          color: '#7c7b82' }
  }

  const canReviewExchange = (exchangeId) => {
    const ex = exchanges.find(e => e.id === parseInt(exchangeId))
    if (!ex || ex.status !== 'accepted' || !currentUser) return false
    const reviews = ex.reviews || []
    return !reviews.some(r => {
      const authorId = r.author?.id ?? r.author
      return authorId === currentUser.id
    })
  }

  const getReviewPartner = (exchangeId) => {
    const ex = exchanges.find(e => e.id === parseInt(exchangeId))
    if (!ex || !currentUser) return null
    const proposerId = ex.proposer?.id ?? ex.proposerId
    return proposerId === currentUser.id
      ? (ex.owner?.id ?? ex.ownerId)
      : proposerId
  }

  const getTeam = () => [
    { id: 't1', name: 'Jean-Baptiste Fouda', role: 'Project Lead & Full-Stack Dev', bio: 'Passionate about building tools that create real impact in African communities.', emoji: '🚀', color: '#e8521f' },
    { id: 't2', name: 'Armel Kamga',         role: 'Backend Developer',             bio: 'Django wizard. Loves clean APIs and well-structured databases.', emoji: '⚙️', color: '#7c3aed' },
    { id: 't3', name: 'Diane Mbarga',        role: 'UI/UX Designer',                bio: 'Believes great design should be invisible. Figma is her canvas.', emoji: '🎨', color: '#0891b2' },
    { id: 't4', name: 'Patrick Nkeng',       role: 'Frontend Developer',            bio: 'Turns mockups into pixel-perfect components. Fanatic about responsive design.', emoji: '💻', color: '#16a34a' },
    { id: 't5', name: 'Serge Biyong',        role: 'Product & Marketing',           bio: 'Bridges the gap between what we build and who needs it.', emoji: '📣', color: '#d97706' },
    { id: 't6', name: 'Chloe Ngo Bum',       role: 'QA & Community Manager',       bio: 'The last line of defence before a bug reaches users.', emoji: '🛡️', color: '#db2777' },
  ]

  const value = {
    currentUser, users, items, loading, apiError,
    signin, signup, signout, updateProfile,
    addItem, deleteItem, refreshItems,
    getMyItems, getItemById, getUserById,
    proposeExchange, respondExchange, getMyExchanges, getFairness,
    canReviewExchange, getReviewPartner,
    markNotifRead, markAllNotifsRead, getMyNotifications, getUnreadCount,
    addReview, getUserReviews,
    getSuggestions, getTrustScore, getTeam,
    loadAll,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}