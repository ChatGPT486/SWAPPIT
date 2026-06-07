/**
 * useLocation.js
 * 
 * Custom hook that:
 *   1. Requests the browser's Geolocation API
 *   2. Pushes coordinates to Supabase user_locations table every 30s
 *   3. Marks user offline on page close/unmount
 *   4. Returns { granted, error } so UI can show permission prompts
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import supabase from './supabase'

export function useLocationTracking(currentUser) {
  const [granted,  setGranted]  = useState(null)   // null=unknown, true, false
  const [myCoords, setMyCoords] = useState(null)
  const [error,    setError]    = useState(null)
  const intervalRef = useRef(null)
  const watchRef    = useRef(null)

  const pushLocation = useCallback(async (position) => {
    if (!currentUser?.id) return
    const { latitude, longitude } = position.coords
    setMyCoords({ latitude, longitude })

    await supabase.upsertLocation({
      userId:    currentUser.id,
      email:     currentUser.email,
      firstName: currentUser.firstName || currentUser.first_name || '',
      latitude,
      longitude,
    }).catch(() => {})  // silent — don't block the app if Supabase isn't configured
  }, [currentUser?.id])

  const markOffline = useCallback(async () => {
    if (!currentUser?.id) return
    await supabase.setOffline(currentUser.id).catch(() => {})
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id || !supabase.isConfigured()) return

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setGranted(false)
      return
    }

    // Ask for permission and start watching
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGranted(true)
        setError(null)
        pushLocation(position)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGranted(false)
          setError('Location permission denied. Others won\'t see you on the live map.')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    )

    // Refresh location in Supabase every 30s to keep last_seen fresh
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pushLocation, () => {}, { maximumAge: 60000 })
    }, 30000)

    // Mark offline on tab close / refresh
    const handleUnload = () => { markOffline() }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (watchRef.current    != null) navigator.geolocation.clearWatch(watchRef.current)
      if (intervalRef.current != null) clearInterval(intervalRef.current)
      window.removeEventListener('beforeunload', handleUnload)
      markOffline()
    }
  }, [currentUser?.id, pushLocation, markOffline])

  return { granted, myCoords, error }
}
