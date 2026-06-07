/**
 * useLocation.js
 *
 * Tracks precise GPS location and pushes to Supabase every 30s.
 * Uses HIGH accuracy mode for street-level precision.
 * Also does reverse geocoding via OpenStreetMap Nominatim (free, no API key)
 * so we can show "ICT University, Yaoundé" instead of raw coordinates.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import supabase from './supabase'

// Reverse geocode: lat/lng → human-readable address (free, no key needed)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Swappit/1.0' } }
    )
    const data = await res.json()
    if (!data || data.error) return null

    // Build a human-readable short address
    const a = data.address || {}
    const parts = [
      a.amenity || a.building || a.shop || a.office || a.university || a.school,
      a.road || a.street || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.municipality,
    ].filter(Boolean)

    return {
      display: parts.slice(0, 3).join(', ') || data.display_name?.split(',').slice(0, 2).join(',').trim(),
      full:    data.display_name,
      city:    a.city || a.town || a.village || '',
      country: a.country || '',
    }
  } catch {
    return null
  }
}

export function useLocationTracking(currentUser) {
  const [granted,  setGranted]  = useState(null)
  const [myCoords, setMyCoords] = useState(null)
  const [address,  setAddress]  = useState(null)   // human-readable place name
  const [error,    setError]    = useState(null)
  const watchRef    = useRef(null)
  const intervalRef = useRef(null)
  const lastGeocode = useRef(0)   // throttle geocode calls

  const pushLocation = useCallback(async (position) => {
    if (!currentUser?.id) return
    const { latitude, longitude, accuracy } = position.coords
    setMyCoords({ latitude, longitude, accuracy })

    // Reverse geocode (throttled — max once per 60s)
    const now = Date.now()
    let place = null
    if (now - lastGeocode.current > 60000) {
      lastGeocode.current = now
      place = await reverseGeocode(latitude, longitude)
      if (place) setAddress(place)
    }

    // Push to Supabase
    await supabase.upsertLocation({
      userId:    currentUser.id,
      email:     currentUser.email     || '',
      firstName: currentUser.firstName || currentUser.first_name || '',
      latitude,
      longitude,
      accuracy:  Math.round(accuracy || 0),
      address:   place?.display || address?.display || '',
    }).catch(() => {})
  }, [currentUser?.id, address])

  const markOffline = useCallback(async () => {
    if (!currentUser?.id) return
    await supabase.setOffline(currentUser.id).catch(() => {})
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id || !supabase.isConfigured()) return
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.')
      setGranted(false)
      return
    }

    // HIGH accuracy for street-level precision
    const geoOptions = {
      enableHighAccuracy: true,   // use GPS chip, not IP/WiFi only
      timeout:            15000,
      maximumAge:         10000,  // cache for 10s max
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGranted(true)
        setError(null)
        pushLocation(pos)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGranted(false)
          setError('Location permission denied.')
        } else if (err.code === err.TIMEOUT) {
          // Timeout is ok — keep watching
        }
      },
      geoOptions
    )

    // Heartbeat every 30s to keep last_seen fresh
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pushLocation, () => {}, geoOptions)
    }, 30000)

    const handleUnload = () => markOffline()
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (watchRef.current    != null) navigator.geolocation.clearWatch(watchRef.current)
      if (intervalRef.current != null) clearInterval(intervalRef.current)
      window.removeEventListener('beforeunload', handleUnload)
      markOffline()
    }
  }, [currentUser?.id, pushLocation, markOffline])

  return { granted, myCoords, address, error }
}