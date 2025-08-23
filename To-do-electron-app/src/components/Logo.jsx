import React, { useState } from 'react';

export default function Logo({ className = "w-8 h-8", showText = false, textClassName = "text-xl font-bold", preferredSrc = null }) {
  // Prefer logo2.png; fallback to logo.png once if not found
  const [useFallback, setUseFallback] = useState(false);
  const src = useFallback ? '/logo.png' : (preferredSrc || '/logo2.png');
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt="Echo Logo"
        className={className}
        onError={() => {
          // Switch to fallback only once to avoid loops
          if (!useFallback) setUseFallback(true);
        }}
      />
      {showText && (
        <span className={`text-gray-800 dark:text-gray-200 font-bold ${textClassName}`}>
          Echo
        </span>
      )}
    </div>
  );
}
