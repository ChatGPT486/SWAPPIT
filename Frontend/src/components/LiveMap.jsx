/**
 * LiveMap.jsx
 *
 * Shows all online users on a Cameroon map with their real locations.
 * Uses Supabase Realtime to update pins without page refresh.
 *
 * If Supabase isn't configured, renders a friendly setup message.
 * If geolocation is denied, shows the user how to re-enable it.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import supabase from '../lib/supabase'
import { useLocationTracking } from '../lib/useLocation'
import { useApp } from '../context/AppContext'

// Cameroon bounding box (rough)
const CAM_BOUNDS = {
  latMin: 1.65,  latMax: 13.08,
  lngMin: 8.45,  lngMax: 16.19,
}

// Convert lat/lng to % position within the map box
function toXY(lat, lng) {
  const x = ((lng - CAM_BOUNDS.lngMin) / (CAM_BOUNDS.lngMax - CAM_BOUNDS.lngMin)) * 100
  const y = ((CAM_BOUNDS.latMax - lat) / (CAM_BOUNDS.latMax - CAM_BOUNDS.latMin)) * 100
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  }
}

// Major cities for reference grid
const CITIES = [
  { name: 'Douala',    lat: 4.0511,  lng: 9.7679  },
  { name: 'Yaoundé',  lat: 3.8480,  lng: 11.5021  },
  { name: 'Bafoussam',lat: 5.4764,  lng: 10.4176  },
  { name: 'Bamenda',  lat: 5.9528,  lng: 10.1463  },
  { name: 'Garoua',   lat: 9.3008,  lng: 13.3978  },
  { name: 'Maroua',   lat: 10.5907, lng: 14.3236  },
  { name: 'Ngaoundéré', lat: 7.3167, lng: 13.5833 },
  { name: 'Bertoua',  lat: 4.5757,  lng: 13.6848  },
  { name: 'Ebolowa',  lat: 2.9000,  lng: 11.1500  },
]

export default function LiveMap({ compact = false }) {
  const { currentUser } = useApp()
  const { granted, myCoords, error: locationError } = useLocationTracking(currentUser)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [hoveredUser, setHoveredUser] = useState(null)
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const channelRef = useRef(null)

  // ── Fetch online users ───────────────────────────────────────────────────
  const refreshUsers = useCallback(async () => {
    if (!supabase.isConfigured()) return
    const users = await supabase.getOnlineUsers()
    setOnlineUsers(users)
    setLastUpdate(new Date())
  }, [])

  // ── Subscribe to realtime changes ────────────────────────────────────────
  useEffect(() => {
    if (!supabase.isConfigured()) return

    refreshUsers()

    channelRef.current = supabase.subscribeToLocations(() => {
      // Any change to user_locations → refresh the list
      refreshUsers()
    })

    // Poll every 60s as fallback (realtime covers the fast path)
    const poll = setInterval(refreshUsers, 60000)

    return () => {
      channelRef.current?.unsubscribe()
      clearInterval(poll)
    }
  }, [refreshUsers])

  const mapHeight = compact ? 260 : 480

  // ── Supabase not configured ──────────────────────────────────────────────
  if (!supabase.isConfigured()) {
    return (
      <SetupCard />
    )
  }

  return (
    <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: '#0c0c10' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245,244,240,0.06)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>
            🌍 Live Swap Map
          </div>
          <div style={{ fontSize: 11, color: 'rgba(245,244,240,0.35)', marginTop: 2 }}>
            {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online now · Cameroon
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {granted === false && (
            <div style={{ padding: '5px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 10, color: '#f87171', fontWeight: 600 }}>
              📵 Location off
            </div>
          )}
          {granted === true && (
            <div style={{ padding: '5px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#34d399', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              You're live
            </div>
          )}
          {lastUpdate && (
            <div style={{ fontSize: 10, color: 'rgba(245,244,240,0.25)' }}>
              Updated {lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Location permission banner */}
      {granted === false && (
        <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-display)' }}>Location access needed to appear on the map</div>
            <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', marginTop: 2 }}>{locationError || 'Enable location in your browser settings to show your pin to other swappers.'}</div>
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Map canvas */}
      <div style={{ position: 'relative', height: mapHeight, overflow: 'hidden', background: '#0f1a12', cursor: 'default' }}>

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'linear-gradient(rgba(200,242,48,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,242,48,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Cameroon SVG outline */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Rough Cameroon polygon */}
          <polygon points="22,88 18,78 14,65 15,52 18,40 22,30 26,20 32,12 40,8 50,6 60,8 68,14 72,22 74,32 72,44 68,54 64,64 60,74 56,82 50,88 44,92 36,92" fill="rgba(200,242,48,0.08)" stroke="rgba(200,242,48,0.35)" strokeWidth="0.8" />
        </svg>

        {/* City reference dots */}
        {CITIES.map(city => {
          const pos = toXY(city.lat, city.lng)
          return (
            <div key={city.name} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', zIndex: 1, pointerEvents: 'none' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(200,242,48,0.3)' }} />
              {!compact && (
                <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 8, color: 'rgba(200,242,48,0.25)', marginTop: 2, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {city.name}
                </div>
              )}
            </div>
          )
        })}

        {/* Online user pins */}
        {onlineUsers.map(user => {
          if (!user.latitude || !user.longitude) return null
          const pos     = toXY(user.latitude, user.longitude)
          const isMe    = user.user_id === currentUser?.id
          const initial = (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()
          const isHov   = hoveredUser === user.user_id

          return (
            <div key={user.user_id} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -100%)', zIndex: isMe ? 20 : 10, transition: 'all 0.4s var(--ease)' }}>
              {/* Pulse ring for self */}
              {isMe && (
                <div style={{ position: 'absolute', left: '50%', top: '100%', width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(200,242,48,0.4)', transform: 'translate(-50%,-50%)', animation: 'pulse 2s ease infinite', pointerEvents: 'none' }} />
              )}

              {/* Pin */}
              <div
                onMouseEnter={() => setHoveredUser(user.user_id)}
                onMouseLeave={() => setHoveredUser(null)}
                style={{
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width:   isMe ? 38 : 32,
                  height:  isMe ? 38 : 32,
                  borderRadius: '50%',
                  background: isMe ? 'var(--lime)' : 'var(--coral)',
                  color:   isMe ? 'var(--ink)' : '#fff',
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize:   isMe ? 14 : 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `3px solid ${isMe ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                  boxShadow: isMe
                    ? '0 0 0 3px rgba(200,242,48,0.4), 0 4px 16px rgba(0,0,0,0.4)'
                    : '0 4px 12px rgba(0,0,0,0.35)',
                  transform: isHov ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.2s var(--ease-spring)',
                  zIndex: 2, position: 'relative',
                }}>{initial}</div>

                {/* Pin point */}
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `8px solid ${isMe ? 'var(--lime)' : 'var(--coral)'}`, marginTop: -1 }} />
              </div>

              {/* Tooltip on hover */}
              {isHov && (
                <div style={{
                  position: 'absolute', bottom: '115%', left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', borderRadius: 10, padding: '8px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap', zIndex: 30,
                  animation: 'scaleIn 0.15s var(--ease)',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', marginBottom: 2 }}>
                    {isMe ? '📍 You' : user.first_name || user.email?.split('@')[0] || 'Swapper'}
                    {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--teal)', fontWeight: 600 }}>· Live</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {user.latitude.toFixed(4)}°N, {user.longitude.toFixed(4)}°E
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                    Last seen: {new Date(user.last_seen).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {/* Tooltip arrow */}
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff' }} />
                </div>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {onlineUsers.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 40 }}>🌍</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'rgba(245,244,240,0.5)' }}>Waiting for users to connect…</div>
            <div style={{ fontSize: 12, color: 'rgba(245,244,240,0.25)' }}>Online users will appear as pins on the map</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(245,244,240,0.06)', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--lime)', border: '2px solid rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 11, color: 'rgba(245,244,240,0.4)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--coral)', border: '2px solid rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 11, color: 'rgba(245,244,240,0.4)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Other swappers</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(245,244,240,0.2)', fontFamily: 'var(--font-display)' }}>
          Powered by Supabase Realtime
        </div>
      </div>
    </div>
  )
}

// ── Setup card when Supabase isn't configured ─────────────────────────────────
function SetupCard() {
  return (
    <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', background: '#0c0c10' }}>
      <div style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Live Map needs Supabase
        </div>
        <div style={{ fontSize: 13, color: 'rgba(245,244,240,0.45)', lineHeight: 1.75, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
          To show live user locations, add your Supabase keys to the <code style={{ background: 'rgba(200,242,48,0.1)', color: 'var(--lime)', padding: '1px 5px', borderRadius: 4 }}>.env</code> file and run the setup SQL.
        </div>
        <div style={{ background: 'rgba(245,244,240,0.04)', borderRadius: 10, padding: '16px 18px', textAlign: 'left', border: '1px solid rgba(245,244,240,0.08)', maxWidth: 400, margin: '0 auto' }}>
          {[
            ['1', 'Create a free project at supabase.com'],
            ['2', 'Go to Settings → API → copy URL and anon key'],
            ['3', 'Add to Frontend/.env as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'],
            ['4', 'Run the SQL in supabase_setup.sql in SQL Editor'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 13, color: 'rgba(245,244,240,0.55)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--lime)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
