import { useState } from 'react'
import StarRating from './StarRating'

export default function ReviewModal({ partner, exchangeId, onSubmit, onClose }) {
  const [stars,   setStars]   = useState(0)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(0)

  // FIX: partner may come from API with snake_case OR already normalized camelCase
  const firstName = partner?.firstName || partner?.first_name || ''
  const lastName  = partner?.lastName  || partner?.last_name  || ''
  const photo     = partner?.photo     || partner?.avatar     || null
  // FIX: guard initials — never do undefined[0]
  const initials  = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()

  const labels = ['', 'Poor — Scammer risk', 'Fair — Be cautious', 'Good — Reliable', 'Great — Trustworthy', 'Excellent — Highly trusted']

  const handleSubmit = () => {
    if (!stars) return
    onSubmit({
      exchangeId,
      recipientId: partner?.id,   // FIX: renamed from targetUserId → recipientId to match AppContext.addReview
      stars,
      comment,
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-scale" style={{ maxWidth: 440, borderRadius: 20 }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Leave a Review</h2>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface)', color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            How was your experience swapping with{' '}
            <strong style={{ color: 'var(--ink)' }}>{firstName} {lastName}</strong>?
          </p>
        </div>

        <div style={{ padding: 24 }}>
          {/* Partner avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--surface)', borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {photo
                ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{firstName} {lastName}</div>
              <StarRating value={Number(partner?.stars) || 0} size={13} />
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
                    fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                    color: s <= (hovered || stars) ? '#f59e0b' : '#e5e7eb',
                    transition: 'all 0.12s ease',
                    transform: s <= (hovered || stars) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >★</button>
              ))}
            </div>
            {(hovered || stars) > 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, color: ['','var(--error)','var(--warning)','var(--warning)','var(--success)','var(--success)'][hovered || stars] }}>
                {labels[hovered || stars]}
              </div>
            )}
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Your comment (optional)
            </label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Was the item as described? Was the person reliable? Share your experience…"
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.6, transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--muted)', background: 'transparent', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >Skip</button>
            <button onClick={handleSubmit} disabled={!stars} style={{
              flex: 2, padding: '11px', borderRadius: 10,
              background: stars ? 'var(--ink)' : 'var(--border)',
              color: stars ? 'var(--lime)' : 'var(--muted)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              border: 'none',
              transition: 'all 0.2s', cursor: stars ? 'pointer' : 'not-allowed',
            }}
              onMouseEnter={e => { if (stars) { e.currentTarget.style.background = 'var(--ink-2)' } }}
              onMouseLeave={e => { if (stars) { e.currentTarget.style.background = 'var(--ink)' } }}
            >Submit Review ★</button>
          </div>
        </div>
      </div>
    </div>
  )
}