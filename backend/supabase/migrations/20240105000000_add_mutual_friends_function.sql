-- Migration to add get_mutual_friends function
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
