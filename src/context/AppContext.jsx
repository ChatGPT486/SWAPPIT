import { createContext, useContext, useState } from 'react'

// ── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    id: 'u1', firstName: 'Armel', lastName: 'Kamga',
    email: 'armel@example.com', password: 'pass123',
    contact: '+237 6 71 23 45 67',
    bio: 'Gadget collector and tech lover. Based in Douala.',
    photo: null, joinedAt: '2026-01-10',
    stars: 4.8, reviewCount: 12, swapCount: 15,
    role: 'member',
  },
  {
    id: 'u2', firstName: 'Diane', lastName: 'Mbarga',
    email: 'diane@example.com', password: 'pass123',
    contact: '+237 6 52 87 34 12',
    bio: 'Fashion lover and bookworm. Yaoundé.',
    photo: null, joinedAt: '2026-01-15',
    stars: 4.5, reviewCount: 8, swapCount: 10,
    role: 'member',
  },
  {
    id: 'u3', firstName: 'Patrick', lastName: 'Nkeng',
    email: 'patrick@example.com', password: 'pass123',
    contact: '+237 6 93 45 78 23',
    bio: 'Tech enthusiast. Bafoussam.',
    photo: null, joinedAt: '2026-02-01',
    stars: 3.9, reviewCount: 5, swapCount: 6,
    role: 'member',
  },
]

const SEED_TEAM = [
  { id: 't1', name: 'Jean-Baptiste Fouda', role: 'Project Lead & Full-Stack Dev', bio: 'Passionate about building tools that create real impact in African communities. Dreams in React.', emoji: '🚀', color: '#e8521f' },
  { id: 't2', name: 'Armel Kamga', role: 'Backend Developer', bio: 'Django wizard. Loves clean APIs and well-structured databases. Coffee-powered.', emoji: '⚙️', color: '#7c3aed' },
  { id: 't3', name: 'Diane Mbarga', role: 'UI/UX Designer', bio: 'Believes great design should be invisible. Figma is her canvas, users are her audience.', emoji: '🎨', color: '#0891b2' },
  { id: 't4', name: 'Patrick Nkeng', role: 'Frontend Developer', bio: 'Turns Figma mockups into pixel-perfect components. Fanatic about responsive design.', emoji: '💻', color: '#16a34a' },
  { id: 't5', name: 'Serge Biyong', role: 'Product & Marketing', bio: 'Bridges the gap between what we build and who needs it. Makes sure Swappit speaks to everyone.', emoji: '📣', color: '#d97706' },
  { id: 't6', name: 'Chloe Ngo Bum', role: 'QA & Community Manager', bio: 'The last line of defence before a bug reaches users. Also our warmest community voice.', emoji: '🛡️', color: '#db2777' },
]

const SEED_ITEMS = [
  { id: 'i1', userId: 'u1', name: 'iPhone 13 Pro', category: 'Electronics', description: 'Excellent condition, 128GB, midnight black. Comes with original charger and box.', condition: 'Excellent', value: 180000, emoji: '📱', createdAt: '2026-03-01', available: true, image: null },
  { id: 'i2', userId: 'u2', name: 'Nike Air Max 270', category: 'Clothing', description: 'Worn twice, size 42, white/grey colorway. No visible defects.', condition: 'Good', value: 55000, emoji: '👟', createdAt: '2026-03-05', available: true, image: null },
  { id: 'i3', userId: 'u3', name: 'Book Collection (×12)', category: 'Books', description: '12 novels including classics and contemporary fiction. All in good reading condition.', condition: 'Good', value: 25000, emoji: '📚', createdAt: '2026-03-08', available: true, image: null },
  { id: 'i4', userId: 'u1', name: 'Sony WH-1000XM4', category: 'Electronics', description: 'Noise-cancelling headphones, black. Minor scratch on right earcup, sound perfect.', condition: 'Good', value: 95000, emoji: '🎧', createdAt: '2026-03-10', available: true, image: null },
  { id: 'i5', userId: 'u2', name: 'Canon EOS 200D', category: 'Electronics', description: 'Entry-level DSLR, 24.1MP. Includes 18-55mm kit lens and carrying bag.', condition: 'Excellent', value: 220000, emoji: '📷', createdAt: '2026-03-12', available: true, image: null },
  { id: 'i6', userId: 'u3', name: 'Ergonomic Office Chair', category: 'Furniture', description: 'Mesh back ergonomic chair. Adjustable height, armrests intact. Used 1 year.', condition: 'Good', value: 45000, emoji: '🪑', createdAt: '2026-03-14', available: true, image: null },
  { id: 'i7', userId: 'u2', name: 'Samsung Galaxy Tab S7', category: 'Electronics', description: '11-inch tablet, 128GB, Wi-Fi. Comes with original S-Pen. Some light scratches on back.', condition: 'Good', value: 140000, emoji: '📲', createdAt: '2026-03-18', available: true, image: null },
  { id: 'i8', userId: 'u3', name: 'Yamaha F310 Guitar', category: 'Music', description: 'Acoustic guitar. Great sound, one string replaced recently. Includes soft case.', condition: 'Good', value: 60000, emoji: '🎸', createdAt: '2026-03-20', available: true, image: null },
]

