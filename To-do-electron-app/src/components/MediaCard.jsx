import React from "react";
import { Star, Music, Film } from "lucide-react";

export default function MediaCard({ title, type = "Movie", rating = 0, coverUrl = "", tags = [] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {type === "Movie" || type === "Series" ? (
          <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h3>
      </div>
      
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
          />
        ))}
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{rating}/5</span>
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
    </div>
  );
}
