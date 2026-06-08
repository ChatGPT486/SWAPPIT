import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import SwapModal from '../components/SwapModal'
import Toast from '../components/Toast'
import { AISwapAssistant } from '../components/AIAssistant'
import LiveMap from '../components/LiveMap'

const CATS = ['All','Electronics','Clothing','Furniture','Books','Music','Sports','Other']

export default function Explorer() {
  const { items, getSuggestions, currentUser } = useApp()
  const [search,      setSearch]      = useState('')
  const [cat,         setCat]         = useState('All')
  const [sort,        setSort]        = useState('recent')
  const [swapTarget,  setSwapTarget]  = useState(null)
  const [toast,       setToast]       = useState(null)
  const [showSugg,    setShowSugg]    = useState(false)
  const [showMap,     setShowMap]     = useState(false)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    getSuggestions().then(setSuggestions).catch(() => setSuggestions([]))
  }, [])

  const filtered = items
    .filter(item => {
      const available = item.available !== false && item.isAvailable !== false
      if (!available) return false
      const ms = search
        ? (item.name + ' ' + (item.description || '')).toLowerCase().includes(search.toLowerCase())
        : true
      const mc = cat === 'All' || item.category === cat
      return ms && mc
    })
    .sort((a, b) => {
      if (sort === 'recent')     return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
      if (sort === 'value-asc')  return Number(a.value) - Number(b.value)
      if (sort === 'value-desc') return Number(b.value) - Number(a.value)
      return 0
    })

  const available = items.filter(i => i.available !== false && i.isAvailable !== false).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Page header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                Explorer
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', marginRight: 6, boxShadow: '0 0 6px var(--teal)' }} />
                {available} items available for swap
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Live Map toggle */}
              <button onClick={() => setShowMap(s => !s)} style={{
                padding: '10px 18px', borderRadius: 'var(--radius-pill)',
                background: showMap ? 'var(--ink)' : 'transparent',
                color: showMap ? 'var(--lime)' : 'var(--ink)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 7,
                border: showMap ? 'none' : '1.5px solid var(--border-md)',
                transition: 'all 0.2s var(--ease)', cursor: 'pointer',
              }}>
                🌍 {showMap ? 'Hide Live Map' : 'Show Live Map'}
              </button>
              {suggestions.length > 0 && (
                <button onClick={() => setShowSugg(s => !s)} style={{
                  padding: '10px 18px', borderRadius: 'var(--radius-pill)',
                  background: showSugg ? 'var(--ink)' : 'transparent',
                  color: showSugg ? 'var(--lime)' : 'var(--ink)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 7,
                  border: showSugg ? 'none' : '1.5px solid var(--border-md)',
                  transition: 'all 0.2s var(--ease)', cursor: 'pointer',
                }}>
                  💡 {suggestions.length} Smart Suggestions
                </button>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '12px 0' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items…"
                style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-md)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
              />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-md)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              <option value="recent">Most Recent</option>
              <option value="value-asc">Value: Low → High</option>
              <option value="value-desc">Value: High → Low</option>
            </select>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 14 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? 'pill--active' : ''}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '28px 5%' }}>

        {/* Live Map */}
        {showMap && (
          <div style={{ marginBottom: 28, animation: 'scaleIn 0.25s var(--ease)' }}>
            <LiveMap />
          </div>
        )}

        {/* Smart Suggestions */}
        {showSugg && suggestions.length > 0 && (
          <div style={{ background: 'var(--ink)', borderRadius: 'var(--radius)', padding: 'clamp(18px,3vw,28px)', marginBottom: 28, animation: 'scaleIn 0.2s var(--ease)' }}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--lime)', marginBottom: 4 }}>💡 Suggested for You</h2>
              <p style={{ fontSize: 12, color: 'rgba(245,244,240,0.45)' }}>Best value-matched swaps based on your items</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {suggestions.slice(0, 3).map((s, i) => (
                <SuggCard key={i} s={s} onSwap={() => setSwapTarget(s.their_item || s.theirItem)} />
              ))}
            </div>
          </div>
        )}

        {/* Item Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>No items found</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Try a different search or category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(252px, 1fr))', gap: 18 }}>
            {filtered.map((item, i) => {
              const ownerId = item.owner?.id ?? item.owner_id ?? item.userId
              const isOwn   = ownerId === currentUser?.id
              return (
                <div key={item.id}  className="reveal revealed" style={{ transitionDelay: `${i * 35}ms` }}>
                  <ItemCard item={item} showActions={!isOwn} isOwn={isOwn} onSwap={isOwn ? null : setSwapTarget} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {swapTarget && (
        <SwapModal
          targetItem={swapTarget}
          onClose={() => setSwapTarget(null)}
          onSuccess={() => setToast({ message: 'Swap proposal sent! The owner will be notified.', type: 'success' })}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <AISwapAssistant />
    </div>
  )
}

function SuggCard({ s, onSwap }) {
  const myItem    = s.my_item    || s.myItem
  const theirItem = s.their_item || s.theirItem
  const fairness  = s.fairness   || {}
  const fairnessStyle = {
    balanced:   { color: '#059669', bg: 'rgba(16,185,129,0.12)' },
    acceptable: { color: '#d97706', bg: 'rgba(245,158,11,0.12)' },
    unfair:     { color: '#dc2626', bg: 'rgba(239,68,68,0.12)' },
  }[fairness.tier] || { color: 'var(--muted)', bg: 'var(--surface)' }

  return (
    <div style={{ background: 'rgba(245,244,240,0.07)', borderRadius: 'var(--radius-sm)', padding: 14, border: '1px solid rgba(245,244,240,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ItemChip item={myItem} />
        <div style={{ fontSize: 18, color: 'var(--lime)', fontWeight: 800, flexShrink: 0 }}>⇄</div>
        <ItemChip item={theirItem} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: fairnessStyle.bg, color: fairnessStyle.color, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {fairness.label || 'Match'}
        </span>
        <button onClick={onSwap} style={{ padding: '7px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--lime)', color: 'var(--ink)', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)', border: 'none', cursor: 'pointer', transition: 'transform 0.2s var(--ease-spring)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >Propose Swap</button>
      </div>
    </div>
  )
}

function ItemChip({ item }) {
  if (!item) return null
  return (
    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(245,244,240,0.06)', borderRadius: 8 }}>
      <div style={{ fontSize: 16, marginBottom: 4 }}>{item.emoji || '📦'}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, lineHeight: 1.2, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
      <div style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 700 }}>{Number(item.value).toLocaleString()} F</div>
    </div>
  )
}