import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import SwapModal from '../components/SwapModal'
import Toast from '../components/Toast'
import StarRating from '../components/StarRating'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getItemById, getUserById, getUserReviews,
    currentUser, items, getFairness, getMyItems, getTrustScore,
  } = useApp()

  const [showSwap,        setShowSwap]        = useState(false)
  const [toast,           setToast]           = useState(null)
  const [showAllReviews,  setShowAllReviews]  = useState(false)

  // FIX: getUserReviews is async — store result in state, never call inline
  const [ownerReviews, setOwnerReviews] = useState([])

  const item   = getItemById(id)
  const ownerId = item?.owner?.id ?? item?.owner_id ?? item?.userId ?? null

  useEffect(() => {
    if (ownerId) {
      getUserReviews(ownerId)
        .then(data => setOwnerReviews(Array.isArray(data) ? data : []))
        .catch(() => setOwnerReviews([]))
    }
  }, [ownerId])

  if (!item) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Item not found
        </h2>
        <Link to="/explorer" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Explorer
        </Link>
      </div>
    </div>
  )

  // FIX: owner is now item.owner (nested object from API, already normalized)
  const owner  = item.owner && typeof item.owner === 'object' ? item.owner : getUserById(ownerId)
  const isOwn  = currentUser?.id === ownerId

  // FIX: use normalized camelCase fields (available set by normalizeItem)
  const myItems = getMyItems().filter(i => i.available !== false && i.isAvailable !== false)

  // FIX: similar items — compare owner.id not item.userId
  const similar = items.filter(i => {
    const iOwnerId = i.owner?.id ?? i.owner_id ?? i.userId
    return i.id !== item.id
      && i.category === item.category
      && iOwnerId !== currentUser?.id
      && i.available !== false
  }).slice(0, 3)

  const bestMatch = !isOwn && myItems.length > 0
    ? myItems.reduce((best, i) =>
        Math.abs(1 - Number(i.value) / Number(item.value)) <
        Math.abs(1 - Number(best?.value || 0) / Number(item.value)) ? i : best, null)
    : null
  const fairness = bestMatch ? getFairness(bestMatch.value, item.value) : null
  const trust    = owner ? getTrustScore(owner) : null

  const conditionCfg = {
    Excellent: { color: '#059669', bg: 'rgba(16,185,129,0.1)' },
    Good:      { color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
    Fair:      { color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
  }[item.condition] || { color: 'var(--muted)', bg: 'var(--surface)' }

  const displayedReviews = showAllReviews ? ownerReviews : ownerReviews.slice(0, 3)

  // Safe owner field access (AppContext normalizes these, but extra safety here)
  const ownerFirst    = owner?.firstName || owner?.first_name || ''
  const ownerLast     = owner?.lastName  || owner?.last_name  || ''
  const ownerPhoto    = owner?.photo     || owner?.avatar     || null
  const ownerInitials = `${ownerFirst[0] || '?'}${ownerLast[0] || ''}`.toUpperCase()
  const ownerReviewCount = owner?.reviewCount ?? owner?.review_count ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ padding: '14px 5%', maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <Link to="/explorer" style={{ color: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}
          >Explorer</Link>
          <span>›</span>
          <span>{item.category}</span>
          <span>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{item.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 5% 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(24px,5vw,56px)', alignItems: 'start' }}>

          {/* ── Image panel ── */}
          <div>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface-2)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', position: 'relative' }}>
              {item.image
                ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 'clamp(64px,12vw,96px)' }}>{item.emoji || '📦'}</span>
              }
              <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'var(--lime)', color: 'var(--ink)', padding: '6px 14px', borderRadius: 10, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, boxShadow: 'var(--shadow-glow-lime)' }}>
                {Number(item.value).toLocaleString()} FCFA
              </div>
            </div>

            {item.available === false && (
              <div style={{ marginTop: 12, padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>✓ This item has been swapped</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <Chip>{item.category}</Chip>
              <Chip bg={conditionCfg.bg} color={conditionCfg.color}>{item.condition}</Chip>
              {item.available === false && <Chip>Unavailable</Chip>}
            </div>
          </div>

          {/* ── Detail panel ── */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px,4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18, color: 'var(--ink)' }}>
              {item.name}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--border)' }}>
              {item.description}
            </p>

            {/* Owner block */}
            {owner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {ownerPhoto
                    ? <img src={ownerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : ownerInitials
                  }
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {isOwn ? 'You (this is your item)' : `${ownerFirst} ${ownerLast}`.trim()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <StarRating value={Number(owner.stars) || 0} size={13} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {owner.stars > 0 ? `${owner.stars} · ${ownerReviewCount} reviews` : 'New member'}
                    </span>
                    {trust && trust.score > 0 && (
                      <span style={{ padding: '2px 9px', borderRadius: 'var(--radius-pill)', fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-display)', background: trust.color + '15', color: trust.color, border: `1px solid ${trust.color}30` }}>
                        {trust.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fairness preview */}
            {fairness && bestMatch && (
              <div style={{ padding: '13px 16px', borderRadius: 'var(--radius-sm)', background: fairness.bg, border: `1px solid ${fairness.color}28`, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 22 }}>{fairness.icon}</span>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: fairness.color }}>{fairness.label} exchange</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>with your "{bestMatch.name}"</span>
                </div>
              </div>
            )}

            {/* CTA */}
            {!isOwn && item.available !== false ? (
              <button onClick={() => setShowSwap(true)} style={{
                width: '100%', padding: '15px', borderRadius: 'var(--radius-sm)',
                background: 'var(--ink)', color: 'var(--lime)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s var(--ease-spring), box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              >⇄ Propose a Swap</button>
            ) : isOwn ? (
              <Link to="/my-space?tab=products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--muted)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-md)'; e.currentTarget.style.color = 'var(--muted)' }}
              >Manage in My Space →</Link>
            ) : null}

            <button onClick={() => navigate(-1)} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--muted)', border: '1.5px solid var(--border)', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
            >← Go Back</button>
          </div>
        </div>

        {/* Owner reviews */}
        {ownerReviews.length > 0 && !isOwn && (
          <div style={{ marginTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(18px,2.5vw,24px)', letterSpacing: '-0.02em' }}>
                Reviews for {ownerFirst} ({ownerReviews.length})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarRating value={Number(owner?.stars) || 0} size={16} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{owner?.stars}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {displayedReviews.map(r => {
                // FIX: author is a nested object from API
                const author = r.author && typeof r.author === 'object' ? r.author : getUserById(r.author)
                const aFirst    = author?.firstName || author?.first_name || ''
                const aLast     = author?.lastName  || author?.last_name  || ''
                const aPhoto    = author?.photo     || author?.avatar     || null
                const aInitials = `${aFirst[0] || '?'}${aLast[0] || ''}`.toUpperCase()
                return (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 'var(--radius-sm)', padding: '16px 18px', border: '1px solid var(--border)', transition: 'transform 0.2s var(--ease), box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {aPhoto ? <img src={aPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : aInitials}
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>{aFirst} {aLast}</span>
                      </div>
                      <StarRating value={r.stars} size={13} />
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, fontStyle: 'italic' }}>"{r.comment}"</p>}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{r.created_at || r.createdAt || ''}</div>
                  </div>
                )
              })}
            </div>
            {ownerReviews.length > 3 && (
              <button onClick={() => setShowAllReviews(s => !s)} style={{ marginTop: 18, padding: '10px 22px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--border-md)', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-md)'; e.currentTarget.style.color = 'var(--muted)' }}
              >{showAllReviews ? 'Show less ↑' : `Show all ${ownerReviews.length} reviews ↓`}</button>
            )}
          </div>
        )}

        {/* Similar items */}
        {similar.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(18px,2.5vw,24px)', letterSpacing: '-0.02em', marginBottom: 24 }}>
              More in {item.category}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
              {similar.map(s => (
                <Link to={`/item/${s.id}`} key={s.id} style={{ display: 'block' }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {s.image
                      ? <img src={s.image} alt={s.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      : <div style={{ height: 140, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{s.emoji || '📦'}</div>
                    }
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.name}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--teal)' }}>{Number(s.value).toLocaleString()} FCFA</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSwap && <SwapModal targetItem={item} onClose={() => setShowSwap(false)} onSuccess={() => setToast({ message: 'Swap proposal sent!', type: 'success' })} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function Chip({ children, color, bg }) {
  return (
    <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)', background: bg || 'var(--surface-2)', color: color || 'var(--muted)', border: `1px solid ${bg ? 'transparent' : 'var(--border)'}` }}>
      {children}
    </span>
  )
}