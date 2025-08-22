import React, { useState } from 'react';

export default function Logo({ className = "w-8 h-8", showText = false, textClassName = "text-xl font-bold", preferredSrc = null }) {
  const sources = [
    '/dist/logo2.png',
    '/logo2.png',
    '/logo(no background).png',
    '/logo-transparent.png',
    '/logo.png',
  ];
  const [idx, setIdx] = useState(0);
  const src = preferredSrc || sources[idx] || '/logo.png';
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        onError={() => {
          if (preferredSrc) return; // do not fallback if explicitly specified
          setIdx((i) => Math.min(i + 1, sources.length));
        }}
        alt="Echo Logo"
        className={className}
      />
      {showText && (
        <span className={`text-gray-800 dark:text-gray-200 font-bold ${textClassName}`}>
          Echo
        </span>
      )}
    </div>
  );
}
