import React from 'react';

export default function Logo({ className = "w-8 h-8", showText = false, textClassName = "text-xl font-bold" }) {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo.png" 
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
