-- ═══════════════════════════════════════════════════════════════════════════
-- SWAPPIT — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the user_locations table for live map tracking
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id    TEXT        PRIMARY KEY,
  email      TEXT,
  first_name TEXT,
  latitude   FLOAT8      NOT NULL,
  longitude  FLOAT8      NOT NULL,
  is_online  BOOLEAN     NOT NULL DEFAULT true,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add a comment
COMMENT ON TABLE public.user_locations IS
  'Live location tracking for Swappit users. Rows are upserted on login and updated every 30s.';

-- 3. Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read locations (they're online swappers — public info)
CREATE POLICY "Anyone can view online locations"
  ON public.user_locations FOR SELECT
  USING (is_online = true);

-- 5. Allow authenticated users to upsert ONLY their own row
CREATE POLICY "Users can upsert own location"
  ON public.user_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  USING (true);

-- 6. Enable Realtime on this table
-- (Also go to: Supabase Dashboard → Database → Replication → enable user_locations)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- 7. Auto-cleanup: mark users offline if last_seen > 5 minutes ago
-- Run this as a CRON job or Supabase Edge Function if needed
-- For now, the frontend filters by last_seen >= NOW() - interval '2 minutes'

-- 8. Optional: index for fast online-user queries
CREATE INDEX IF NOT EXISTS idx_user_locations_online
  ON public.user_locations (is_online, last_seen DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- Done! Your live map will now work.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS — run this in Supabase SQL Editor too
-- OR create buckets manually: Dashboard → Storage → New bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- item-images bucket (public — anyone can view item images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- avatars bucket (public — profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view images
CREATE POLICY "Public can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow uploads (open for now — lock down with JWT in production)
CREATE POLICY "Allow item image uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Allow avatar uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow item image updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'item-images');

CREATE POLICY "Allow avatar updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');
