/**
 * src/context/AppContext.jsx  —  API-connected version
 */
import { createContext, useContext, useState, useCallback } from 'react'
import * as api from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser,   setCurrentUser]   = useState(null)
  const [items,         setItems]         = useState([])
  const [myItems,       setMyItems]       = useState([])   // items de l'utilisateur connecté
  const [exchanges,     setExchanges]     = useState([])
  const [reviews,       setReviews]       = useState({})
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(false)

  // ── Auth ────────────────────────────────────────────────────────────────────
  const signup = async (formData) => {
    const res = await api.signup(formData)
    if (res.ok) setCurrentUser(res.user)
    return res
  }

  const signin = async (email, password) => {
    const res = await api.signin(email, password)
    if (res.ok) setCurrentUser(res.user)
    return res
  }

  const signout = async () => {
    await api.signout()
    setCurrentUser(null)
    setItems([]); setMyItems([]); setExchanges([])
    setReviews({}); setNotifications([])
  }

  const updateProfile = async (fields) => {
    const res = await api.updateProfile(fields)
    if (res.ok) setCurrentUser(res.user)
    return res
  }

  // ── Items ───────────────────────────────────────────────────────────────────
  // Charge TOUS les items disponibles (Explorer)
  const loadItems = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      const data = await api.getItems(filters)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('loadItems error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Charge les items de l'utilisateur connecté (MySpace)
  const loadMyItems = useCallback(async () => {
    try {
      const data = await api.getMyItems()
      setMyItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('loadMyItems error:', e)
    }
  }, [])

  const addItem = async (itemData) => {
    const res = await api.addItem(itemData)
    if (res.ok) {
      setMyItems(prev => [res.item, ...prev])
      // Ajoute aussi dans la liste globale si disponible
      setItems(prev => [res.item, ...prev])
    }
    return res
  }

  const deleteItem = async (id) => {
    await api.deleteItem(id)
    setMyItems(prev => prev.filter(i => i.id !== id))
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const getItemById = (id) => {
    const found = [...items, ...myItems].find(i => i.id === id)
    return found || api.getItemById(id)
  }

  // Retourne les items de l'utilisateur connecté depuis le state dédié
  const getMyItems = () => myItems

  // ── Exchanges ───────────────────────────────────────────────────────────────
  const loadExchanges = useCallback(async () => {
    try {
      const data = await api.getMyExchanges()
      setExchanges(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('loadExchanges error:', e)
    }
  }, [])

  const proposeExchange = async ({ offeredItemId, requestedItemId }) => {
    const res = await api.proposeExchange({ offeredItemId, requestedItemId })
    if (res.ok) setExchanges(prev => [res.exchange, ...prev])
    return res
  }

  const respondExchange = async (exchangeId, accepted) => {
    const res = await api.respondExchange(exchangeId, accepted)
    if (res.ok) {
      setExchanges(prev => prev.map(e => e.id === exchangeId ? res.exchange : e))
      if (accepted) {
        const ex = res.exchange
        setItems(prev => prev.map(i =>
          i.id === ex.offeredItemId || i.id === ex.requestedItemId
            ? { ...i, available: false } : i
        ))
        setMyItems(prev => prev.map(i =>
          i.id === ex.offeredItemId || i.id === ex.requestedItemId
            ? { ...i, available: false } : i
        ))
      }
    }
    return res
  }

  const getMyExchanges = () => exchanges

  const canReviewExchange = (exchangeId) => {
    const ex = exchanges.find(e => e.id === exchangeId)
    if (!ex || ex.status !== 'accepted') return false
    if (ex.proposerId === currentUser?.id && !ex.reviewedByProposer) return true
    if (ex.ownerId    === currentUser?.id && !ex.reviewedByOwner)    return true
    return false
  }

  const getReviewPartner = (exchangeId) => {
    const ex = exchanges.find(e => e.id === exchangeId)
    if (!ex) return null
    return ex.proposerId === currentUser?.id ? ex.owner : ex.proposer
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────
  const getUserReviews = useCallback(async (userId) => {
    if (reviews[userId]) return reviews[userId]
    try {
      const data = await api.getUserReviews(userId)
      const list = Array.isArray(data) ? data : []
      setReviews(prev => ({ ...prev, [userId]: list }))
      return list
    } catch (e) {
      console.error('getUserReviews error:', e)
      return []
    }
  }, [reviews])

  const addReview = async (data) => {
    const res = await api.addReview(data)
    if (res.ok) {
      setReviews(prev => { const next = { ...prev }; delete next[data.targetUserId]; return next })
    }
    return res
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.getMyNotifications()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(data.unreadCount || 0)
    } catch (e) {
      console.error('loadNotifications error:', e)
    }
  }, [])

  const markNotifRead = async (id) => {
    await api.markNotifRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllNotifsRead = async () => {
    await api.markAllNotifsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getMyNotifications = () => notifications
  const getUnreadCount     = () => unreadCount

  // ── Suggestions ─────────────────────────────────────────────────────────────
  const getSuggestions = useCallback(() => api.getSuggestions(), [])

  // ── Fairness (calcul local) ──────────────────────────────────────────────────
  const getFairness = api.getFairness

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getUserById = async (id) => {
    try { return await api.getUserById(id) } catch { return null }
  }

  const getTeam    = () => SEED_TEAM
  const getAllUsers = () => []

  return (
    <AppContext.Provider value={{
      currentUser, loading,
      // auth
      signup, signin, signout, updateProfile,
      // items
      items, loadItems, loadMyItems, addItem, deleteItem, getItemById, getMyItems,
      // exchanges
      exchanges, loadExchanges, proposeExchange, respondExchange,
      getMyExchanges, canReviewExchange, getReviewPartner,
      // reviews
      addReview, getUserReviews,
      // notifications
      loadNotifications, markNotifRead, markAllNotifsRead,
      getMyNotifications, getUnreadCount,
      // helpers
      getSuggestions, getFairness, getUserById, getTeam, getAllUsers,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

const SEED_TEAM = [
  { id: 't1', name: 'Jean-Baptiste Fouda', role: 'Project Lead & Full-Stack Dev', bio: 'Passionate about building tools that create real impact in African communities.', emoji: '🚀', color: '#e8521f' },
  { id: 't2', name: 'Armel Kamga',         role: 'Backend Developer',             bio: 'Django wizard. Loves clean APIs and well-structured databases.',                 emoji: '⚙️', color: '#7c3aed' },
  { id: 't3', name: 'Diane Mbarga',        role: 'UI/UX Designer',                bio: 'Believes great design should be invisible.',                                     emoji: '🎨', color: '#0891b2' },
  { id: 't4', name: 'Patrick Nkeng',       role: 'Frontend Developer',            bio: 'Turns Figma mockups into pixel-perfect components.',                             emoji: '💻', color: '#16a34a' },
  { id: 't5', name: 'Serge Biyong',        role: 'Product & Marketing',           bio: 'Bridges the gap between what we build and who needs it.',                        emoji: '📣', color: '#d97706' },
  { id: 't6', name: 'Chloe Ngo Bum',       role: 'QA & Community Manager',        bio: 'The last line of defence before a bug reaches users.',                           emoji: '🛡️', color: '#db2777' },
]
