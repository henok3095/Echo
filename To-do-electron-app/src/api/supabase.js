import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL;
const runtimeOrigin = typeof window !== 'undefined' && window.location && window.location.origin
  ? window.location.origin
  : undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Defer hard failure to callers so the app can render a setup screen
  console.warn('Supabase not configured. Some features will be disabled until .env is set.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const auth = {
  signIn: async (email, password) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    try {
      const redirectTo = (siteUrl || runtimeOrigin) ? `${(siteUrl || runtimeOrigin)}/auth/callback` : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Activities methods
  createActivity: async (activity) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();
    return { data, error };
  },

  // Fetch recent activities from public profiles with pagination
  fetchPublicActivities: async (limit = 20, offset = 0) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const to = Math.max(0, offset + limit - 1);
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:profiles!activities_user_id_fkey(id, username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, to);
    return { data, error };
  },

  // Fetch recent activities from users that the current user follows
  fetchFollowingActivities: async (currentUserId, limit = 20, offset = 0) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    if (!currentUserId) return { data: [], error: new Error('Missing currentUserId') };
    const to = Math.max(0, offset + limit - 1);
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:profiles!activities_user_id_fkey(id, username, avatar_url)')
      .in('user_id', (
        await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
      ).data?.map(r => r.following_id) || [] )
      .order('created_at', { ascending: false })
      .range(offset, to);
    return { data, error };
  },
  
  signUp: async (email, password, userData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const redirectTo = (siteUrl || runtimeOrigin) ? `${(siteUrl || runtimeOrigin)}/auth/callback` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData?.username,
          full_name: userData?.fullName,
        },
        emailRedirectTo: redirectTo,
      },
    });
    return { data, error };
  },

  // Proper resend verification email for signup
  resendVerification: async (email) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const redirectTo = (siteUrl || runtimeOrigin) ? `${(siteUrl || runtimeOrigin)}/auth/callback` : undefined;
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    return { data, error };
  },
  
  signOut: async () => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};

