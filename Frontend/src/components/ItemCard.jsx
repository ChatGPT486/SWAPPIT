import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import StarRating from './StarRating'

export default function ItemCard({ item, showActions = false, onSwap, compact = false, isOwn: isOwnProp }) {
  const { currentUser } = useApp()

  // FIX: Django API returns item.owner as a nested object {id, first_name, last_name, ...}
  // Old code used item.userId and getUserById() — those don't exist with the real API
  const owner = item.owner && typeof item.owner === 'object' ? item.owner : null
  const ownerId = owner?.id ?? item.owner_id ?? item.userId ?? null
  // Allow parent to override (Explorer passes isOwn directly to avoid re-computing)
  const isOwn   = isOwnProp !== undefined ? isOwnProp : (currentUser?.id === ownerId)

  // FIX: Django uses snake_case — handle both naming conventions
  const ownerFirstName = owner?.first_name || owner?.firstName || ''
  const ownerLastName  = owner?.last_name  || owner?.lastName  || ''
  const ownerInitials  = `${ownerFirstName[0] || ''}${ownerLastName[0] || ''}`.toUpperCase() || '?'
  const ownerPhoto     = owner?.photo || owner?.avatar || null

  // FIX: Django returns 'available', not 'is_available' (we alias both)
  const isAvailable = item.available !== false && item.is_available !== false

  const conditionStyles = {
    Excellent: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    Good:      { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
    Fair:      { bg: 'rgba(239,68,68,0.1)',  color: '#dc2626' },
  }
  const cStyle = conditionStyles[item.condition] || { bg: 'var(--surface)', color: 'var(--muted)' }

  return (
    <div className="card item-card" style={{ opacity: !isAvailable ? 0.6 : 1, position: 'relative' }}>
      {/* Image */}
      <Link to={`/item/${item.id}`} style={{ display: 'block', overflow: 'hidden', position: 'relative' }}>
        {item.image ? (
          <img className="item-image" src={item.image} alt={item.name}
            style={{ width: '100%', height: compact ? 148 : 184, objectFit: 'cover' }} />
        ) : (
          <div className="item-image" style={{
            height: compact ? 148 : 184,
            background: 'linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 48 : 64,
          }}>{item.emoji || '📦'}</div>
        )}
        {/* Value badge */}
        <div style={{
          position: 'absolute', right: 10, bottom: 10,
          background: 'var(--lime)', color: 'var(--ink)',
          padding: '4px 10px', borderRadius: 8,
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
          boxShadow: 'var(--shadow-glow-lime)',
        }}>{Number(item.value).toLocaleString()} FCFA</div>
      </Link>

      {!isAvailable && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'var(--ink)', color: 'var(--lime)',
          padding: '4px 12px', borderRadius: 'var(--radius-pill)',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
        }}>SWAPPED ✓</div>
      )}

      {isAvailable && isOwn && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(12,12,16,0.82)', color: 'var(--lime)',
          padding: '4px 12px', borderRadius: 'var(--radius-pill)',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
          backdropFilter: 'blur(4px)',
        }}>Your Item</div>
      )}

      <div style={{ padding: compact ? '12px 14px' : '14px 18px' }}>
        <Link to={`/item/${item.id}`}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 14 : 15,
            color: 'var(--ink)', lineHeight: 1.2, marginBottom: 8,
          }} className="clamp-2">{item.name}</h3>
        </Link>

        {!compact && (
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }} className="clamp-2">
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: (showActions || owner) ? 12 : 0 }}>
          <Chip>{item.category}</Chip>
          <Chip bg={cStyle.bg} color={cStyle.color}>{item.condition}</Chip>
        </div>

        {/* Owner row — clickable link to their public profile */}
        {!compact && owner && (
          <Link to={isOwn ? '/my-space' : `/user/${owner.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 10, textDecoration: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--ink)', color: 'var(--lime)',
              fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-display)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {ownerPhoto
                ? <img src={ownerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : ownerInitials
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {isOwn ? 'You' : `${ownerFirstName} ${ownerLastName}`.trim() || 'Unknown'}
              </div>
              {owner.stars > 0 && <StarRating value={Number(owner.stars)} size={10} />}
            </div>
            {!isOwn && <span style={{ fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>View →</span>}
          </Link>
        )}

        {showActions && isAvailable && !isOwn && (
          <button onClick={() => onSwap?.(item)} style={{
            width: '100%', marginTop: 12, padding: '11px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--ink)', color: 'var(--lime)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'transform 0.2s var(--ease-spring), box-shadow 0.2s',
            border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >⇄ Propose Swap</button>
        )}
        {showActions && isOwn && (
          <div style={{ textAlign: 'center', padding: '10px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
            Your item
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ children, bg, color }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 'var(--radius-pill)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
      fontFamily: 'var(--font-display)',
      background: bg || 'var(--surface)',
      color: color || 'var(--muted)',
      border: `1px solid ${bg ? 'transparent' : 'var(--border)'}`,
    }}>{children}</span>
  )
}