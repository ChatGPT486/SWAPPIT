import { useState } from 'react'
import { useApp } from '../context/AppContext'

// ── Swap validation rules ──────────────────────────────────────────────────────
function validateSwap(selectedItem, targetItem, meetLocation, meetDate, step) {
  const errors = {}

  if (step >= 1) {
    if (!selectedItem) {
      errors.item = 'You must select one of your items to offer.'
    } else {
      // Block swapping an item with itself
      if (selectedItem.id === targetItem.id) {
        errors.item = 'You cannot swap an item with itself.'
      }
      // Block if offered item is not available
      if (selectedItem.available === false || selectedItem.isAvailable === false) {
        errors.item = 'The item you selected is no longer available for swapping.'
      }
      // Block if target item is not available
      if (targetItem.available === false || targetItem.isAvailable === false) {
        errors.item = 'This item is no longer available for swapping.'
      }
      // Warn (but don't block) if unfair
      const ratio = Number(selectedItem.value) / Number(targetItem.value)
      if (ratio < 0.3 || ratio > 3.0) {
        errors.fairnessBlock =
          `The value difference is too large to propose a swap. ` +
          `Your item is worth ${Number(selectedItem.value).toLocaleString()} FCFA ` +
          `but the requested item is ${Number(targetItem.value).toLocaleString()} FCFA — ` +
          `that's a ${ratio < 1
            ? Math.round((1 - ratio) * 100)
            : Math.round((ratio - 1) * 100)}% difference. ` +
          `Try an item with a closer value.`
      }
    }
  }

  if (step >= 2) {
    if (!meetLocation || !meetLocation.trim()) {
      errors.meetLocation = 'Please enter or select a meeting location.'
    }
    if (meetDate) {
      const chosen = new Date(meetDate)
      const now    = new Date()
      if (chosen < now) {
        errors.meetDate = 'Meeting date must be in the future.'
      }
      const maxDate = new Date()
      maxDate.setMonth(maxDate.getMonth() + 6)
      if (chosen > maxDate) {
        errors.meetDate = 'Meeting date cannot be more than 6 months from now.'
      }
    }
  }

  return errors
}

