/**
 * LiveMap.jsx — Google Maps-style live user location map
 *
 * Uses Leaflet.js (loaded from CDN) for real tile maps:
 *   - Street view (OpenStreetMap tiles)
 *   - Satellite view (ESRI World Imagery tiles)
 *   - Hybrid view (Satellite + labels)
 *   - Real zoom in/out/scroll
 *   - Animated user pins with popups
 *   - Live updates via Supabase Realtime
 *   - My location pulse ring
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocationTracking } from '../lib/useLocation'
import { useApp } from '../context/AppContext'
import supabase from '../lib/supabase'

// ── Tile layer definitions ────────────────────────────────────────────────────
const TILE_LAYERS = {
  street: {
    label: '🗺 Map',
    url:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr:  '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    label: '🛰 Satellite',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri, Maxar, GeoEye, Earthstar Geographics',
    maxZoom: 18,
  },
  hybrid: {
    label: '🌍 Hybrid',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri',
    maxZoom: 18,
  },
}

// Cameroon center
const CAMEROON_CENTER = [5.5, 12.3]
const DEFAULT_ZOOM    = 6

export default function LiveMap({ compact = false }) {
  const { currentUser } = useApp()
  const { granted, myCoords, address: myAddress, error: locationError } = useLocationTracking(currentUser)

  const mapRef        = useRef(null)   // Leaflet map instance
  const containerRef  = useRef(null)   // DOM div
  const markersRef    = useRef({})     // user_id → Leaflet marker
  const tileLayerRef  = useRef(null)   // current tile layer
  const channelRef    = useRef(null)

  const [onlineUsers, setOnlineUsers] = useState([])
  const [mapMode,     setMapMode]     = useState('street')
  const [loaded,      setLoaded]      = useState(false)
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const mapHeight = compact ? 300 : 520

  // ── Load Leaflet from CDN ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setLoaded(true); return }

    // CSS
    const css = document.createElement('link')
    css.rel   = 'stylesheet'
    css.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    // JS
    const script  = document.createElement('script')
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)

    return () => {}
  }, [])

  // ── Initialize Leaflet map ─────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return

    const L   = window.L
    const map = L.map(containerRef.current, {
      center:           CAMEROON_CENTER,
      zoom:             DEFAULT_ZOOM,
      zoomControl:      false,       // we add our own
      attributionControl: false,
    })

    // Add tile layer
    const layer = L.tileLayer(TILE_LAYERS.street.url, {
      attribution: TILE_LAYERS.street.attr,
      maxZoom:     TILE_LAYERS.street.maxZoom,
    }).addTo(map)
    tileLayerRef.current = layer

    // Custom zoom control (bottom right)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Attribution (bottom left, minimal)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

    mapRef.current = map
  }, [loaded])

  // ── Switch tile layer when mapMode changes ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const L = window.L
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current)
    }
    const cfg = TILE_LAYERS[mapMode]
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: cfg.maxZoom })
      .addTo(mapRef.current)
  }, [mapMode, loaded])

  // ── Fetch online users + subscribe ────────────────────────────────────────
  const refreshUsers = useCallback(async () => {
    if (!supabase.isConfigured()) return
    const users = await supabase.getOnlineUsers()
    setOnlineUsers(users)
    setLastUpdate(new Date())
    updateMarkers(users)
  }, [])

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

  // ── Update Leaflet markers when users change ───────────────────────────────
  const updateMarkers = useCallback((users) => {
    if (!mapRef.current || !loaded) return
    const L   = window.L
    const map = mapRef.current

    const currentIds = new Set(users.map(u => u.user_id))

    // Remove markers for users who went offline
    Object.keys(markersRef.current).forEach(uid => {
      if (!currentIds.has(uid)) {
        map.removeLayer(markersRef.current[uid])
        delete markersRef.current[uid]
      }
    })

    // Add/update markers
    users.forEach(user => {
      if (!user.latitude || !user.longitude) return

      const isMe    = String(user.user_id) === String(currentUser?.id)
      const initial = (user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()
      const color   = isMe ? '#c8f230' : '#ff5533'
      const textCol = isMe ? '#0c0c10' : '#ffffff'
      const size    = isMe ? 42 : 36
      const border  = isMe ? '3px solid #fff' : '3px solid rgba(255,255,255,0.4)'
      const shadow  = isMe
        ? '0 0 0 4px rgba(200,242,48,0.3), 0 4px 20px rgba(0,0,0,0.4)'
        : '0 4px 16px rgba(0,0,0,0.35)'
      const pulse = isMe
        ? `<div style="position:absolute;top:50%;left:50%;width:${size+16}px;height:${size+16}px;border-radius:50%;background:rgba(200,242,48,0.2);transform:translate(-50%,-50%);animation:livemap-pulse 2s ease infinite;pointer-events:none;"></div>`
        : ''

      const iconHtml = `
        <div style="position:relative;width:${size}px;height:${size + 10}px;display:flex;flex-direction:column;align-items:center;">
          ${pulse}
          <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:${textCol};font-family:system-ui,sans-serif;font-weight:800;font-size:${Math.round(size*0.35)}px;display:flex;align-items:center;justify-content:center;border:${border};box-shadow:${shadow};position:relative;z-index:1;">${initial}</div>
          <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid ${color};margin-top:-1px;"></div>
        </div>
      `

      const icon = L.divIcon({
        html:      iconHtml,
        className: '',
        iconSize:  [size, size + 10],
        iconAnchor:[size / 2, size + 10],
        popupAnchor:[0, -(size + 12)],
      })

      const popupName    = isMe ? '📍 You' : (user.first_name || user.email?.split('@')[0] || 'Swapper')
      const popupTime    = new Date(user.last_seen).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const popupContent = `
        <div style="font-family:system-ui,sans-serif;min-width:160px;">
          <div style="font-weight:800;font-size:14px;color:#0c0c10;margin-bottom:4px;">${popupName}${isMe ? ' <span style="font-size:10px;color:#00c9a7;font-weight:600;">· Live</span>' : ''}</div>
          <div style="font-size:11px;color:#7c7b82;margin-bottom:2px;">📍 ${user.latitude.toFixed(5)}°N, ${user.longitude.toFixed(5)}°E</div>
          <div style="font-size:11px;color:#7c7b82;">🕐 Last seen ${popupTime}</div>
          ${!isMe ? `<a href="/user/${user.user_id}" style="display:block;margin-top:10px;padding:6px 12px;background:#0c0c10;color:#c8f230;border-radius:8px;font-size:12px;font-weight:700;text-align:center;text-decoration:none;">View Profile →</a>` : ''}
        </div>
      `

      if (markersRef.current[user.user_id]) {
        // Update existing marker position + icon
        markersRef.current[user.user_id]
          .setLatLng([user.latitude, user.longitude])
          .setIcon(icon)
          .getPopup()?.setContent(popupContent)
      } else {
        // Create new marker
        const marker = L.marker([user.latitude, user.longitude], { icon, zIndexOffset: isMe ? 1000 : 0 })
          .addTo(map)
          .bindPopup(popupContent, { closeButton: false, maxWidth: 220 })
        markersRef.current[user.user_id] = marker
      }
    })
  }, [currentUser?.id, loaded])

  // ── Update markers whenever users or map loads ─────────────────────────────
  useEffect(() => {
    if (loaded && onlineUsers.length > 0) {
      updateMarkers(onlineUsers)
    }
  }, [loaded, onlineUsers, updateMarkers])

  // ── Fly to my location when granted ───────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !myCoords || !loaded) return
    mapRef.current.flyTo([myCoords.latitude, myCoords.longitude], 13, { duration: 1.5 })
  }, [myCoords, loaded])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = {}
      }
    }
  }, [])

  // ── Fly to user on panel click ─────────────────────────────────────────────
  const flyToUser = (user) => {
    if (!mapRef.current || !user.latitude) return
    setSelectedUser(user.user_id)
    mapRef.current.flyTo([user.latitude, user.longitude], 14, { duration: 1.2 })
    setTimeout(() => {
      const marker = markersRef.current[user.user_id]
      if (marker) marker.openPopup()
    }, 1300)
  }

  const flyToMe = () => {
    if (!mapRef.current || !myCoords) return
    mapRef.current.flyTo([myCoords.latitude, myCoords.longitude], 15, { duration: 1.2 })
  }

  const resetView = () => {
    if (!mapRef.current) return
    mapRef.current.flyTo(CAMEROON_CENTER, DEFAULT_ZOOM, { duration: 1.0 })
    setSelectedUser(null)
  }

  return (
    <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: '#0c0c10', boxShadow: 'var(--shadow-md)' }}>

      {/* ── Pulse CSS ── */}
      <style>{`
        @keyframes livemap-pulse {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.8; }
          70%  { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(0.8); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
          border: 1px solid rgba(12,12,16,0.08) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 14px 16px !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: var(--shadow-md) !important; }
        .leaflet-control-zoom a {
          background: #0c0c10 !important; color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          font-family: var(--font-display) !important; font-weight: 700 !important;
          width: 36px !important; height: 36px !important; line-height: 36px !important;
          font-size: 18px !important;
        }
        .leaflet-control-zoom a:hover { background: #1a1a24 !important; color: #c8f230 !important; }
        .leaflet-bar { border: none !important; border-radius: 10px !important; overflow: hidden; }
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: '#0c0c10', borderBottom: '1px solid rgba(245,244,240,0.06)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
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
          {/* Map mode switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(245,244,240,0.06)', borderRadius: 10, padding: 3, border: '1px solid rgba(245,244,240,0.08)' }}>
            {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
              <button key={key} onClick={() => setMapMode(key)} style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: mapMode === key ? (key === 'satellite' ? '#1a1a24' : 'var(--lime)') : 'transparent',
                color:      mapMode === key ? (key === 'satellite' ? 'var(--lime)' : 'var(--ink)') : 'rgba(245,244,240,0.45)',
                border: 'none', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}>{cfg.label}</button>
            ))}
          </div>

          {/* My location button */}
          {granted === true && myCoords && (
            <button onClick={flyToMe} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(200,242,48,0.12)', color: 'var(--lime)', border: '1px solid rgba(200,242,48,0.25)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5, maxWidth: 220, overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(200,242,48,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(200,242,48,0.12)' }}
              title={myAddress?.full || 'My location'}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0, display: 'inline-block', boxShadow: '0 0 6px var(--lime)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {myAddress?.display ? myAddress.display.split(',')[0] : 'Me'}
              </span>
              {myCoords.accuracy && <span style={{ fontSize: 9, opacity: 0.6, flexShrink: 0 }}>±{Math.round(myCoords.accuracy)}m</span>}
            </button>
          )}

          {/* Reset view */}
          <button onClick={resetView} style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(245,244,240,0.06)', color: 'rgba(245,244,240,0.5)', border: '1px solid rgba(245,244,240,0.1)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(245,244,240,0.5)' }}
            title="Reset to Cameroon view"
          >⊙</button>
        </div>
      </div>

      {/* ── Location denied banner ── */}
      {granted === false && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }}>📵</span>
          <div style={{ flex: 1, fontSize: 12 }}>
            <span style={{ color: '#f87171', fontWeight: 700 }}>Location off — </span>
            <span style={{ color: 'rgba(239,68,68,0.7)' }}>{locationError || 'Enable in browser settings to appear on the map.'}</span>
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Main layout: map + side panel ── */}
      <div style={{ display: 'flex', height: mapHeight }}>

        {/* Map */}
        <div ref={containerRef} style={{ flex: 1, zIndex: 1, position: 'relative' }}>
          {!loaded && (
            <div style={{ position: 'absolute', inset: 0, background: '#0f1a12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, zIndex: 10 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(200,242,48,0.3)', borderTopColor: 'var(--lime)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(245,244,240,0.4)', fontWeight: 600 }}>Loading map…</div>
            </div>
          )}
        </div>

        {/* Side panel — online users list */}
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
              const isSelected = selectedUser === user.user_id

              return (
                <button key={user.user_id} onClick={() => flyToUser(user)} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                  background: isSelected ? 'rgba(200,242,48,0.08)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(245,244,240,0.04)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.18s',
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='rgba(245,244,240,0.04)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isMe ? 'var(--lime)' : 'var(--coral)',
                    color: isMe ? 'var(--ink)' : '#fff',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isMe ? '2px solid rgba(200,242,48,0.4)' : '2px solid rgba(255,85,51,0.4)',
                    position: 'relative',
                  }}>
                    {initial}
                    {/* Live dot */}
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: '#34d399', border: '1.5px solid #0c0c10' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: isMe ? 'var(--lime)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(245,244,240,0.35)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.address
                        ? user.address.split(',')[0]
                        : user.latitude ? `${user.latitude.toFixed(4)}°N` : 'No location'}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Footer ── */}
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
          Scroll to zoom · Click pin for info · Leaflet + OpenStreetMap
        </div>
      </div>
    </div>
  )
}