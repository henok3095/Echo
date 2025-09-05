import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Auth helpers
export const auth = {
  signUp: async (email, password, userData = {}) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: () => {
    if (!supabase) {
      return Promise.resolve({ data: { user: null }, error: null })
    }
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback) => {
    if (!supabase) {
      return { data: { subscription: null } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Tasks
  getTasks: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createTask: async (taskData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
    return { data, error }
  },

  updateTask: async (id, updates) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  deleteTask: async (id) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    return { error }
  },

  // Ideas
  getIdeas: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createIdea: async (ideaData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('ideas')
      .insert([ideaData])
      .select()
    return { data, error }
  },

  // Media entries
  getMediaEntries: async (userId, type = null) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    let query = supabase
      .from('media_entries')
      .select('*')
      .eq('user_id', userId)
    
    if (type) {
      query = query.eq('type', type)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  },

  createMediaEntry: async (mediaData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('media_entries')
      .insert([mediaData])
      .select()
    return { data, error }
  },

  // Journal entries
  getJournalEntries: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    return { data, error }
  },

  createJournalEntry: async (entryData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entryData])
      .select()
    return { data, error }
  },

  updateJournalEntry: async (id, updates) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  deleteJournalEntry: async (id) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
    return { error }
  },

  // Memories
  getMemories: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  createMemory: async (memoryData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('memories')
      .insert([memoryData])
      .select()
    return { data, error }
  },

  // User profiles
  getUserProfile: async (userId) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  fetchUserProfile: async (identifier) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    
    // Check if identifier is a UUID (user ID) or username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
    
    let query = supabase
      .from('profiles')
      .select('*');
    
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.ilike('username', identifier);
    }
    
    const { data, error } = await query.single();
    return { data, error };
  },

  updateUserProfile: async (userId, updates) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  },

  checkIfFollowing: async (userId) => {
    if (!supabase) {
      return { data: false, error: { message: 'Supabase not configured' } }
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();
    
    return { data: !!data, error };
  },

  getFollowers: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('follows')
      .select('follower:profiles(*)')
      .eq('following_id', userId)
    return { data: data?.map(item => item.follower), error }
  },

  getFollowing: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles(*)')
      .eq('follower_id', userId)
    return { data: data?.map(item => item.following), error }
  },

  followUser: async (followingId) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('follows')
      .insert([{ following_id: followingId }])
      .select()
    return { data, error }
  },

  unfollowUser: async (followingId) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
    return { error }
  },

  getUserFeed: async () => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.rpc('get_user_feed');
    return { data, error };
  },

  searchUsers: async (query) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(10);
    return { data, error };
  },

  fetchUserFollowers: async (userId, page = 0, pageSize = 10) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('follows')
      .select('follower:profiles(*)')
      .eq('following_id', userId)
      .range(from, to);
      
    return { 
      data: data?.map(item => item.follower) || [], 
      error 
    };
  },

  fetchUserFollowing: async (userId, page = 0, pageSize = 10) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles(*)')
      .eq('follower_id', userId)
      .range(from, to);
      
    return { 
      data: data?.map(item => item.following) || [], 
      error 
    };
  },

  // Book Recommendations
  getBookRecommendations: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('book_recommendations')
      .select(`
        *,
        book:media_entries(*),
        recommended_by:profiles!recommended_by_user_id(username, full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  createBookRecommendation: async (recommendationData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    
    // If media_entry_id is provided, get book details from media_entries
    if (recommendationData.media_entry_id) {
      const { data: bookData } = await supabase
        .from('media_entries')
        .select('title, director, poster_path, overview')
        .eq('id', recommendationData.media_entry_id)
        .single()
      
      if (bookData) {
        recommendationData.book_title = bookData.title
        recommendationData.book_author = bookData.director
        recommendationData.poster_path = bookData.poster_path
        recommendationData.description = bookData.overview
      }
    }
    
    const { data, error } = await supabase
      .from('book_recommendations')
      .insert([recommendationData])
      .select(`
        *,
        book:media_entries(*),
        recommended_by:profiles!recommended_by_user_id(username, full_name)
      `)
    
    return { data, error }
  },

  updateBookRecommendation: async (id, updates) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('book_recommendations')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Reading Progress
  getReadingProgress: async (userId, bookId = null) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    let query = supabase
      .from('reading_progress')
      .select(`
        *,
        book:media_entries(*)
      `)
      .eq('user_id', userId)
    
    if (bookId) {
      query = query.eq('book_id', bookId)
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false })
    return { data, error }
  },

  upsertReadingProgress: async (progressData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(progressData, { onConflict: 'user_id,book_id' })
      .select()
    return { data, error }
  },

  // Reading Activity
  getReadingActivity: async (userId, bookId = null, limit = 50) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    let query = supabase
      .from('reading_activity')
      .select(`
        *,
        book:media_entries(title, poster_path)
      `)
      .eq('user_id', userId)
    
    if (bookId) {
      query = query.eq('book_id', bookId)
    }
    
    const { data, error } = await query
      .order('activity_date', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  createReadingActivity: async (activityData) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase
      .from('reading_activity')
      .insert([activityData])
      .select()
    return { data, error }
  },

  // Friends system (mutual follows)
  getFriends: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    
    console.log('getFriends called with userId:', userId);
    // Get users who follow each other (mutual follows = friends)
    const { data, error } = await supabase.rpc('get_mutual_friends', { user_id: userId });
    console.log('RPC get_mutual_friends result:', { data, error });
    return { data: data || [], error };
  },

  // Alternative implementation if RPC doesn't exist
  getFriendsAlternative: async (userId) => {
    if (!supabase) {
      return { data: [], error: { message: 'Supabase not configured' } }
    }
    
    // Get users I follow
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    if (followingError) return { data: [], error: followingError };
    
    const followingIds = following.map(f => f.following_id);
    if (followingIds.length === 0) return { data: [], error: null };
    
    // Get users who also follow me back (mutual follows)
    const { data: mutualFollows, error: mutualError } = await supabase
      .from('follows')
      .select('follower_id, follower:profiles(*)')
      .eq('following_id', userId)
      .in('follower_id', followingIds);
    
    return { 
      data: mutualFollows?.map(f => f.follower) || [], 
      error: mutualError 
    };
  }
}

// Storage helpers
export const storage = {
  uploadAvatar: async (userId, file) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`${userId}/${file.name}`, file)
    return { data, error }
  },

  getAvatarUrl: (path) => {
    if (!supabase) {
      return null
    }
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }
}
