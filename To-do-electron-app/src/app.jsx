import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from './store/index.jsx';
import Header from "./components/Header";
import NotificationsBar from "./components/NotificationsBar.jsx";
import NotificationsPopup from "./components/NotificationsPopup.jsx";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import TasksPage from "./pages/TasksPage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import MusicPage from "./pages/MusicPage_clean";
import JournalPage from "./pages/JournalPage";
import BooksPage from "./pages/BooksPage";
import CalendarPage from "./pages/CalendarPage";
import SchoolPage from "./pages/SchoolPage";
import LandingPage from "./pages/LandingPage";
import AuthModal from "./components/AuthModal";
import { supabase, db } from './api/supabase.js';
import ProfilePage from "./pages/ProfilePage";
import toast, { Toaster } from 'react-hot-toast';
import AboutPage from "./pages/AboutPage";
import AuthCallback from "./pages/AuthCallback.jsx";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarDrawer, setSidebarDrawer] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Set dark theme immediately to prevent flash
    document.documentElement.classList.add("dark");
    return localStorage.getItem("theme") || "dark";
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const MAX_NOTIFS = 50; // retain up to 50 recent notifications
  const [showNotifications, setShowNotifications] = useState(true); // banner visibility
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [followingIds, setFollowingIds] = useState(new Set());
  const { user, signOut } = useAuthStore();

  // Load who I already follow so UI can hide Follow back appropriately
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!user) {
        setFollowingIds(new Set());
        return;
      }
      try {
        const { data, error } = await db.fetchUserFollowing(user.id);
        if (error) return;
        if (!canceled) {
          const ids = new Set((data || []).map(r => r.following_id || r.profiles?.id).filter(Boolean));
          setFollowingIds(ids);
        }
      } catch {}
    })();
    return () => { canceled = true; };
  }, [user?.id]);

  // Check if Supabase credentials are configured
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Realtime follows notification subscription
  useEffect(() => {
    if (!user) return;
    if (!supabase) return;

    if (import.meta?.env?.MODE !== 'production') {
      console.log('[Realtime] Subscribing to follows for following_id=', user.id);
    }

    const channel = supabase
      .channel('follows-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'follows', filter: `following_id=eq.${user.id}` },
        async (payload) => {
          if (import.meta?.env?.MODE !== 'production') {
            console.log('[Realtime] Follow INSERT payload:', payload);
          }
          try {
            // Fetch follower's profile for readable name
            const followerId = payload.new?.follower_id;
            let followerName = 'Someone';
            let actor = null;
            if (followerId) {
              const { data } = await db.getUserProfile(followerId);
              followerName = data?.username || followerName;
              actor = data ? { id: data.id, username: data.username, avatar_url: data.avatar_url } : null;
            }
            const id = `${payload.commit_timestamp}-${payload.new?.follower_id}`;
            const created_at = new Date().toISOString();
            setNotifications((prev) => [
              { id, type: 'follow', message: `${followerName} started following you`, actor, created_at },
              ...prev,
            ].slice(0, MAX_NOTIFS));
            // Toast popup
            toast.success(`${followerName} followed you`);
          } catch (e) {
            // Fallback simple message
            const id = `${payload.commit_timestamp}-${payload.new?.follower_id}`;
            setNotifications((prev) => [
              { id, type: 'follow', message: `You have a new follower` },
              ...prev,
            ].slice(0, MAX_NOTIFS));
            toast.success('You have a new follower');
          }
        }
      )
      .subscribe();

    return () => {
      if (import.meta?.env?.MODE !== 'production') {
        console.log('[Realtime] Unsubscribing follows channel');
      }
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load following list when user logs in (for activity notifications)
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setFollowingIds(new Set());
      return;
    }
    (async () => {
      try {
        const { data, error } = await db.fetchUserFollowing(user.id);
        if (!error && isMounted) {
          // fetchUserFollowing returns an array of profile objects for the users you follow
          const ids = new Set((data || []).map(r => r.id));
          setFollowingIds(ids);
        }
      } catch (_) {}
    })();
    return () => { isMounted = false };
  }, [user]);

  // Realtime activities from people you follow
  useEffect(() => {
    if (!user) return;
    if (!supabase) return;

    const actChannel = supabase
      .channel('activities-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
          try {
            const activity = payload.new;
            if (!activity) return;
            // Ignore my own activities
            if (activity.user_id === user.id) return;
            // Only notify if I follow the author
            if (!followingIds.has(activity.user_id)) return;

            // Get author name
            let author = 'Someone you follow';
            try {
              const { data } = await db.getUserProfile(activity.user_id);
              if (data?.username) author = data.username;
            } catch (_) {}

            const type = String(activity.type || 'activity');
            const pretty = (
              type === 'task_completed' ? 'completed a task' :
              type === 'movie_finished' ? 'finished a movie' :
              type === 'movie_rated' ? `rated a movie ${activity?.payload?.rating ?? ''}` :
              type === 'media_added' ? ((activity?.payload?.type || '').toLowerCase() === 'book' ? 'added a book' : 'added media') :
              type === 'journal_created' ? 'wrote a journal entry' :
              'posted a new activity'
            );
            const id = `${payload.commit_timestamp}-${activity.id || activity.user_id}`;
            const msg = `${author} ${pretty}`.trim();

            setNotifications((prev) => [
              { id, type: 'activity', message: msg },
              ...prev,
            ].slice(0, MAX_NOTIFS));
            toast(msg);
          } catch (_) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(actChannel);
    };
  }, [user, followingIds]);

  // Show setup screen if no environment variables
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Setup Required
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              To use Echo, you need to configure Supabase credentials. Create a <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env</code> file in the project root with your Supabase URL and anon key.
            </p>
          </div>
          <div className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm font-mono">
            <div className="text-gray-600 dark:text-gray-400 mb-2"># .env</div>
            <div>VITE_SUPABASE_URL=your_supabase_url</div>
            <div>VITE_SUPABASE_ANON_KEY=your_anon_key</div>
          </div>
        </div>
      </div>
    );
  }

  // OAuth callback route is now handled at the top level

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-['Inter'] overflow-hidden flex">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={!sidebarOpen} />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          onMenuClick={() => {
            if (window.innerWidth < 768) {
              setSidebarDrawer(true);
            } else {
              setSidebarOpen((v) => !v);
            }
          }}
          username={user.email}
          onToggleTheme={handleToggleTheme}
          onToggleNotifications={() => setShowNotificationsPopup((v) => !v)}
          notificationsCount={notifications.length}
          onSignOut={handleSignOut}
          theme={theme}
        />

        {showNotifications && !showNotificationsPopup && (
          <NotificationsBar
            notifications={notifications}
            onClearAll={() => setNotifications([])}
            onDismiss={(id) => setNotifications((prev) => prev.filter(n => n.id !== id))}
          />
        )}

        {showNotificationsPopup && (
          <NotificationsPopup
            notifications={notifications}
            followingIds={followingIds}
            onFollowBack={async (actorId) => {
              if (!user || !actorId) return;
              try {
                if (followingIds.has(actorId)) return; // already following
                const { error } = await db.followUser(user.id, actorId);
                if (error) {
                  toast.error(error.message || 'Could not follow back');
                } else {
                  // update local following set
                  setFollowingIds(prev => new Set([...prev, actorId]));
                  toast.success('Followed back');
                }
              } catch (e) {
                toast.error('Could not follow back');
              }
            }}
            onDismiss={(id) => setNotifications((prev) => prev.filter(n => n.id !== id))}
            onClearAll={() => setNotifications([])}
            onClose={() => setShowNotificationsPopup(false)}
          />
        )}
        
        <main className="flex-1 overflow-auto">
          {/* Mobile sidebar overlay */}
          {sidebarDrawer && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="bg-black/20 w-full h-full" onClick={() => setSidebarDrawer(false)} />
              <div className="relative z-50">
                <Sidebar collapsed={false} />
                <button
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800"
                  onClick={() => setSidebarDrawer(false)}
                  aria-label="Close sidebar"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="6" x2="18" y2="18"/>
                    <line x1="6" y1="18" x2="18" y2="6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
             <Route path="/activities" element={<ActivitiesPage />} />
             <Route path="/my-activities" element={<ActivitiesPage mode="mine" />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#374151',
            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth callback route - accessible without authentication */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* All other routes go through AppLayout */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}