import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { estimateValue, swapChat } from '../engine/SwapEngine'

// ── Floating Swap Chat Assistant ───────────────────────────────────────────────
export function AISwapAssistant() {
  // FIX: removed getAllUsers() — it doesn't exist. Use 'users' array from context directly.
  const { items, currentUser, getMyItems, users } = useApp()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)

  // FIX: compare item.owner.id (nested object from API) not item.userId
  const availableItems = items.filter(i => {
    const isAvail = i.available !== false && i.is_available !== false
    const ownerId = i.owner?.id ?? i.owner_id ?? i.userId
    return isAvail && ownerId !== currentUser?.id
  })
  const myItems  = getMyItems()
  const allUsers = users  // FIX: just use the users array directly

  useEffect(() => {
    if (open && messages.length === 0) {
      try {
        const response = swapChat('hi', availableItems, myItems, allUsers)
        setMessages([{ role: 'assistant', ...response }])
      } catch {
        setMessages([{ role: 'assistant', text: 'Hi! I can help you find swap matches and estimate values. What are you looking for?', suggestions: ['Show me matches', 'Estimate a value', 'How does swapping work?'] }])
      }
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setLoading(true)
    setTimeout(() => {
      try {
        const response = swapChat(userText, availableItems, myItems, allUsers)
        setMessages(prev => [...prev, { role: 'assistant', ...response }])
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I couldn\'t process that. Try asking about swap matches or item values!', suggestions: [] }])
      }
      setLoading(false)
    }, 320)
  }

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 500,
        width: 56, height: 56, borderRadius: '50%',
        background: open ? 'var(--ink)' : 'var(--coral)',
        color: open ? 'var(--lime)' : '#fff',
        fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 28px rgba(255,85,51,0.4)',
        transition: 'all 0.25s var(--ease-spring)',
        border: 'none', cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Swap Assistant"
      >
        <span style={{ transition: 'transform 0.3s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>
          {open ? '✕' : '✦'}
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 500,
          width: 'min(380px, calc(100vw - 40px))',
          background: '#fff', borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          animation: 'scaleIn 0.2s var(--ease)',
          transformOrigin: 'bottom right',
          maxHeight: '72vh',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', background: 'var(--ink)', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>Swap Assistant</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
                Powered by SwapEngine · Always offline
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '86%', padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user' ? 'var(--ink)' : 'var(--surface)',
                    color: m.role === 'user' ? 'var(--lime)' : 'var(--ink)',
                    fontSize: 13, lineHeight: 1.65,
                    border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    whiteSpace: 'pre-line',
                  }}>
                    {renderMarkdown(m.text)}
                  </div>
                </div>
                {m.role === 'assistant' && m.suggestions?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, paddingLeft: 4 }}>
                    {m.suggestions.map((s, si) => (
                      <button key={si} onClick={() => send(s)} style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255,85,51,0.08)', color: 'var(--coral)',
                        fontSize: 11, fontWeight: 700,
                        border: '1px solid rgba(255,85,51,0.2)',
                        transition: 'all 0.15s', cursor: 'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--coral)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,85,51,0.08)'; e.currentTarget.style.color = 'var(--coral)' }}
                      >{s}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted)', animation: `pulse 1s ease ${i * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about swaps, values, fairness…"
              rows={1}
              style={{ flex: 1, padding: '9px 13px', borderRadius: 12, resize: 'none', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5, maxHeight: 76 }}
              onFocus={e => e.target.style.borderColor = 'var(--coral)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{
              width: 38, height: 38, borderRadius: '50%',
              background: input.trim() && !loading ? 'var(--ink)' : 'var(--border)',
              color: input.trim() && !loading ? 'var(--lime)' : 'var(--muted)',
              fontSize: 16, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              border: 'none',
            }}>↑</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── AI Value Estimator (used in MySpace add-item form) ──────────────────────
export function AIValueEstimator({ itemName, description, category, onResult }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  const estimate = () => {
    if (!itemName?.trim()) return
    setLoading(true); setResult(null)
    setTimeout(() => {
      try {
        const r = estimateValue(itemName, description, category, 'Good')
        setResult(r)
      } catch { setResult(null) }
      setLoading(false)
    }, 400)
  }

  const apply = () => {
    if (result) onResult({ value: result.estimatedValue, condition: result.suggestedCondition })
    setResult(null)
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={estimate} disabled={loading || !itemName?.trim()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 'var(--radius-pill)',
          background: loading || !itemName?.trim() ? 'var(--border)' : 'rgba(255,85,51,0.08)',
          color: loading || !itemName?.trim() ? 'var(--muted)' : 'var(--coral)',
          border: '1.5px solid rgba(255,85,51,0.2)',
          fontSize: 12, fontWeight: 700,
          cursor: loading || !itemName?.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}>
          {loading
            ? <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Estimating…</>
            : <>✦ Estimate Value</>
          }
        </button>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>SwapEngine · no internet needed</span>
      </div>

      {result && (
        <div style={{ marginTop: 12, padding: '16px 18px', borderRadius: 14, background: 'rgba(255,85,51,0.04)', border: '1.5px solid rgba(255,85,51,0.15)', animation: 'scaleIn 0.2s var(--ease)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Suggested Value</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--coral)' }}>
                {result.estimatedValue.toLocaleString()} FCFA
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Range: {result.range?.min.toLocaleString()} – {result.range?.max.toLocaleString()} FCFA
              </div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, background: result.confidence === 'high' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: result.confidence === 'high' ? '#059669' : '#d97706' }}>
              {result.confidence === 'high' ? '✓ High confidence' : '~ Medium confidence'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            {result.reasoning}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={apply} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              Apply This Value →
            </button>
            <button onClick={() => setResult(null)} style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', background: 'transparent' }}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function renderMarkdown(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}