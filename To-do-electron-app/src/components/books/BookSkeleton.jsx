import React from 'react';

export default function BookSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
      <div className="relative">
        {/* Cover image skeleton */}
        <div className="w-full h-64 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
        
        {/* Status pill skeleton */}
        <div className="absolute top-3 right-3">
          <div className="w-16 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {/* Type badge skeleton */}
        <div className="absolute top-3 left-3">
          <div className="w-12 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        </div>
        
        {/* Author skeleton */}
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
        
        {/* Date skeleton */}
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        
        {/* Rating skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
            ))}
          </div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12" />
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/5" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16" />
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-20" />
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-12" />
        </div>
        
        {/* Controls skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}
