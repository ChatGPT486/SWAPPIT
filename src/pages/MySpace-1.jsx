import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import Toast from '../components/Toast'
import StarRating from '../components/StarRating'
import ReviewModal from '../components/ReviewModal'
import { AIValueEstimator } from '../components/AIAssistant'

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'products',      label: 'My Items',       icon: '📦' },
  { id: 'exchanges',     label: 'Exchanges',      icon: '🔁' },
  { id: 'notifications', label: 'Notifications',  icon: '🔔' },
]

const EMOJIS = { Electronics:'📱', Clothing:'👕', Furniture:'🪑', Books:'📚', Music:'🎸', Sports:'⚽', Other:'📦' }

export default function MySpace() {
  const location = useLocation()
  const {
    currentUser, updateProfile,
    getMyItems, getMyExchanges, getMyNotifications,
    loadItems, loadExchanges, loadNotifications,
    addItem, deleteItem, respondExchange,
    markNotifRead, markAllNotifsRead,
    getFairness, getUserById, getItemById, getUnreadCount,
    getUserReviews, addReview, canReviewExchange, getReviewPartner,
  } = useApp()

  const tabFromUrl = new URLSearchParams(location.search).get('tab')
  const [tab, setTab]     = useState(tabFromUrl || 'profile')
  const [toast, setToast] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)

  // ── Charge toutes les données depuis l'API au montage ──────────────────────
  useEffect(() => {
    loadItems()
    loadExchanges()
    loadNotifications()
  }, [])

  useEffect(() => { if (tabFromUrl) setTab(tabFromUrl) }, [tabFromUrl])

  const myItems     = getMyItems()
  const myExchanges = getMyExchanges()
  const myNotifs    = getMyNotifications()
  const unread      = getUnreadCount()

  const handleReviewSubmit = async (data) => {
    await addReview(data)
    setToast({ message: 'Review submitted! Thank you.', type: 'success' })
    setReviewTarget(null)
  }

  if (!currentUser) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 5%' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {currentUser.photo
                ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : `${currentUser.firstName[0]}${currentUser.lastName[0]}`
              }
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <StarRating value={currentUser.stars || 0} size={13} />
                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {currentUser.stars > 0
                    ? `${currentUser.stars} · ${currentUser.reviewCount} review${currentUser.reviewCount !== 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? 'var(--ink)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--ink-muted)',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all var(--transition)', position: 'relative',
              }}
                onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = 'var(--surface)' }}
                onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{t.icon}</span> {t.label}
                {t.id === 'notifications' && unread > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', marginLeft: 2 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '32px 5%' }}>
        {tab === 'profile'       && <ProfileTab user={currentUser} onUpdate={updateProfile} onToast={setToast} getUserReviews={getUserReviews} getUserById={getUserById} />}
        {tab === 'products'      && <ProductsTab items={myItems} onAdd={addItem} onDelete={deleteItem} onToast={setToast} />}
        {tab === 'exchanges'     && <ExchangesTab exchanges={myExchanges} currentUser={currentUser} onRespond={respondExchange} getFairness={getFairness} getUserById={getUserById} getItemById={getItemById} onToast={setToast} canReviewExchange={canReviewExchange} getReviewPartner={getReviewPartner} onReview={(partner, exchangeId) => setReviewTarget({ partner, exchangeId })} />}
        {tab === 'notifications' && <NotificationsTab notifs={myNotifs} onRead={markNotifRead} onReadAll={markAllNotifsRead} setTab={setTab} />}
      </div>

      {reviewTarget && (
        <ReviewModal
          partner={reviewTarget.partner}
          exchangeId={reviewTarget.exchangeId}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate, onToast, getUserReviews, getUserById }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName:  user.lastName,
    bio:       user.bio || '',
    contact:   user.contact || '',
  })
  const [myReviews, setMyReviews] = useState([])
  const photoRef = useRef()

  // Charge les reviews de manière async correctement
  useEffect(() => {
    getUserReviews(user.id).then(setMyReviews).catch(() => setMyReviews([]))
  }, [user.id])

  const handleSave = async () => {
    await onUpdate(form)
    setEditing(false)
    onToast({ message: 'Profile updated!', type: 'success' })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) onUpdate({ photo: file })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
      {/* Left: info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title="Public Profile">
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '3px solid var(--border)',
              }}>
                {user.photo
                  ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : `${user.firstName[0]}${user.lastName[0]}`
                }
              </div>
              <button onClick={() => photoRef.current?.click()} style={{
                position: 'absolute', bottom: 0, right: -2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--ink)', color: '#fff', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff',
              }}>✏️</button>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 3 }}>
              Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { label: 'Swaps',   value: user.swapCount   || 0 },
              { label: 'Reviews', value: user.reviewCount  || 0 },
              { label: 'Rating',  value: user.stars > 0 ? `${user.stars}★` : '—' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--surface)', borderRadius: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {!editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Email">{user.email}</InfoRow>
              <InfoRow label="Contact">{user.contact || '—'}</InfoRow>
              <InfoRow label="Bio">{user.bio || '—'}</InfoRow>
              <Btn onClick={() => setEditing(true)}>Edit Profile</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PField label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
              <PField label="Last Name"  value={form.lastName}  onChange={v => setForm(f => ({ ...f, lastName: v }))} />
              <PField label="Contact"    value={form.contact}   onChange={v => setForm(f => ({ ...f, contact: v }))} />
              <PField label="Bio"        value={form.bio}       onChange={v => setForm(f => ({ ...f, bio: v }))} multiline />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={handleSave}>Save</Btn>
                <Btn secondary onClick={() => setEditing(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right: reviews */}
      <Card title="Reviews received" subtitle={`${myReviews.length} review${myReviews.length !== 1 ? 's' : ''}`}>
        {myReviews.length === 0 ? (
          <Empty icon="⭐" title="No reviews yet" desc="Complete exchanges to receive reviews." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myReviews.map(r => (
              <div key={r.id} style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {r.author?.firstName} {r.author?.lastName}
                  </span>
                  <StarRating value={r.stars} size={12} />
                </div>
                {r.comment && <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{r.comment}</p>}
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Products Tab ───────────────────────────────────────────────────────────────
function ProductsTab({ items, onAdd, onDelete, onToast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Electronics', description: '', condition: 'Good', value: '', emoji: '📦' })
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await onAdd({ ...form, value: parseInt(form.value) || 0})
    if (!res) return
    setLoading(false)
    if (res?.ok) {
      setShowForm(false)
      setForm({ name: '', category: 'Electronics', description: '', condition: 'Good', value: '', emoji: '📦' })
      onToast({ message: 'Item added!', type: 'success' })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>My Items</h2>
        <Btn onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : '+ Add Item'}</Btn>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 22, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>New Item</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FField label="Name" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Image</label>
                <input type='file' accept='image/*' onChange={e => setForm(f => ({...f, image:e.target.files[0]}))} style={inp}/>
                
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, emoji: EMOJIS[e.target.value] || '📦' }))} style={sel}>
                  {Object.keys(EMOJIS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Condition</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} style={sel}>
                  {['Excellent','Good','Fair'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <FField label="Estimated Value (FCFA)" name="value" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            <PField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline />
            <AIValueEstimator itemName={form.name} category={form.category} condition={form.condition} onEstimate={v => setForm(f => ({ ...f, value: String(v) }))} />
            <Btn>{loading ? 'Adding…' : 'Add Item'}</Btn>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon="📦" title="No items yet" desc="Add your first item to start swapping." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              <ItemCard item={item} />
              <button onClick={() => { onDelete(item.id); onToast({ message: 'Item deleted.', type: 'success' }) }} style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(220,38,38,0.9)', color: '#fff', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Exchanges Tab ──────────────────────────────────────────────────────────────
function ExchangesTab({ exchanges, currentUser, onRespond, getFairness, getUserById, getItemById, onToast, canReviewExchange, getReviewPartner, onReview }) {
  const [responding, setResponding] = useState(null)

  const handleRespond = async (exchangeId, accepted) => {
    setResponding(exchangeId)
    await onRespond(exchangeId, accepted)
    setResponding(null)
    onToast({ message: accepted ? 'Swap accepted! 🎉' : 'Swap declined.', type: accepted ? 'success' : 'info' })
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Exchanges</h2>
      {exchanges.length === 0 ? (
        <Empty icon="🔁" title="No exchanges yet" desc="Propose a swap from the Explorer page." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {exchanges.map(ex => {
            const isProposer = ex.proposerId === currentUser.id
            const fairness   = getFairness(ex.offeredItem?.value, ex.requestedItem?.value)
            const canReview  = canReviewExchange(ex.id)
            const partner    = getReviewPartner(ex.id)

            return (
              <div key={ex.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                      {isProposer ? 'You proposed' : 'Received from'} {isProposer ? ex.owner?.firstName : ex.proposer?.firstName}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {new Date(ex.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {fairness && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: fairness.bg, color: fairness.color }}>
                        {fairness.icon} {fairness.label}
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: ex.status === 'accepted' ? 'var(--green-soft)' : ex.status === 'rejected' ? 'var(--red-soft)' : 'var(--orange-soft)',
                      color:      ex.status === 'accepted' ? 'var(--green)'      : ex.status === 'rejected' ? 'var(--red)'      : 'var(--orange)',
                    }}>
                      {ex.status === 'pending' ? '⏳ Pending' : ex.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <ExChip item={ex.offeredItem}   label="Offered" />
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: 'var(--ink-muted)' }}>⇄</div>
                  <ExChip item={ex.requestedItem} label="Requested" />
                </div>

                {ex.status === 'pending' && !isProposer && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRespond(ex.id, true)} disabled={responding === ex.id} style={{
                      padding: '8px 16px', borderRadius: 8, background: 'var(--green)', color: '#fff',
                      fontWeight: 600, fontSize: 13, transition: 'opacity var(--transition)',
                      opacity: responding === ex.id ? 0.6 : 1,
                    }}>✓ Accept</button>
                    <button onClick={() => handleRespond(ex.id, false)} disabled={responding === ex.id} style={{
                      padding: '8px 16px', borderRadius: 8, background: 'transparent',
                      border: '1.5px solid var(--border)', color: 'var(--ink-muted)',
                      fontWeight: 600, fontSize: 13,
                    }}>✕ Decline</button>
                  </div>
                )}

                {canReview && partner && (
                  <button onClick={() => onReview(partner, ex.id)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    transition: 'all var(--transition)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)' }}
                  >★ Leave Review</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ExChip({ item, label }) {
  return (
    <div style={{ flex: '0 1 155px', padding: '10px 12px', background: 'var(--surface)', borderRadius: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      {item?.image
        ? <img src={item.image} alt={item?.name} style={{ width: '100%', height: 56, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
        : <div style={{ fontSize: 20, marginBottom: 4 }}>{item?.emoji || '📦'}</div>
      }
      <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3 }}>{item?.name || 'Unknown'}</div>
      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>{item?.value?.toLocaleString()} FCFA</div>
    </div>
  )
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab({ notifs, onRead, onReadAll, setTab }) {
  const cfg = {
    proposal: { icon: '🔁', color: 'var(--orange)' },
    accepted: { icon: '✅', color: 'var(--green)' },
    rejected: { icon: '❌', color: 'var(--red)' },
    review:   { icon: '⭐', color: '#f59e0b' },
    default:  { icon: '🔔', color: 'var(--ink-muted)' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Notifications</h2>
        {notifs.some(n => !n.read) && (
          <button onClick={onReadAll} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', padding: '6px 12px', borderRadius: 8 }}>
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <Empty icon="🔔" title="No notifications" desc="You'll be notified about swap proposals and reviews." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => {
            const c = cfg[n.type] || cfg.default
            return (
              <div key={n.id} onClick={() => { onRead(n.id); if (n.type === 'proposal') setTab('exchanges') }} style={{
                padding: '14px 16px', borderRadius: 12,
                background: n.read ? '#fff' : 'var(--accent-soft)',
                border: `1px solid ${n.read ? 'var(--border)' : 'rgba(232,82,31,0.18)'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                transition: 'transform var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.message}</p>
                  {n.contact && <div style={{ marginTop: 6, padding: '5px 10px', background: 'var(--green-soft)', borderRadius: 6, fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'inline-flex', gap: 5 }}>📞 {n.contact}</div>}
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 5 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 4, flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Shared micro-components ────────────────────────────────────────────────────
function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 22 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink)' }}>{children}</div>
    </div>
  )
}

function PField({ label, value, onChange, multiline }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={inp} />
      }
    </div>
  )
}

function FField({ label, name, type = 'text', value, onChange }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} style={inp}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function Btn({ children, onClick, secondary }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 18px', borderRadius: 8,
      background: secondary ? 'transparent' : 'var(--ink)',
      color: secondary ? 'var(--ink-muted)' : '#fff',
      border: secondary ? '1.5px solid var(--border)' : 'none',
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
      transition: 'all var(--transition)',
    }}
      onMouseEnter={e => { if (!secondary) e.currentTarget.style.background = 'var(--accent)' }}
      onMouseLeave={e => { if (!secondary) e.currentTarget.style.background = secondary ? 'transparent' : 'var(--ink)' }}
    >{children}</button>
  )
}

function Empty({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--ink-muted)' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 14 }}>{desc}</p>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', transition: 'border-color var(--transition)', fontFamily: 'var(--font-body)' }
const sel = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }
