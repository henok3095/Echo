-- Create watching_sessions table
CREATE TABLE IF NOT EXISTS watching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media_entries(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  minutes INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watching_sessions_user_id ON watching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_watching_sessions_media_id ON watching_sessions(media_id);
CREATE INDEX IF NOT EXISTS idx_watching_sessions_date ON watching_sessions(date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_watching_sessions_media_episode ON watching_sessions(media_id, season_number, episode_number, user_id);

-- Enable RLS
ALTER TABLE watching_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watching sessions" ON watching_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watching sessions" ON watching_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watching sessions" ON watching_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watching sessions" ON watching_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger (reuse function if present or create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watching_sessions_updated_at 
  BEFORE UPDATE ON watching_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
