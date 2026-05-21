import { useState } from 'react'
import StarRating from './StarRating'

export default function ReviewModal({ partner, exchangeId, onSubmit, onClose }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(0)

  const labels = ['', 'Poor — Scammer risk', 'Fair — Be cautious', 'Good — Reliable', 'Great — Trustworthy', 'Excellent — Highly trusted']

  const handleSubmit = () => {
    if (!stars) return
    onSubmit({ targetUserId: partner.id, exchangeId, stars, comment })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.15s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Leave a Review</h2>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface)', color: 'var(--ink-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 }}>
            How was your experience swapping with <strong style={{ color: 'var(--ink)' }}>{partner.firstName} {partner.lastName}</strong>?
          </p>
        </div>

        <div style={{ padding: 24 }}>
          {/* Partner avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--surface)', borderRadius: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {partner.photo
                ? <img src={partner.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : `${partner.firstName[0]}${partner.lastName[0]}`
              }
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{partner.firstName} {partner.lastName}</div>
              <StarRating value={partner.stars || 0} size={13} />
            </div>
          </div>

          {/* Star selector */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onClick={() => setStars(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    fontSize: 36,
                    color: s <= (hovered || stars) ? '#f59e0b' : '#e5e7eb',
                    transition: 'all 0.12s ease',
                    transform: s <= (hovered || stars) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >★</button>
              ))}
            </div>
            {(hovered || stars) > 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, color: ['','var(--red)','var(--orange)','var(--orange)','var(--green)','var(--green)'][hovered || stars] }}>
                {labels[hovered || stars]}
              </div>
            )}
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your comment (optional)</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Was the item as described? Was the person reliable? Share your experience…"
              rows={3}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 10, border: '1.5px solid var(--border)',
                background: 'var(--surface)', fontSize: 14,
                resize: 'vertical', fontFamily: 'var(--font-body)',
                lineHeight: 1.6, transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--ink-muted)', transition: 'border-color var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >Skip</button>
            <button onClick={handleSubmit} disabled={!stars} style={{
              flex: 2, padding: '11px', borderRadius: 10,
              background: stars ? 'var(--ink)' : 'var(--border)',
              color: stars ? '#fff' : 'var(--ink-muted)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              transition: 'all var(--transition)', cursor: stars ? 'pointer' : 'not-allowed',
            }}
              onMouseEnter={e => { if (stars) e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { if (stars) e.currentTarget.style.background = 'var(--ink)' }}
            >Submit Review ★</button>
          </div>
        </div>
      </div>
    </div>
  )
}
