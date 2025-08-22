import React, { useEffect, useState } from 'react';
import { User, Music, Album, Play, RefreshCw, Headphones, TrendingUp, Clock, Calendar, Clock3, CalendarDays } from 'lucide-react';
import { resolveArtistImage, resolveTrackImage } from '../../utils/artwork';

export default function LastfmStats({ 
  lastfmProfile, 
  listeningStats,
  topArtists, 
  topAlbums, 
  topTracks = [],
  recentTracks, 
  nowPlaying, 
  isRefreshing, 
  onRefresh 
}) {
  // pick largest Last.fm image url from array
  const getImageUrl = (imageArr) => {
    if (!Array.isArray(imageArr)) return '';
    for (let i = imageArr.length - 1; i >= 0; i--) {
      const item = imageArr[i];
      const url = (item && (item['#text'] || item)) || '';
      if (url) return url;
    }
    return '';
  };

  const [resolvedArtistImages, setResolvedArtistImages] = useState({});
  const [resolvedTrackImages, setResolvedTrackImages] = useState({});

  // Resolve missing artist images for Top Artists (top 5)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!topArtists || topArtists.length === 0) return;
      const updates = {};
      for (const a of topArtists.slice(0, 5)) {
        const name = a?.name;
        if (!name) continue;
        const key = name.toLowerCase();
        const hasImage = !!getImageUrl(a?.image);
        if (!hasImage && !resolvedArtistImages[key]) {
          try {
            const url = await resolveArtistImage(name);
            if (alive && url) updates[key] = url;
          } catch {}
        }
      }
      if (alive && Object.keys(updates).length) {
        setResolvedArtistImages((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topArtists]);
  
  // Resolve missing track images for Top Tracks and Recent (top 5)
  useEffect(() => {
    let alive = true;
    (async () => {
      const candidates = [];
      if (topTracks && topTracks.length) {
        for (const t of topTracks.slice(0, 5)) {
          const title = t?.name || t?.track;
          const artistName = t?.artist?.name || t?.artist?.['#text'] || t?.artist;
          if (!title || !artistName) continue;
          const key = `${artistName}||${title}`.toLowerCase();
          const hasImage = !!getImageUrl(t?.image);
          if (!hasImage && !resolvedTrackImages[key]) {
            candidates.push({ artistName, title, key });
          }
        }
      }
      if (recentTracks && recentTracks.length) {
        for (const t of recentTracks.slice(0, 5)) {
          const title = t?.name || t?.track;
          const artistName = t?.artist?.name || t?.artist?.['#text'] || t?.artist;
          if (!title || !artistName) continue;
          const key = `${artistName}||${title}`.toLowerCase();
          const hasImage = !!getImageUrl(t?.image);
          if (!hasImage && !resolvedTrackImages[key]) {
            candidates.push({ artistName, title, key });
          }
        }
      }
      if (candidates.length === 0) return;
      const updates = {};
      for (const c of candidates) {
        try {
          const url = await resolveTrackImage(c.artistName, c.title);
          if (alive && url) updates[c.key] = url;
        } catch {}
      }
      if (alive && Object.keys(updates).length) {
        setResolvedTrackImages(prev => ({ ...prev, ...updates }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTracks, recentTracks]);
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <div className="space-y-8">
      {/* Minimalist Profile Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {lastfmProfile?.image?.[2]?.['#text'] ? (
                      <img 
                        src={lastfmProfile.image[2]['#text']} 
                        alt={lastfmProfile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {lastfmProfile?.realname || lastfmProfile?.name || 'Music Lover'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-2">@{lastfmProfile?.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <Headphones className="w-4 h-4" />
                    {formatNumber(parseInt(lastfmProfile?.playcount || 0))} scrobbles
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="group p-3 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-2xl transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Now Playing - Floating Minimal Card */}
      {nowPlaying.isPlaying && nowPlaying.track && (
        <div className="relative">
          <div className="relative bg-gradient-to-br from-indigo-100 via-pink-50 to-green-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 border border-indigo-100 dark:border-gray-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-pink-400 rounded-2xl flex items-center justify-center shadow">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider mb-1">Now Playing</p>
                <h3 className="font-extrabold text-xl text-indigo-700 dark:text-indigo-300 truncate">
                  {nowPlaying.track.name}
                </h3>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300 truncate">
                  {nowPlaying.track.artist['#text']}
                </p>
              </div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Listening */}
        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(listeningStats.today)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tracks played</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Week's Listening */}
        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(listeningStats.week)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tracks played</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Month's Listening */}
        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(listeningStats.month)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">tracks played</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Artist</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {topArtists[0]?.name || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {topArtists[0] ? `${formatNumber(parseInt(topArtists[0].playcount))} plays` : 'No data'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Album className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Album</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {topAlbums[0]?.name || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {topAlbums[0] ? `${formatNumber(parseInt(topAlbums[0].playcount))} plays` : 'No data'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Track */}
        <div className="group">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 flex gap-3 items-center">
            <Music className="w-8 h-8 text-pink-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Track</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {topTracks[0]?.name || '—'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {topTracks[0]?.artist?.name || '—'} • {topTracks[0]?.playcount ? `${formatNumber(parseInt(topTracks[0].playcount))} plays` : 'No data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Top Artists */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Artists</h3>
          </div>
          <div className="space-y-3">
            {topArtists.slice(0, 5).map((artist, index) => {
              const name = artist.name;
              const key = name?.toLowerCase();
              const image = artist?.imageUrl || getImageUrl(artist?.image) || (key ? resolvedArtistImages[key] : '');
              return (
                <div key={name} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(parseInt(artist.playcount))} plays
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Tracks</h3>
          </div>
          <div className="space-y-3">
            {topTracks && topTracks.length > 0 ? topTracks.slice(0, 5).map((track, index) => {
              const title = track?.name || track?.track;
              const artistName = track?.artist?.name || track?.artist?.['#text'] || track?.artist;
              const key = `${artistName || ''}||${title || ''}`.toLowerCase();
              const image = track?.imageUrl || getImageUrl(track?.image) || (key ? resolvedTrackImages[key] : '');
              return (
                <div key={track.mbid || track.url || index} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={`${title} cover`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {artistName}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                    {track.playcount} plays
                  </div>
                </div>
              );
            }) : (
              <div className="text-gray-500 dark:text-gray-400">No top tracks found.</div>
            )}
          </div>
        </div>

        {/* Top Albums */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Album className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Albums</h3>
          </div>
          <div className="space-y-3">
            {topAlbums.slice(0, 5).map((album, index) => (
              <div key={`${album.name}-${album.artist.name}`} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {album.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {album.artist.name} • {formatNumber(parseInt(album.playcount))} plays
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent</h3>
          </div>
          <div className="space-y-3">
            {recentTracks.slice(0, 5).map((track, index) => {
              const title = track?.name || track?.track;
              const artistName = track?.artist?.name || track?.artist?.['#text'] || track?.artist;
              const key = `${artistName || ''}||${title || ''}`.toLowerCase();
              const image = track?.imageUrl || getImageUrl(track?.image) || (key ? resolvedTrackImages[key] : '');
              return (
                <div key={`${track.name}-${artistName}-${index}`} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={`${title} cover`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Music className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {artistName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