export const db = {
  // Activities methods (exposed under db for app usage)
  createActivity: async (activity) => {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();
    return { data, error };
  },

  fetchMyActivities: async (currentUserId, limit = 20, offset = 0) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    if (!currentUserId) return { data: [], error: new Error('Missing currentUserId') };
    const to = Math.max(0, offset + limit - 1);
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:profiles!activities_user_id_fkey(id, username, avatar_url)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .range(offset, to);
    return { data, error };
  },

  // Activity reactions
  getActivityReactions: async (activityIds) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
      return { data: [], error: null };
    }
    const { data, error } = await supabase
      .from('activity_reactions')
      .select('*')
      .in('activity_id', activityIds);
    return { data: data || [], error };
  },

  addReaction: async (activityId, userId, type) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('activity_reactions')
      .insert([{ activity_id: activityId, user_id: userId, type }])
      .select()
      .single();
    return { data, error };
  },

  removeReaction: async (activityId, userId, type) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('activity_reactions')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .eq('type', type);
    return { error };
  },

  // Fetch recent activities from public profiles with pagination
  fetchPublicActivities: async (limit = 20, offset = 0) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const to = Math.max(0, offset + limit - 1);
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:profiles!activities_user_id_fkey(id, username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, to);
    return { data, error };
  },

  // Fetch recent activities from users that the current user follows
  fetchFollowingActivities: async (currentUserId, limit = 20, offset = 0) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    if (!currentUserId) return { data: [], error: new Error('Missing currentUserId') };
    const to = Math.max(0, offset + limit - 1);
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:profiles!activities_user_id_fkey(id, username, avatar_url)')
      .in('user_id', (
        await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
      ).data?.map(r => r.following_id) || [] )
      .order('created_at', { ascending: false })
      .range(offset, to);
    return { data, error };
  },

  // Profile methods
  getUserProfile: async (userId) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },

  // Fetch profile by username or id
  fetchUserProfile: async (identifier) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const idStr = typeof identifier === 'string' ? identifier : String(identifier || '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idStr);
    let query = supabase.from('profiles').select('*');
    query = isUuid ? query.eq('id', idStr) : query.eq('username', idStr);
    const { data, error } = await query.maybeSingle();
    return { data, error };
  },

  // Check if current user is following another user
  checkIfFollowing: async (currentUserId, userId) => {
    if (!supabase) return { data: false, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();
    return { data: !!data, error };
  },

  // Follow a user
  followUser: async (currentUserId, userId) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    if (!currentUserId || !userId) return { error: new Error('Missing user ids') };
    if (currentUserId === userId) return { error: new Error('Cannot follow yourself') };
    // Idempotent: ignore duplicate constraint violations on (follower_id, following_id)
    const { error } = await supabase
      .from('follows')
      .upsert(
        [{ follower_id: currentUserId, following_id: userId }],
        { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
      );
    return { error };
  },

  // Unfollow a user
  unfollowUser: async (currentUserId, userId) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);
    return { error };
  },

  // Fetch followers
  fetchUserFollowers: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, profiles:profiles!follows_follower_id_fkey(*)')
      .eq('following_id', userId);
    return { data, error };
  },

  // Fetch following
  fetchUserFollowing: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles:profiles!follows_following_id_fkey(*)')
      .eq('follower_id', userId);
    return { data, error };
  },
  
  updateProfile: async (updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    // Upsert to create the row if it doesn't exist, keyed by id
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' })
      .select()
      .single();
    return { data, error };
  },

  // Delete current user's profile by id
  deleteProfile: async (userId) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    if (!userId) return { error: new Error('Missing userId') };
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    return { error };
  },

  // Memory methods
  getMemories: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createMemory: async (memoryData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('memories')
      .insert([memoryData])
      .select();
    return { data, error };
  },

  // Media Entries methods
  getMediaEntries: async (userId, type = null) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    let query = supabase
      .from('media_entries')
      .select('*')
      .eq('user_id', userId);
    if (type) query = query.eq('type', type);
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  createMediaEntry: async (mediaData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    // Clean up empty date strings to prevent database errors
    const cleanedData = { ...mediaData };
    if (cleanedData.release_date === '') {
      cleanedData.release_date = null;
    }
    
    const { data, error } = await supabase
      .from('media_entries')
      .insert([cleanedData])
      .select();
    return { data, error };
  },

  updateMediaEntry: async (id, updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('media_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteMediaEntry: async (id) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('media_entries')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Journal entries
  getJournalEntries: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return { data, error };
  },

  createJournalEntry: async (entryData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entryData])
      .select();
    return { data, error };
  },

  updateJournalEntry: async (id, updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  deleteJournalEntry: async (id) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);
    return { error };
  },

  getJournalEntryById: async (id) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data, error };
  },

  // Search for profiles by username (exclude self)
  searchProfiles: async (searchTerm, currentUserId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url, is_public')
      .ilike('username', `%${searchTerm}%`)
      .neq('id', currentUserId)
      .eq('is_public', true)
      .limit(10);
    return { data, error };
  },

  // Suggest profiles to follow (not already followed, not self)
  suggestProfilesToFollow: async (currentUserId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    // Get IDs of users the current user is already following
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    if (followingError) return { data: [], error: followingError };
    
    const followingIds = (following || []).map(f => f.following_id);

    // Fetch a pool of public profiles (exclude self), then filter out followed on client
    // Ordering by follower_count to surface more relevant profiles first
    const { data: pool, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url, is_public, follower_count')
      .neq('id', currentUserId)
      .eq('is_public', true)
      .order('follower_count', { ascending: false })
      .limit(50);

    if (error) return { data: [], error };

    const suggestions = (pool || [])
      .filter(p => !followingIds.includes(p.id))
      .slice(0, 10);

    return { data: suggestions, error: null };
  },

  // Task methods
  getTasks: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createTask: async (taskData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    // Clean up empty date strings to prevent database errors
    const cleanedTask = { ...taskData };
    if (cleanedTask.due_date === '') {
      cleanedTask.due_date = null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([cleanedTask])
      .select();
    return { data, error };
  },

  updateTask: async (id, updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteTask: async (id) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Achievements
  getUserAchievements: async (userId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  addAchievement: async (userId, type, label, icon = '🏆') => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('user_achievements')
      .insert([{ user_id: userId, type, label, icon }])
      .select()
      .single();
    return { data, error };
  },

  deleteAchievement: async (id) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('user_achievements')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Book Recommendations
  getBookRecommendations: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } };
    }
    const { data, error } = await supabase
      .from('book_recommendations')
      .select(`
        *,
        recommended_by:profiles!recommended_by_user_id(username, full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  createBookRecommendation: async (recommendationData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    // If media_entry_id is provided, get book details from media_entries
    if (recommendationData.media_entry_id) {
      const { data: bookData } = await supabase
        .from('media_entries')
        .select('title, director, poster_path, overview')
        .eq('id', recommendationData.media_entry_id)
        .single();
      
      if (bookData) {
        recommendationData.book_title = bookData.title;
        recommendationData.book_author = bookData.director;
        recommendationData.poster_path = bookData.poster_path;
        recommendationData.description = bookData.overview;
      }
    }
    
    const { data, error } = await supabase
      .from('book_recommendations')
      .insert([recommendationData])
      .select(`
        *,
        recommended_by:profiles!recommended_by_user_id(username, full_name)
      `)
      .single();
    
    return { data, error };
  },

  updateBookRecommendation: async (id, updates) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    
    const { data, error } = await supabase
      .from('book_recommendations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        recommended_by:profiles!recommended_by_user_id(username, full_name)
      `)
      .single();
    
    return { data, error };
  },

  // Watching sessions (TV progress)
  listWatchingSessions: async (userId, mediaId) => {
    if (!supabase) return { data: [], error: new Error('Supabase not configured') };
    if (!userId || !mediaId) return { data: [], error: new Error('Missing userId or mediaId') };
    const { data, error } = await supabase
      .from('watching_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .order('date', { ascending: true });
    return { data: data || [], error };
  },

  createWatchingSession: async (session) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const { data, error } = await supabase
      .from('watching_sessions')
      .insert([session])
      .select()
      .single();
    return { data, error };
  },

  deleteWatchingSession: async (id) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase
      .from('watching_sessions')
      .delete()
      .eq('id', id);
    return { error };
  },

};

export const storage = {
  uploadAvatar: async (userId, file) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const filePath = `${userId}/${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    if (error) return { data: null, error };
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return { data: { path: publicUrl }, error: null };
  },
};