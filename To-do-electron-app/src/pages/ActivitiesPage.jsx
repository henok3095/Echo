import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { db, supabase } from "../api/supabase.js";
import { TrendingUp, Music, Film, Clock, UserCircle2, BookOpen } from "lucide-react";
import { useAuthStore } from "../store/index.jsx";
import toast from 'react-hot-toast';

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
        const kind = (payload?.type || "media").toLowerCase();
        const title = payload?.title || "Untitled";
        const isBook = kind === 'book' || kind === 'books';
        const icon = isBook
          ? <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
          : <Film className="w-4 h-4 text-purple-600 dark:text-purple-300" />;
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> added {isBook ? 'book' : kind}: <span className={isBook ? "text-indigo-700 dark:text-indigo-300" : "text-purple-700 dark:text-purple-300"}>{title}</span>
          </span>
        )};
      }
      case "book_started":
      case "book_progress":
      case "book_finished":
      case "book_watchlist":
      case "book_rated": {
        const isFinished = type === 'book_finished';
        const isStarted = type === 'book_started';
        const isProgress = type === 'book_progress';
        const isWatchlist = type === 'book_watchlist';
        const isRated = type === 'book_rated';
        const icon = <BookOpen className={`w-4 h-4 ${isFinished ? 'text-emerald-600 dark:text-emerald-300' : isWatchlist ? 'text-blue-600 dark:text-blue-300' : isRated ? 'text-yellow-600 dark:text-yellow-300' : 'text-indigo-600 dark:text-indigo-300'}`} />;
        const title = payload?.title || 'Book';
        const author = payload?.author || payload?.director || null;
        const cover = payload?.cover_url || payload?.poster_path;
        const rating = payload?.rating ?? null;
        const progress = payload?.progress ?? payload?.pages_read ?? null; // pages or percent
        const headerLabel = isFinished ? 'Finished' : isWatchlist ? 'Reading List' : isRated ? 'Rated' : isStarted ? 'Started' : 'Progress';
        const borderCls = isFinished
          ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/20'
          : isWatchlist
          ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20'
          : isRated
          ? 'border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/70 dark:bg-yellow-900/20'
          : 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-900/20';
        const headerTextCls = isFinished
          ? 'text-emerald-700 dark:text-emerald-300'
          : isWatchlist
          ? 'text-blue-700 dark:text-blue-300'
          : isRated
          ? 'text-yellow-700 dark:text-yellow-300'
          : 'text-indigo-700 dark:text-indigo-300';
        return { icon, render: (
          <div className={`rounded-xl border ${borderCls} overflow-hidden`}>
            <div className={`px-4 pt-3 pb-2 flex items-center gap-2 text-xs ${headerTextCls}`}>
              {icon}
              <span>{headerLabel}</span>
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-current font-semibold">
                  by {profile.username}
                </span>
              )}
            </div>
            <div className="px-4 pb-4 flex gap-3">
              {cover ? (
                <img src={cover.startsWith('http') ? cover : `https://image.tmdb.org/t/p/w92${cover}`} alt={title} className="w-16 h-24 rounded-lg object-cover border border-white/50 dark:border-white/10" />
              ) : (
                <div className="w-16 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 opacity-60" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                  <b className="text-gray-900 dark:text-white">{profile?.username || 'Someone'}</b> {isFinished ? 'finished' : isWatchlist ? 'saved' : isRated ? 'rated' : isStarted ? 'started' : 'updated progress on'} <b>{title}</b>
                  {author && <span className="text-gray-500 dark:text-gray-400"> by {author}</span>}
                  {isRated && rating != null && (
                    <span className="ml-1 text-yellow-700 dark:text-yellow-300">{String(rating)}/10</span>
                  )}
                </div>
                {isProgress && progress != null && (
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Progress: {progress}{typeof progress === 'number' && progress <= 100 ? '%' : ''}</div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(created_at)}</div>
              </div>
            </div>
          </div>
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
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-semibold">
                  by {profile.username}
                </span>
              )}
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
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 font-semibold">
                  by {profile.username}
                </span>
              )}
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
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-semibold">
                  by {profile.username}
                </span>
              )}
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
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100/70 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 font-semibold">
                  by {profile.username}
                </span>
              )}
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
        const icon = <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />;
        const title = payload?.title || "Task";
        return { icon, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> completed a task: <span className="text-emerald-700 dark:text-emerald-300">{title}</span>
          </span>
        )};
      }
      case "journal_created": {
        const icon = <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-300" />;
        const title = payload?.title || "Journal entry";
        const id = payload?.id;
        return { icon, render: (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/70 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              {icon}
              <span>Journal</span>
              <span>•</span>
              <span>{timeAgo(created_at)}</span>
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold">
                  by {profile.username}
                </span>
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
        const topArtist = payload?.topArtist;
        const topTrack = payload?.topTrack;
        const topGenre = payload?.topGenre;
        const streakDays = payload?.streakDays;
        const today = payload?.today;
        const week = payload?.week;
        const minutesToday = payload?.minutesToday;
        const newArtists = payload?.newArtistsCount;

        const chips = [];
        if (topArtist) chips.push({ label: `Top Artist`, value: topArtist, cls: 'bg-pink-100/70 dark:bg-pink-900/30 text-pink-900 dark:text-pink-200' });
        if (topTrack) chips.push({ label: `Top Track`, value: topTrack, cls: 'bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200' });
        if (topGenre) chips.push({ label: `Top Genre`, value: topGenre, cls: 'bg-purple-100/70 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200' });
        if (typeof streakDays === 'number' && streakDays >= 3) chips.push({ label: `Streak`, value: `${streakDays} days`, cls: 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200' });
        if (typeof today === 'number' && today >= 20) chips.push({ label: `Today`, value: `${today} plays`, cls: 'bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200' });
        if (typeof week === 'number' && week >= 100) chips.push({ label: `This Week`, value: `${week} plays`, cls: 'bg-blue-100/70 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200' });
        if (typeof minutesToday === 'number' && minutesToday >= 120) chips.push({ label: `Listening`, value: `${minutesToday} min`, cls: 'bg-teal-100/70 dark:bg-teal-900/30 text-teal-900 dark:text-teal-200' });
        if (typeof newArtists === 'number' && newArtists > 0) chips.push({ label: `New Artists`, value: `${newArtists}`, cls: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/30 text-fuchsia-900 dark:text-fuchsia-200' });

        return { icon, render: (
          <div className="rounded-xl border border-pink-200 dark:border-pink-900/40 bg-pink-50/70 dark:bg-pink-900/20 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-xs text-pink-700 dark:text-pink-300">
              {icon}
              <span>Music Stats</span>
              {profile?.username && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-100/70 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200 font-semibold">
                  by {profile.username}
                </span>
              )}
            </div>
            <div className="px-4 pb-4">
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {chips.map((c, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/50 dark:border-white/10 ${c.cls}`}>
                      <b>{c.label}:</b> <span className="truncate max-w-[12rem]">{c.value}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  <b className="font-semibold">{profile?.username || 'Someone'}</b> posted listening stats
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{timeAgo(created_at)}</div>
            </div>
          </div>
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
        return { icon: <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-300" />, text: (
          <span>
            <b className="font-semibold">{profile?.username || "Someone"}</b> posted an update
          </span>
        )};
    }
  }, [type, payload, profile]);

  const badge = useMemo(() => {
    const map = {
      journal_created: { label: 'Journal', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' },
      movie_review: { label: 'Movie', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' },
      music_weekly: { label: 'Music', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
      task_completed: { label: 'Task', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' },
      default: { label: 'Update', cls: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' },
    };
    return map[type] || map.default;
  }, [type]);

  return (
    <div className="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm flex items-start gap-3 transition hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
      <div className="shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 grid place-items-center shadow-sm">
          {content?.icon || <UserCircle2 className="w-5 h-5 text-gray-500" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
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
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="shrink-0 font-semibold text-gray-900 dark:text-gray-100">{profile?.username || 'Someone'}</span>
              <span className={`px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(created_at)}</span>
            </div>
          </>
        )}
        <div className="mt-2 border-t border-gray-200 dark:border-gray-800" />
        {/* Reactions */}
        <div className="mt-1 flex items-center gap-2">
          {REACTIONS.map(r => {
            const count = reactionCounts?.[r.key] || 0;
            const mine = myReactions?.includes(r.key);
            const base = 'inline-flex items-center rounded-full border text-xs transition select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';
            const cls = mine
              ? 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70';
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onReact(activity.id, r.key, mine)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReact(activity.id, r.key, mine); } }}
                aria-pressed={mine}
                aria-label={`${r.label}${count ? ` (${count})` : ''}`}
                title={r.label}
                className={`${base} px-2.5 py-1 ${cls}`}
              >
                <span className="text-base leading-none">{r.emoji}</span>
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${mine ? 'bg-pink-200/80 text-pink-900 dark:bg-pink-800/60 dark:text-pink-100' : 'bg-gray-200/80 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
                    {count}
                  </span>
                )}
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
  const [followingIds, setFollowingIds] = useState(new Set());
  

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

  // Load following list (for filtering realtime in 'following' mode)
  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setFollowingIds(new Set());
      return;
    }
    (async () => {
      try {
        const { data, error } = await db.fetchUserFollowing(user.id);
        if (!error && mounted) {
          const ids = new Set((data || []).map(r => r.following_id));
          setFollowingIds(ids);
        }
      } catch (_) {}
    })();
    return () => { mounted = false };
  }, [user?.id]);

  // Realtime subscription for new activities
  useEffect(() => {
    if (!user?.id) return;
    if (!supabase) return; // Supabase not configured

    const channel = supabase
      .channel('activities-feed-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
          try {
            const act = payload.new;
            if (!act) return;

            // Filter by current view mode
            if (viewMode === 'mine') {
              if (act.user_id !== user.id) return;
            } else {
              // following mode: ignore my own and only people I follow
              if (act.user_id === user.id) return;
              if (!followingIds.has(act.user_id)) return;
            }

            // Fetch author's profile to attach for immediate UI display
            let authorProfile = null;
            try {
              const { data } = await db.getUserProfile(act.user_id);
              if (data) authorProfile = data;
            } catch (_) {}

            // Prepend if not already present
            setActivities(prev => {
              const exists = prev.some(a => a.id === act.id);
              if (exists) return prev;
              // Maintain created_at ordering (newest first)
              const hydrated = authorProfile ? { ...act, profiles: [authorProfile] } : act;
              const next = [hydrated, ...prev];
              return next;
            });

            // Initialize reactions entry and fetch reactions for this activity
            setReactionsMap(prev => ({ ...prev, [act.id]: prev[act.id] || { counts: {}, mine: [] } }));
            try {
              const { data: reacts } = await db.getActivityReactions([act.id]);
              const counts = {};
              const mine = [];
              (reacts || []).forEach(r => {
                counts[r.type] = (counts[r.type] || 0) + 1;
                if (r.user_id === user.id && !mine.includes(r.type)) mine.push(r.type);
              });
              setReactionsMap(prev => ({ ...prev, [act.id]: { counts, mine } }));
            } catch (_) {}

            // Toast notification
            let author = authorProfile?.username || 'Someone you follow';
            const type = String(act.type || 'activity');
            const pretty = (
              type === 'task_completed' ? 'completed a task' :
              type === 'movie_finished' ? 'finished a movie' :
              type === 'movie_rated' ? `rated a movie ${act?.payload?.rating ?? ''}` :
              type === 'media_added' ? ((act?.payload?.type || '').toLowerCase() === 'book' ? 'added a book' : 'added media') :
              type === 'book_finished' ? 'finished a book' :
              type === 'book_started' ? 'started a book' :
              type === 'book_progress' ? 'updated a book progress' :
              type === 'book_watchlist' ? 'saved a book' :
              type === 'book_rated' ? `rated a book ${act?.payload?.rating ?? ''}` :
              type === 'journal_created' ? 'wrote a journal entry' :
              type === 'music_stat' ? 'shared music stats' :
              'posted a new activity'
            );
            toast(`${author} ${pretty}`.trim());
          } catch (_) {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, viewMode, followingIds]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-200 dark:to-emerald-300 bg-clip-text text-transparent">Activities</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{viewMode === 'mine' ? 'Your recent activities' : 'Recent updates from people you follow'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['all','journal','movies','music','books'].map(t => (
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
                if (filterType === 'books') return (
                  ['book_started','book_progress','book_finished','book_watchlist','book_rated'].includes(act.type)
                  || (act.type === 'media_added' && (act?.payload?.type || '').toLowerCase() === 'book')
                );
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