export default function SwapModal({ targetItem, onClose, onSuccess }) {
  const { getMyItems, proposeExchange, getFairness } = useApp()

  const allMyItems = getMyItems()
  // Only show available items that are not the target item
  const myItems = allMyItems.filter(i =>
    i.available !== false &&
    i.isAvailable !== false &&
    i.id !== targetItem.id
  )

  const [selectedId,   setSelectedId]   = useState(null)
  const [meetLocation, setMeetLocation] = useState('')
  const [meetDate,     setMeetDate]     = useState('')
  const [step,         setStep]         = useState(1)
  const [errors,       setErrors]       = useState({})
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)

  const selectedItem = myItems.find(i => i.id === selectedId) || null
  const fairness     = selectedItem ? getFairness(selectedItem.value, targetItem.value) : null

  // Real-time fairness feedback as user picks an item
  const getItemFairness = (item) => getFairness(item.value, targetItem.value)

  const goToStep2 = () => {
    const errs = validateSwap(selectedItem, targetItem, '', '', 1)
    setErrors(errs)
    if (!errs.item && !errs.fairnessBlock) setStep(2)
  }

  const handleSubmit = async () => {
    const errs = validateSwap(selectedItem, targetItem, meetLocation, meetDate, 2)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // Secondary check — meeting location required
    if (!meetLocation.trim()) {
      setErrors({ meetLocation: 'Please select or enter a meeting location.' })
      return
    }

    setSubmitting(true)
    try {
      await proposeExchange({
        offeredItemId:   selectedId,
        requestedItemId: targetItem.id,
        meetLocation,
        meetDate,
      })
      setSubmitted(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1800)
    } catch (err) {
      setErrors({ api: err.message || 'Failed to send proposal. Please try again.' })
      setSubmitting(false)
    }
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="modal-backdrop">
        <div className="modal-scale" style={{ maxWidth: 400, textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 12 }}>Proposal Sent!</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
            Your swap proposal has been sent. The owner will be notified and can accept or decline.
          </p>
          <div style={{ marginTop: 20, padding: '10px 18px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
            📍 Meeting: {meetLocation || 'Not specified'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-scale" style={{ maxWidth: 560 }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Propose a Swap</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              Step {step} of 2 — {step === 1 ? 'Choose your item' : 'Set a meeting point'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--lime)', transition: 'width 0.3s var(--ease)', borderRadius: 2 }} />
        </div>

        <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto' }}>

          {/* ── STEP 1: Pick item ── */}
          {step === 1 && (
            <>
              {/* Target item */}
              <div style={{ marginBottom: 18 }}>
                <p style={LabelStyle}>You want</p>
                <ItemPreview item={targetItem} />
              </div>

              <div style={{ textAlign: 'center', fontSize: 22, color: 'var(--muted)', margin: '-4px 0 14px' }}>⇄</div>

              {/* My items */}
              <div style={{ marginBottom: 18 }}>
                <p style={LabelStyle}>You offer</p>

                {myItems.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-md)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                    <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700, marginBottom: 6 }}>No available items</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      You need at least one available item to propose a swap.<br />
                      Add items in <strong>My Space → My Items</strong>.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {myItems.map(item => {
                      const itemFairness = getItemFairness(item)
                      const isSelected   = selectedId === item.id
                      const ratio        = Number(item.value) / Number(targetItem.value)
                      const tooFarOff    = ratio < 0.3 || ratio > 3.0

                      return (
                        <label key={item.id} style={{
                          display: 'flex', gap: 12, alignItems: 'center',
                          padding: '11px 14px', borderRadius: 'var(--radius-sm)', cursor: tooFarOff ? 'not-allowed' : 'pointer',
                          border: `2px solid ${isSelected ? 'var(--ink)' : tooFarOff ? 'rgba(239,68,68,0.25)' : 'var(--border-md)'}`,
                          background: isSelected ? 'rgba(12,12,16,0.04)' : tooFarOff ? 'rgba(239,68,68,0.03)' : '#fff',
                          opacity: tooFarOff ? 0.65 : 1,
                          transition: 'all 0.2s var(--ease)',
                        }}>
                          <input
                            type="radio" name="myItem" value={item.id}
                            checked={isSelected}
                            disabled={tooFarOff}
                            onChange={() => {
                              setSelectedId(item.id)
                              setErrors(prev => ({ ...prev, item: null, fairnessBlock: null }))
                            }}
                            style={{ accentColor: 'var(--ink)', flexShrink: 0 }}
                          />
                          {item.image
                            ? <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            : <span style={{ fontSize: 26, flexShrink: 0 }}>{item.emoji || '📦'}</span>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.condition}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--teal)' }}>
                              {Number(item.value).toLocaleString()} F
                            </div>
                            {itemFairness && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: tooFarOff ? 'var(--error)' : itemFairness.color, fontFamily: 'var(--font-display)' }}>
                                {tooFarOff ? '⚠ Too far' : `${itemFairness.icon} ${itemFairness.label}`}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Validation errors */}
              {errors.item && <ErrBox>{errors.item}</ErrBox>}
              {errors.fairnessBlock && (
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--error)', marginBottom: 4 }}>Value difference too large</div>
                    <div style={{ fontSize: 12, color: 'var(--error)', lineHeight: 1.65 }}>{errors.fairnessBlock}</div>
                  </div>
                </div>
              )}

              {/* Selected item fairness preview */}
              {fairness && selectedItem && !errors.fairnessBlock && (
                <div style={{ padding: '11px 14px', borderRadius: 'var(--radius-sm)', background: fairness.bg, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${fairness.color}28` }}>
                  <span style={{ fontSize: 20 }}>{fairness.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: fairness.color }}>{fairness.label} Exchange</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Your {Number(selectedItem.value).toLocaleString()} FCFA ↔ Their {Number(targetItem.value).toLocaleString()} FCFA
                      {' '}· Diff: {Math.abs(Number(selectedItem.value) - Number(targetItem.value)).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={OutlineBtn}>Cancel</button>
                <button
                  onClick={goToStep2}
                  disabled={!selectedId || myItems.length === 0}
                  style={{ ...PrimaryBtn, opacity: (!selectedId || myItems.length === 0) ? 0.45 : 1, cursor: (!selectedId || myItems.length === 0) ? 'not-allowed' : 'pointer' }}
                >Next: Set Meetup →</button>
              </div>
            </>
          )}

          {/* ── STEP 2: Meeting point ── */}
          {step === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 6 }}>Where will you meet?</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Suggest a location and date. The other person sees this when reviewing your proposal.
                </p>
              </div>

              {/* Map picker */}
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `1px solid ${errors.meetLocation ? 'var(--error)' : 'var(--border)'}`, marginBottom: 6 }}>
                <MapPicker location={meetLocation} onChange={loc => { setMeetLocation(loc); setErrors(prev => ({ ...prev, meetLocation: null })) }} />
              </div>
              {errors.meetLocation && <ErrBox style={{ marginBottom: 12 }}>{errors.meetLocation}</ErrBox>}

              {/* Manual location input */}
              <div style={{ marginBottom: 14 }}>
                <label style={LabelStyle}>Meeting location *</label>
                <input
                  value={meetLocation}
                  onChange={e => { setMeetLocation(e.target.value); setErrors(prev => ({ ...prev, meetLocation: null })) }}
                  placeholder="e.g. Douala — Akwa Total Station"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${errors.meetLocation ? 'var(--error)' : 'var(--border-md)'}`,
                    fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: '#fff',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = errors.meetLocation ? 'var(--error)' : 'var(--border-md)'}
                />
              </div>

              {/* Date picker */}
              <div style={{ marginBottom: 20 }}>
                <label style={LabelStyle}>Proposed date & time (optional)</label>
                <input
                  type="datetime-local"
                  value={meetDate}
                  min={new Date().toISOString().slice(0,16)}
                  onChange={e => { setMeetDate(e.target.value); setErrors(prev => ({ ...prev, meetDate: null })) }}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${errors.meetDate ? 'var(--error)' : 'var(--border-md)'}`,
                    fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: '#fff',
                  }}
                />
                {errors.meetDate && <ErrBox style={{ marginTop: 6 }}>{errors.meetDate}</ErrBox>}
              </div>

              {/* Swap summary */}
              <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>Swap Summary</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>{selectedItem?.emoji || '📦'}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedItem?.name}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 700 }}>⇄</span>
                  <span style={{ fontSize: 18 }}>{targetItem.emoji || '📦'}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{targetItem.name}</span>
                </div>
                {fairness && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: fairness.bg }}>
                    <span style={{ fontSize: 12 }}>{fairness.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: fairness.color, fontFamily: 'var(--font-display)' }}>{fairness.label}</span>
                  </div>
                )}
                {meetLocation && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>📍 {meetLocation}</div>}
                {meetDate && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>🗓 {new Date(meetDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
              </div>

              {/* API error */}
              {errors.api && <ErrBox style={{ marginBottom: 16 }}>{errors.api}</ErrBox>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep(1); setErrors({}) }} style={OutlineBtn} disabled={submitting}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting || !meetLocation.trim()} style={{
                  ...PrimaryBtn,
                  opacity: (submitting || !meetLocation.trim()) ? 0.6 : 1,
                  cursor:  (submitting || !meetLocation.trim()) ? 'not-allowed' : 'pointer',
                }}>
                  {submitting ? 'Sending…' : '⇄ Send Proposal'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Item preview chip ─────────────────────────────────────────────────────────
function ItemPreview({ item }) {
  return (
    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
      {item.image
        ? <img src={item.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        : <span style={{ fontSize: 32, flexShrink: 0 }}>{item.emoji || '📦'}</span>
      }
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{item.name}</div>
        <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 800 }}>{Number(item.value).toLocaleString()} FCFA</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.condition} · {item.category}</div>
      </div>
    </div>
  )
}

// ── Map picker ────────────────────────────────────────────────────────────────
function MapPicker({ location, onChange }) {
  const CITIES = [
    { name: 'Douala',    spots: ['Akwa', 'Bonanjo', 'Deido', 'Bassa', 'Bonabéri'] },
    { name: 'Yaoundé',   spots: ['Centre Ville', 'Bastos', 'Mvog-Ada', 'Mfoundi', 'Nlongkak'] },
    { name: 'Bafoussam', spots: ['Centre', 'Djeleng', 'Tamdja', 'Ngouache'] },
    { name: 'Bamenda',   spots: ['Commercial Ave', 'Up Station', 'Nkwen', 'Mile 4'] },
    { name: 'Garoua',    spots: ['Marché Central', 'Plateau', 'Bibémi'] },
  ]
  const PINS = {
    'Douala':    { x: '28%', y: '62%' }, 'Yaoundé':   { x: '45%', y: '65%' },
    'Bafoussam': { x: '32%', y: '52%' }, 'Bamenda':   { x: '25%', y: '42%' },
    'Garoua':    { x: '55%', y: '25%' },
  }

  const [selectedCity, setSelectedCity] = useState(() => {
    const parts = location.split('—')
    return parts.length > 1 ? parts[0].trim() : null
  })

  const handleCity = (name) => {
    setSelectedCity(name)
    onChange(name + ' — ')
  }

  const handleSpot = (city, spot) => {
    onChange(`${city} — ${spot}`)
  }

  return (
    <div style={{ background: '#0c0c10', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
        📍 Pick a city in Cameroon
      </div>
      <div style={{ position: 'relative', background: 'rgba(245,244,240,0.03)', borderRadius: 10, minHeight: 190, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 300 280">
          <path d="M80,30 Q100,20 130,25 L170,30 Q200,35 220,60 L240,100 Q250,130 245,160 L230,200 Q210,230 190,245 L160,255 Q130,260 110,250 L80,235 Q55,215 50,185 L45,150 Q42,120 50,90 L60,60 Z" fill="rgba(200,242,48,0.3)" stroke="rgba(200,242,48,0.5)" strokeWidth="2" />
        </svg>
        {Object.entries(PINS).map(([name, pos]) => (
          <button key={name} onClick={() => handleCity(name)} style={{
            position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)',
            background: selectedCity === name ? 'var(--lime)' : 'rgba(245,244,240,0.12)',
            border: `2px solid ${selectedCity === name ? 'var(--lime)' : 'rgba(245,244,240,0.2)'}`,
            color: selectedCity === name ? 'var(--ink)' : '#fff',
            borderRadius: 'var(--radius-pill)', padding: '4px 12px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            boxShadow: selectedCity === name ? '0 0 12px rgba(200,242,48,0.5)' : 'none',
          }}>📍 {name}</button>
        ))}
      </div>

      {selectedCity && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            📌 Pick a spot in {selectedCity}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CITIES.find(c => c.name === selectedCity)?.spots.map(spot => {
              const active = location === `${selectedCity} — ${spot}`
              return (
                <button key={spot} onClick={() => handleSpot(selectedCity, spot)} style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                  background: active ? 'var(--lime)' : 'rgba(245,244,240,0.08)',
                  color: active ? 'var(--ink)' : 'rgba(245,244,240,0.6)',
                  border: `1px solid ${active ? 'transparent' : 'rgba(245,244,240,0.12)'}`,
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>{spot}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────
const LabelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 8, fontFamily: 'var(--font-display)',
}
const PrimaryBtn = {
  flex: 2, padding: '12px 20px', borderRadius: 'var(--radius-sm)',
  background: 'var(--ink)', color: 'var(--lime)',
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
  border: 'none', cursor: 'pointer',
  transition: 'transform 0.2s var(--ease-spring), box-shadow 0.2s',
}
const OutlineBtn = {
  flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--border-md)', fontSize: 14, fontWeight: 600,
  color: 'var(--muted)', background: 'transparent',
  cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.2s',
}

function ErrBox({ children, style: s }) {
  return (
    <div style={{ padding: '11px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14, ...s }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span style={{ fontSize: 13, color: 'var(--error)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}