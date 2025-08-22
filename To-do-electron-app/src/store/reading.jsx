import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, supabase } from '../api/supabase.js';
import { useAuthStore } from './index.jsx';

// Minimal reading sessions store for Stats Dashboard
// Schema expectation: reading_sessions(id, user_id, book_id, date, minutes, pages, created_at)
export const useReadingStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      isLoading: false,
      error: null,

      setSessions: (sessions) => set({ sessions }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchSessions: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        // If supabase client missing, keep UI functional
        if (!supabase) {
          set({ sessions: [], isLoading: false, error: null });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('reading_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (error) throw error;
          set({ sessions: data || [], isLoading: false });
        } catch (e) {
          // Non-fatal if table doesn't exist yet
          set({ sessions: [], isLoading: false, error: null });
        }
      },

      addSession: async ({ book_id, date, minutes = 0, pages = 0 }) => {
        const { user } = useAuthStore.getState();
        if (!user || !supabase) return;
        try {
          const payload = { user_id: user.id, book_id, date, minutes, pages };
          const { data, error } = await supabase
            .from('reading_sessions')
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          const { sessions } = get();
          set({ sessions: [data, ...sessions] });
          return data;
        } catch (e) {
          set({ error: e.message });
          throw e;
        }
      },
    }),
    { name: 'reading-storage' }
  )
);

// Helpers for aggregations used by charts
export function aggregateMinutesPerDay(sessions, daysBack = 84) {
  const today = new Date();
  const map = new Map();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (daysBack - 1 - i));
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  (sessions || []).forEach((s) => {
    const key = (s.date || '').slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + (s.minutes || 0));
  });
  return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }));
}
