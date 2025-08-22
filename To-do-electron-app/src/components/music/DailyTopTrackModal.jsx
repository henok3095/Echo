import React from 'react';
import { X, Music, User, Album, Headphones, TrendingUp, CalendarDays } from 'lucide-react';

function getImage(src, fallback, alt, className) {
  if (src) return <img src={src} alt={alt} className={className} />;
  return fallback;
}

export default function DailyTopTrackModal({ isOpen, onClose, topTrack, topArtist, topAlbum, listeningStats, lastfmProfile, date }) {
  if (!isOpen) return null;

  // Images for demo: fallback to icons or colored placeholders if no image
  const trackImg = topTrack?.image?.[2]?.['#text'] || topTrack?.image?.[0]?.['#text'];
  const artistImg = topArtist?.image?.[2]?.['#text'] || topArtist?.image?.[0]?.['#text'];
  const albumImg = topAlbum?.image?.[2]?.['#text'] || topAlbum?.image?.[0]?.['#text'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-950 rounded-2xl w-full max-w-xl mx-4 shadow-2xl transform scale-100 transition-transform border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Listening Snapshot</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your top items & recent listening counts</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Optionally add a refresh button here if needed */}
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: grid of stats */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Top Track */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Top Track</div>
                <div className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {topTrack?.name || '—'}
                  {topTrack?.artist?.name || topTrack?.artist?.['#text'] ? (
                    <span className="text-xs text-gray-400"> — {topTrack.artist?.name || topTrack.artist?.['#text']}</span>
                  ) : null}
                </div>
              </div>
            </div>
            {/* Top Artist */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Top Artist</div>
                <div className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {topArtist?.name || '—'}
                </div>
              </div>
            </div>
            {/* Top Album */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              {getImage(
                albumImg,
                <div className="w-12 h-12 rounded-md bg-cyan-200 flex items-center justify-center"><Album className="w-7 h-7 text-cyan-500" /></div>,
                "album",
                "w-12 h-12 rounded-md object-cover shadow-sm"
              )}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Top Album</div>
                <div className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {topAlbum?.name || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Today */}
            <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl flex flex-col items-start border border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{listeningStats?.today ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">plays</div>
            </div>
            {/* Week */}
            <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl flex flex-col items-start border border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Week</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{listeningStats?.week ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">plays</div>
            </div>
            {/* Month */}
            <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl flex flex-col items-start border border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">Month</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{listeningStats?.month ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">plays</div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-base font-semibold text-indigo-700 dark:text-indigo-300">
              {(() => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  month: undefined
                }).replace(/, /g, ', ');
              })()}
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1.5 border rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

