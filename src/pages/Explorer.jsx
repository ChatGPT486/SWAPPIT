import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import SwapModal from '../components/SwapModal'
import Toast from '../components/Toast'
import { AISwapAssistant } from '../components/AIAssistant'

const CATS = ['All','Electronics','Clothing','Furniture','Books','Music','Sports','Other']

export default function Explorer() {
  const { items, getSuggestions, currentUser } = useApp()
  const [search, setSearch]     = useState('')
  const [cat, setCat]           = useState('All')
  const [sort, setSort]         = useState('recent')
  const [swapTarget, setSwapTarget] = useState(null)
  const [toast, setToast]       = useState(null)
  const [showSugg, setShowSugg] = useState(false)

  const suggestions = getSuggestions()

  const filtered = items
    .filter(item => {
      const ms = search ? (item.name + ' ' + item.description).toLowerCase().includes(search.toLowerCase()) : true
      const mc = cat === 'All' || item.category === cat
      return ms && mc
    })
    .sort((a, b) => {
      if (sort === 'recent')     return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'value-asc')  return a.value - b.value
      if (sort === 'value-desc') return b.value - a.value
      return 0
    })

  const available = items.filter(i => i.available !== false).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '24px 5%' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(20px, 2.5vw, 28px)', letterSpacing: '-0.02em' }}>Explorer</h1>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 3 }}>{available} items available for swap</p>
            </div>
            {suggestions.length > 0 && (
              <button onClick={() => setShowSugg(s => !s)} style={{
                padding: '9px 16px', borderRadius: 'var(--radius-pill)',
                background: showSugg ? 'var(--accent)' : 'var(--accent-soft)',
                color: showSugg ? '#fff' : 'var(--accent)',
                fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1.5px solid rgba(232,82,31,0.2)',
                transition: 'all var(--transition)',
              }}>
                💡 {suggestions.length} Suggestions
              </button>
            )}
          </div>

          {/* Search + sort */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, descriptions…"
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 14, transition: 'border-color var(--transition)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
              <option value="recent">Most Recent</option>
              <option value="value-asc">Value: Low → High</option>
              <option value="value-desc">Value: High → Low</option>
            </select>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: '6px 15px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                background: cat === c ? 'var(--ink)' : 'transparent',
                color: cat === c ? '#fff' : 'var(--ink-muted)',
                border: `1.5px solid ${cat === c ? 'var(--ink)' : 'var(--border)'}`,
                transition: 'all var(--transition)',
              }}
                onMouseEnter={e => { if (cat !== c) { e.currentTarget.style.borderColor = 'var(--ink-muted)'; e.currentTarget.style.color = 'var(--ink)' } }}
                onMouseLeave={e => { if (cat !== c) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)' } }}
              >{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '28px 5%' }}>

        {/* Smart Suggestions */}
        {showSugg && suggestions.length > 0 && (
          <div style={{ background: 'var(--accent-soft)', border: '1.5px solid rgba(232,82,31,0.18)', borderRadius: 'var(--radius)', padding: 'clamp(16px, 3vw, 24px)', marginBottom: 28, animation: 'scaleIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>💡 Suggested for You</h2>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>Best value-matched swaps based on your items</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {suggestions.slice(0, 3).map((s, i) => (
                <SuggCard key={i} s={s} onSwap={() => setSwapTarget(s.theirItem)} />
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--ink)', marginBottom: 6 }}>No items found</h3>
            <p style={{ fontSize: 14 }}>Try a different search or category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 18 }}>
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} showActions onSwap={setSwapTarget} />
            ))}
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
  const fc = { balanced:'var(--green)', acceptable:'var(--orange)', unfair:'var(--red)' }
  const fb = { balanced:'var(--green-soft)', acceptable:'var(--orange-soft)', unfair:'var(--red-soft)' }
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid rgba(232,82,31,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ItemChip item={s.myItem} />
        <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>⇄</div>
        <ItemChip item={s.theirItem} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: fb[s.fairness], color: fc[s.fairness], fontSize: 11, fontWeight: 700 }}>
          {s.fairness.charAt(0).toUpperCase() + s.fairness.slice(1)}
        </span>
        <button onClick={onSwap} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--ink)', color: '#fff',
          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
          transition: 'background var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
        >Propose Swap</button>
      </div>
    </div>
  )
}

function ItemChip({ item }) {
  return (
    <div style={{ flex: 1, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8 }}>
      <div style={{ fontSize: 16, marginBottom: 3 }}>{item.emoji || '📦'}</div>
      <div style={{ fontWeight: 600, fontSize: 11, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{item.value?.toLocaleString()} F</div>
    </div>
  )
}
