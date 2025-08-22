-- Add policy to allow viewing public profiles for user discovery
-- This allows the RecommendedUsers component to work properly

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies that allow viewing own profile AND public profiles
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON profiles 
FOR SELECT USING (is_public = true);

-- Also allow viewing basic profile info for followers/following functionality
CREATE POLICY "Users can view followed profiles" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() 
    AND following_id = profiles.id
  )
);
