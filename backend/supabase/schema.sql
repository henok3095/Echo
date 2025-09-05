CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Life',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Not Started',
  due_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE media_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'to_watch',
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  review TEXT,
  tags TEXT[],
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  mood TEXT DEFAULT 'neutral',
  tags TEXT[],
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'thought',
  tags TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own media entries" ON media_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media entries" ON media_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media entries" ON media_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media entries" ON media_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view follows" ON follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can insert follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add TMDB fields to existing media_entries table
ALTER TABLE media_entries 
ADD COLUMN director TEXT,
ADD COLUMN poster_path TEXT,
ADD COLUMN release_date DATE,
ADD COLUMN overview TEXT,
ADD COLUMN popularity INTEGER,
ADD COLUMN tmdb_id INTEGER;


ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_tasks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_memories BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;


CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();


CREATE OR REPLACE FUNCTION can_view_content(owner_id UUID, viewer_id UUID, content_visibility TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_public BOOLEAN;
    is_following BOOLEAN;
BEGIN
    IF owner_id = viewer_id THEN
        RETURN TRUE;
    END IF;
    
    SELECT p.is_public INTO is_public FROM profiles p WHERE p.id = owner_id;
    IF is_public THEN
        RETURN TRUE;
    END IF;
    
    IF content_visibility = 'public' THEN
        RETURN TRUE;
    END IF;
    
    IF content_visibility = 'followers' THEN
        SELECT EXISTS (
            SELECT 1 FROM follows WHERE follower_id = viewer_id AND following_id = owner_id
        ) INTO is_following;
        RETURN is_following;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE POLICY "Users can view media entries with visibility rules"
ON media_entries
FOR SELECT
USING (can_view_content(user_id, auth.uid(), visibility));


ALTER TABLE follows
  DROP CONSTRAINT IF EXISTS follows_follower_id_fkey,
  DROP CONSTRAINT IF EXISTS follows_following_id_fkey;


  ALTER TABLE follows
  ADD CONSTRAINT follows_follower_id_fkey
    FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT follows_following_id_fkey
    FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE;


    CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Social/music extensions
-- Add Last.fm username to profiles for music features
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lastfm_username TEXT;

-- Social links stored as JSONB: { website, twitter, instagram, github }
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Allow viewing public profiles (in addition to own profile policy above)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view public profiles'
  ) THEN
    CREATE POLICY "Users can view public profiles" ON profiles
      FOR SELECT
      USING (is_public = true);
  END IF;
END $$;

-- Reactions on activities
CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('love','fire','groove','mind_blown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id, type)
);

ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Only the reacting user can insert/delete their reactions; anyone can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_reactions'
      AND policyname = 'Activity reactions are viewable'
  ) THEN
    CREATE POLICY "Activity reactions are viewable" ON activity_reactions
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_reactions'
      AND policyname = 'Users can react as themselves'
  ) THEN
    CREATE POLICY "Users can react as themselves" ON activity_reactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_reactions'
      AND policyname = 'Users can remove their reactions'
  ) THEN
    CREATE POLICY "Users can remove their reactions" ON activity_reactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_reactions_activity_idx ON activity_reactions (activity_id);
CREATE INDEX IF NOT EXISTS activity_reactions_user_idx ON activity_reactions (user_id);

-- Function to get mutual friends (users who follow each other)
CREATE OR REPLACE FUNCTION get_mutual_friends(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_public
  FROM profiles p
  WHERE p.id IN (
    -- Get users I follow who also follow me back (mutual follows)
    SELECT f1.following_id
    FROM follows f1
    WHERE f1.follower_id = user_id
    AND EXISTS (
      SELECT 1 
      FROM follows f2 
      WHERE f2.follower_id = f1.following_id 
      AND f2.following_id = user_id
    )
  )
  AND p.id != user_id; -- Exclude self
END;
$$;

-- Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,         -- e.g., milestone_total_scrobbles, streak_30, genre_mastery_rock
  label TEXT NOT NULL,        -- display label
  icon TEXT DEFAULT '🏆',     -- emoji or identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_achievements' AND policyname='Achievements are viewable'
  ) THEN
    CREATE POLICY "Achievements are viewable" ON user_achievements
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_achievements' AND policyname='Users can insert their achievements'
  ) THEN
    CREATE POLICY "Users can insert their achievements" ON user_achievements
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_achievements' AND policyname='Users can delete their achievements'
  ) THEN
    CREATE POLICY "Users can delete their achievements" ON user_achievements
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;