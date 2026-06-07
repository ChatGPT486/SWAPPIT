/**
 * supabase.js
 * 
 * Supabase client — used ONLY for:
 *   1. Realtime presence (live user location on map)
 *
 * All business data (users, items, exchanges) still goes through Django REST API.
 * Supabase handles the websocket/realtime layer that Django can't do natively.
 *
 * Setup:
 *   1. Go to https://supabase.com → create a project
 *   2. Dashboard → Settings → API → copy Project URL and anon key
 *   3. Paste into Frontend/.env as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 *   4. Run the SQL in supabase_setup.sql in Supabase SQL Editor
 */

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// ── Lightweight Supabase client (no npm package needed — uses fetch + WebSocket)
class SupabaseClient {
  constructor(url, key) {
    this.url = url
    this.key = key
    this.channels = new Map()
  }

  isConfigured() {
    return Boolean(this.url && this.key)
  }

  // ── REST API helper ──────────────────────────────────────────────────────
  async _rest(method, path, body = null) {
    const res = await fetch(`${this.url}/rest/v1${path}`, {
      method,
      headers: {
        'apikey':        this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type':  'application/json',
        'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
      },
      body: body ? JSON.stringify(body) : null,
    })
    if (method === 'DELETE' || res.status === 204) return null
    return res.json()
  }

  // ── Realtime channel ──────────────────────────────────────────────────────
  channel(name) {
    return new RealtimeChannel(this.url, this.key, name)
  }

  // ── user_locations table helpers ─────────────────────────────────────────

  /** Upsert my location into user_locations table */
  async upsertLocation({ userId, email, firstName, latitude, longitude }) {
    if (!this.isConfigured()) return
    return this._rest('POST', '/user_locations', {
      user_id:    userId,
      email:      email,
      first_name: firstName,
      latitude,
      longitude,
      last_seen:  new Date().toISOString(),
      is_online:  true,
    })
  }

  /** Mark myself as offline when leaving */
  async setOffline(userId) {
    if (!this.isConfigured()) return
    return this._rest('PATCH', `/user_locations?user_id=eq.${userId}`, {
      is_online: false,
      last_seen: new Date().toISOString(),
    })
  }

  /** Fetch all currently online users */
  async getOnlineUsers() {
    if (!this.isConfigured()) return []
    // Consider online if last_seen within 2 minutes
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const data = await this._rest('GET',
      `/user_locations?is_online=eq.true&last_seen=gte.${cutoff}&select=*`)
    return Array.isArray(data) ? data : []
  }

  /** Subscribe to real-time changes on user_locations */
  subscribeToLocations(callback) {
    if (!this.isConfigured()) return { unsubscribe: () => {} }
    const ch = new RealtimeChannel(this.url, this.key, 'user_locations_changes')
    ch.on('postgres_changes',
      { event: '*', schema: 'public', table: 'user_locations' },
      callback
    ).subscribe()
    return ch
  }
}

// ── Minimal Realtime channel implementation using Supabase WS protocol ────────
class RealtimeChannel {
  constructor(url, key, name) {
    this.wsUrl   = url.replace('https://', 'wss://').replace('http://', 'ws://')
    this.key     = key
    this.name    = name
    this.ws      = null
    this.handlers = []
    this.ref      = 1
  }

  on(event, filter, callback) {
    this.handlers.push({ event, filter, callback })
    return this
  }

  subscribe() {
    if (!this.wsUrl) return this
    try {
      this.ws = new WebSocket(`${this.wsUrl}/realtime/v1/websocket?apikey=${this.key}&vsn=1.0.0`)

      this.ws.onopen = () => {
        // Join the channel
        this.ws.send(JSON.stringify({
          topic:   `realtime:${this.name}`,
          event:   'phx_join',
          payload: {
            config: {
              broadcast: { self: true },
              postgres_changes: this.handlers
                .filter(h => h.event === 'postgres_changes')
                .map(h => h.filter),
            },
          },
          ref: String(this.ref++),
        }))

        // Heartbeat every 25s
        this._heartbeat = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(this.ref++) }))
          }
        }, 25000)
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.event === 'postgres_changes') {
            this.handlers.forEach(h => {
              if (h.event === 'postgres_changes') h.callback(msg.payload)
            })
          }
        } catch {}
      }

      this.ws.onerror = () => {}
      this.ws.onclose = () => { if (this._heartbeat) clearInterval(this._heartbeat) }
    } catch {}
    return this
  }

  unsubscribe() {
    if (this._heartbeat) clearInterval(this._heartbeat)
    if (this.ws) {
      try { this.ws.close() } catch {}
      this.ws = null
    }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export default supabase


// ── Supabase Storage — image uploads ─────────────────────────────────────────
/**
 * Upload an image file to Supabase Storage bucket "item-images"
 * Returns the public URL or null on failure.
 *
 * Setup: Supabase Dashboard → Storage → New bucket → name: "item-images" → Public
 */
SupabaseClient.prototype.uploadItemImage = async function(file, userId) {
  if (!this.isConfigured()) return null
  try {
    const ext      = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/${Date.now()}.${ext}`

    const res = await fetch(
      `${this.url}/storage/v1/object/item-images/${filename}`,
      {
        method:  'POST',
        headers: {
          'apikey':          this.key,
          'Authorization':   `Bearer ${this.key}`,
          'Content-Type':    file.type || 'image/jpeg',
          'x-upsert':        'true',
        },
        body: file,
      }
    )
    if (!res.ok) return null

    // Return the public URL
    return `${this.url}/storage/v1/object/public/item-images/${filename}`
  } catch {
    return null
  }
}

/**
 * Upload avatar photo to Supabase Storage bucket "avatars"
 */
SupabaseClient.prototype.uploadAvatar = async function(file, userId) {
  if (!this.isConfigured()) return null
  try {
    const ext      = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}.${ext}`

    const res = await fetch(
      `${this.url}/storage/v1/object/avatars/${filename}`,
      {
        method:  'POST',
        headers: {
          'apikey':        this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type':  file.type || 'image/jpeg',
          'x-upsert':      'true',
        },
        body: file,
      }
    )
    if (!res.ok) return null
    return `${this.url}/storage/v1/object/public/avatars/${filename}`
  } catch {
    return null
  }
}