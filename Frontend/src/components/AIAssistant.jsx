import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

// ── Floating AI Swap Assistant for Explorer ───────────────────────────────────
export function AISwapAssistant() {
  const { items, currentUser } = useApp()
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi ${currentUser?.firstName}! 👋 I'm your Swappit AI assistant. Tell me what you have or what you're looking for, and I'll help you find the best swap options on the platform.` }
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const availableItems = items.filter(i => i.available !== false && i.userId !== currentUser?.id)
  const itemsSummary = availableItems.map(i =>
    `- "${i.name}" (${i.category}, ${i.condition}, ${i.value?.toLocaleString()} FCFA) — owned by user`
  ).join('\n')

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a helpful assistant for Swappit, a peer-to-peer item exchange platform based in Cameroon. 
Users swap items instead of buying/selling. All values are in FCFA (West African CFA franc).

Current available items on the platform:
${itemsSummary || 'No items currently available.'}

Your job:
- Help users find swap matches for items they have
- Suggest which items from the platform would be a fair exchange
- Explain the fairness indicator (Balanced = within 8% value, Acceptable = within 28%, Unfair = beyond that)
- Keep responses concise and friendly, max 3-4 sentences
- Always mention FCFA values when discussing items
- If no good match exists, say so honestly and suggest they check back later
- Do NOT make up items that aren't in the list above`,
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0).map(m => ({
              role: m.role,
              content: m.text
            })),
            { role: 'user', content: userMsg }
          ]
        })
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const suggestions = [
    'What can I swap for electronics?',
    'Find me a fair match for a phone',
    'What items are under 50,000 FCFA?',
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 500,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'var(--ink)' : 'var(--accent)',
          color: '#fff', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(232,82,31,0.45)',
          transition: 'all 0.2s ease',
          border: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="AI Swap Assistant"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 500,
          width: 'min(380px, calc(100vw - 40px))',
          background: '#fff', borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex', flexDirection: 'column',
          animation: 'scaleIn 0.2s ease',
          transformOrigin: 'bottom right',
          maxHeight: '72vh',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--ink)', borderRadius: '20px 20px 0 0',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>✦</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>Swap AI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Powered by Claude · Always online</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--ink)' : 'var(--surface)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink)',
                  fontSize: 13, lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-muted)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (shown when only 1 message) */}
          {messages.length === 1 && (
            <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(send, 50) }} style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  fontSize: 11, fontWeight: 600, border: '1px solid rgba(232,82,31,0.2)',
                  transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)' }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about swaps, values, matches…"
              rows={1}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10, resize: 'none',
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5,
                transition: 'border-color var(--transition)',
                maxHeight: 80, overflowY: 'auto',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={send} disabled={!input.trim() || loading} style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
              color: '#fff', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>↑</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── AI Value Estimator (inline, used in MySpace add-item form) ─────────────────
export function AIValueEstimator({ itemName, description, category, onResult }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  const estimate = async () => {
    if (!itemName.trim()) { setError('Enter an item name first.'); return }
    setLoading(true); setResult(null); setError('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a pricing expert for second-hand goods in Cameroon. 
You estimate fair swap values in FCFA (West African CFA franc) for used items.
Consider the Cameroonian market, local purchasing power, and item condition.

Respond ONLY with a JSON object, no markdown, no explanation outside the JSON:
{
  "estimatedValue": <number in FCFA>,
  "range": { "min": <number>, "max": <number> },
  "suggestedCondition": "Excellent" | "Good" | "Fair",
  "reasoning": "<1-2 sentence explanation>",
  "tips": "<1 tip to get a better swap>"
}`,
          messages: [{
            role: 'user',
            content: `Item: ${itemName}\nCategory: ${category}\nDescription: ${description || 'No description provided'}\n\nEstimate the fair swap value for this item in the Cameroonian second-hand market.`
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResult(parsed)
    } catch (err) {
      setError('Could not estimate value. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    if (result) onResult({ value: result.estimatedValue, condition: result.suggestedCondition })
    setResult(null)
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result ? 12 : 0 }}>
        <button
          onClick={estimate}
          disabled={loading || !itemName.trim()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 'var(--radius-pill)',
            background: loading || !itemName.trim() ? 'var(--border)' : 'var(--accent-soft)',
            color: loading || !itemName.trim() ? 'var(--ink-muted)' : 'var(--accent)',
            border: '1.5px solid rgba(232,82,31,0.2)',
            fontSize: 12, fontWeight: 700,
            cursor: loading || !itemName.trim() ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { if (!loading && itemName.trim()) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { if (!loading && itemName.trim()) { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)' } }}
        >
          {loading
            ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> Estimating…</>
            : <>✦ AI Estimate Value</>
          }
        </button>
        {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
      </div>

      {result && (
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(232,82,31,0.04) 0%, rgba(232,82,31,0.08) 100%)',
          border: '1.5px solid rgba(232,82,31,0.2)',
          animation: 'scaleIn 0.2s ease',
        }}>
          {/* Value */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>AI Suggested Value</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--accent)' }}>
                {result.estimatedValue?.toLocaleString()} FCFA
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                Range: {result.range?.min?.toLocaleString()} – {result.range?.max?.toLocaleString()} FCFA
              </div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 'var(--radius-pill)',
              background: { Excellent: 'var(--green-soft)', Good: 'var(--orange-soft)', Fair: 'var(--red-soft)' }[result.suggestedCondition],
              color: { Excellent: 'var(--green)', Good: 'var(--orange)', Fair: 'var(--red)' }[result.suggestedCondition],
              fontSize: 11, fontWeight: 700,
            }}>{result.suggestedCondition} condition</div>
          </div>

          {/* Reasoning */}
          {result.reasoning && (
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(232,82,31,0.12)' }}>
              {result.reasoning}
            </p>
          )}

          {/* Tip */}
          {result.tips && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.55 }}>{result.tips}</p>
            </div>
          )}

          {/* Apply button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={apply} style={{
              flex: 1, padding: '9px', borderRadius: 8,
              background: 'var(--ink)', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              transition: 'background var(--transition)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
            >Apply This Estimate →</button>
            <button onClick={() => setResult(null)} style={{
              padding: '9px 14px', borderRadius: 8,
              border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)',
            }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  )
}
