import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db, storage, supabase } from '../api/supabase.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      userProfile: null, // For viewing other users' profiles
      isLoading: false,
      error: null,
      followers: [],
      following: [],
      isFollowing: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setFollowers: (followers) => set({ followers }),
      setFollowing: (following) => set({ following }),
      setIsFollowing: (isFollowing) => set({ isFollowing }),

      // Initialize session from Supabase (for OAuth and app startup)
      initializeAuth: async () => {
        if (!supabase) return;
        set({ isLoading: true });
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session?.user) {
            // Fetch or create profile for OAuth users
            const { data: existingProfile } = await db.getUserProfile(session.user.id);
            let ensuredProfile = existingProfile;

            if (!ensuredProfile) {
              // Create profile for OAuth users
              const metaUsername = session.user?.user_metadata?.username || session.user?.user_metadata?.full_name;
              const emailPrefix = (session.user?.email || '').split('@')[0] || '';
              const baseRaw = (metaUsername || emailPrefix || 'user').toString();
              const sanitizedBase = baseRaw
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 20) || `user${String(session.user.id).slice(0, 6)}`;

              let candidate = sanitizedBase;
              for (let attempt = 0; attempt < 5; attempt++) {
                const { data: taken } = await db.fetchUserProfile(candidate);
                if (!taken) break;
                candidate = `${sanitizedBase}${Math.floor(1000 + Math.random() * 9000)}`;
              }

              const { data: createdProfile } = await db.updateProfile({
                id: session.user.id,
                username: candidate,
                full_name: session.user?.user_metadata?.full_name || null,
                avatar_url: session.user?.user_metadata?.avatar_url || null,
              });
              ensuredProfile = createdProfile || null;
            }

            set({ user: session.user, profile: ensuredProfile, isLoading: false });
          } else {
            set({ user: null, profile: null, isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await auth.signIn(email, password)
          if (error) throw error
          
          if (data.user) {
            // Fetch existing profile
            const { data: existingProfile } = await db.getUserProfile(data.user.id)

            let ensuredProfile = existingProfile

            // If profile does not exist yet (first login after verification), create it
            if (!ensuredProfile) {
              // Derive a default username: prefer user metadata.username, else email prefix
              const metaUsername = data.user?.user_metadata?.username
              const emailPrefix = (data.user?.email || '').split('@')[0] || ''
              const baseRaw = (metaUsername || emailPrefix || 'user').toString()
              const sanitizedBase = baseRaw
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 20) || `user${String(data.user.id).slice(0, 6)}`

              // Ensure uniqueness: if taken, append random 4 digits (a few attempts)
              let candidate = sanitizedBase
              for (let attempt = 0; attempt < 5; attempt++) {
                const { data: taken } = await db.fetchUserProfile(candidate)
                if (!taken) break
                candidate = `${sanitizedBase}${Math.floor(1000 + Math.random() * 9000)}`
              }

              // Upsert the profile with the decided username
              const { data: createdProfile } = await db.updateProfile({
                id: data.user.id,
                username: candidate,
              })
              ensuredProfile = createdProfile || null
            }

            set({ user: data.user, profile: ensuredProfile || null, isLoading: false })
          }
          return { data, error: null }
        } catch (error) {
          set({ error: error.message, isLoading: false })
          return { data: null, error }
        }
      },

      // Delete the current user's profile
      deleteProfile: async () => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');
        set({ isLoading: true, error: null });
        try {
          const { error } = await db.deleteProfile(user.id);
          if (error) throw error;
          // Clear local profile state; keep session unless you also want to sign out
          set({ profile: null, isLoading: false });
          return true;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email, password, userData) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await auth.signUp(email, password, userData)
          if (error) throw error
          set({ isLoading: false })
          return { data, error: null }
        } catch (error) {
          set({ error: error.message, isLoading: false })
          return { data: null, error }
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        try {
          await auth.signOut()
          set({ user: null, profile: null, isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return

        try {
          const payload = { ...updates, id: updates?.id || user.id }
          const { data, error } = await db.updateProfile(payload)
          if (error) throw error
          set({ profile: data })
          return data
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      },

      // Fetch a user's profile by ID or username
      fetchUserProfile: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await db.fetchUserProfile(identifier);
          if (error) throw error;
          
          // Check if the current user is following this profile
          const { user } = get();
          const isFollowing = user ? await db.checkIfFollowing(user.id, data.id) : false;
          
          set({ 
            userProfile: data,
            isFollowing: isFollowing.data || false,
            isLoading: false 
          });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Follow a user
      followUser: async (userId) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Not authenticated');
          const { error } = await db.followUser(user.id, userId);
          if (error) throw error;
          
          // Update the isFollowing state
          set({ isFollowing: true });
          
          // Update the follower count in the profile
          const { userProfile } = get();
          if (userProfile) {
            set({
              userProfile: {
                ...userProfile,
                follower_count: (userProfile.follower_count || 0) + 1
              }
            });
          }
          
          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Unfollow a user
      unfollowUser: async (userId) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Not authenticated');
          const { error } = await db.unfollowUser(user.id, userId);
          if (error) throw error;
          
          // Update the isFollowing state
          set({ isFollowing: false });
          
          // Update the follower count in the profile
          const { userProfile } = get();
          if (userProfile) {
            set({
              userProfile: {
                ...userProfile,
                follower_count: Math.max(0, (userProfile.follower_count || 1) - 1)
              }
            });
          }
          
          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Fetch a user's followers
      fetchFollowers: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await db.fetchUserFollowers(userId);
          if (error) throw error;
          set({ followers: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Fetch who a user is following
      fetchFollowing: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await db.fetchUserFollowing(userId);
          if (error) throw error;
          set({ following: data, isLoading: false });
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Toggle follow/unfollow
      toggleFollow: async (userId) => {
        const { isFollowing } = get();
        try {
          if (isFollowing) {
            await get().unfollowUser(userId);
          } else {
            await get().followUser(userId);
          }
          return !isFollowing;
        } catch (error) {
          console.error('Error toggling follow:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, profile: state.profile })
    }
  )
)

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,

      setTasks: (tasks) => set({ tasks }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchTasks: async () => {
        const { user } = useAuthStore.getState()
        if (!user) return

        set({ isLoading: true })
        try {
          const { data, error } = await db.getTasks(user.id)
          if (error) throw error
          set({ tasks: data || [], isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      addTask: async (taskData) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        try {
          const { data, error } = await db.createTask({
            ...taskData,
            user_id: user.id
          })
          if (error) throw error
          
          const { tasks } = get()
          set({ tasks: [data[0], ...tasks] })
        } catch (error) {
          set({ error: error.message })
        }
      },

      updateTask: async (id, updates) => {
        try {
          const { tasks } = get()
          const previous = tasks.find(t => t.id === id) || {}

          // Normalize status and compute completed_at transitions
          const prevStatus = (previous.status || '').toLowerCase()
          const incomingStatus = (updates?.status ?? previous.status ?? '').toLowerCase()
          const computedUpdates = { ...updates }
          if (incomingStatus === 'completed') {
            if (!computedUpdates.hasOwnProperty('completed_at') || computedUpdates.completed_at == null) {
              computedUpdates.completed_at = new Date().toISOString()
            }
          } else if (prevStatus === 'completed' && incomingStatus !== 'completed') {
            // Clearing completion when moving away from completed
            if (!computedUpdates.hasOwnProperty('completed_at')) {
              computedUpdates.completed_at = null
            }
          }

          const { data, error } = await db.updateTask(id, computedUpdates)
          if (error) throw error

          set({
            tasks: tasks.map(task => 
              task.id === id ? { ...task, ...computedUpdates } : task
            )
          })

          // Create activity if task marked completed (case-insensitive)
          try {
            const merged = { ...previous, ...computedUpdates }
            const statusStr = (merged?.status || '').toLowerCase()
            const nowCompleted = merged?.completed === true || statusStr === 'completed'
            if (nowCompleted) {
              const { user } = useAuthStore.getState()
              if (user?.id) {
                await db.createActivity({
                  user_id: user.id,
                  type: 'task_completed',
                  payload: {
                    id: merged.id,
                    title: merged.title || 'Task'
                  }
                })
              }
            }
          } catch (e) {
            console.warn('Failed to create task activity:', e)
          }

          return data
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      },

      deleteTask: async (id) => {
        try {
          const { error } = await db.deleteTask(id)
          if (error) throw error
          
          const { tasks } = get()
          set({ tasks: tasks.filter(task => task.id !== id) })
        } catch (error) {
          set({ error: error.message })
        }
      }
    }),
    {
      name: 'task-storage'
    }
  )
)

export const useMediaStore = create(
  persist(
    (set, get) => ({
      mediaEntries: [],
      isLoading: false,
      error: null,

      setMediaEntries: (mediaEntries) => set({ mediaEntries }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchMediaEntries: async (type = null) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        set({ isLoading: true })
        try {
          const { data, error } = await db.getMediaEntries(user.id, type)
          if (error) throw error
          set({ mediaEntries: data || [], isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      addMediaEntry: async (mediaData) => {
        const { user } = useAuthStore.getState()
        if (!user) {
          console.error('No user found when trying to add media')
          throw new Error('User not authenticated')
        }

        try {
          console.log('Creating media entry with data:', { ...mediaData, user_id: user.id })
          const { data, error } = await db.createMediaEntry({
            ...mediaData,
            user_id: user.id
          })
          
          console.log('Database response:', { data, error })
          
          if (error) {
            console.error('Database error:', error)
            throw error
          }
          
          if (!data || !data[0]) {
            console.error('No data returned from database')
            throw new Error('Failed to create media entry - no data returned')
          }
          
          const { mediaEntries } = get()
          console.log('Current media entries:', mediaEntries.length)
          console.log('Adding new entry:', data[0])
          
          const newMediaEntries = [data[0], ...mediaEntries]
          set({ mediaEntries: newMediaEntries })

          // Create activity: media added (generic)
          try {
            await db.createActivity({
              user_id: user.id,
              type: 'media_added',
              payload: {
                id: data[0].id,
                title: data[0].title,
                type: data[0].type,
                status: data[0].status || null
              }
            })
          } catch (e) {
            console.warn('Failed to create media activity:', e)
          }

          // Post more specific movie activities based on initial status/rating
          try {
            const created = data[0]
            const isMovie = created?.type === 'movie' || created?.type === 'tv'
            if (isMovie) {
              const status = (created.status || '').toLowerCase()
              if (status === 'watched' || status === 'completed' || status === 'finished' || status === 'watched') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'movie_finished',
                  payload: {
                    id: created.id,
                    title: created.title,
                    type: created.type,
                    poster_path: created.poster_path || null
                  }
                })
              } else if (status === 'to_watch' || status === 'watchlist' || status === 'want_to_watch') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'movie_watchlist',
                  payload: {
                    id: created.id,
                    title: created.title,
                    type: created.type,
                    poster_path: created.poster_path || null
                  }
                })
              } else if (status === 'dropped') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'movie_dropped',
                  payload: {
                    id: created.id,
                    title: created.title,
                    type: created.type,
                    poster_path: created.poster_path || null
                  }
                })
              }

              if (created.rating != null) {
                await db.createActivity({
                  user_id: user.id,
                  type: 'movie_rated',
                  payload: {
                    id: created.id,
                    title: created.title,
                    rating: created.rating,
                    review: created.review || null,
                    type: created.type,
                    poster_path: created.poster_path || null
                  }
                })
              }
            }

            // Post specific book activities based on initial status/rating/progress
            const isBook = created?.type === 'book' || created?.type === 'books'
            if (isBook) {
              const status = (created.status || '').toLowerCase()
              const basePayload = {
                id: created.id,
                title: created.title,
                type: created.type,
                // Use 'director' field to represent author per app conventions
                author: created.director || null,
                poster_path: created.poster_path || null
              }

              if (status === 'completed' || status === 'finished' || status === 'read') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'book_finished',
                  payload: basePayload
                })
              } else if (status === 'reading' || status === 'started' || status === 'in_progress') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'book_started',
                  payload: basePayload
                })
              } else if (status === 'to_read' || status === 'watchlist' || status === 'want_to_read' || status === 'planning') {
                await db.createActivity({
                  user_id: user.id,
                  type: 'book_watchlist',
                  payload: basePayload
                })
              }

              // Initial progress
              if (created.hasOwnProperty('progress') || created.hasOwnProperty('pages_read')) {
                const progressPayload = {
                  ...basePayload,
                  progress: created.progress ?? null,
                  pages_read: created.pages_read ?? null
                }
                await db.createActivity({
                  user_id: user.id,
                  type: 'book_progress',
                  payload: progressPayload
                })
              }

              // Initial rating
              if (created.rating != null) {
                await db.createActivity({
                  user_id: user.id,
                  type: 'book_rated',
                  payload: {
                    ...basePayload,
                    rating: created.rating,
                    review: created.review || null
                  }
                })
              }
            }
          } catch (e) {
            console.warn('Failed to post specific movie activity:', e)
          }
          
          console.log('Updated media entries:', newMediaEntries.length)
          return data[0]
        } catch (error) {
          console.error('Error in addMediaEntry:', error)
          set({ error: error.message })
          throw error
        }
      },

      updateMediaEntry: async (id, updates) => {
        try {
          const { mediaEntries } = get();
          const previous = mediaEntries.find(e => e.id === id);
          const { data, error } = await db.updateMediaEntry(id, updates);
          if (error) throw error;

          const merged = { ...previous, ...updates };

          // Update local state
          set({
            mediaEntries: mediaEntries.map(entry => 
              entry.id === id ? { ...entry, ...updates } : entry
            )
          });

          // Create activities for movies: finished, dropped, watchlist, rated
          try {
            const isMovie = (merged?.type === 'movie' || merged?.type === 'tv');
            if (isMovie) {
              const { user } = useAuthStore.getState();
              if (user?.id) {
                const statusChanged = previous && updates.hasOwnProperty('status') && previous.status !== merged.status;
                const ratingChanged = previous && updates.hasOwnProperty('rating') && previous.rating !== merged.rating && merged.rating != null;

                if (statusChanged) {
                  if (merged.status === 'completed' || merged.status === 'finished' || merged.status === 'watched') {
                    await db.createActivity({
                      user_id: user.id,
                      type: 'movie_finished',
                      payload: {
                        id,
                        title: merged.title,
                        type: merged.type
                      }
                    });
                  } else if (merged.status === 'dropped') {
                    await db.createActivity({
                      user_id: user.id,
                      type: 'movie_dropped',
                      payload: {
                        id,
                        title: merged.title,
                        type: merged.type
                      }
                    });
                  } else if (merged.status === 'to_watch' || merged.status === 'watchlist' || merged.status === 'want_to_watch') {
                    await db.createActivity({
                      user_id: user.id,
                      type: 'movie_watchlist',
                      payload: {
                        id,
                        title: merged.title,
                        type: merged.type
                      }
                    });
                  }
                }

                if (ratingChanged) {
                  await db.createActivity({
                    user_id: user.id,
                    type: 'movie_rated',
                    payload: {
                      id,
                      title: merged.title,
                      rating: merged.rating,
                      review: merged.review || null,
                      type: merged.type
                    }
                  });
                }
              }
            }

            // Create activities for books: started/finished/watchlist/progress/rated
            const isBook = (merged?.type === 'book' || merged?.type === 'books');
            if (isBook) {
              const { user } = useAuthStore.getState();
              if (user?.id) {
                const statusChanged = previous && updates.hasOwnProperty('status') && previous.status !== merged.status;
                const ratingChanged = previous && updates.hasOwnProperty('rating') && previous.rating !== merged.rating && merged.rating != null;
                const progressChanged = (
                  (updates.hasOwnProperty('progress') && previous?.progress !== merged.progress) ||
                  (updates.hasOwnProperty('pages_read') && previous?.pages_read !== merged.pages_read)
                );

                const basePayload = {
                  id,
                  title: merged.title,
                  type: merged.type,
                  author: merged.director || null,
                  poster_path: merged.poster_path || null
                };

                if (statusChanged) {
                  const s = (merged.status || '').toLowerCase();
                  if (s === 'completed' || s === 'finished' || s === 'read') {
                    await db.createActivity({ user_id: user.id, type: 'book_finished', payload: basePayload });
                  } else if (s === 'reading' || s === 'started' || s === 'in_progress') {
                    await db.createActivity({ user_id: user.id, type: 'book_started', payload: basePayload });
                  } else if (s === 'to_read' || s === 'watchlist' || s === 'want_to_read' || s === 'planning') {
                    await db.createActivity({ user_id: user.id, type: 'book_watchlist', payload: basePayload });
                  }
                }

                if (progressChanged) {
                  await db.createActivity({
                    user_id: user.id,
                    type: 'book_progress',
                    payload: {
                      ...basePayload,
                      progress: merged.progress ?? null,
                      pages_read: merged.pages_read ?? null
                    }
                  });
                }

                if (ratingChanged) {
                  await db.createActivity({
                    user_id: user.id,
                    type: 'book_rated',
                    payload: {
                      ...basePayload,
                      rating: merged.rating,
                      review: merged.review || null
                    }
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Failed to create movie activity:', e);
          }

          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      toggleFavoriteMediaEntry: async (id) => {
        try {
          const { mediaEntries } = get();
          const entry = mediaEntries.find(m => m.id === id);
          if (!entry) throw new Error('Media entry not found');
          const updatedFavorite = !entry.favorite;
          const { data, error } = await db.updateMediaEntry(id, { favorite: updatedFavorite });
          if (error) throw error;
          set({
            mediaEntries: mediaEntries.map(m => m.id === id ? { ...m, favorite: updatedFavorite } : m)
          });
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      }
    }),
    {
      name: 'media-storage'
    }
  )
)

export const useJournalStore = create(
  persist(
    (set, get) => ({
      journalEntries: [],
      isLoading: false,
      error: null,

      setJournalEntries: (journalEntries) => set({ journalEntries }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchJournalEntries: async () => {
        const { user } = useAuthStore.getState()
        if (!user) return

        set({ isLoading: true })
        try {
          const { data, error } = await db.getJournalEntries(user.id)
          if (error) throw error
          set({ journalEntries: data || [], isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      addJournalEntry: async (entryData) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        try {
          const { data, error } = await db.createJournalEntry({
            ...entryData,
            user_id: user.id
          })
          if (error) throw error
          
          const { journalEntries } = get()
          set({ journalEntries: [data[0], ...journalEntries] })

          // Create activity: journal created
          try {
            await db.createActivity({
              user_id: user.id,
              type: 'journal_created',
              payload: {
                id: data[0].id,
                title: data[0].title || entryData?.title || 'Journal entry'
              }
            })
          } catch (e) {
            console.warn('Failed to create journal activity:', e)
          }
        } catch (error) {
          set({ error: error.message })
        }
      },

      updateJournalEntry: async (id, updates) => {
        try {
          const { data, error } = await db.updateJournalEntry(id, updates)
          if (error) throw error

          const { journalEntries } = get()
          set({
            journalEntries: journalEntries.map(e => e.id === id ? { ...e, ...updates } : e)
          })
          return data
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      },

      deleteJournalEntry: async (id) => {
        try {
          const { error } = await db.deleteJournalEntry(id)
          if (error) throw error

          const { journalEntries } = get()
          set({ journalEntries: journalEntries.filter(e => e.id !== id) })
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      }
    }),
    {
      name: 'journal-storage'
    }
  )
)

export const useMemoryStore = create(
  persist(
    (set, get) => ({
      memories: [],
      isLoading: false,
      error: null,

      setMemories: (memories) => set({ memories }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchMemories: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Get the current user from the auth store
          const authState = useAuthStore.getState();
          if (!authState.user) {
            throw new Error('User not authenticated');
          }

          const { data, error } = await db.getMemories(authState.user.id);
          
          if (error) {
            console.error('Error fetching memories:', error);
            throw new Error(error.message || 'Failed to fetch memories');
          }
          
          set({ 
            memories: Array.isArray(data) ? data : [], 
            isLoading: false 
          });
          return data;
        } catch (error) {
          console.error('Fetch memories error:', error);
          set({ 
            error: error.message || 'An error occurred while fetching memories',
            isLoading: false 
          });
          throw error;
        }
      },

      addMemory: async (memoryData) => {
        try {
          set({ isLoading: true, error: null });
          
          // Get the current user from the auth store
          const authState = useAuthStore.getState();
          if (!authState.user) {
            throw new Error('User not authenticated');
          }

          const { data, error } = await db.createMemory({
            ...memoryData,
            user_id: authState.user.id
          });
          
          if (error) {
            console.error('Error creating memory:', error);
            throw new Error(error.message || 'Failed to create memory');
          }
          
          if (!data || !data[0]) {
            throw new Error('No data returned after creating memory');
          }
          
          // Update the local state with the new memory
          const { memories } = get();
          set({ 
            memories: [data[0], ...memories],
            isLoading: false
          });
          
          return data[0];
        } catch (error) {
          console.error('Add memory error:', error);
          set({ 
            error: error.message || 'An error occurred while adding the memory',
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'memory-storage'
    }
  )
)
