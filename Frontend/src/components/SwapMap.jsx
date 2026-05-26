import { useState, useEffect, useRef } from 'react'
import { MAPBOX_TOKEN, DEFAULT_MAP_CENTER } from '../config/ai'

// ─────────────────────────────────────────────────────────────────────────────
//  SwapMap — Location sharing & meeting point for accepted exchanges
//  Uses Mapbox GL JS loaded from CDN (no npm install needed)
// ─────────────────────────────────────────────────────────────────────────────

export default function SwapMap({ exchange, currentUser, partner, onClose }) {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const watchId      = useRef(null)

  const [myLocation, setMyLocation]         = useState(null)
  const [partnerLocation, setPartnerLocation] = useState(null) // simulated for demo
  const [sharing, setSharing]               = useState(false)
  const [mapLoaded, setMapLoaded]           = useState(false)
  const [mapError, setMapError]             = useState('')
  const [geoError, setGeoError]             = useState('')
  const [distance, setDistance]             = useState(null)
  const [meetingPoint, setMeetingPoint]     = useState(null)
  const [copied, setCopied]                 = useState(false)

  const hasToken = !!MAPBOX_TOKEN

  // ── Load Mapbox GL JS from CDN ────────────────────────────────────────────
  useEffect(() => {
    if (!hasToken) return

    const loadMapbox = () => {
      if (window.mapboxgl) { initMap(); return }

      // Load CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
      document.head.appendChild(link)

      // Load JS
      const script = document.createElement('script')
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
      script.onload = initMap
      script.onerror = () => setMapError('Failed to load Mapbox. Check your internet connection.')
      document.head.appendChild(script)
    }

    const initMap = () => {
      if (!mapContainer.current || mapRef.current) return
      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN
        mapRef.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: DEFAULT_MAP_CENTER,
          zoom: 12,
        })
        mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.on('load', () => setMapLoaded(true))
      } catch (e) {
        setMapError('Map failed to initialize. Check your Mapbox token.')
      }
    }

    loadMapbox()

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [hasToken])

  // ── Add/update markers when locations change ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // My marker (blue)
    if (myLocation) {
      const el = document.createElement('div')
      el.style.cssText = `width:36px;height:36px;border-radius:50%;background:var(--accent);border:3px solid #fff;box-shadow:0 2px 12px rgba(232,82,31,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;cursor:pointer;`
      el.innerHTML = currentUser.firstName[0]
      el.title = 'Your location'

      if (window._myMarker) window._myMarker.remove()
      window._myMarker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([myLocation.lng, myLocation.lat])
        .setPopup(new window.mapboxgl.Popup({ offset: 20 }).setHTML(`<strong>📍 Your location</strong>`))
        .addTo(mapRef.current)
    }

    // Partner marker (dark) — simulated nearby for demo
    if (partnerLocation) {
      const el = document.createElement('div')
      el.style.cssText = `width:36px;height:36px;border-radius:50%;background:var(--ink);border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;cursor:pointer;`
      el.innerHTML = partner.firstName[0]
      el.title = `${partner.firstName}'s location`

      if (window._partnerMarker) window._partnerMarker.remove()
      window._partnerMarker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([partnerLocation.lng, partnerLocation.lat])
        .setPopup(new window.mapboxgl.Popup({ offset: 20 }).setHTML(`<strong>📍 ${partner.firstName} ${partner.lastName}</strong>`))
        .addTo(mapRef.current)

      // Draw route line between the two
      if (myLocation) drawRoute(myLocation, partnerLocation)
    }

    // Meeting point marker
    if (meetingPoint) {
      const el = document.createElement('div')
      el.style.cssText = `width:32px;height:32px;border-radius:50%;background:#fff;border:3px solid var(--green);box-shadow:0 2px 10px rgba(22,163,74,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;`
      el.innerHTML = '🤝'

      if (window._meetMarker) window._meetMarker.remove()
      window._meetMarker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([meetingPoint.lng, meetingPoint.lat])
        .setPopup(new window.mapboxgl.Popup({ offset: 20 }).setHTML('<strong>🤝 Suggested meeting point</strong>'))
        .addTo(mapRef.current)
    }
  }, [myLocation, partnerLocation, meetingPoint, mapLoaded])

  // ── Draw route between two points ─────────────────────────────────────────
  const drawRoute = async (from, to) => {
    if (!MAPBOX_TOKEN || !mapRef.current) return
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      )
      const data = await res.json()
      const route = data.routes?.[0]

      if (route) {
        const dist = (route.distance / 1000).toFixed(1)
        setDistance(dist)

        if (mapRef.current.getSource('route')) {
          mapRef.current.getSource('route').setData(route.geometry)
        } else {
          mapRef.current.addSource('route', { type: 'geojson', data: route.geometry })
          mapRef.current.addLayer({
            id: 'route', type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#e8521f', 'line-width': 4, 'line-dasharray': [2, 1] },
          })
        }
      }
    } catch (_) { /* route fetch failed silently */ }
  }

  // ── Start sharing location ─────────────────────────────────────────────────
  const startSharing = () => {
    if (!navigator.geolocation) { setGeoError('Your browser does not support location sharing.'); return }
    setSharing(true); setGeoError('')

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMyLocation(loc)

        // Simulate partner nearby (300-800m away) — replace with real-time DB in production
        if (!partnerLocation) {
          setPartnerLocation({
            lat: loc.lat + (Math.random() - 0.5) * 0.008,
            lng: loc.lng + (Math.random() - 0.5) * 0.008,
          })
        }

        if (mapRef.current) mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 15, duration: 1200 })
      },
      (err) => {
        setGeoError('Location access denied. Please enable location in your browser settings.')
        setSharing(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  const stopSharing = () => {
    if (watchId.current) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null }
    setSharing(false)
  }

  // ── Suggest a midpoint between users ──────────────────────────────────────
  const suggestMeetingPoint = () => {
    if (!myLocation || !partnerLocation) return
    setMeetingPoint({
      lat: (myLocation.lat + partnerLocation.lat) / 2,
      lng: (myLocation.lng + partnerLocation.lng) / 2,
    })
    if (mapRef.current) mapRef.current.flyTo({
      center: [(myLocation.lng + partnerLocation.lng) / 2, (myLocation.lat + partnerLocation.lat) / 2],
      zoom: 14, duration: 1000,
    })
  }

  // ── Copy location link ─────────────────────────────────────────────────────
  const copyLocationLink = () => {
    if (!myLocation) return
    const url = `https://maps.google.com/maps?q=${myLocation.lat},${myLocation.lng}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Open in Google Maps for navigation ────────────────────────────────────
  const openNavigation = () => {
    if (!partnerLocation) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${partnerLocation.lat},${partnerLocation.lng}&travelmode=walking`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'fadeIn 0.15s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 700,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>📍 Meet to Swap</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>
              Share your location with <strong>{partner.firstName} {partner.lastName}</strong> to arrange your meeting
            </p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface)', color: 'var(--ink-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* No token state */}
        {!hasToken ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Map not configured yet</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 420, marginBottom: 24 }}>
              To enable the live map, add your free Mapbox token to the <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>.env</code> file.
            </p>
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: 'var(--ink-light)', textAlign: 'left', width: '100%', maxWidth: 420, marginBottom: 20 }}>
              <div style={{ color: 'var(--ink-muted)', marginBottom: 6, fontFamily: 'var(--font-body)', fontSize: 11 }}># In your .env file:</div>
              VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi...
            </div>
            <a href="https://account.mapbox.com" target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '11px 24px', borderRadius: 'var(--radius-pill)',
              background: 'var(--ink)', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
            }}>Get Free Mapbox Token →</a>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 12 }}>Free tier: 50,000 map loads/month</p>

            {/* Fallback: share Google Maps link */}
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)', width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 14 }}>In the meantime, share your location via Google Maps:</p>
              <GoogleMapsShare partner={partner} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Control bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
              {!sharing ? (
                <button onClick={startSharing} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent)', color: '#fff',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >📍 Share My Location</button>
              ) : (
                <button onClick={stopSharing} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--red-soft)', color: 'var(--red)',
                  border: '1.5px solid rgba(220,38,38,0.2)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                }}>⏹ Stop Sharing</button>
              )}

              {myLocation && partnerLocation && (
                <>
                  <button onClick={suggestMeetingPoint} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', background: 'var(--green-soft)', color: 'var(--green)', border: '1.5px solid rgba(22,163,74,0.2)', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    🤝 Suggest Midpoint
                  </button>
                  <button onClick={openNavigation} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', background: 'var(--surface)', color: 'var(--ink)', border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    🧭 Navigate There
                  </button>
                </>
              )}

              {myLocation && (
                <button onClick={copyLocationLink} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', background: copied ? 'var(--green-soft)' : 'var(--surface)', color: copied ? 'var(--green)' : 'var(--ink-muted)', border: `1.5px solid ${copied ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`, fontWeight: 600, fontSize: 13, transition: 'all var(--transition)' }}>
                  {copied ? '✓ Copied!' : '🔗 Copy Link'}
                </button>
              )}

              {distance && (
                <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
                  📏 {distance} km away
                </div>
              )}
            </div>

            {/* Errors */}
            {(geoError || mapError) && (
              <div style={{ padding: '10px 16px', background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, borderBottom: '1px solid rgba(220,38,38,0.15)' }}>
                ⚠️ {geoError || mapError}
              </div>
            )}

            {/* Map */}
            <div ref={mapContainer} style={{ flex: 1, minHeight: 320 }} />

            {/* Legend */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
              {[
                { color: 'var(--accent)', label: `You (${currentUser.firstName})` },
                { color: 'var(--ink)', label: `${partner.firstName} ${partner.lastName}` },
                { color: 'var(--green)', label: 'Meeting point' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{l.label}</span>
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-muted)' }}>
                {!sharing && !myLocation ? 'Click "Share My Location" to appear on the map' : sharing ? '🟢 Live · updating every 5s' : '🔴 Sharing stopped'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Fallback: Google Maps share (no Mapbox token needed) ──────────────────────
function GoogleMapsShare({ partner }) {
  const [loc, setLoc]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')

  const getLocation = () => {
    setLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false) },
      () => { setError('Location access denied.'); setLoading(false) }
    )
  }

  const copyLink = () => {
    if (!loc) return
    navigator.clipboard.writeText(`https://maps.google.com/maps?q=${loc.lat},${loc.lng}`)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!loc ? (
        <button onClick={getLocation} disabled={loading} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-pill)',
          background: loading ? 'var(--border)' : 'var(--ink)', color: loading ? 'var(--ink-muted)' : '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
        }}>{loading ? 'Getting location…' : '📍 Get My Location'}</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: 'var(--green-soft)', borderRadius: 10, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            ✓ Location ready: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLink} style={{ flex: 1, padding: '9px', borderRadius: 8, background: copied ? 'var(--green)' : 'var(--ink)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, transition: 'background var(--transition)' }}>
              {copied ? '✓ Copied!' : '🔗 Copy Google Maps Link'}
            </button>
            <a href={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer" style={{ padding: '9px 14px', borderRadius: 8, background: 'var(--surface)', border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center' }}>
              Open ↗
            </a>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
            Copy this link and send it to <strong>{partner.firstName}</strong> via WhatsApp or SMS so they can navigate to your location.
          </p>
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--red)' }}>⚠️ {error}</p>}
    </div>
  )
}
