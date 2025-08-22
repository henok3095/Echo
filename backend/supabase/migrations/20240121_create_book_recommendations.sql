-- Create book_recommendations table
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommended_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_entry_id UUID REFERENCES media_entries(id) ON DELETE CASCADE,
  book_title TEXT,
  book_author TEXT,
  poster_path TEXT,
  description TEXT,
  recommendation_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_recommendations_user_id ON book_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_recommended_by ON book_recommendations(recommended_by_user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_status ON book_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_created_at ON book_recommendations(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view recommendations for them" ON book_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view recommendations they made" ON book_recommendations
  FOR SELECT USING (auth.uid() = recommended_by_user_id);

CREATE POLICY "Users can create recommendations" ON book_recommendations
  FOR INSERT WITH CHECK (auth.uid() = recommended_by_user_id);

CREATE POLICY "Users can update recommendations for them" ON book_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update recommendations they made" ON book_recommendations
  FOR UPDATE USING (auth.uid() = recommended_by_user_id);

-- Create updated_at trigger
CREATE TRIGGER update_book_recommendations_updated_at 
  BEFORE UPDATE ON book_recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
