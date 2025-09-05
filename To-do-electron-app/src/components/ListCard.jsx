import React, { useState } from 'react';
import { 
  Film, 
  Users, 
  Lock, 
  Globe, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Share2,
  Eye,
  Heart,
  Calendar,
  Star
} from 'lucide-react';
import { useMediaStore } from '../store/index.jsx';
import { formatRating } from '../utils/ratings.js';

const ListCard = ({ list, onEdit, onDelete, onView, compact = false }) => {
  const { mediaEntries } = useMediaStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Get media items for this list
  const listMedia = mediaEntries.filter(media => 
    list.items?.includes(media.id)
  );

  // Calculate list stats
  const totalItems = list.items?.length || 0;

  // Get first few poster images for preview
  const previewPosters = listMedia
    .slice(0, 4)
    .map(media => media.poster_path)
    .filter(Boolean);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (compact) {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => onView?.(list)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {list.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            <span>{totalItems}</span>
          </div>
        </div>
        {list.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {list.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {formatDate(list.created_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {list.name}
              </h3>
              <div className="flex items-center gap-1">
                {list.visibility === 'private' ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : (
                  <Globe className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            {list.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
                <button
                  onClick={() => {
                    onView?.(list);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View List
                </button>
                <button
                  onClick={() => {
                    onEdit?.(list);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit List
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/lists/${list.id}`);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share List
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    onDelete?.(list);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Film className="w-4 h-4" />
            <span>{totalItems} items</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(list.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {previewPosters.length > 0 && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {previewPosters.slice(0, 4).map((poster, index) => {
              const isAbsolute = /^https?:\/\//.test(poster) || poster.startsWith('data:');
              const isAlreadyTmdbFull = poster.startsWith('/t/p/');
              const src = isAbsolute
                ? poster
                : isAlreadyTmdbFull
                  ? `https://image.tmdb.org${poster}`
                  : `https://image.tmdb.org/t/p/w154${poster}`;
              
              return (
                <div key={index} className="aspect-[2/3] rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
            {/* Fill empty slots with placeholders */}
            {Array.from({ length: Math.max(0, 4 - previewPosters.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-[2/3] rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Film className="w-6 h-6 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onView?.(list)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View List →
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            {list.visibility === 'public' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>0</span> {/* Placeholder for follower count */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListCard;
