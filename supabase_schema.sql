-- ── SUPABASE LEADERBOARD SCHEMA ─────────────────────
-- Run this in your Supabase SQL Editor

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_balance ON public.leaderboard(balance DESC);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Allow anyone to read leaderboard"
ON public.leaderboard
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert/update (upsert)
CREATE POLICY "Allow anyone to upsert leaderboard"
ON public.leaderboard
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow anyone to update leaderboard"
ON public.leaderboard
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Enable Realtime for the leaderboard table
-- Run this in Supabase Dashboard > Database > Replication
-- Or enable via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;

-- Sample data (optional)
-- INSERT INTO public.leaderboard (name, balance, games_played, wins) VALUES
--   ('Lucky777', 50000, 150, 85),
--   ('HighRoller', 35000, 200, 110),
--   ('CasinoKing', 25000, 100, 55);
