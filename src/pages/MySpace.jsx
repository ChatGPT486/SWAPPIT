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
                : `${currentUser.firstName?.[0]}${currentUser.lastName?.[0]}`
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
        <ReviewModal partner={reviewTarget.partner} exchangeId={reviewTarget.exchangeId} onSubmit={handleReviewSubmit} onClose={() => setReviewTarget(null)} />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ user, onUpdate, onToast, getUserReviews, getUserById }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ firstName: user.firstName, lastName: user.lastName, bio: user.bio || '', contact: user.contact || '' })
  const [myReviews, setMyReviews] = useState([])
  const [photoPreview, setPhotoPreview] = useState(user.photo || null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoDragOver, setPhotoDragOver]   = useState(false)
  const photoInputRef = useRef()

  useEffect(() => {
    getUserReviews(user.id)
      .then(data => setMyReviews(Array.isArray(data) ? data : []))
      .catch(() => setMyReviews([]))
  }, [user.id])

  const handleSave = async () => {
    await onUpdate(form)
    setEditing(false)
    onToast({ message: 'Profile updated!', type: 'success' })
  }

  // ── Gestion photo de profil — drag & drop + click ──────────────────────────
  const handlePhotoFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    try {
      await onUpdate({ photo: file })
      onToast({ message: 'Profile photo updated!', type: 'success' })
    } catch {
      onToast({ message: 'Failed to upload photo.', type: 'error' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>

      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title="Public Profile">

          {/* ── Avatar upload zone ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>

            {/* Zone drag & drop pour la photo de profil */}
            <div
              onDrop={e => { e.preventDefault(); setPhotoDragOver(false); handlePhotoFile(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setPhotoDragOver(true) }}
              onDragLeave={() => setPhotoDragOver(false)}
              onClick={() => photoInputRef.current?.click()}
              style={{
                position: 'relative', marginBottom: 12, cursor: 'pointer',
                borderRadius: '50%',
                outline: photoDragOver ? '3px dashed var(--accent)' : '3px dashed transparent',
                outlineOffset: 3,
                transition: 'outline var(--transition)',
              }}
              title="Click or drag a photo to change your avatar"
            >
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '3px solid var(--border)',
                opacity: uploadingPhoto ? 0.6 : 1,
                transition: 'opacity var(--transition)',
              }}>
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : `${user.firstName?.[0]}${user.lastName?.[0]}`
                }
              </div>

              {/* Badge caméra */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: uploadingPhoto ? 'var(--border)' : 'var(--ink)',
                color: '#fff', fontSize: 12, border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background var(--transition)',
              }}>
                {uploadingPhoto ? '…' : '📷'}
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handlePhotoFile(e.target.files[0])} />

            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 6 }}>
              Click or drag a photo to change
            </p>

            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StarRating value={user.stars || 0} size={15} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{user.stars > 0 ? user.stars : 'New'}</span>
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PField label="First name" value={form.firstName} onChange={v => setForm(f => ({...f, firstName: v}))} />
              <PField label="Last name"  value={form.lastName}  onChange={v => setForm(f => ({...f, lastName: v}))} />
              <PField label="Bio" value={form.bio} onChange={v => setForm(f => ({...f, bio: v}))} multiline />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Btn onClick={handleSave}>Save changes</Btn>
                <Btn onClick={() => setEditing(false)} secondary>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Bio">{user.bio || <span style={{ color: 'var(--ink-muted)' }}>No bio yet</span>}</InfoRow>
              <InfoRow label="Member since">{user.joinedAt}</InfoRow>
              <InfoRow label="Swaps completed"><strong style={{ color: 'var(--green)' }}>{user.swapCount || 0}</strong></InfoRow>
              <Btn onClick={() => setEditing(true)} secondary>Edit Profile</Btn>
            </div>
          )}
        </Card>

        <Card title="🔒 Private Info" subtitle="Never shared publicly">
          {editing
            ? <PField label="Contact number" value={form.contact} onChange={v => setForm(f => ({...f, contact: v}))} />
            : <>
                <InfoRow label="Email">{user.email}</InfoRow>
                <div style={{ marginTop: 12 }}>
                  <InfoRow label="Contact">{user.contact || <span style={{ color: 'var(--ink-muted)' }}>Not set</span>}</InfoRow>
                </div>
              </>
          }
        </Card>
      </div>

      {/* Right: reviews */}
      <Card title={`Reviews (${myReviews.length})`}>
        {myReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⭐</div>
            <div style={{ fontSize: 14 }}>No reviews yet. Complete a swap to earn your first stars!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myReviews.map(r => (
              <div key={r.id} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {r.author?.photo
                        ? <img src={r.author.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : `${r.author?.firstName?.[0] || '?'}${r.author?.lastName?.[0] || ''}`
                      }
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.author?.firstName} {r.author?.lastName}</span>
                  </div>
                  <StarRating value={r.stars} size={13} />
                </div>
                {r.comment && <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>"{r.comment}"</p>}
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 6 }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
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
  const [form, setForm]         = useState({ name: '', description: '', category: 'Electronics', condition: 'Good', value: '', image: null })
  const [preview, setPreview]   = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Gère le fichier image — stocke le File réel pour l'upload API ──────────
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    setForm(f => ({ ...f, image: file }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.value) {
      onToast({ message: 'Name and value are required.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await onAdd({
        ...form,
        value: parseFloat(form.value),
        emoji: EMOJIS[form.category] || '📦',
      })
      if (res?.ok !== false) {
        setForm({ name: '', description: '', category: 'Electronics', condition: 'Good', value: '', image: null })
        setPreview(null)
        setShowForm(false)
        onToast({ message: 'Item added to the marketplace! 🎉', type: 'success' })
      } else {
        onToast({ message: res?.error || 'Failed to add item.', type: 'error' })
      }
    } catch {
      onToast({ message: 'Network error. Try again.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>My Items</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>{items.length} item{items.length !== 1 ? 's' : ''} in your catalogue</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          padding: '9px 18px', borderRadius: 'var(--radius-pill)',
          background: showForm ? 'var(--surface)' : 'var(--ink)',
          color: showForm ? 'var(--ink-muted)' : '#fff',
          border: showForm ? '1.5px solid var(--border)' : 'none',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all var(--transition)',
        }}
          onMouseEnter={e => { if (!showForm) e.currentTarget.style.background = 'var(--accent)' }}
          onMouseLeave={e => { if (!showForm) e.currentTarget.style.background = 'var(--ink)' }}
        >{showForm ? '✕ Cancel' : '+ Add Item'}</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 28, animation: 'scaleIn 0.2s ease' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Post a New Item</h3>

          {/* ── Zone image — drag & drop + click + preview ─────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Item Photo</label>
            <div
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]) }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById('item-photo-upload').click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: 24,
                textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--accent-soft)' : 'var(--surface)',
                transition: 'all var(--transition)',
                minHeight: preview ? 'auto' : 130,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={preview} alt="preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                  <button onClick={e => { e.stopPropagation(); setPreview(null); setForm(f => ({...f, image: null})) }} style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--red)', color: '#fff', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>✕</button>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-muted)' }}>Click to change photo</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 36 }}>📷</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontWeight: 600 }}>Click to upload or drag & drop</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', opacity: 0.7 }}>PNG, JPG, WEBP — max 10MB</div>
                </>
              )}
            </div>
            <input id="item-photo-upload" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleImageFile(e.target.files[0])} />
          </div>

          {/* AI Value Estimator */}
          <AIValueEstimator
            itemName={form.name}
            description={form.description}
            category={form.category}
            onResult={({ value, condition }) => setForm(f => ({ ...f, value: String(value), condition }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <FField label="Item Name *"    name="name"  value={form.name}  onChange={handleChange} />
            <FField label="Value (FCFA) *" name="value" value={form.value} onChange={handleChange} type="number" />
            <div>
              <label style={lbl}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={sel}>
                {Object.keys(EMOJIS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} style={sel}>
                {['Excellent','Good','Fair'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Describe your item — condition details, included accessories, reason for swapping…"
              style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              padding: '10px 20px', borderRadius: 8,
              background: loading ? 'var(--border)' : 'var(--ink)',
              color: loading ? 'var(--ink-muted)' : '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              transition: 'all var(--transition)',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--ink)' }}
            >{loading ? 'Posting…' : 'Post Item →'}</button>
            <Btn onClick={() => { setShowForm(false); setPreview(null) }} secondary>Cancel</Btn>
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
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)', color: 'var(--red)',
                fontSize: 13, border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)', boxShadow: 'var(--shadow-sm)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.color = 'var(--red)' }}
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
  const [filter, setFilter]       = useState('all')
  const [responding, setResponding] = useState(null)

  const filtered = exchanges.filter(ex => filter === 'all' || ex.status === filter)
  const counts = {
    all:      exchanges.length,
    pending:  exchanges.filter(e => e.status === 'pending').length,
    accepted: exchanges.filter(e => e.status === 'accepted').length,
    rejected: exchanges.filter(e => e.status === 'rejected').length,
  }

  const handleRespond = async (exId, accepted) => {
    setResponding(exId)
    await onRespond(exId, accepted)
    setResponding(null)
    onToast({ message: accepted ? '✅ Exchange accepted! Contacts have been shared.' : 'Exchange declined.', type: accepted ? 'success' : 'info' })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all','pending','accepted','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            background: filter === f ? 'var(--ink)' : 'transparent',
            color: filter === f ? '#fff' : 'var(--ink-muted)',
            border: `1.5px solid ${filter === f ? 'var(--ink)' : 'var(--border)'}`,
            transition: 'all var(--transition)',
          }}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon="🔁" title="No exchanges" desc="Exchange proposals will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(ex => {
            const isOwner   = ex.ownerId === currentUser.id
            const other     = isOwner ? ex.proposer : ex.owner
            const offered   = ex.offeredItem
            const requested = ex.requestedItem
            const fairness  = getFairness(offered?.value, requested?.value)
            const canReview = canReviewExchange(ex.id)
            const partner   = getReviewPartner(ex.id)

            const statusStyle = {
              pending:  { color: 'var(--orange)', bg: 'var(--orange-soft)' },
              accepted: { color: 'var(--green)',  bg: 'var(--green-soft)' },
              rejected: { color: 'var(--red)',    bg: 'var(--red-soft)' },
            }[ex.status]

            return (
              <div key={ex.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {isOwner ? `${other?.firstName} wants to swap with you` : `Your proposal to ${other?.firstName}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {ex.createdAt ? new Date(ex.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, color: statusStyle?.color, background: statusStyle?.bg }}>
                    {ex.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <ExChip item={offered}   label={isOwner ? 'They offer' : 'You offer'} />
                  <div style={{ fontSize: 22, color: 'var(--accent)', fontWeight: 700 }}>⇄</div>
                  <ExChip item={requested} label={isOwner ? 'For your item' : 'For their item'} />
                  {fairness && (
                    <div style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: fairness.bg }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: fairness.color }}>{fairness.icon} {fairness.label}</span>
                    </div>
                  )}
                </div>

                {isOwner && ex.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={() => handleRespond(ex.id, true)} disabled={responding === ex.id} style={{
                      padding: '9px 18px', borderRadius: 8, background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: 13,
                      opacity: responding === ex.id ? 0.6 : 1, transition: 'opacity var(--transition)',
                    }}>✓ Accept & Share Contacts</button>
                    <button onClick={() => handleRespond(ex.id, false)} disabled={responding === ex.id} style={{
                      padding: '9px 18px', borderRadius: 8, border: '1.5px solid var(--red)', color: 'var(--red)', fontWeight: 700, fontSize: 13,
                      transition: 'all var(--transition)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--red)' }}
                    >✕ Decline</button>
                  </div>
                )}

                {ex.status === 'accepted' && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ padding: '8px 14px', background: 'var(--green-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📞</span>
                      <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                        Contact {other?.firstName}: {other?.contact}
                      </span>
                    </div>
                    {canReview && partner && (
                      <button onClick={() => onReview(partner, ex.id)} style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        fontWeight: 700, fontSize: 12, border: '1.5px solid rgba(232,82,31,0.2)',
                        transition: 'all var(--transition)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)' }}
                      >★ Leave Review</button>
                    )}
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
          <button onClick={onReadAll} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, transition: 'background var(--transition)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >Mark all read</button>
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
      onMouseEnter={e => { if (!secondary) e.currentTarget.style.background = 'var(--accent)'; else e.currentTarget.style.borderColor = 'var(--ink)' }}
      onMouseLeave={e => { if (!secondary) e.currentTarget.style.background = 'var(--ink)'; else e.currentTarget.style.borderColor = 'var(--border)' }}
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
