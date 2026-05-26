import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import StarRating from './StarRating'

export default function ItemCard({ item, showActions = false, onSwap, compact = false }) {
  const { getUserById, currentUser } = useApp()
  const owner = getUserById(item.userId)
  const isOwn = currentUser?.id === item.userId

  const conditionColor = { Excellent: 'var(--green)', Good: 'var(--orange)', Fair: 'var(--red)' }[item.condition] || 'var(--ink-muted)'

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflow: 'hidden',
      transition: 'transform var(--transition), box-shadow var(--transition)',
      opacity: item.available === false ? 0.58 : 1,
      position: 'relative',
    }}
      onMouseEnter={e => { if (item.available !== false) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Image */}
      <Link to={`/item/${item.id}`}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: compact ? 140 : 176, objectFit: 'cover' }} />
        ) : (
          <div style={{
            height: compact ? 140 : 176,
            background: 'linear-gradient(145deg, #f1f3f7 0%, #e8eaf0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 46 : 60,
          }}>{item.emoji || '📦'}</div>
        )}
      </Link>

      {item.available === false && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(17,19,24,0.75)', color: '#fff',
          padding: '3px 10px', borderRadius: 'var(--radius-pill)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        }}>SWAPPED ✓</div>
      )}

      <div style={{ padding: compact ? '12px 14px' : '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
          <Link to={`/item/${item.id}`}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: compact ? 14 : 15, color: 'var(--ink)', lineHeight: 1.25 }}
              className="clamp-2"
            >{item.name}</h3>
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 12 : 14, color: 'var(--accent)', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {item.value?.toLocaleString()} <span style={{ fontSize: 10 }}>FCFA</span>
          </span>
        </div>

        {!compact && (
          <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 10 }} className="clamp-2">
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: showActions ? 10 : 0 }}>
          <Chip>{item.category}</Chip>
          <Chip color={conditionColor}>{item.condition}</Chip>
        </div>

        {!compact && owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
              color: '#fff', fontSize: 9, fontWeight: 700,
              fontFamily: 'var(--font-display)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {owner.photo
                ? <img src={owner.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : `${owner.firstName[0]}${owner.lastName[0]}`
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                {isOwn ? 'You' : `${owner.firstName} ${owner.lastName}`}
              </div>
              {owner.stars > 0 && <StarRating value={owner.stars} size={10} />}
            </div>
          </div>
        )}

        {showActions && item.available !== false && !isOwn && (
          <button onClick={() => onSwap?.(item)} style={{
            width: '100%', padding: '9px', borderRadius: 8, marginTop: 10,
            background: 'var(--ink)', color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'background var(--transition)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
          >⇄ Propose Swap</button>
        )}
        {showActions && isOwn && (
          <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>Your item</div>
        )}
      </div>
    </div>
  )
}

function Chip({ children, color }) {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 'var(--radius-pill)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
      background: color ? `${color}14` : 'var(--surface)',
      color: color || 'var(--ink-muted)',
      border: `1px solid ${color ? `${color}28` : 'var(--border)'}`,
    }}>{children}</span>
  )
}
