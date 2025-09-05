import React, { useState } from "react";
import { Star, Music, Film, Heart, Plus, MoreVertical, List as ListIcon } from "lucide-react";
import { useMediaStore } from '../store/index.jsx';
import { formatRating } from '../utils/ratings.js';
import MediaActions from './MediaActions';
import AddToListModal from './AddToListModal';

export default function EnhancedMediaCard({ 
  media, 
  showListActions = true, 
  compact = false 
}) {
  const { getListsForMedia, toggleFavoriteMediaEntry } = useMediaStore();
  const [showAddToList, setShowAddToList] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Get lists containing this media
  const mediaLists = getListsForMedia(media.id);

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteMediaEntry(media.id);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  // Clamp rating to 0-5 range and prepare display
  const rating = Math.min(5, Math.max(0, Number(media.rating) || 0));
  const widthPct = `${(rating / 5) * 100}%`;

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-4">
          {/* Poster */}
          <div className="w-16 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
            {media.poster_path ? (() => {
              const p = media.poster_path || '';
              const isAbsolute = /^https?:\/\//.test(p) || p.startsWith('data:');
              const isAlreadyTmdbFull = p.startsWith('/t/p/');
              const src = isAbsolute
                ? p
                : isAlreadyTmdbFull
                  ? `https://image.tmdb.org${p}`
                  : `https://image.tmdb.org/t/p/w92${p}`;
              return (
                <img
                  src={src}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              );
            })() : (
              <div className="w-full h-full flex items-center justify-center">
                {media.type === "movie" || media.type === "tv" || media.type === "series" ? (
                  <Film className="w-6 h-6 text-gray-400" />
                ) : (
                  <Music className="w-6 h-6 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{media.title}</h3>
              {showListActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowAddToList(true)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Add to list"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-1.5 rounded-md transition-colors ${
                      media.favorite 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                    title={media.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`w-4 h-4 ${media.favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {media.type}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {media.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative inline-block">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={`bg-${i}`} className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      ))}
                    </div>
                    <div className="absolute inset-0 overflow-hidden" style={{ width: widthPct }}>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={`fg-${i}`} className="w-3 h-3 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatRating(rating)}</span>
                </div>
              )}

              {mediaLists.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <ListIcon className="w-3 h-3" />
                  <span>{mediaLists.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add to List Modal */}
        <AddToListModal
          isOpen={showAddToList}
          onClose={() => setShowAddToList(false)}
          media={media}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Poster */}
      <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {media.poster_path ? (() => {
          const p = media.poster_path || '';
          const isAbsolute = /^https?:\/\//.test(p) || p.startsWith('data:');
          const isAlreadyTmdbFull = p.startsWith('/t/p/');
          const src = isAbsolute
            ? p
            : isAlreadyTmdbFull
              ? `https://image.tmdb.org${p}`
              : `https://image.tmdb.org/t/p/w342${p}`;
          return (
            <img
              src={src}
              alt={media.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          );
        })() : (
          <div className="w-full h-full flex items-center justify-center">
            {media.type === "movie" || media.type === "tv" || media.type === "series" ? (
              <Film className="w-12 h-12 text-gray-400" />
            ) : (
              <Music className="w-12 h-12 text-gray-400" />
            )}
          </div>
        )}

        {/* Overlay Actions */}
        {showListActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAddToList(true)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors text-white"
              title="Add to list"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-3 backdrop-blur-sm rounded-full transition-colors ${
                media.favorite 
                  ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={media.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-5 h-5 ${media.favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}

        {/* Favorite Badge */}
        {media.favorite && (
          <div className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full">
            <Heart className="w-3 h-3 text-white fill-current" />
          </div>
        )}

        {/* Lists Badge */}
        {mediaLists.length > 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            <div className="flex items-center gap-1">
              <ListIcon className="w-3 h-3" />
              <span>{mediaLists.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {media.title}
          </h3>
          
          {showListActions && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      setShowAddToList(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to List
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {media.type}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {media.status}
          </span>
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="relative inline-block">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={`bg-${i}`} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                ))}
              </div>
              <div className="absolute inset-0 overflow-hidden" style={{ width: widthPct }}>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`fg-${i}`} className="w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{formatRating(rating)}</span>
          </div>
        )}

        {/* Lists Preview */}
        {mediaLists.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ListIcon className="w-3 h-3" />
              <span>In {mediaLists.length} list{mediaLists.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {mediaLists.slice(0, 2).map(list => (
                <span key={list.id} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  {list.name}
                </span>
              ))}
              {mediaLists.length > 2 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  +{mediaLists.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Original Actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <MediaActions media={media} />
        </div>
      </div>

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={showAddToList}
        onClose={() => setShowAddToList(false)}
        media={media}
      />
    </div>
  );
}
