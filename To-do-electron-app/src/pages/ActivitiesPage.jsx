function JournalPreview({ entryId }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!entryId) return;
      try {
        setLoading(true);
        // We don't have direct content in payload; optionally fetch by id if allowed
        // If RLS prevents cross-user SELECT, this will gracefully no-op
        const res = await db.getJournalEntryById(entryId);
        if (mounted) setContent(res?.data?.content || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false };
  }, [entryId]);

  if (!entryId) return null;
  if (loading) return <div className="h-16 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />;

  // Render a short preview, even if content isn't available
  return (
    <div className="rounded-lg bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-800 dark:text-gray-100 max-h-40 overflow-hidden">
      {content ? (
        <>
          <div className="line-clamp-4 whitespace-pre-wrap">{content}</div>
        </>
      ) : (
        <div className="italic text-gray-500 dark:text-gray-400">Journal content</div>
      )}
    </div>
  );
}
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { db } from "../api/supabase.js";
import { Sparkles, Music, Film, Clock, UserCircle2 } from "lucide-react";
import { useAuthStore } from "../store/index.jsx";

const REACTIONS = [
  { key: 'love', label: 'Love', emoji: '❤️' },
  { key: 'fire', label: 'Fire', emoji: '🔥' },
  { key: 'groove', label: 'Groove', emoji: '🎶' },
  { key: 'mind_blown', label: 'Mind-blown', emoji: '🤯' },
];

