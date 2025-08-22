import React, { useEffect, useState } from "react";
import { resolveTrackImage, resolveArtistImage } from "../../utils/artwork";

export default function NowPlayingCard({ nowPlaying }) {
  const isPlaying = nowPlaying?.isPlaying;
  const track = nowPlaying?.track;
  const title = track?.name || "No track currently playing";
  const artist = track?.artist?.['#text'] || track?.artist || "";
  const album = track?.album?.['#text'] || track?.album || "";
  const coverRaw = Array.isArray(track?.image) ? (track.image[track.image.length - 1]?.['#text'] || "") : "";
  const [resolvedCover, setResolvedCover] = useState("");

  // Resolve artwork for track/artist when Last.fm doesn't provide a cover
  useEffect(() => {
    let alive = true;
    (async () => {
      // Reset when track changes
      setResolvedCover("");
      if (coverRaw) return; // we already have a cover from Last.fm
      const trackTitle = track?.name || track?.track;
      const artistName = artist;
      try {
        if (artistName && trackTitle) {
          const u1 = await resolveTrackImage(artistName, trackTitle);
          if (alive && u1) { setResolvedCover(u1); return; }
        }
        if (artistName) {
          const u2 = await resolveArtistImage(artistName);
          if (alive && u2) { setResolvedCover(u2); return; }
        }
      } catch {
        // silent fail
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.name, track?.track, artist, coverRaw]);

  const cover = resolvedCover || coverRaw;

  // Last.fm payloads usually don't carry progress/duration; we show an indeterminate bar when playing
  const progressKnown = false;
  const progressPercentage = 0;

  const formatTime = (ms) => {
    if (!ms && ms !== 0) return "--:--";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-5xl md:max-w-6xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-blue-900/40 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-700 hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.25)] hover:-translate-y-3 hover:scale-[1.02] group">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 opacity-60 animate-pulse" aria-hidden="true" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">
          {/* Enhanced Vinyl with Multiple Glow Rings */}
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full opacity-40 animate-spin-slow blur-sm" aria-hidden="true" />
            {/* Middle glow ring */}
            <div className="absolute inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-30 animate-spin-slow" style={{animationDirection: 'reverse'}} aria-hidden="true" />
            {/* Vinyl record */}
            <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm bg-white/5 ${isPlaying ? 'animate-vinyl-spin' : ''} transition-all duration-500 group-hover:scale-110`}>
              {cover ? (
                <img src={cover} alt={album || title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500/50 via-purple-500/40 to-orange-500/50" />
              )}
              {/* Vinyl grooves effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.1)_21%,transparent_22%,transparent_40%,rgba(0,0,0,0.1)_41%,transparent_42%)] opacity-30" />
            </div>
            {/* Center hole with enhanced styling */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-white/30 shadow-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-gray-900 rounded-full" />
          </div>

          {/* Enhanced Track Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 mb-3 animate-text-glow relative">
                Now Playing
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-xl -z-10 animate-pulse" />
              </h2>
            </div>
            <div className="space-y-2">
              <p className="text-xl md:text-2xl font-bold text-white tracking-wide truncate drop-shadow-lg" title={title}>
                {title}
              </p>
              {artist && (
                <p className="text-base md:text-lg text-purple-200/90 font-medium truncate" title={artist}>
                  {artist}
                </p>
              )}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full bg-white/10 backdrop-blur-sm rounded-full h-4 md:h-5 mt-4 overflow-hidden border border-white/20 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/20 to-blue-400/30 animate-pulse" aria-hidden="true" />
              <div
                className={`bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 h-full rounded-full transition-all duration-700 relative shadow-lg ${!progressKnown && isPlaying ? 'progress-indeterminate' : ''}`}
                style={{ width: progressKnown ? `${progressPercentage}%` : undefined }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full" />
                <div className="absolute right-0 top-0 h-full w-4 md:w-5 bg-white/60 rounded-full blur-sm animate-glow shadow-lg" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm md:text-base text-purple-200/80 font-medium">{formatTime(null)}</p>
              <p className="text-sm md:text-base text-purple-200/80 font-medium">{formatTime(null)}</p>
            </div>
          </div>

          {/* Floating Action Button */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] cursor-pointer group">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
