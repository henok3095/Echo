import React, { useEffect, useMemo, useState } from "react";
import { Tv, Film, Calendar, CheckCircle, Play, Clock, Heart, Plus, X, Search, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMediaStore, useAuthStore } from "../store/index.jsx";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";
import { getTVDetails, getSeasonDetails, searchTVShows } from "../api/tmdb";
import { db } from "../api/supabase";
import { uiToDbRating } from "../utils/ratings";

export default function SeriesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mediaEntries, fetchMediaEntries, isLoading, addMediaEntry, updateMediaEntry } = useMediaStore();

  // Progress state
  const [totalEpisodesByMedia, setTotalEpisodesByMedia] = useState({}); // media_id -> total episodes
  const [sessionsByMedia, setSessionsByMedia] = useState({}); // media_id -> array of sessions
  const [loadingProgress, setLoadingProgress] = useState(false);
  // Map media_id -> { [season_number]: startOffset }
  const [seasonOffsetsByMedia, setSeasonOffsetsByMedia] = useState({});

  // Modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null); // media entry object
  const [seasonsData, setSeasonsData] = useState(null); // { seasons: [{ season_number, episodes: [...] }], tvId }
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0,10));

  // Add Series modal state (Movies-like flow)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [tvQuery, setTvQuery] = useState("");
  const [tvResults, setTvResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // Enhanced flow states
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingTv, setPendingTv] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  // Finish flow (when last episode logged)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishRating, setFinishRating] = useState(0);
  const [finishReview, setFinishReview] = useState('');
  
  // Filter state
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMediaEntries();
  }, [fetchMediaEntries]);

  const seriesEntries = mediaEntries.filter((m) => m.type === "tv");

  // Load sessions for current user and visible TV entries
  useEffect(() => {
    if (!user?.id || seriesEntries.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoadingProgress(true);
      try {
        const newSessions = {};
        for (const show of seriesEntries) {
          const { data, error } = await db.listWatchingSessions(user.id, show.id);
          if (error) continue;
          newSessions[show.id] = data || [];
        }
        if (!cancelled) setSessionsByMedia(newSessions);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, seriesEntries.map(s => s.id).join(',')]);

  // Load total episode counts via TMDB and compute season offsets
  useEffect(() => {
    if (seriesEntries.length === 0) return;
    let cancelled = false;
    (async () => {
      const totals = { ...totalEpisodesByMedia };
      const offsets = { ...seasonOffsetsByMedia };
      for (const show of seriesEntries) {
        if (totals[show.id]) continue; // cached
        try {
          const tvId = show.tmdb_id;
          if (!tvId) continue;
          const tv = await getTVDetails(tvId);
          // Sum episodes across seasons (skip specials if season_number === 0)
          let total = 0;
          let seasonOffsetMap = {};
          if (Array.isArray(tv.seasons)) {
            // Sort seasons ascending by season_number ignoring 0 (specials)
            const seasonsSorted = [...tv.seasons].filter(s => s.season_number !== 0).sort((a,b) => a.season_number - b.season_number);
            let running = 0;
            for (const s of seasonsSorted) {
              seasonOffsetMap[s.season_number] = running; // 0-based offset before this season
              // Fallback to s.episode_count; try fetching full season for accuracy
              let epCount = s.episode_count || 0;
              try {
                const season = await getSeasonDetails(tvId, s.season_number);
                epCount = Array.isArray(season.episodes) ? season.episodes.length : epCount;
              } catch {}
              total += (epCount || 0);
              running += (epCount || 0);
            }
          }
          totals[show.id] = total;
          offsets[show.id] = seasonOffsetMap;
        } catch (e) {
          console.error('TMDB load failed for show', show.title, e);
        }
      }
      if (!cancelled) {
        setTotalEpisodesByMedia(totals);
        setSeasonOffsetsByMedia(offsets);
      }
    })();
    return () => { cancelled = true; };
  }, [seriesEntries.map(s => `${s.id}:${s.tmdb_id}`).join(',')]);

  const getAbsIndex = (mediaId, season, episode) => {
    const offset = seasonOffsetsByMedia[mediaId]?.[Number(season)] || 0;
    return (offset + Number(episode)); // 1-based count within series
  };

  const getProgressFor = (mediaId) => {
    const total = totalEpisodesByMedia[mediaId] || 0;
    const sessions = sessionsByMedia[mediaId] || [];
    let farthest = 0;
    for (const s of sessions) {
      const idx = getAbsIndex(mediaId, s.season_number, s.episode_number);
      if (idx > farthest) farthest = idx;
    }
    const completed = farthest; // show max reached episode number
    const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    return { total, completed, pct };
  };

  const resetAddState = () => {
    setAddModalOpen(false);
    setTvQuery("");
    setTvResults([]);
    setIsSearching(false);
    setShowStatusSelection(false);
    setShowRatingModal(false);
    setPendingTv(null);
    setSelectedStatus('');
    setRating(0);
    setReview('');
  };

  const openAddModal = () => {
    setTvQuery("");
    setTvResults([]);
    setAddModalOpen(true);
  };

  const runTVSearch = async () => {
    if (!tvQuery.trim()) {
      setTvResults([]);
      return;
    }
    setIsSearching(true);
    setTvResults([]);
    try {
      const results = await searchTVShows(tvQuery.trim());
      setTvResults((results || []).slice(0, 10));
    } catch (e) {
      toast.error('Failed to search TMDB. Please try again.');
      setTvResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTV = async (item) => {
    setIsSearching(true);
    try {
      if (item.media_type && item.media_type !== 'tv') {
        toast.error('This is a movie. Please add it from the Movies page.');
        return;
      }
      const details = await getTVDetails(item.id);
      const tvData = {
        id: item.id,
        media_type: 'tv',
        name: item.name || details.name || 'Untitled',
        title: item.name || details.name || 'Untitled',
        overview: item.overview || details.overview || '',
        first_air_date: item.first_air_date || details.first_air_date || '',
        release_date: item.first_air_date || details.first_air_date || '',
        poster_path: item.poster_path || details.poster_path || '',
        director: (details.created_by && details.created_by[0]?.name) || '',
        tags: details.genres ? details.genres.map(g => g.name).join(', ') : '',
      };
      setPendingTv(tvData);
      setShowStatusSelection(true);
    } catch (e) {
      toast.error('Failed to fetch TV details');
    } finally {
      setIsSearching(false);
    }
  };

  const findDuplicateTV = (tmdbId, title, date) => {
    const t = (title || '').trim().toLowerCase();
    const y = date ? new Date(date).getFullYear() : '';
    return mediaEntries.find(m => m.type === 'tv' && (
      (m.tmdb_id && m.tmdb_id === tmdbId) ||
      ((m.title || '').trim().toLowerCase() === t && (!y || (new Date(m.release_date).getFullYear() === y)))
    ));
  };

  // Movies-like add flows for TV
  const addToWatchDiaryTV = async (tv) => {
    try {
      if (!user?.id) {
        toast.error('You must be signed in to add series');
        return;
      }
      const dup = findDuplicateTV(tv.id, tv.name || tv.title, tv.first_air_date || tv.release_date);
      if (dup) { toast.error('This series already exists in your library'); return; }
      const mediaData = {
        title: tv.title || tv.name,
        type: 'tv',
        status: 'to_watch',
        rating: null,
        review: null,
        tags: typeof tv.tags === 'string' ? tv.tags.split(',').map(t => t.trim()).filter(Boolean) : tv.tags || [],
        director: tv.director || '',
        poster_path: tv.poster_path || '',
        release_date: tv.release_date || tv.first_air_date || '',
        overview: tv.overview || '',
        tmdb_id: tv.id,
        visibility: 'private',
      };
      console.log('[Series] addMediaEntry payload (to_watch):', mediaData);
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added to your watch diary!`);
      resetAddState();
      await fetchMediaEntries();
    } catch (e) {
      toast.error(`Failed to add to watch diary${e?.message ? `: ${e.message}` : ''}`);
    }
  };

  const addTVWithStatus = async (tv, status) => {
    try {
      if (!user?.id) {
        toast.error('You must be signed in to add series');
        return;
      }
      const dup = findDuplicateTV(tv.id, tv.name || tv.title, tv.first_air_date || tv.release_date);
      if (dup) { toast.error('This series already exists in your library'); return; }
      const mediaData = {
        title: tv.title || tv.name,
        type: 'tv',
        status,
        rating: null,
        review: null,
        tags: typeof tv.tags === 'string' ? tv.tags.split(',').map(t => t.trim()).filter(Boolean) : tv.tags || [],
        director: tv.director || '',
        poster_path: tv.poster_path || '',
        release_date: tv.release_date || tv.first_air_date || '',
        overview: tv.overview || '',
        tmdb_id: tv.id,
        visibility: 'private',
      };
      console.log('[Series] addMediaEntry payload (status):', status, mediaData);
      const created = await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added as ${status.replace('_',' ')}!`);
      resetAddState();
      await fetchMediaEntries();

      // If user added as watching, immediately open the log modal and hint the next episode
      if (created && status === 'watching') {
        // Try to infer next episode (default S1E1 for new series)
        try {
          await openLogModal(created);
          toast('Start logging at S1E1');
        } catch (e) {
          console.warn('Failed to auto-open log modal after adding watching:', e);
        }
      }
    } catch (e) {
      toast.error(`Failed to add series${e?.message ? `: ${e.message}` : ''}`);
    }
  };

  const handleRatingSubmissionTV = async () => {
    if (!pendingTv) return;
    try {
      if (!user?.id) {
        toast.error('You must be signed in to add series');
        return;
      }
      const dup = findDuplicateTV(pendingTv.id, pendingTv.name || pendingTv.title, pendingTv.first_air_date || pendingTv.release_date);
      if (dup) { toast.error('This series already exists in your library'); return; }
      const mediaData = {
        title: pendingTv.title || pendingTv.name,
        type: 'tv',
        status: 'watched',
        rating: uiToDbRating(rating),
        review: review.trim() || null,
        tags: typeof pendingTv.tags === 'string' ? pendingTv.tags.split(',').map(t => t.trim()).filter(Boolean) : pendingTv.tags || [],
        director: pendingTv.director || '',
        poster_path: pendingTv.poster_path || '',
        release_date: pendingTv.release_date || pendingTv.first_air_date || '',
        overview: pendingTv.overview || '',
        tmdb_id: pendingTv.id,
        visibility: 'private',
        watch_date: new Date().toISOString(),
      };
      console.log('[Series] addMediaEntry payload (watched with rating):', mediaData);
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added as watched with ${rating}/5 rating!`);
      resetAddState();
      await fetchMediaEntries();
    } catch (e) {
      toast.error(`Failed to add series${e?.message ? `: ${e.message}` : ''}`);
    }
  };

  const handleStatusSelection = (status) => {
    setSelectedStatus(status);
    setShowStatusSelection(false);
    if (status === 'watched') {
      setShowRatingModal(true);
    } else if (status === 'to_watch') {
      addToWatchDiaryTV(pendingTv);
    } else {
      addTVWithStatus(pendingTv, status);
    }
  };

  const openLogModal = async (show) => {
    try {
      if (!show.tmdb_id) {
        toast.error('Missing TMDB id for this show');
        return;
      }
      const tv = await getTVDetails(show.tmdb_id);
      const seasons = [];
      if (Array.isArray(tv.seasons)) {
        for (const s of tv.seasons) {
          if (s.season_number === 0) continue;
          let episodes = [];
          try {
            const season = await getSeasonDetails(show.tmdb_id, s.season_number);
            episodes = season.episodes || [];
          } catch {
            episodes = new Array(s.episode_count || 0).fill(0).map((_, i) => ({ episode_number: i + 1, name: `Episode ${i+1}` }));
          }
          seasons.push({ season_number: s.season_number, episodes });
        }
      }
      setSeasonsData({ tvId: show.tmdb_id, seasons });
      // Compute next episode from existing sessions if any; else default to S1E1
      let preSeason = seasons[0]?.season_number || 1;
      let preEpisode = seasons[0]?.episodes?.[0]?.episode_number || 1;
      try {
        const sess = sessionsByMedia[show.id] || [];
        if (seasons.length > 0) {
          // Build a local season offset map from fetched seasons
          const seasonsSorted = [...seasons].sort((a,b) => a.season_number - b.season_number);
          const offsetMap = {};
          let running = 0;
          for (const s of seasonsSorted) {
            offsetMap[s.season_number] = running;
            running += (s.episodes?.length || 0);
          }
          // Find farthest absolute index from existing sessions
          let farthest = 0;
          for (const s of sess) {
            const idx = (offsetMap[Number(s.season_number)] || 0) + Number(s.episode_number);
            if (idx > farthest) farthest = idx;
          }
          const nextAbs = Math.min(running, farthest + 1);
          // Map nextAbs back to season/episode
          let remaining = nextAbs;
          for (const s of seasonsSorted) {
            const count = s.episodes?.length || 0;
            if (remaining <= count) {
              preSeason = s.season_number;
              preEpisode = remaining;
              break;
            }
            remaining -= count;
          }
        }
      } catch (e) {
        console.warn('Prefill next episode failed, defaulting to S1E1:', e);
      }
      setSelectedSeason(preSeason);
      setSelectedEpisode(preEpisode);
      setLogTarget(show);
      setLogModalOpen(true);
      toast(`You're at S${preSeason}E${preEpisode}`);
    } catch (e) {
      toast.error('Failed to load seasons');
    }
  };

  const submitLog = async () => {
    if (!user?.id || !logTarget) return;
    try {
      const payload = {
        user_id: user.id,
        media_id: logTarget.id,
        date: logDate,
        season_number: Number(selectedSeason),
        episode_number: Number(selectedEpisode),
        minutes: 0,
        note: null,
      };
      const { data, error } = await db.createWatchingSession(payload);
      if (error) throw error;
      // Update local sessions
      const current = sessionsByMedia[logTarget.id] || [];
      setSessionsByMedia({ ...sessionsByMedia, [logTarget.id]: [...current, data] });
      toast.success('Progress logged');
      setLogModalOpen(false);

      // If this completes the series, auto-mark as watched
      try {
        const total = totalEpisodesByMedia[logTarget.id] || 0;
        if (total > 0) {
          let farthest = 0;
          for (const s of current) {
            const idx = getAbsIndex(logTarget.id, s.season_number, s.episode_number);
            if (idx > farthest) farthest = idx;
          }
          const lastIdx = getAbsIndex(logTarget.id, data.season_number, data.episode_number);
          const completed = Math.max(farthest, lastIdx);
          if (completed >= total) {
            try {
              await updateMediaEntry(logTarget.id, { status: 'watched', watch_date: new Date().toISOString() });
              toast.success('Series completed and marked as watched.');
              await fetchMediaEntries();
            } catch (err) {
              console.warn('Failed to auto-mark watched:', err);
            }
          }
        }
      } catch (e) {
        console.warn('Finish detection failed:', e);
      }
    } catch (e) {
      const msg = e?.message?.includes('duplicate key') ? 'Already logged this episode' : 'Failed to log progress';
      toast.error(msg);
    }
  };

  const submitFinishReview = async () => {
    if (!logTarget) return;
    try {
      const updates = {
        status: 'watched',
        rating: uiToDbRating(finishRating),
        review: (finishReview || '').trim() || null,
        watch_date: new Date().toISOString(),
      };
      await updateMediaEntry(logTarget.id, updates);
      toast.success('Series marked as watched. Thanks for rating!');
      setShowFinishModal(false);
      setFinishRating(0);
      setFinishReview('');
      await fetchMediaEntries();
    } catch (e) {
      toast.error(`Failed to save rating${e?.message ? `: ${e.message}` : ''}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "watching":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "watched":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "to_watch":
        return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
      case "dropped":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "watching":
        return <Play className="w-3 h-3" />;
      case "watched":
        return <CheckCircle className="w-3 h-3" />;
      case "to_watch":
        return <Clock className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="relative p-6 space-y-8">
        <PageHeader
          title="Series"
          subtitle="Track your TV shows and progress"
          Icon={Tv}
          iconGradient="from-indigo-500 to-purple-600"
          titleGradient="from-indigo-600 via-purple-600 to-pink-600"
          centered={true}
        />

        {/* Actions under title */}
        <div className="flex items-center justify-between">
          {/* Segmented toggle: Movies | Series - moved to left */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => navigate('/movies')}
              className="px-5 py-3 flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Film className="w-5 h-5" />
              Movies
            </button>
            <button
              className="px-5 py-3 flex items-center gap-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-medium"
              aria-current="page"
            >
              <Tv className="w-5 h-5" />
              Series
            </button>
          </div>
          
          {/* Action buttons on the right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (seriesEntries.length > 0) {
                  openLogModal(seriesEntries[0]);
                } else {
                  toast("No series yet. Add one first.");
                }
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Watch Diary</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Total</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{seriesEntries.length}</p>
              </div>
              <Tv className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Watched</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{seriesEntries.filter(m => m.status === 'watched').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Watching</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{seriesEntries.filter(m => m.status === 'watching').length}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">To Watch</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {seriesEntries.filter(m => m.status === 'to_watch').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filter Button Group */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'to_watch' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
            onClick={() => setFilter('to_watch')}
          >
            <Clock className="inline w-4 h-4 mr-1" />
            To Watch
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'watching' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
            onClick={() => setFilter('watching')}
          >
            <Play className="inline w-4 h-4 mr-1" />
            Watching
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'watched' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
            onClick={() => setFilter('watched')}
          >
            <CheckCircle className="inline w-4 h-4 mr-1" />
            Completed
          </button>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seriesEntries
            .filter(show => {
              if (filter === 'all') return true;
              return show.status === filter;
            })
            .map((show) => (
              <Card key={show.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="relative">
                  {show.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                    alt={show.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                    <Tv className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(show.status)}`}>
                    {getStatusIcon(show.status)}
                    <span className="capitalize">{show.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                    <Tv className="w-3 h-3" />
                    <span>TV</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{show.title}</h3>
                {show.release_date && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(show.release_date).getFullYear()}
                  </p>
                )}
                {/* Progress */}
                <div className="mt-2">
                  {(() => {
                    const p = getProgressFor(show.id);
                    return (
                      <>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${p.pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{p.completed}/{p.total} episodes • {p.pct}%</p>
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => openLogModal(show)}
                    className="px-3 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                  >
                    Log Progress
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await useMediaStore.getState().toggleFavoriteMediaEntry(show.id);
                        toast.success(show.favorite ? "Removed from favorites" : "Added to favorites");
                      } catch (err) {
                        toast.error("Failed to update favorite");
                      }
                    }}
                    className={`p-2 rounded-full bg-white/90 dark:bg-gray-900/80 shadow transition-colors hover:scale-110 border border-gray-200 dark:border-gray-700 ${show.favorite ? "text-pink-600" : "text-gray-400 hover:text-pink-500"}`}
                    title={show.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`w-6 h-6 transition-all duration-200 ${show.favorite ? "fill-current" : ""}`} fill={show.favorite ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {seriesEntries.length === 0 && (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl inline-block mb-6">
              <Tv className="w-16 h-16 text-indigo-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No series yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Go to Movies to add TV shows to your library.</p>
            <button
              onClick={() => navigate("/movies")}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl hover:from-rose-700 hover:to-orange-700 transition-all duration-200 hover:scale-105"
            >
              Go to Movies
            </button>
          </div>
        )}

        {/* Add TV Modal (Movies-like) */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add TV Show</h2>
                <button
                  onClick={resetAddState}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Search */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for TV shows..."
                        value={tvQuery}
                        onChange={(e) => setTvQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && runTVSearch()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={runTVSearch}
                      disabled={isSearching || !tvQuery.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSearching ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      Search
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {tvResults.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Search Results</h3>
                    {tvResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectTV(item)}
                        className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <img
                          src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : undefined}
                          alt={item.name}
                          className="w-12 h-16 object-cover rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-xs text-gray-500">{(item.first_air_date || '').slice(0,4)}</div>
                          <div className="text-xs text-gray-500 uppercase">TV</div>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-sm">Select</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Selection Modal - Enhanced Flow (match Movies) */}
        {showStatusSelection && pendingTv && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => {
                  setShowStatusSelection(false);
                  setPendingTv(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close Status Selection"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>

              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {pendingTv.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${pendingTv.poster_path}`}
                        alt={pendingTv.title || pendingTv.name}
                        className="w-16 h-24 object-cover rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Tv className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {pendingTv.title || pendingTv.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {pendingTv.release_date && new Date(pendingTv.release_date).getFullYear()}
                      </p>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    What's your status with this TV show?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose your current status to continue
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleStatusSelection('watched')}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-2 border-green-200 dark:border-green-800/30 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <div className="text-center">
                      <div className="font-semibold text-green-700 dark:text-green-300">Watched</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">Rate & review</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusSelection('to_watch')}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 border-2 border-orange-200 dark:border-orange-800/30 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    <div className="text-center">
                      <div className="font-semibold text-orange-700 dark:text-orange-300">To Watch</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Add to diary</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusSelection('watching')}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-2 border-blue-200 dark:border-blue-800/30 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Play className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div className="text-center">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">Watching</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Currently viewing</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusSelection('dropped')}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-2 border-red-200 dark:border-red-800/30 rounded-xl hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                    <div className="text-center">
                      <div className="font-semibold text-red-700 dark:text-red-300">Dropped</div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">Didn't finish</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal (Movies-like) */}
        {showRatingModal && pendingTv && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden">
              <button
                onClick={() => setShowRatingModal(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h3 className="text-xl font-semibold mb-4 pr-8">Rate • {pendingTv.title}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Rating (0-5)</label>
                  <input type="range" min="0" max="5" step="0.25" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full" />
                  <div className="text-sm text-gray-600 mt-1">{rating > 0 ? `${rating.toFixed(2).replace(/\\.0+$/, '').replace(/(\\.\\d*?)0+$/, '$1')}/5` : 'No rating yet'}</div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Review (optional)</label>
                  <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowRatingModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">Cancel</button>
                <button onClick={handleRatingSubmissionTV} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Finish Series Modal (upon final episode logged) */}
        {showFinishModal && logTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden">
              <button
                onClick={() => setShowFinishModal(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h3 className="text-xl font-semibold mb-1 pr-8">You've finished • {logTarget.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Would you like to rate and review this series?</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Rating (0-5)</label>
                  <input type="range" min="0" max="5" step="0.25" value={finishRating} onChange={(e) => setFinishRating(Number(e.target.value))} className="w-full" />
                  <div className="text-sm text-gray-600 mt-1">{finishRating > 0 ? `${finishRating.toFixed(2).replace(/\\.0+$/, '').replace(/(\\.\\d*?)0+$/, '$1')}/5` : 'No rating yet'}</div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Review (optional)</label>
                  <textarea value={finishReview} onChange={(e) => setFinishReview(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowFinishModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">Not Now</button>
                <button onClick={submitFinishReview} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Log Progress Modal */}
        {logModalOpen && logTarget && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setLogModalOpen(false)}>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLogModalOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 shadow"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-between mb-4 pr-8">
                <h3 className="text-lg font-semibold">Log Progress • {logTarget.title}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Season</label>
                    <select value={selectedSeason} onChange={(e) => {
                      const s = Number(e.target.value);
                      setSelectedSeason(s);
                      const ep = seasonsData?.seasons?.find(x => x.season_number === s)?.episodes?.[0]?.episode_number || 1;
                      setSelectedEpisode(ep);
                    }} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {(seasonsData?.seasons || []).map(s => (
                        <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Episode</label>
                    <select value={selectedEpisode} onChange={(e) => setSelectedEpisode(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {(seasonsData?.seasons?.find(s => s.season_number === selectedSeason)?.episodes || []).map(ep => (
                        <option key={ep.episode_number} value={ep.episode_number}>{ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setLogModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">Cancel</button>
                <button onClick={submitLog} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Log</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