function timeAgo(iso) {
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ActivityItem({ activity, currentUserId, onReact, reactionCounts, myReactions }) {
  const { type, payload, created_at, profiles } = activity;
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;

  const content = useMemo(() => {
    switch (type) {
      case "media_added": {
        const icon = <Film className="w-4 h-4 text-purple-600 dark:text-purple-300" />;
        const title = payload?.title || "Untitled";
        const kind = payload?.type || "media";
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> added {kind}: <span className="text-purple-700 dark:text-purple-300">{title}</span>
          </span>
        )};
      }
      case "movie_finished": {
        const icon = <Film className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />;
        const title = payload?.title || 'Movie';
        const poster = payload?.poster_path;
        return { icon, render: (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/20 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              {icon}
              <span>Finished</span>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              {poster ? (
                <img src={`https://image.tmdb.org/t/p/w92${poster}`} alt={title} className="w-16 h-24 rounded-lg object-cover border border-emerald-200/60 dark:border-emerald-800/40" />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Film className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <b className="text-gray-900 dark:text-white">{profile?.username || 'Someone'}</b> finished <b>{title}</b>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(created_at)}</div>
              </div>
            </div>
          </div>
        )};
      }
      case "movie_dropped": {
        const icon = <Film className="w-4 h-4 text-rose-600 dark:text-rose-300" />;
        const title = payload?.title || 'Movie';
        const poster = payload?.poster_path;
        return { icon, render: (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-900/20 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              {icon}
              <span>Dropped</span>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              {poster ? (
                <img src={`https://image.tmdb.org/t/p/w92${poster}`} alt={title} className="w-16 h-24 rounded-lg object-cover border border-rose-200/60 dark:border-rose-800/40" />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Film className="w-6 h-6 text-rose-600 dark:text-rose-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <b className="text-gray-900 dark:text-white">{profile?.username || 'Someone'}</b> dropped <b>{title}</b>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(created_at)}</div>
              </div>
            </div>
          </div>
        )};
      }
      case "movie_watchlist": {
        const icon = <Film className="w-4 h-4 text-blue-600 dark:text-blue-300" />;
        const title = payload?.title || 'Movie';
        const poster = payload?.poster_path;
        return { icon, render: (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              {icon}
              <span>Watchlist</span>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              {poster ? (
                <img src={`https://image.tmdb.org/t/p/w92${poster}`} alt={title} className="w-16 h-24 rounded-lg object-cover border border-blue-200/60 dark:border-blue-800/40" />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Film className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <b className="text-gray-900 dark:text-white">{profile?.username || 'Someone'}</b> wants to watch <b>{title}</b>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(created_at)}</div>
              </div>
            </div>
          </div>
        )};
      }
      case "movie_rated": {
        const icon = <Film className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />;
        const title = payload?.title || 'Movie';
        const rating = payload?.rating ?? '—';
        const review = payload?.review || null;
        const poster = payload?.poster_path;
        return { icon, render: (
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/70 dark:bg-yellow-900/20 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
              {icon}
              <span>Rated</span>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              {poster ? (
                <img src={`https://image.tmdb.org/t/p/w92${poster}`} alt={title} className="w-16 h-24 rounded-lg object-cover border border-yellow-200/60 dark:border-yellow-800/40" />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Film className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <b className="text-gray-900 dark:text-white">{profile?.username || 'Someone'}</b> rated <b>{title}</b> <span className="text-yellow-700 dark:text-yellow-300">{rating}/10</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(created_at)}</div>
                {review && (
                  <div className="mt-2 text-xs rounded bg-yellow-100/60 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-2 text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                    {review}
                  </div>
                )}
              </div>
            </div>
          </div>
        )};
      }
      case "task_completed": {
        const icon = <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />;
        const title = payload?.title || "Task";
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> completed a task: <span className="text-emerald-700 dark:text-emerald-300">{title}</span>
          </span>
        )};
      }
      case "journal_created": {
        const icon = <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-300" />;
        const title = payload?.title || "Journal entry";
        const id = payload?.id;
        return { icon, render: (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/70 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {icon}
              <span>Journal</span>
              <span>•</span>
              <span>{timeAgo(created_at)}</span>
              {profile?.username && (
                <span className="ml-auto">by <b className="text-gray-700 dark:text-gray-200">{profile.username}</b></span>
              )}
            </div>
            <div className="px-4 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <JournalPreview entryId={id} />
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <button className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">Comment</button>
              </div>
            </div>
          </div>
        )};
      }
      case "music_stat": {
        const icon = <Music className="w-4 h-4 text-pink-600 dark:text-pink-300" />;
        const today = payload?.today ?? 0;
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> listened to <b>{today}</b> tracks today
          </span>
        )};
      }
      case "now_playing": {
        const icon = <Music className="w-4 h-4 text-pink-600 dark:text-pink-300" />;
        const title = payload?.title || 'Track';
        const artist = payload?.artist ? ` – ${payload.artist}` : '';
        const url = payload?.url;
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || 'Someone'}</b> is listening to {url ? (
              <a className="underline text-pink-700 dark:text-pink-300" href={url} target="_blank" rel="noreferrer">{title}</a>
            ) : (
              <span className="text-pink-700 dark:text-pink-300">{title}</span>
            )}{artist}
          </span>
        )};
      }
      case "weekly_music_recap": {
        const icon = <Music className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />;
        const topArtist = payload?.topArtist || 'Unknown';
        const topTrack = payload?.topTrack || 'Unknown';
        const newArtist = payload?.newArtist || null;
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || 'Someone'}</b> posted a weekly music recap: Top Artist <b>{topArtist}</b>, Most Replayed <b>{topTrack}</b>{newArtist ? `, New Artist ${newArtist}` : ''}
          </span>
        )};
      }
      default:
        return { icon: <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-300" />, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> posted an update
          </span>
        )};
    }
  }, [type, payload, profile]);

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 flex items-start gap-3">
      <div className="shrink-0">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile?.username || "User"} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <UserCircle2 className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {content?.render ? (
          content.render
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              {content.icon}
              <div className="truncate">
                {content.text}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(created_at)}</span>
            </div>
          </>
        )}
        {/* Reactions */}
        <div className="mt-1 flex items-center gap-2">
          {REACTIONS.map(r => {
            const count = reactionCounts?.[r.key] || 0;
            const mine = myReactions?.includes(r.key);
            return (
              <button
                key={r.key}
                onClick={() => onReact(activity.id, r.key, mine)}
                className={`px-2 py-1 rounded-full text-xs border transition ${mine ? 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                title={r.label}
              >
                <span className="mr-1">{r.emoji}</span>
                {count > 0 ? count : ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage({ mode = 'following' }) {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState([]);
  const [reactionsMap, setReactionsMap] = useState({}); // activityId -> { counts: {type: n}, mine: [types] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'movies' | 'music' | 'tasks' | 'journal'
  const [viewMode, setViewMode] = useState(mode); // 'following' | 'mine'
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  const loaderRef = useRef(null);
  

  const fetchPage = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const nextOffset = reset ? 0 : offset;
      // Mode: 'following' (default) or 'mine'
      const resp = viewMode === 'mine'
        ? await db.fetchMyActivities(user?.id, limit, nextOffset)
        : await db.fetchFollowingActivities(user?.id, limit, nextOffset);
      const { data, error } = resp || {};
      if (error) throw error;
      const page = Array.isArray(data) ? data : [];
      setHasMore(page.length === limit);
      setActivities(prev => {
        const combined = reset ? page : [...prev, ...page];
        // de-dupe by id
        const seen = new Set();
        return combined.filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)));
      });
      setOffset(nextOffset + page.length);

      // Fetch reactions for this page
      try {
        const ids = page.map(a => a.id);
        const { data: reacts } = await db.getActivityReactions(ids);
        const nextMap = { ...reactionsMap };
        ids.forEach(id => { if (!nextMap[id]) nextMap[id] = { counts: {}, mine: [] }; });
        (reacts || []).forEach(r => {
          const entry = nextMap[r.activity_id] || { counts: {}, mine: [] };
          entry.counts[r.type] = (entry.counts[r.type] || 0) + 1;
          if (r.user_id === user?.id && !entry.mine.includes(r.type)) entry.mine.push(r.type);
          nextMap[r.activity_id] = entry;
        });
        setReactionsMap(nextMap);
      } catch (_) { /* ignore */ }
    } catch (e) {
      console.error('Failed to fetch activities', e);
      setError(e?.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [loading, offset, user?.id, viewMode]);

  // Reset and fetch when auth changes (avoid depending on fetchPage to prevent loops)
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, viewMode]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        fetchPage(false);
      }
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading]);

  const handleReact = useCallback(async (activityId, type, alreadyReacted) => {
    if (!user?.id) return;
    try {
      if (alreadyReacted) {
        await db.removeReaction(activityId, user.id, type);
      } else {
        await db.addReaction(activityId, user.id, type);
      }
      // Optimistic update
      setReactionsMap(prev => {
        const entry = prev[activityId] || { counts: {}, mine: [] };
        const counts = { ...entry.counts };
        const mine = new Set(entry.mine);
        if (alreadyReacted) {
          counts[type] = Math.max(0, (counts[type] || 1) - 1);
          mine.delete(type);
        } else {
          counts[type] = (counts[type] || 0) + 1;
          mine.add(type);
        }
        return { ...prev, [activityId]: { counts, mine: Array.from(mine) } };
      });
    } catch (e) {
      console.error('Reaction failed', e);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-200 dark:to-emerald-300 bg-clip-text text-transparent">Activities</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{viewMode === 'mine' ? 'Your recent activities' : 'Recent updates from people you follow'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['all','journal','movies','music'].map(t => (
                <button
                  key={t}
                  onClick={() => { setFilterType(t); setOffset(0); setHasMore(true); fetchPage(true); }}
                  className={`mr-1 last:mr-0 px-3 py-1.5 rounded-md text-sm ${filterType === t ? 'bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700' : ''}`}
                >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            <button
              onClick={() => fetchPage(true)}
              className="px-3 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 border border-gray-900/10 dark:border-white/10"
            >
              Refresh
            </button>
            <button
              onClick={() => { setViewMode(v => v === 'mine' ? 'following' : 'mine'); setOffset(0); setHasMore(true); fetchPage(true); }}
              className={`px-3 py-2 rounded-lg border transition-colors ${viewMode === 'mine' ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
              title={viewMode === 'mine' ? 'Showing: My Activities' : 'Showing: Following'}
            >
              {viewMode === 'mine' ? 'My Activities' : 'Following'}
            </button>
          </div>
        </div>

        

        {/* Content */}
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 text-center text-gray-600 dark:text-gray-400">
            No public activities yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {activities
              .filter(act => {
                if (filterType === 'all') return true;
                if (filterType === 'movies') return ['media_added','movie_finished','movie_dropped','movie_watchlist','movie_rated'].includes(act.type);
                if (filterType === 'music') return ['music_stat','now_playing'].includes(act.type);
                if (filterType === 'tasks') return act.type === 'task_completed';
                if (filterType === 'journal') return act.type === 'journal_created';
                return true;
              })
              .map(act => (
              <ActivityItem
                key={act.id}
                activity={act}
                currentUserId={user?.id}
                onReact={handleReact}
                reactionCounts={reactionsMap[act.id]?.counts}
                myReactions={reactionsMap[act.id]?.mine}
              />
            ))}
            {/* Loader sentinel */}
            <div ref={loaderRef} />
            {loading && (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            )}
            {!hasMore && activities.length > 0 && (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">No more activities</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

