-- Add show_music visibility flag to profiles
BEGIN;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_music boolean DEFAULT true;

-- Backfill nulls to true for consistency
UPDATE profiles
SET show_music = true
WHERE show_music IS NULL;

COMMIT;
