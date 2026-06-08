/**
 * LiveMap.jsx — Mapbox GL powered live location map
 *
 * Uses Mapbox GL JS (loaded from CDN) for:
 *   - Precise GPS tracking of the current user (blue dot style)
 *   - Other online swappers shown as avatar pins
 *   - Street / Satellite / Outdoors map styles
 *   - Smooth real-time movement as you walk/drive
 *   - Auto-follows your location; pauses if you drag the map
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocationTracking } from '../lib/useLocation'
import { useApp } from '../context/AppContext'
import supabase from '../lib/supabase'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

const MAP_STYLES = {
  street:    { label: '🗺 Map',       url: 'mapbox://styles/mapbox/streets-v12' },
  satellite: { label: '🛰 Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  outdoors:  { label: '🌍 Outdoors',  url: 'mapbox://styles/mapbox/outdoors-v12' },
}

// Yaoundé, Cameroon
const DEFAULT_CENTER = [11.5021, 3.8480]
const DEFAULT_ZOOM   = 12

export default function LiveMap({ compact = false }) {
  const { currentUser } = useApp()
  const { granted, myCoords, address: myAddress, error: locationError } = useLocationTracking(currentUser)

  const mapRef       = useRef(null)   // mapbox map instance
  const containerRef = useRef(null)   // DOM div
  const markersRef   = useRef({})     // user_id → mapbox Marker
  const myMarkerRef  = useRef(null)   // dedicated "me" marker
  const channelRef   = useRef(null)
  const followMe     = useRef(true)
  const hasFlewToMe  = useRef(false)

  const [onlineUsers,  setOnlineUsers]  = useState([])
  const [mapStyle,     setMapStyle]     = useState('street')
  const [loaded,       setLoaded]       = useState(false)
  const [lastUpdate,   setLastUpdate]   = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [noToken,      setNoToken]      = useState(false)

  const mapHeight = compact ? 300 : 520

  // ── Load Mapbox GL from CDN ───────────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN) { setNoToken(true); return }
    if (window.mapboxgl) { setLoaded(true); return }

    const css = document.createElement('link')
    css.rel  = 'stylesheet'
    css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
    document.head.appendChild(css)

    const script    = document.createElement('script')
    script.src      = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
    script.onload   = () => setLoaded(true)
    script.onerror  = () => setNoToken(true)
    document.head.appendChild(script)
  }, [])

  // ── Initialize Mapbox map ─────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current || !MAPBOX_TOKEN) return

    const mapboxgl = window.mapboxgl
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container:   containerRef.current,
      style:       MAP_STYLES.street.url,
      center:      DEFAULT_CENTER,
      zoom:        DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }),   'bottom-left')

    // When user manually drags, stop auto-follow
    map.on('dragstart', () => { followMe.current = false })

    mapRef.current = map

    // Get GPS immediately on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          if (mapRef.current && !hasFlewToMe.current) {
            hasFlewToMe.current = true
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16, duration: 2000 })
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      )
    }
  }, [loaded])

  // ── Switch map style ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setStyle(MAP_STYLES[mapStyle].url)
  }, [mapStyle])

  // ── Update "Me" marker when GPS coords change ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !loaded || !myCoords || !MAPBOX_TOKEN) return
    const mapboxgl = window.mapboxgl
    const { latitude, longitude } = myCoords

    // Fly to my location on first GPS fix
    if (!hasFlewToMe.current) {
      hasFlewToMe.current = true
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16, duration: 2000 })
    } else if (followMe.current) {
      mapRef.current.easeTo({ center: [longitude, latitude], duration: 800 })
    }

    // Create or update "Me" marker
    if (myMarkerRef.current) {
      myMarkerRef.current.setLngLat([longitude, latitude])
    } else {
      // Custom pulsing blue dot — like Google Maps "you are here"
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="position:relative;width:22px;height:22px;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(200,242,48,0.3);
            animation:mb-pulse 2s ease infinite;
          "></div>
          <div style="
            position:absolute;inset:3px;border-radius:50%;
            background:#c8f230;
            border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
          "></div>
        </div>
      `
      el.style.cssText = 'cursor:pointer'

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false })
        .setHTML(`
          <div style="font-family:system-ui;padding:4px 2px;">
            <div style="font-weight:800;font-size:13px;color:#0c0c10;">📍 You</div>
            <div style="font-size:11px;color:#7c7b82;margin-top:2px;">
              ${myAddress?.display || `${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`}
            </div>
            ${myCoords.accuracy ? `<div style="font-size:10px;color:#aaa;">±${Math.round(myCoords.accuracy)}m accuracy</div>` : ''}
          </div>
        `)

      myMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapRef.current)
    }
  }, [myCoords, loaded, myAddress])

  // ── Continuous watchPosition for smooth real-time movement ───────────────
  const mapWatchRef = useRef(null)
  useEffect(() => {
    if (!loaded || !MAPBOX_TOKEN) return
    if (!navigator.geolocation) return

    mapWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        // Update marker position directly for smoothness
        if (myMarkerRef.current) {
          myMarkerRef.current.setLngLat([longitude, latitude])
        }
        // Pan map if following
        if (mapRef.current && followMe.current) {
          mapRef.current.easeTo({ center: [longitude, latitude], duration: 600 })
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    )

    return () => {
      if (mapWatchRef.current != null) navigator.geolocation.clearWatch(mapWatchRef.current)
    }
  }, [loaded])

  // ── Fetch online users + subscribe via Supabase ───────────────────────────
  const updateMarkers = useCallback((users) => {
    if (!mapRef.current || !loaded || !MAPBOX_TOKEN) return
    const mapboxgl = window.mapboxgl

    const currentIds = new Set(users.map(u => u.user_id))

    // Remove gone users
    Object.keys(markersRef.current).forEach(uid => {
      if (!currentIds.has(uid)) {
        markersRef.current[uid].remove()
        delete markersRef.current[uid]
      }
    })

    // Add/update other users
    users.forEach(user => {
      if (!user.latitude || !user.longitude) return
      const isMe = String(user.user_id) === String(currentUser?.id)
      if (isMe) return  // "me" is handled by myMarkerRef

      const initial = (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()
      const name    = user.first_name || user.email?.split('@')[0] || 'Swapper'

      const el = document.createElement('div')
      el.innerHTML = `
        <div style="
          width:38px;height:38px;border-radius:50%;
          background:#ff5533;color:#fff;
          font-family:system-ui;font-weight:800;font-size:14px;
          display:flex;align-items:center;justify-content:center;
          border:3px solid #fff;
          box-shadow:0 3px 12px rgba(0,0,0,0.35);
          cursor:pointer;
        ">${initial}</div>
      `

      const popup = new mapboxgl.Popup({ offset: 22, closeButton: false })
        .setHTML(`
          <div style="font-family:system-ui;min-width:140px;padding:4px 2px;">
            <div style="font-weight:800;font-size:13px;color:#0c0c10;">${name}</div>
            <div style="font-size:11px;color:#7c7b82;margin-top:2px;">
              ${user.address || `${user.latitude.toFixed(4)}°N`}
            </div>
            <a href="/user/${user.user_id}" style="
              display:block;margin-top:8px;padding:5px 10px;
              background:#0c0c10;color:#c8f230;border-radius:8px;
              font-size:11px;font-weight:700;text-align:center;text-decoration:none;
            ">View Profile →</a>
          </div>
        `)

      if (markersRef.current[user.user_id]) {
        markersRef.current[user.user_id]
          .setLngLat([user.longitude, user.latitude])
          .setPopup(popup)
      } else {
        markersRef.current[user.user_id] = new mapboxgl.Marker({ element: el })
          .setLngLat([user.longitude, user.latitude])
          .setPopup(popup)
          .addTo(mapRef.current)
      }
    })
  }, [currentUser?.id, loaded])

  const refreshUsers = useCallback(async () => {
    if (!supabase.isConfigured()) return
    const users = await supabase.getOnlineUsers()
    setOnlineUsers(users)
    setLastUpdate(new Date())
    updateMarkers(users)
  }, [updateMarkers])

  useEffect(() => {
    if (!supabase.isConfigured()) return
    refreshUsers()
    channelRef.current = supabase.subscribeToLocations(refreshUsers)
    const poll = setInterval(refreshUsers, 30000)
    return () => {
      channelRef.current?.unsubscribe()
      clearInterval(poll)
    }
  }, [refreshUsers])

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapWatchRef.current != null) navigator.geolocation.clearWatch(mapWatchRef.current)
      Object.values(markersRef.current).forEach(m => m.remove())
      if (myMarkerRef.current) myMarkerRef.current.remove()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  const flyToMe = () => {
    if (!mapRef.current || !myCoords) return
    followMe.current = true
    mapRef.current.flyTo({ center: [myCoords.longitude, myCoords.latitude], zoom: 17, duration: 1200 })
  }

  const flyToUser = (user) => {
    if (!mapRef.current || !user.latitude) return
    setSelectedUser(user.user_id)
    followMe.current = false
    mapRef.current.flyTo({ center: [user.longitude, user.latitude], zoom: 15, duration: 1200 })
    setTimeout(() => {
      const m = markersRef.current[user.user_id]
      if (m) m.togglePopup()
    }, 1300)
  }

  const resetView = () => {
    if (!mapRef.current) return
    followMe.current = false
    setSelectedUser(null)
    mapRef.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 1000 })
  }

  // ── No token fallback ─────────────────────────────────────────────────────
  if (noToken) {
    return (
      <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#0c0c10', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗺</div>
        <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>Mapbox token missing</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Add VITE_MAPBOX_TOKEN to your Frontend/.env and rebuild.</div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: '#0c0c10', boxShadow: 'var(--shadow-md)' }}>

      {/* Pulse animation */}
      <style>{`
        @keyframes mb-pulse {
          0%   { transform: scale(0.8); opacity: 0.8; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .mapboxgl-popup-content {
          border-radius: 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
          padding: 12px 14px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>

      {/* Toolbar */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: '#0c0c10', borderBottom: '1px solid rgba(245,244,240,0.06)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            🌍 Live Swap Map
            {onlineUsers.length > 0 && (
              <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 11, fontWeight: 700 }}>
                {onlineUsers.length} online
              </span>
            )}
          </div>
          {lastUpdate && (
            <div style={{ fontSize: 11, color: 'rgba(245,244,240,0.3)', marginTop: 2 }}>
              Updated {lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Style switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(245,244,240,0.06)', borderRadius: 10, padding: 3, border: '1px solid rgba(245,244,240,0.08)' }}>
            {Object.entries(MAP_STYLES).map(([key, cfg]) => (
              <button key={key} onClick={() => setMapStyle(key)} style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: mapStyle === key ? 'var(--lime)' : 'transparent',
                color:      mapStyle === key ? 'var(--ink)' : 'rgba(245,244,240,0.45)',
                border: 'none', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}>{cfg.label}</button>
            ))}
          </div>

          {/* My location button */}
          {granted === true && myCoords && (
            <button onClick={flyToMe} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(200,242,48,0.12)', color: 'var(--lime)', border: '1px solid rgba(200,242,48,0.25)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(200,242,48,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(200,242,48,0.12)'}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block', boxShadow: '0 0 6px var(--lime)' }} />
              {myAddress?.display ? myAddress.display.split(',')[0] : 'Me'}
              {myCoords.accuracy && <span style={{ fontSize: 9, opacity: 0.6 }}>±{Math.round(myCoords.accuracy)}m</span>}
            </button>
          )}

          <button onClick={resetView} title="Reset view" style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(245,244,240,0.06)', color: 'rgba(245,244,240,0.5)', border: '1px solid rgba(245,244,240,0.1)', fontSize: 14, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color='#fff'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(245,244,240,0.5)'}
          >⊙</button>
        </div>
      </div>

      {/* Location denied banner */}
      {granted === false && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📵</span>
          <div style={{ flex: 1, fontSize: 12 }}>
            <span style={{ color: '#f87171', fontWeight: 700 }}>Location off — </span>
            <span style={{ color: 'rgba(239,68,68,0.7)' }}>{locationError || 'Enable location in your browser to appear on the map.'}</span>
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Map + side panel */}
      <div style={{ display: 'flex', height: mapHeight }}>
        <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
          {!loaded && (
            <div style={{ position: 'absolute', inset: 0, background: '#0f1a12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, zIndex: 10 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(200,242,48,0.3)', borderTopColor: 'var(--lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(245,244,240,0.4)', fontWeight: 600 }}>Loading map…</div>
            </div>
          )}
        </div>

        {/* Online users panel */}
        <div style={{ width: 180, background: '#0c0c10', borderLeft: '1px solid rgba(245,244,240,0.06)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(245,244,240,0.06)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(245,244,240,0.3)' }}>
            Online Now
          </div>
          {onlineUsers.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'rgba(245,244,240,0.25)', fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              No one online
            </div>
          ) : (
            onlineUsers.map(user => {
              const isMe    = String(user.user_id) === String(currentUser?.id)
              const initial = (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()
              const name    = isMe ? 'You' : (user.first_name || user.email?.split('@')[0] || 'Swapper')
              const isSel   = selectedUser === user.user_id
              return (
                <button key={user.user_id} onClick={() => flyToUser(user)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', background: isSel ? 'rgba(200,242,48,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(245,244,240,0.04)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.18s' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='rgba(245,244,240,0.04)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isMe ? 'var(--lime)' : 'var(--coral)', color: isMe ? 'var(--ink)' : '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {initial}
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: '#34d399', border: '1.5px solid #0c0c10' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: isMe ? 'var(--lime)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(245,244,240,0.35)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.address ? user.address.split(',')[0] : user.latitude ? `${user.latitude.toFixed(4)}°N` : 'No location'}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px', background: '#0c0c10', borderTop: '1px solid rgba(245,244,240,0.04)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--lime)' }} />
          <span style={{ fontSize: 10, color: 'rgba(245,244,240,0.3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--coral)' }} />
          <span style={{ fontSize: 10, color: 'rgba(245,244,240,0.3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Other swappers</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(245,244,240,0.2)' }}>
          Drag to explore · Click pin for info · Powered by Mapbox
        </div>
      </div>
    </div>
  )
}