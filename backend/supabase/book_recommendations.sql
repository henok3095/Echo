-- Book Recommendations System
-- This creates tables for book recommendations and reading progress

-- Book recommendations table - integrated with existing media_entries
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  media_entry_id UUID REFERENCES media_entries(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_isbn TEXT,
  google_books_id TEXT,
  poster_path TEXT,
  description TEXT,
  recommendation_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading progress table for tracking progress on current books
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES media_entries(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_read_date DATE DEFAULT CURRENT_DATE,
  reading_goal_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Reading activity log for detailed tracking
CREATE TABLE IF NOT EXISTS reading_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES media_entries(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('started', 'progress_update', 'finished', 'paused', 'resumed')),
  pages_read INTEGER DEFAULT 0,
  minutes_read INTEGER DEFAULT 0,
  activity_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_recommendations_user_id ON book_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_status ON book_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_activity_user_id ON reading_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_activity_date ON reading_activity(activity_date);

-- Row Level Security
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activity ENABLE ROW LEVEL SECURITY;

-- Policies for book_recommendations
CREATE POLICY "Users can view their own recommendations" ON book_recommendations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create recommendations for others" ON book_recommendations
  FOR INSERT WITH CHECK (recommended_by_user_id = auth.uid());

CREATE POLICY "Users can update their own recommendations" ON book_recommendations
  FOR UPDATE USING (user_id = auth.uid());

-- Policies for reading_progress
CREATE POLICY "Users can manage their own reading progress" ON reading_progress
  FOR ALL USING (user_id = auth.uid());

-- Policies for reading_activity
CREATE POLICY "Users can manage their own reading activity" ON reading_activity
  FOR ALL USING (user_id = auth.uid());

-- Function to update reading progress percentage
CREATE OR REPLACE FUNCTION update_reading_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_pages > 0 THEN
    NEW.progress_percentage = (NEW.current_page::DECIMAL / NEW.total_pages::DECIMAL) * 100;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate progress percentage
CREATE TRIGGER trigger_update_reading_progress_percentage
  BEFORE UPDATE ON reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_progress_percentage();
