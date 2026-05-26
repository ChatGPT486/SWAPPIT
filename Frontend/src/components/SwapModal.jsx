import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function SwapModal({ targetItem, onClose, onSuccess }) {
  const { getMyItems, proposeExchange, getFairness, currentUser } = useApp()
  const myItems = getMyItems().filter(i => i.available !== false)
  const [selectedId, setSelectedId] = useState(null)

  const selectedItem = myItems.find(i => i.id === selectedId)
  const fairness = selectedItem ? getFairness(selectedItem.value, targetItem.value) : null

  const handleSubmit = () => {
    if (!selectedId) return
    proposeExchange({ offeredItemId: selectedId, requestedItemId: targetItem.id })
    onSuccess?.()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.15s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius)',
        width: '100%', maxWidth: 540,
        boxShadow: 'var(--shadow-lg)',
        animation: 'scaleIn 0.2s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
              Propose a Swap
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
              Choose one of your items to offer in exchange
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', color: 'var(--ink-muted)',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background var(--transition)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Target item */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              You want
            </p>
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <span style={{ fontSize: 32 }}>{targetItem.emoji || '📦'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{targetItem.name}</div>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                  {targetItem.value?.toLocaleString()} FCFA
                </div>
              </div>
            </div>
          </div>

          {/* Swap arrow */}
          <div style={{ textAlign: 'center', fontSize: 24, margin: '-4px 0 16px', color: 'var(--ink-muted)' }}>⇄</div>

          {/* My items */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              You offer
            </p>

            {myItems.length === 0 ? (
              <div style={{
                padding: 20, textAlign: 'center',
                background: 'var(--surface)', borderRadius: 12,
                fontSize: 14, color: 'var(--ink-muted)',
              }}>
                You have no items to offer. Add items in My Space first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myItems.map(item => (
                  <label key={item.id} style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '12px 14px', borderRadius: 12,
                    border: `2px solid ${selectedId === item.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedId === item.id ? 'var(--accent-soft)' : 'var(--surface-card)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                  }}>
                    <input
                      type="radio" name="myItem" value={item.id}
                      checked={selectedId === item.id}
                      onChange={() => setSelectedId(item.id)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 24 }}>{item.emoji || '📦'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{item.condition}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                      {item.value?.toLocaleString()} FCFA
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Fairness indicator */}
          {fairness && selectedItem && (
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: fairness.bg, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{fairness.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: fairness.color }}>
                  {fairness.label} Exchange
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Your item: {selectedItem.value?.toLocaleString()} FCFA → Their item: {targetItem.value?.toLocaleString()} FCFA
                  {' '}(diff: {Math.abs(selectedItem.value - targetItem.value).toLocaleString()} FCFA)
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600,
              color: 'var(--ink-muted)', transition: 'all var(--transition)',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!selectedId}
              style={{
                flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)',
                background: selectedId ? 'var(--ink)' : 'var(--border)',
                color: selectedId ? '#fff' : 'var(--ink-muted)',
                fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-display)',
                transition: 'all var(--transition)',
                cursor: selectedId ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => { if (selectedId) e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { if (selectedId) e.currentTarget.style.background = 'var(--ink)' }}
            >
              ⇄ Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
