import React from 'react';
import { Film, Tv, User, Calendar, Star } from 'lucide-react';
import MediaActions from './MediaActions';
import Card from './Card';
import { formatRating } from '../utils/ratings';

/**
 * UnifiedMediaCard
 * Props:
 *  - media: object with fields { id, title, type, poster_path, director, release_date, rating, review, status, watch_date, favorite, tmdb_id }
 *  - onLogDate(media)
 *  - onOpenLog(media)
 */
export default function UnifiedMediaCard({ media, onLogDate = () => {}, onOpenLog = () => {}, onStartWatching = () => {}, progress = null, rank = null, compact = false }) {
  const title = media.title || media.name || 'Untitled';
  const year = media.release_date ? new Date(media.release_date).getFullYear() : null;

  return (
    <Card className={`overflow-hidden group relative p-0`}>
      {compact ? (
        // Horizontal compact layout: small poster left, content right
        <div className="flex items-center gap-4 p-3">
          <div className="flex-shrink-0">
            {media.poster_path ? (
              <img src={`https://image.tmdb.org/t/p/w300${media.poster_path}`} alt={title} className="w-24 h-32 object-cover rounded-md shadow-sm" />
            ) : (
              <div className="w-24 h-32 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md flex items-center justify-center shadow-sm">
                {media.type === 'tv' ? <Tv className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <Film className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
              </div>
            )}
          </div>
          <div className="flex-1">
            {/* Inline status / rank above title to avoid overlap */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {rank ? (
                  <div className="w-7 h-7 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white dark:border-gray-900">
                    {rank}
                  </div>
                ) : media.status && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(media.status)}`}>
                    <span className="capitalize">{media.status.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
              {/* placeholder for possible right-side controls in the header */}
              <div />
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mt-1">{title}</h3>
            <div className="flex items-center gap-3 mt-1">
              {media.director && <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{media.director}</p>}
              {year && <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{year}</p>}
            </div>
            {media.review && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{media.review}</p>}

            {progress && media.type === 'tv' && media.status === 'watching' && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${progress.pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.completed}/{progress.total} • {progress.pct}%</p>
              </div>
            )}

            {/* Footer row: left = rating + status buttons, right = actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {media.rating && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                    <Star className="w-3 h-3" />
                    <span>{formatRating(media.rating, { outOfFive: true, decimals: 2 })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {media.status === 'to_watch' && (
                    <button onClick={() => onStartWatching(media)} className="px-3 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Start Watching</button>
                  )}
                  {media.status === 'watching' && (
                    <button onClick={() => onOpenLog(media)} className="px-3 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50">Log Progress</button>
                  )}
                  {media.status === 'watched' && !media.watch_date && (
                    <button onClick={() => onLogDate(media)} className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">Log Watch Date</button>
                  )}
                </div>
              </div>

              <div className="relative z-10">
                <MediaActions media={media} showRating={false} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Default vertical layout
        <>
          <div className="relative">
            {media.poster_path ? (
              <img src={`https://image.tmdb.org/t/p/w500${media.poster_path}`} alt={title} className={`w-full ${compact ? 'h-40' : 'h-64'} object-cover group-hover:scale-105 transition-transform duration-300`} />
            ) : (
              <div className={`w-full ${compact ? 'h-40' : 'h-64'} bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center`}>
                {media.type === 'tv' ? <Tv className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} text-gray-500 dark:text-gray-400`} /> : <Film className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} text-gray-500 dark:text-gray-400`} />}
              </div>
            )}

            {rank ? (
              <div className="absolute top-3 left-3 z-10">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-white dark:border-gray-900">
                  {rank}
                </div>
              </div>
            ) : media.status && (
              <div className="absolute top-3 left-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(media.status)}`}>
                  <span className="capitalize">{media.status.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>

          <div className={`${compact ? 'p-3' : 'p-4'}`}>
            <h3 className={`font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 ${compact ? 'text-sm' : ''}`}>{title}</h3>
            {media.director && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" />
                {media.director}
              </p>
            )}
            {year && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {year}
              </p>
            )}

            {media.review && (
              <p className={`text-sm text-gray-600 dark:text-gray-400 ${compact ? 'line-clamp-2 mt-1' : 'line-clamp-3 mt-2'}`}>{media.review}</p>
            )}

            {progress && media.type === 'tv' && media.status === 'watching' && (
              <div className="mt-3">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${progress.pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.completed}/{progress.total} episodes • {progress.pct}%</p>
              </div>
            )}

            <div className={`${compact ? 'mt-2' : 'mt-3'} flex items-center justify-between`}>
              <div>
                {media.status === 'to_watch' && (
                  <button onClick={() => onStartWatching(media)} className={`px-3 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 ${compact ? '' : ''}`}>Start Watching</button>
                )}
                {media.status === 'watching' && (
                  <button onClick={() => onOpenLog(media)} className="px-3 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50">Log Progress</button>
                )}
                {media.status === 'watched' && !media.watch_date && (
                  <button onClick={() => onLogDate(media)} className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">Log Watch Date</button>
                )}
              </div>
              <div style={{ width: 44 }} />
            </div>
          </div>

          <div className="absolute bottom-3 right-3">
            <MediaActions media={media} showRating={false} />
          </div>

          {media.rating && (
            <div className="absolute bottom-3 left-3">
              <div className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                <Star className="w-3 h-3" />
                <span>{formatRating(media.rating, { outOfFive: true, decimals: 2 })}</span>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'watching': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    case 'watched': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'to_watch': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    case 'dropped': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  }
}
