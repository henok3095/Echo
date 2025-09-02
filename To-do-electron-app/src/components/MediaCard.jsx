import React from "react";
import { Star, Music, Film } from "lucide-react";
import MediaActions from './MediaActions';

export default function MediaCard({ title, type = "Movie", rating = 0, coverUrl = "", tags = [], id = null, favorite = false }) {
  // Clamp rating to 0-5 range and prepare a display string with up to 2 decimals (trim trailing zeros)
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  const widthPct = `${(r / 5) * 100}%`;
  const ratingText = r.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow relative">
      <div className="flex items-center gap-2 mb-3">
        {type === "Movie" || type === "Series" ? (
          <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h3>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <div className="relative inline-block" aria-label={`Rating ${ratingText} out of 5`}>
          {/* Base (empty) stars */}
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={`bg-${i}`} className="w-3 h-3 text-gray-300 dark:text-gray-600" />
            ))}
          </div>
          {/* Filled overlay clipped to percentage */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: widthPct }}>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={`fg-${i}`} className="w-3 h-3 text-yellow-500 fill-current" />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{ratingText}/5</span>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Absolute positioned actions bottom-right to keep placement consistent */}
      <div className="absolute bottom-3 right-3">
        <MediaActions media={{ id, favorite, rating }} />
      </div>
    </div>
  );
}
