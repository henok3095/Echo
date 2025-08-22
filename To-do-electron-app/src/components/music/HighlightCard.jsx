import React from "react";

export default function HighlightCard({
  image,
  title,
  subtitle,
  playcount,
  href,
  delay = 0,
}) {
  return (
    <a
      href={href || '#'}
      target={href ? '_blank' : undefined}
      rel={href ? 'noreferrer noopener' : undefined}
      className="group block min-w-[240px] md:min-w-[280px] rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-2 animate-fade-up relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="h-44 md:h-52 w-full overflow-hidden rounded-t-3xl relative">
          {image ? (
            <>
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {/* Image overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-orange-500/40 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.1)_100%)]" />
            </div>
          )}
        </div>
        {typeof playcount !== 'undefined' && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg">
            {Number(playcount).toLocaleString()} plays
          </div>
        )}
      </div>
      <div className="p-5 space-y-2">
        <div className="font-bold text-white/90 truncate text-lg leading-tight" title={title}>
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-white/70 truncate font-medium" title={subtitle}>
            {subtitle}
          </div>
        )}
        {/* Subtle bottom accent */}
        <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-500" />
      </div>
    </a>
  );
}
