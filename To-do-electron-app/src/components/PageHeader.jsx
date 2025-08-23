import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  Icon, // lucide icon component
  iconGradient = 'from-pink-500 to-orange-600',
  titleGradient = 'from-pink-600 via-orange-600 to-red-600',
  centered = true,
}) {
  return (
    <div className={centered ? 'text-center mb-8' : 'mb-8'}>
      <div className={`flex items-center ${centered ? 'justify-center' : ''} gap-3 mb-4`}>
        <div className={`p-4 bg-gradient-to-br ${iconGradient} rounded-3xl shadow-lg`}>
          {Icon ? <Icon className="w-12 h-12 text-white" /> : (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
          )}
        </div>
        <h1 className={`text-5xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className={`text-xl text-gray-600 dark:text-gray-400 ${centered ? '' : ''}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
