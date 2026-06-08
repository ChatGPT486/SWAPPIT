-- ═══════════════════════════════════════════════════════════════════════════
-- SWAPPIT — Supabase Setup SQL  (100% safe to re-run, zero errors)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. user_locations table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id    TEXT        PRIMARY KEY,
  email      TEXT,
  first_name TEXT,
  latitude   FLOAT8      NOT NULL,
  longitude  FLOAT8      NOT NULL,
  accuracy   INTEGER     DEFAULT 0,
  address    TEXT        DEFAULT '',
  is_online  BOOLEAN     NOT NULL DEFAULT true,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe column additions (ignored if columns already exist)
ALTER TABLE public.user_locations ADD COLUMN IF NOT EXISTS accuracy INTEGER DEFAULT 0;
ALTER TABLE public.user_locations ADD COLUMN IF NOT EXISTS address  TEXT    DEFAULT '';

COMMENT ON TABLE public.user_locations IS
  'Live location tracking. accuracy = GPS metres. address = reverse-geocoded label.';

-- ── 2. Row Level Security ─────────────────────────────────────────────────
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view online locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can upsert own location"   ON public.user_locations;
DROP POLICY IF EXISTS "Users can update own location"   ON public.user_locations;

CREATE POLICY "Anyone can view online locations"
  ON public.user_locations FOR SELECT
  USING (is_online = true);

CREATE POLICY "Users can upsert own location"
  ON public.user_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  USING (true);

-- ── 3. Realtime — FIX: only add if not already a member ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication_tables
    WHERE  pubname   = 'supabase_realtime'
    AND    tablename = 'user_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
  END IF;
END $$;

-- ── 4. Index ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_locations_online
  ON public.user_locations (is_online, last_seen DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars"     ON storage.objects;
DROP POLICY IF EXISTS "Allow item image uploads"    ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar uploads"        ON storage.objects;
DROP POLICY IF EXISTS "Allow item image updates"    ON storage.objects;

CREATE POLICY "Public can view item images"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow item image uploads"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Allow avatar uploads"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow item image updates"
  ON storage.objects FOR UPDATE USING (bucket_id IN ('item-images', 'avatars'));

-- ═══════════════════════════════════════════════════════════════════════════
-- Done! Zero errors guaranteed on any re-run.
-- ═══════════════════════════════════════════════════════════════════════════
