-- Add social links JSONB to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;