const SEED_REVIEWS = [
  { id: 'r1', authorId: 'u2', targetUserId: 'u1', exchangeId: null, stars: 5, comment: 'Armel was super responsive and the iPhone was exactly as described. Very trustworthy!', createdAt: '2026-02-15' },
  { id: 'r2', authorId: 'u3', targetUserId: 'u1', exchangeId: null, stars: 5, comment: 'Smooth exchange, item in perfect condition. Highly recommended!', createdAt: '2026-02-28' },
  { id: 'r3', authorId: 'u1', targetUserId: 'u2', exchangeId: null, stars: 4, comment: 'Diane was friendly and the shoes were as advertised. Would swap again.', createdAt: '2026-03-05' },
  { id: 'r4', authorId: 'u3', targetUserId: 'u2', exchangeId: null, stars: 5, comment: 'Great experience. Very honest about item condition.', createdAt: '2026-03-10' },
  { id: 'r5', authorId: 'u1', targetUserId: 'u3', exchangeId: null, stars: 4, comment: 'Patrick showed up on time and the books were in great shape.', createdAt: '2026-03-18' },
]

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [users, setUsers] = useState(SEED_USERS)
  const [items, setItems] = useState(SEED_ITEMS)
  const [exchanges, setExchanges] = useState([])
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [notifications, setNotifications] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const signup = ({ firstName, lastName, email, password, contact, bio }) => {
    if (users.find(u => u.email === email)) return { ok: false, error: 'Email already in use.' }
    const newUser = {
      id: 'u' + Date.now(), firstName, lastName, email, password,
      contact: contact || '', bio: bio || '', photo: null,
      joinedAt: new Date().toISOString().slice(0, 10),
      stars: 0, reviewCount: 0, swapCount: 0, role: 'member',
    }
    setUsers(prev => [...prev, newUser])
    setCurrentUser(newUser)
    return { ok: true }
  }

  const signin = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) return { ok: false, error: 'Invalid email or password.' }
    // Sync with latest user state
    setCurrentUser(user)
    return { ok: true }
  }

  const signout = () => setCurrentUser(null)

  const updateProfile = (fields) => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...fields } : u))
    setCurrentUser(prev => ({ ...prev, ...fields }))
  }

  // ── Items ─────────────────────────────────────────────────────────────────
  const addItem = (itemData) => {
    const newItem = {
      id: 'i' + Date.now(),
      userId: currentUser.id,
      createdAt: new Date().toISOString().slice(0, 10),
      available: true,
      image: null,
      ...itemData,
    }
    setItems(prev => [...prev, newItem])
    return newItem
  }

  const deleteItem = (itemId) => setItems(prev => prev.filter(i => i.id !== itemId))

  // ── Exchanges ─────────────────────────────────────────────────────────────
  const proposeExchange = ({ offeredItemId, requestedItemId }) => {
    const offeredItem  = items.find(i => i.id === offeredItemId)
    const requestedItem = items.find(i => i.id === requestedItemId)
    if (!offeredItem || !requestedItem) return null

    const ratio = offeredItem.value / requestedItem.value
    let fairness = 'balanced'
    if (ratio < 0.8 || ratio > 1.25) fairness = 'unfair'
    else if (ratio < 0.92 || ratio > 1.08) fairness = 'acceptable'

    const ex = {
      id: 'ex' + Date.now(),
      proposerId: currentUser.id,
      ownerId: requestedItem.userId,
      offeredItemId, requestedItemId,
      status: 'pending', fairness,
      createdAt: new Date().toISOString().slice(0, 10),
      reviewedByProposer: false,
      reviewedByOwner: false,
    }
    setExchanges(prev => [...prev, ex])

    pushNotification(requestedItem.userId, {
      type: 'proposal', exchangeId: ex.id,
      message: `${currentUser.firstName} wants to swap your "${requestedItem.name}"`,
    })
    return ex
  }

  const respondExchange = (exchangeId, accepted) => {
    const ex = exchanges.find(e => e.id === exchangeId)
    if (!ex) return
    setExchanges(prev => prev.map(e => e.id === exchangeId ? { ...e, status: accepted ? 'accepted' : 'rejected' } : e))

    const proposer = users.find(u => u.id === ex.proposerId)
    const owner    = users.find(u => u.id === ex.ownerId)
    const reqItem  = items.find(i => i.id === ex.requestedItemId)

    if (accepted) {
      setItems(prev => prev.map(i =>
        i.id === ex.offeredItemId || i.id === ex.requestedItemId ? { ...i, available: false } : i
      ))
      setUsers(prev => prev.map(u =>
        u.id === ex.proposerId || u.id === ex.ownerId ? { ...u, swapCount: (u.swapCount || 0) + 1 } : u
      ))
      pushNotification(ex.proposerId, { type: 'accepted', exchangeId, message: `${owner.firstName} accepted your swap! Contact: ${owner.contact}`, contact: owner.contact })
      pushNotification(ex.ownerId,    { type: 'accepted', exchangeId, message: `Exchange confirmed with ${proposer.firstName}. Contact: ${proposer.contact}`, contact: proposer.contact })
    } else {
      pushNotification(ex.proposerId, { type: 'rejected', exchangeId, message: `${owner.firstName} declined your swap proposal for "${reqItem?.name}".` })
    }
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  const addReview = ({ targetUserId, exchangeId, stars, comment }) => {
    const newReview = {
      id: 'r' + Date.now(),
      authorId: currentUser.id,
      targetUserId, exchangeId,
      stars, comment,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setReviews(prev => [...prev, newReview])

    // Recalculate target user's star average
    const userReviews = [...reviews, newReview].filter(r => r.targetUserId === targetUserId)
    const avg = userReviews.reduce((s, r) => s + r.stars, 0) / userReviews.length
    setUsers(prev => prev.map(u =>
      u.id === targetUserId ? { ...u, stars: Math.round(avg * 10) / 10, reviewCount: userReviews.length } : u
    ))

    // Mark exchange as reviewed by this user
    if (exchangeId) {
      setExchanges(prev => prev.map(ex => {
        if (ex.id !== exchangeId) return ex
        return {
          ...ex,
          reviewedByProposer: ex.proposerId === currentUser.id ? true : ex.reviewedByProposer,
          reviewedByOwner:    ex.ownerId    === currentUser.id ? true : ex.reviewedByOwner,
        }
      }))
    }

    // Notify target
    pushNotification(targetUserId, {
      type: 'review',
      message: `${currentUser.firstName} gave you ${stars} star${stars !== 1 ? 's' : ''}: "${comment.slice(0, 50)}${comment.length > 50 ? '…' : ''}"`,
    })
    return newReview
  }

  const getUserReviews = (userId) => reviews.filter(r => r.targetUserId === userId)
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
    const partnerId = ex.proposerId === currentUser?.id ? ex.ownerId : ex.proposerId
    return users.find(u => u.id === partnerId)
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const pushNotification = (userId, notif) => {
    setNotifications(prev => [{
      id: 'n' + Date.now() + Math.random(),
      userId, read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    }, ...prev])
  }
  const markNotifRead    = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllNotifsRead = () => setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, read: true } : n))

  // ── Smart Suggestions ─────────────────────────────────────────────────────
  const getSuggestions = () => {
    if (!currentUser) return []
    const mine  = items.filter(i => i.userId === currentUser.id && i.available)
    const theirs = items.filter(i => i.userId !== currentUser.id && i.available)
    const suggestions = []
    mine.forEach(m => {
      theirs.forEach(t => {
        const ratio = m.value / t.value
        if (ratio >= 0.72 && ratio <= 1.39) {
          let fairness = 'balanced'
          if (ratio < 0.92 || ratio > 1.08) fairness = 'acceptable'
          suggestions.push({ myItem: m, theirItem: t, fairness, score: 1 - Math.abs(1 - ratio) })
        }
      })
    })
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 6)
  }

  // ── Fairness ──────────────────────────────────────────────────────────────
  const getFairness = (val1, val2) => {
    if (!val1 || !val2) return null
    const ratio = val1 / val2
    if (ratio >= 0.92 && ratio <= 1.08) return { label: 'Balanced',   color: 'var(--green)',  bg: 'var(--green-soft)',  icon: '⚖️' }
    if (ratio >= 0.72 && ratio <= 1.39) return { label: 'Acceptable', color: 'var(--orange)', bg: 'var(--orange-soft)', icon: '〜' }
    return                                      { label: 'Unfair',     color: 'var(--red)',    bg: 'var(--red-soft)',    icon: '⚠️' }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserById           = (id) => users.find(u => u.id === id)
  const getItemById           = (id) => items.find(i => i.id === id)
  const getMyItems            = ()   => items.filter(i => i.userId === currentUser?.id)
  const getMyNotifications    = ()   => notifications.filter(n => n.userId === currentUser?.id)
  const getMyExchanges        = ()   => exchanges.filter(e => e.proposerId === currentUser?.id || e.ownerId === currentUser?.id)
  const getUnreadCount        = ()   => notifications.filter(n => n.userId === currentUser?.id && !n.read).length
  const getTeam               = ()   => SEED_TEAM
  const getAllUsers            = ()   => users

  return (
    <AppContext.Provider value={{
      users, items, exchanges, reviews, currentUser, notifications,
      signup, signin, signout, updateProfile,
      addItem, deleteItem,
      proposeExchange, respondExchange,
      addReview, getUserReviews, canReviewExchange, getReviewPartner,
      markNotifRead, markAllNotifsRead,
      getSuggestions, getFairness,
      getUserById, getItemById, getMyItems, getMyNotifications,
      getMyExchanges, getUnreadCount, getTeam, getAllUsers,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
