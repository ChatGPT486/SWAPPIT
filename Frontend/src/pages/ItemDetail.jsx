import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import SwapModal from '../components/SwapModal'
import Toast from '../components/Toast'
import StarRating from '../components/StarRating'
import ReviewModal from '../components/ReviewModal'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getItemById, getUserById, getUserReviews, currentUser, items, getFairness, getMyItems } = useApp()
  const [showSwap, setShowSwap]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const item = getItemById(id)
  if (!item) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 14 }}>Item not found</h2>
        <Link to="/explorer" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 15 }}>← Back to Explorer</Link>
      </div>
    </div>
  )

  const owner   = getUserById(item.userId)
  const isOwn   = currentUser?.id === item.userId
  const myItems = getMyItems().filter(i => i.available !== false)
  const ownerReviews = getUserReviews(item.userId)

  const similar = items.filter(i => i.id !== item.id && i.category === item.category && i.userId !== currentUser?.id && i.available !== false).slice(0, 3)

  const bestMatch = !isOwn && myItems.length > 0
    ? myItems.reduce((best, i) => Math.abs(1 - i.value / item.value) < Math.abs(1 - (best?.value || 0) / item.value) ? i : best, null)
    : null
  const fairness = bestMatch ? getFairness(bestMatch.value, item.value) : null

  const condColor = { Excellent: 'var(--green)', Good: 'var(--orange)', Fair: 'var(--red)' }[item.condition] || 'var(--ink-muted)'
  const displayedReviews = showAllReviews ? ownerReviews : ownerReviews.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ padding: '14px 5%', maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)', flexWrap: 'wrap' }}>
          <Link to="/explorer" style={{ color: 'var(--accent)', fontWeight: 500 }}>Explorer</Link>
          <span>›</span><span>{item.category}</span><span>›</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{item.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 5% 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(24px, 4vw, 52px)', alignItems: 'start' }}>

          {/* Image */}
          <div>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'linear-gradient(145deg, #f1f3f7, #e8eaf0)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              {item.image
                ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 'clamp(64px, 12vw, 96px)' }}>{item.emoji || '📦'}</span>
              }
            </div>
            {item.available === false && (
              <div style={{ marginTop: 12, padding: '12px', borderRadius: 10, background: 'var(--green-soft)', border: '1px solid rgba(22,163,74,0.2)', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>
                ✓ This item has been swapped
              </div>
            )}
          </div>

          {/* Detail */}
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <Chip>{item.category}</Chip>
              <Chip color={condColor}>{item.condition}</Chip>
              {item.available === false && <Chip color="var(--ink-muted)">Unavailable</Chip>}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3.5vw, 36px)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10 }}>
              {item.name}
            </h1>

            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--accent)', marginBottom: 20 }}>
              {item.value?.toLocaleString()} <span style={{ fontSize: '0.6em', fontWeight: 600, opacity: 0.7 }}>FCFA</span>
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-light)', marginBottom: 22, paddingBottom: 22, borderBottom: '1px solid var(--border)' }}>
              {item.description}
            </p>

            {/* Owner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px', background: 'var(--surface)', borderRadius: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {owner?.photo ? <img src={owner.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${owner?.firstName?.[0]}${owner?.lastName?.[0]}`}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {isOwn ? 'You (this is your item)' : `${owner?.firstName} ${owner?.lastName}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <StarRating value={owner?.stars || 0} size={13} />
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{owner?.stars > 0 ? `${owner.stars} · ${owner.reviewCount} review${owner.reviewCount !== 1 ? 's' : ''}` : 'New member'}</span>
                </div>
              </div>
            </div>

            {/* Fairness preview */}
            {fairness && bestMatch && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: fairness.bg, border: `1px solid ${fairness.color}28`, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 18 }}>{fairness.icon}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: fairness.color }}>{fairness.label} exchange</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 6 }}>with your "{bestMatch.name}"</span>
                </div>
              </div>
            )}

            {/* CTA */}
            {!isOwn && item.available !== false ? (
              <button onClick={() => setShowSwap(true)} style={{
                width: '100%', padding: '14px',
                borderRadius: 12, background: 'var(--ink)', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all var(--transition)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(232,82,31,0.32)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
              >⇄ Propose a Swap</button>
            ) : isOwn ? (
              <Link to="/my-space?tab=products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px', borderRadius: 12, border: '1.5px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink-muted)' }}>
                Manage in My Space →
              </Link>
            ) : null}

            <button onClick={() => navigate(-1)} style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'var(--ink-muted)', border: '1.5px solid var(--border)', transition: 'border-color var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >← Go Back</button>
          </div>
        </div>

        {/* Owner reviews */}
        {ownerReviews.length > 0 && !isOwn && (
          <div style={{ marginTop: 52 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>
              Reviews for {owner?.firstName} ({ownerReviews.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {displayedReviews.map(r => {
                const author = getUserById(r.authorId)
                return (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {author?.photo ? <img src={author.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${author?.firstName?.[0]}${author?.lastName?.[0]}`}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{author?.firstName} {author?.lastName}</span>
                      </div>
                      <StarRating value={r.stars} size={13} />
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>"{r.comment}"</p>}
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8 }}>{r.createdAt}</div>
                  </div>
                )
              })}
            </div>
            {ownerReviews.length > 3 && (
              <button onClick={() => setShowAllReviews(s => !s)} style={{ marginTop: 16, padding: '9px 20px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', transition: 'border-color var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >{showAllReviews ? 'Show less' : `Show all ${ownerReviews.length} reviews`}</button>
            )}
          </div>
        )}

        {/* Similar items */}
        {similar.length > 0 && (
          <div style={{ marginTop: 52 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>More in {item.category}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {similar.map(s => (
                <Link to={`/item/${s.id}`} key={s.id}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'transform var(--transition), box-shadow var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {s.image
                      ? <img src={s.image} alt={s.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      : <div style={{ height: 140, background: 'linear-gradient(145deg, #f1f3f7, #e8eaf0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{s.emoji || '📦'}</div>
                    }
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{s.value?.toLocaleString()} FCFA</div>
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

function Chip({ children, color }) {
  return (
    <span style={{ padding: '3px 11px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, background: color ? `${color}14` : 'var(--surface)', color: color || 'var(--ink-muted)', border: `1px solid ${color ? `${color}28` : 'var(--border)'}` }}>
      {children}
    </span>
  )
}
