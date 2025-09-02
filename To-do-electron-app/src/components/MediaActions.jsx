import React from 'react';
import { Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMediaStore } from '../store/index.jsx';
import { formatRating } from '../utils/ratings';

export default function MediaActions({ media, className = '', showRating = false }) {
  const toggleFav = async (e) => {
    e && e.stopPropagation();
    try {
      // call the zustand action directly from the store
      await useMediaStore.getState().toggleFavoriteMediaEntry(media.id);
      toast.success(media.favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showRating && media.rating ? (
        <div className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          <Star className="w-3 h-3" />
          <span>{formatRating(media.rating, { outOfFive: true, decimals: 2 })}</span>
        </div>
      ) : null}

      <button
        onClick={toggleFav}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={media.favorite ? 'Unfavorite' : 'Favorite'}
        title={media.favorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`p-2 rounded-full bg-white/90 dark:bg-gray-900/80 shadow transition-colors hover:scale-110 border border-gray-200 dark:border-gray-700 ${media.favorite ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'}`}
      >
        <Heart className={`w-6 h-6 transition-all duration-200 ${media.favorite ? 'fill-current' : ''}`} fill={media.favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
