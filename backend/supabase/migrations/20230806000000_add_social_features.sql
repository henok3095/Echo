-- Add profile visibility settings to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_tasks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_journal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_memories BOOLEAN DEFAULT false;

-- Add follower/following counts to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create a function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the user being followed
        UPDATE profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.following_id;
        
        -- Increment following count for the follower
        UPDATE profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the user being unfollowed
        UPDATE profiles 
        SET follower_count = GREATEST(0, follower_count - 1) 
        WHERE id = OLD.following_id;
        
        -- Decrement following count for the user who unfollowed
        UPDATE profiles 
        SET following_count = GREATEST(0, following_count - 1) 
        WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Create a function to check if a user can view another user's content
CREATE OR REPLACE FUNCTION can_view_content(owner_id UUID, viewer_id UUID, content_visibility TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_public BOOLEAN;
    is_following BOOLEAN;
BEGIN
    -- If the viewer is the owner, always allow access
    IF owner_id = viewer_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check if the owner's profile is public
    SELECT p.is_public INTO is_public
    FROM profiles p
    WHERE p.id = owner_id;
    
    -- If profile is public, allow access
    IF is_public THEN
        RETURN TRUE;
    END IF;
    
    -- If content is set to public, allow access
    IF content_visibility = 'public' THEN
        RETURN TRUE;
    END IF;
    
    -- If content is set to followers only, check if viewer is following
    IF content_visibility = 'followers' THEN
        SELECT EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = viewer_id AND following_id = owner_id
        ) INTO is_following;
        
        RETURN is_following;
    END IF;
    
    -- Default to private
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to respect visibility settings
CREATE OR REPLACE FUNCTION get_visible_media_entries(user_id UUID)
RETURNS SETOF media_entries AS $$
BEGIN
    RETURN QUERY
    SELECT me.*
    FROM media_entries me
    JOIN profiles p ON me.user_id = p.id
    WHERE me.user_id = user_id
    AND (
        me.user_id = auth.uid() OR
        me.visibility = 'public' OR
        (me.visibility = 'followers' AND EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = auth.uid() AND following_id = me.user_id
        ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own media entries" ON media_entries;
DROP POLICY IF EXISTS "Users can view public media entries" ON media_entries;

-- Create new policies with visibility support
CREATE POLICY "Users can view own media entries" 
ON media_entries 
FOR SELECT 
USING (user_id = auth.uid() OR can_view_content(user_id, auth.uid(), visibility));

-- Create a view for user profiles with follow status
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    p.*,
    u.email,
    u.created_at as user_created_at,
    EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND following_id = p.id
    ) as is_followed_by_me,
    EXISTS (
        SELECT 1 FROM follows 
        WHERE following_id = auth.uid() AND follower_id = p.id
    ) as is_following_me
FROM profiles p
JOIN auth.users u ON p.id = u.id;

-- Enable RLS on the view
ALTER VIEW user_profiles OWNER TO authenticated;

-- Create a function to get user's feed (posts from users they follow)
CREATE OR REPLACE FUNCTION get_user_feed()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    content_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    -- Journal entries from followed users
    SELECT 
        je.id,
        je.user_id,
        p.username,
        p.avatar_url,
        je.title || ': ' || LEFT(je.content, 100) || '...' as content,
        'journal' as content_type,
        je.created_at,
        je.updated_at
    FROM journal_entries je
    JOIN profiles p ON je.user_id = p.id
    JOIN follows f ON je.user_id = f.following_id
    WHERE f.follower_id = auth.uid()
    AND je.visibility = 'public'
    
    UNION ALL
    
    -- Media entries from followed users
    SELECT 
        me.id,
        me.user_id,
        p.username,
        p.avatar_url,
        me.title || ' (' || me.type || ')' as content,
        'media' as content_type,
        me.created_at,
        me.updated_at
    FROM media_entries me
    JOIN profiles p ON me.user_id = p.id
    JOIN follows f ON me.user_id = f.following_id
    WHERE f.follower_id = auth.uid()
    AND me.visibility = 'public'
    
    ORDER BY created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
