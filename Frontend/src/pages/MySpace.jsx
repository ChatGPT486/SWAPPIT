import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import supabase from '../lib/supabase'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import Toast from '../components/Toast'
import StarRating from '../components/StarRating'
import ReviewModal from '../components/ReviewModal'
import { AIValueEstimator } from '../components/AIAssistant'

const TABS = [
  { id: 'profile',       label: 'Profile',      icon: '👤' },
  { id: 'products',      label: 'My Items',      icon: '📦' },
  { id: 'exchanges',     label: 'Exchanges',     icon: '🔁' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
]
const EMOJIS = { Electronics:'📱', Clothing:'👕', Furniture:'🪑', Books:'📚', Music:'🎸', Sports:'⚽', Other:'📦' }

export default function MySpace() {
  const location = useLocation()
  const {
    currentUser, updateProfile,
    getMyItems, getMyExchanges, getMyNotifications,
    addItem, deleteItem, respondExchange,
    markNotifRead, markAllNotifsRead,
    getFairness, getUserById, getItemById, getUnreadCount,
    getUserReviews, addReview, canReviewExchange, getReviewPartner,
  } = useApp()

  const tabFromUrl = new URLSearchParams(location.search).get('tab')
  const [tab, setTab]         = useState(tabFromUrl || 'profile')
  const [toast, setToast]     = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)

  useEffect(() => { if (tabFromUrl) setTab(tabFromUrl) }, [tabFromUrl])

  const myItems     = getMyItems()
  const myExchanges = getMyExchanges()
  const myNotifs    = getMyNotifications()
  const unread      = getUnreadCount()

  // Safe camelCase aliases for currentUser (already normalized by AppContext)
  const firstName   = currentUser?.firstName || currentUser?.first_name || ''
  const lastName    = currentUser?.lastName  || currentUser?.last_name  || ''
  const initials    = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()
  const reviewCount = currentUser?.reviewCount ?? currentUser?.review_count ?? 0
  const swapCount   = currentUser?.swapCount   ?? currentUser?.swap_count   ?? 0

  const handleReviewSubmit = async (data) => {
    await addReview(data)
    setToast({ message: 'Review submitted! Thank you.', type: 'success' })
    setReviewTarget(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px 5% 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'var(--ink)', color: 'var(--lime)',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              border: '3px solid var(--lime)', boxShadow: '0 0 0 4px rgba(200,242,48,0.15)',
            }}>
              {currentUser?.photo
                ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(18px,2.5vw,24px)', letterSpacing: '-0.02em' }}>
                {firstName} {lastName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <StarRating value={currentUser?.stars || 0} size={13} />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {currentUser?.stars > 0
                    ? `${currentUser.stars} · ${reviewCount} review${reviewCount !== 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  {myItems.length} items · {myExchanges.filter(e => e.status === 'accepted').length} swaps
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '10px 18px', borderRadius: '10px 10px 0 0',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                background: tab === t.id ? 'var(--surface)' : 'transparent',
                color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
                borderBottom: tab === t.id ? '2px solid var(--ink)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s var(--ease)', border: 'none', cursor: 'pointer',
              }}
                onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--ink)' }}
                onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--muted)' }}
              >
                <span>{t.icon}</span> {t.label}
                {t.id === 'notifications' && unread > 0 && (
                  <span style={{ background: 'var(--coral)', color: '#fff', borderRadius: 'var(--radius-pill)', padding: '1px 6px', fontSize: 9, fontWeight: 800 }}>
                    {unread}
                  </span>
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
  // FIX: initialize form with safe fallbacks for both camelCase and snake_case
  const [form, setForm] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName:  user?.lastName  || user?.last_name  || '',
    bio:       user?.bio       || '',
    contact:   user?.contact   || '',
  })
  // FIX: getUserReviews is async — put result in state via useEffect
  const [myReviews, setMyReviews] = useState([])
  const photoRef = useRef()

  useEffect(() => {
    if (user?.id) {
      getUserReviews(user.id).then(reviews => setMyReviews(Array.isArray(reviews) ? reviews : []))
    }
  }, [user?.id])

  const handleSave = async () => {
    await onUpdate(form)
    setEditing(false)
    onToast({ message: 'Profile updated!', type: 'success' })
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Show local preview immediately for instant feedback
    onUpdate({ photo: URL.createObjectURL(file) })

    try {
      let permanentUrl = null

      // Primary: upload to Django backend directly
      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/upload-image`,
          { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('swappit_access')}` }, body: formData }
        )
        if (res.ok) {
          const data = await res.json()
          permanentUrl = data.url || null
        }
      } catch {}

      // Secondary: Supabase if Django upload failed
      if (!permanentUrl && supabase.isConfigured()) {
        permanentUrl = await supabase.uploadAvatar(file, user?.id)
      }

      if (permanentUrl) {
        onUpdate({ photo: permanentUrl })
      }
      onToast({ message: 'Profile photo updated!', type: 'success' })
    } catch {
      onToast({ message: 'Photo saved locally (reconnect to persist).', type: 'success' })
    }
  }

  const firstName = user?.firstName || user?.first_name || ''
  const lastName  = user?.lastName  || user?.last_name  || ''
  const initials  = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Public profile card */}
        <SCard title="Public Profile">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--surface-2)' }}>
                {user?.photo
                  ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              <button onClick={() => photoRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: -2, width: 28, height: 28, borderRadius: '50%', background: 'var(--lime)', color: 'var(--ink)', fontSize: 13, border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✎</button>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{firstName} {lastName}</div>
            <StarRating value={user?.stars || 0} size={14} />
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SField label="First name" value={form.firstName} onChange={v => setForm(f => ({...f, firstName: v}))} />
              <SField label="Last name"  value={form.lastName}  onChange={v => setForm(f => ({...f, lastName: v}))} />
              <SField label="Bio" value={form.bio} onChange={v => setForm(f => ({...f, bio: v}))} multiline />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <SBtn onClick={handleSave}>Save changes</SBtn>
                <SBtn onClick={() => setEditing(false)} secondary>Cancel</SBtn>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Bio">{user?.bio || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No bio yet</span>}</InfoRow>
              <InfoRow label="Member since">{user?.dateJoined || user?.date_joined || '—'}</InfoRow>
              <InfoRow label="Swaps completed">
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--teal)', fontSize: 18 }}>
                  {user?.swapCount ?? user?.swap_count ?? 0}
                </span>
              </InfoRow>
              <SBtn onClick={() => setEditing(true)} secondary>Edit Profile</SBtn>
            </div>
          )}
        </SCard>

        <SCard title="🔒 Private Info" subtitle="Never shared publicly">
          {editing
            ? <SField label="Contact number" value={form.contact} onChange={v => setForm(f => ({...f, contact: v}))} />
            : <>
                <InfoRow label="Email">{user?.email}</InfoRow>
                <div style={{ marginTop: 12 }}>
                  <InfoRow label="Contact">{user?.contact || <span style={{ color: 'var(--muted)' }}>Not set</span>}</InfoRow>
                </div>
              </>
          }
        </SCard>
      </div>

      {/* Reviews */}
      <SCard title={`⭐ Reviews (${myReviews.length})`}>
        {myReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>No reviews yet</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Complete a swap to earn your first stars!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myReviews.map(r => {
              // FIX: author is a nested object from API or resolved via getUserById
              const author = r.author && typeof r.author === 'object'
                ? r.author
                : getUserById(r.author?.id ?? r.authorId ?? r.author)
              const authorFirst = author?.firstName || author?.first_name || ''
              const authorLast  = author?.lastName  || author?.last_name  || ''
              return (
                <div key={r.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar user={author} size={30} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{authorFirst} {authorLast}</span>
                    </div>
                    <StarRating value={r.stars} size={12} />
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, fontStyle: 'italic' }}>"{r.comment}"</p>}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{r.created_at || r.createdAt || ''}</div>
                </div>
              )
            })}
          </div>
        )}
      </SCard>
    </div>
  )
}

// ── Products Tab ───────────────────────────────────────────────────────────────
function ProductsTab({ items, onAdd, onDelete, onToast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]     = useState({ name: '', description: '', category: 'Electronics', condition: 'Good', value: '' })
  const [imageFile, setImageFile] = useState(null)  // actual File object for upload
  const [preview,   setPreview]   = useState(null)  // blob URL for preview only
  const [dragOver,  setDragOver]  = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    // Store the real File object for upload, and a blob URL just for preview
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.value) { onToast({ message: 'Name and value are required.', type: 'error' }); return }
    setUploading(true)
    try {
      await onAdd({
        ...form,
        value:     parseFloat(form.value),
        emoji:     EMOJIS[form.category] || '📦',
        imageFile: imageFile,  // pass the real File object — AppContext uploads it to Supabase
      })
      setForm({ name: '', description: '', category: 'Electronics', condition: 'Good', value: '' })
      setImageFile(null)
      setPreview(null)
      setShowForm(false)
      onToast({ message: 'Item added to the marketplace! 🎉', type: 'success' })
    } catch (err) {
      onToast({ message: err.message || 'Failed to add item.', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>My Items</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{items.length} item{items.length !== 1 ? 's' : ''} in your catalogue</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-pill)',
          background: showForm ? 'var(--surface)' : 'var(--ink)',
          color: showForm ? 'var(--muted)' : 'var(--lime)',
          border: showForm ? '1.5px solid var(--border-md)' : 'none',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s var(--ease)', cursor: 'pointer',
        }}>
          {showForm ? '✕ Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'clamp(20px,3vw,28px)', marginBottom: 28, animation: 'scaleIn 0.2s var(--ease)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 22, letterSpacing: '-0.02em' }}>Post a New Item</h3>

          {/* Image upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={Lbl}>Item Photo</label>
            <div
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById('item-photo-upload').click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--ink)' : 'var(--border-md)'}`,
                borderRadius: 'var(--radius-sm)', padding: 24, textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--surface-2)' : 'var(--surface)', transition: 'all 0.2s',
                minHeight: preview ? 'auto' : 120,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={preview} alt="preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, display: 'block' }} />
                  <button onClick={e => { e.stopPropagation(); setPreview(null); setImageFile(null) }} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--error)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 36 }}>📷</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>PNG, JPG, WEBP up to 10MB</div>
                </>
              )}
            </div>
            <input id="item-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e.target.files[0])} />
          </div>

          <AIValueEstimator itemName={form.name} description={form.description} category={form.category} onResult={({ value, condition }) => setForm(f => ({ ...f, value: String(value), condition }))} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <FField label="Item Name *"    name="name"  value={form.name}  onChange={handleChange} />
            <FField label="Value (FCFA) *" name="value" value={form.value} onChange={handleChange} type="number" />
            <div>
              <label style={Lbl}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={Sel}>{Object.keys(EMOJIS).map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label style={Lbl}>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} style={Sel}>{['Excellent','Good','Fair'].map(c => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={Lbl}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe your item…" style={{ ...Inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <SBtn onClick={handleSubmit} disabled={uploading}>
              {uploading ? '⏳ Uploading…' : 'Post Item →'}
            </SBtn>
            <SBtn onClick={() => setShowForm(false)} secondary disabled={uploading}>Cancel</SBtn>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Empty icon="📦" title="No items yet" desc="Add your first item to start swapping with others." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              <ItemCard item={item} />
              <button onClick={() => { onDelete(item.id); onToast({ message: 'Item removed.', type: 'info' }) }} style={{
                position: 'absolute', top: 10, right: 10,
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)', color: 'var(--error)',
                fontSize: 13, border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.color = 'var(--error)' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Exchanges Tab ──────────────────────────────────────────────────────────────
function ExchangesTab({ exchanges, currentUser, onRespond, getFairness, getUserById, getItemById, onToast, canReviewExchange, getReviewPartner, onReview }) {
  const [filter, setFilter] = useState('all')
  const filtered = exchanges.filter(ex => filter === 'all' || ex.status === filter)
  const counts = {
    all:      exchanges.length,
    pending:  exchanges.filter(e => e.status === 'pending').length,
    accepted: exchanges.filter(e => e.status === 'accepted').length,
    rejected: exchanges.filter(e => e.status === 'rejected').length,
  }

  const handleRespond = async (exId, accepted) => {
    await onRespond(exId, accepted)
    onToast({ message: accepted ? '✅ Exchange accepted! Contacts have been shared.' : 'Exchange declined.', type: accepted ? 'success' : 'info' })
  }

  const statusCfg = {
    pending:  { color: '#d97706', bg: 'rgba(245,158,11,0.1)',  label: 'PENDING'  },
    accepted: { color: '#059669', bg: 'rgba(16,185,129,0.1)',  label: 'ACCEPTED' },
    rejected: { color: '#dc2626', bg: 'rgba(239,68,68,0.1)',   label: 'DECLINED' },
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all','pending','accepted','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`pill ${filter === f ? 'pill--active' : ''}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon="🔁" title="No exchanges" desc="Exchange proposals will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(ex => {
            // FIX: use normalized fields from AppContext — ownerId/proposerId are set by normalizeExchange
            const isOwner   = (ex.ownerId ?? ex.owner?.id) === currentUser?.id
            const otherId   = isOwner ? (ex.proposerId ?? ex.proposer?.id) : (ex.ownerId ?? ex.owner?.id)
            const other     = getUserById(otherId) || (isOwner ? ex.proposer : ex.owner)

            // FIX: use offeredItem/requestedItem (normalized camelCase) or fall back to nested objects
            const offered   = ex.offeredItem   || ex.offered_item   || getItemById(ex.offeredItemId)
            const requested = ex.requestedItem || ex.requested_item || getItemById(ex.requestedItemId)

            const fairness  = getFairness(offered?.value, requested?.value)
            const canReview = canReviewExchange(ex.id)
            const partner   = getReviewPartner(ex.id)
            const sc        = statusCfg[ex.status] || {}

            // Safe name accessors for the other user
            const otherFirst = other?.firstName || other?.first_name || ''
            const otherContact = other?.contact || ''

            return (
              <div key={ex.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'clamp(16px,2.5vw,22px)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={other} size={36} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                        {isOwner ? `${otherFirst} wants to swap with you` : `Your proposal to ${otherFirst}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ex.createdAt || ex.created_at || ''}</div>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)', background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                  <ExChip item={offered}   label={isOwner ? 'They offer' : 'You offer'} />
                  <div style={{ fontSize: 24, color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>⇄</div>
                  <ExChip item={requested} label={isOwner ? 'For your item' : 'For their item'} />
                  {fairness && (
                    <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: fairness.bg }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: fairness.color, fontFamily: 'var(--font-display)' }}>{fairness.icon} {fairness.label}</span>
                    </div>
                  )}
                </div>

                {isOwner && ex.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRespond(ex.id, true)} style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--success)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >✓ Accept & Share Contacts</button>
                    <button onClick={() => handleRespond(ex.id, false)} style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--error)', color: 'var(--error)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)' }}
                    >✕ Decline</button>
                  </div>
                )}

                {ex.status === 'accepted' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <span style={{ fontSize: 16 }}>📞</span>
                      <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        Contact {otherFirst}: {otherContact || other?.contact || 'Not available'}
                      </span>
                    </div>
                    {(ex.meetLocation || ex.meet_location) && (
                      <div style={{ background: 'rgba(200,242,48,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(200,242,48,0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(200,242,48,0.12)' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📍 Meeting Point</div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {(ex.meetLocation || ex.meet_location) && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>📍 {ex.meetLocation || ex.meet_location}</div>}
                            {(ex.meetDate || ex.meet_date) && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>🗓 {new Date(ex.meetDate || ex.meet_date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                          </div>
                        </div>
                        <MeetMap location={ex.meetLocation || ex.meet_location} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {canReview && partner && (
                        <button onClick={() => onReview(other, ex.id)} style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', transition: 'transform 0.2s var(--ease-spring)' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >★ Leave Review</button>
                      )}
                    </div>
                  </div>
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
    <div style={{ flex: '0 1 155px', padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, fontFamily: 'var(--font-display)' }}>{label}</div>
      {item?.image
        ? <img src={item.image} alt={item?.name} style={{ width: '100%', height: 56, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
        : <div style={{ fontSize: 24, marginBottom: 4 }}>{item?.emoji || '📦'}</div>
      }
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{item?.name || 'Unknown'}</div>
      <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 800, marginTop: 2 }}>{Number(item?.value || 0).toLocaleString()} FCFA</div>
    </div>
  )
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab({ notifs, onRead, onReadAll, setTab }) {
  const cfg = {
    proposal: { icon: '🔁', color: 'var(--warning)' },
    accepted: { icon: '✅', color: 'var(--success)' },
    rejected: { icon: '❌', color: 'var(--error)' },
    review:   { icon: '⭐', color: '#f59e0b' },
    default:  { icon: '🔔', color: 'var(--muted)' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Notifications</h2>
        {/* FIX: Django uses is_read, not read */}
        {notifs.some(n => !n.is_read && !n.read) && (
          <button onClick={onReadAll} style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--muted)', padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}
          >Mark all read</button>
        )}
      </div>

      {notifs.length === 0 ? (
        <Empty icon="🔔" title="No notifications" desc="You'll be notified about swap proposals and reviews." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => {
            const isRead = n.is_read || n.read || false  // FIX: handle both field names
            const c = cfg[n.type] || cfg.default
            return (
              <div key={n.id} onClick={() => { onRead(n.id); if (n.type === 'proposal') setTab('exchanges') }} style={{
                padding: '14px 18px', borderRadius: 'var(--radius-sm)',
                background: isRead ? '#fff' : 'rgba(200,242,48,0.06)',
                border: `1px solid ${isRead ? 'var(--border)' : 'rgba(200,242,48,0.2)'}`,
                display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                transition: 'all 0.2s var(--ease)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.boxShadow='var(--shadow-xs)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.boxShadow='none' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: isRead ? 400 : 600, lineHeight: 1.45, color: 'var(--ink)' }}>{n.message}</p>
                  {n.contact && (
                    <div style={{ marginTop: 6, padding: '5px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, fontSize: 12, color: 'var(--success)', fontWeight: 700, display: 'inline-flex', gap: 5 }}>
                      📞 {n.contact}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                    {new Date(n.created_at || n.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>
                {!isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', marginTop: 4, flexShrink: 0, boxShadow: '0 0 6px var(--lime)' }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Meeting map ────────────────────────────────────────────────────────────────
function MeetMap({ location }) {
  if (!location) return null
  const city  = location.split('—')[0].trim()
  const spot  = location.split('—')[1]?.trim() || ''
  const cityCoords = {
    'Douala':    { x: '28%', y: '62%' }, 'Yaoundé':   { x: '45%', y: '65%' },
    'Bafoussam': { x: '32%', y: '52%' }, 'Bamenda':   { x: '25%', y: '42%' },
    'Garoua':    { x: '55%', y: '25%' },
  }
  const coord = cityCoords[city] || { x: '40%', y: '55%' }
  return (
    <div style={{ background: '#0c0c10', padding: '12px 16px' }}>
      <div style={{ position: 'relative', height: 120, borderRadius: 8, overflow: 'hidden', background: 'rgba(245,244,240,0.03)', border: '1px solid rgba(245,244,240,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} viewBox="0 0 300 200">
          <path d="M80,20 Q110,10 150,18 L185,22 Q215,28 235,55 L250,90 Q258,115 252,140 L238,165 Q218,183 195,192 L160,198 Q125,202 100,192 L70,178 Q45,160 40,135 L36,105 Q33,78 42,55 L55,38 Z" fill="rgba(200,242,48,0.15)" stroke="rgba(200,242,48,0.3)" strokeWidth="1.5" />
        </svg>
        <div style={{ position: 'absolute', left: coord.x, top: coord.y, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
          <div style={{ background: 'var(--lime)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, color: 'var(--ink)', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(200,242,48,0.5)' }}>
            📍 {city}{spot ? ` · ${spot}` : ''}
          </div>
          <div style={{ width: 2, height: 8, background: 'var(--lime)', margin: '0 auto' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', margin: '0 auto', opacity: 0.5 }} />
        </div>
        {Object.entries(cityCoords).filter(([c]) => c !== city).map(([c, pos]) => (
          <div key={c} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(245,244,240,0.2)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared micro-components ────────────────────────────────────────────────────
function SCard({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'clamp(18px,3vw,24px)' }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Avatar({ user, size = 36 }) {
  const first = user?.firstName || user?.first_name || ''
  const last  = user?.lastName  || user?.last_name  || ''
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.36, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {user?.photo
        ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : `${first[0] || '?'}${last[0] || ''}`
      }
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'var(--font-display)' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink)' }}>{children}</div>
    </div>
  )
}

function SField({ label, value, onChange, multiline }) {
  return (
    <div>
      <label style={Lbl}>{label}</label>
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} style={{ ...Inp, resize: 'vertical' }} />
        : <input value={value || ''} onChange={e => onChange(e.target.value)} style={Inp} />
      }
    </div>
  )
}

function FField({ label, name, type = 'text', value, onChange }) {
  return (
    <div>
      <label style={Lbl}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} style={Inp}
        onFocus={e => e.target.style.borderColor = 'var(--ink)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
      />
    </div>
  )
}

function SBtn({ children, onClick, secondary, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '10px 20px', borderRadius: 'var(--radius-sm)',
      background: secondary ? 'transparent' : 'var(--ink)',
      color: secondary ? 'var(--muted)' : 'var(--lime)',
      border: secondary ? '1.5px solid var(--border-md)' : 'none',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
      transition: 'all 0.2s var(--ease)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
      onMouseEnter={e => { if (!secondary && !disabled) e.currentTarget.style.opacity='0.88'; else if (!disabled) { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' } }}
      onMouseLeave={e => { if (!secondary && !disabled) e.currentTarget.style.opacity='1'; else if (!disabled) { e.currentTarget.style.borderColor='var(--border-md)'; e.currentTarget.style.color='var(--muted)' } }}
    >{children}</button>
  )
}

function Empty({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>{desc}</p>
    </div>
  )
}

const Lbl = { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, fontFamily: 'var(--font-display)' }
const Inp = { width: '100%', padding: '10px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-md)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', transition: 'border-color 0.2s', fontFamily: 'var(--font-body)' }
const Sel = { width: '100%', padding: '10px 13px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-md)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-body)' }