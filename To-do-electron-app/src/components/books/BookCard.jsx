import React, { useMemo } from 'react';
import { BookOpen, User, Calendar, ChevronDown, Star } from 'lucide-react';
import { dbToUiRating, formatRating } from '../../utils/ratings';
import { useReadingStore } from '../../store/reading.jsx';

const STATUS_OPTIONS = [
  { value: 'to_read', label: 'To Read', icon: BookOpen },
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'read', label: 'Read', icon: BookOpen },
];

export default function BookCard({ 
  book, 
  onStatusChange, 
  onRatingChange, 
  onShowDetails,
  openShelfFor,
  setOpenShelfFor,
  onBookClick
}) {
  const { sessions } = useReadingStore();

  // Aggregate reading progress for this book
  const progress = useMemo(() => {
    const forBook = (sessions || []).filter(s => s.book_id === book.id);
    const totalMinutes = forBook.reduce((a, s) => a + (s.minutes || 0), 0);
    const totalPages = forBook.reduce((a, s) => a + (s.pages || 0), 0);
    const lastDate = forBook.length > 0 ? forBook.map(s => s.date).sort().slice(-1)[0] : null;
    const pageTotal = book.page_count || book.pages || null;
    const percent = pageTotal && totalPages > 0 ? Math.min(100, Math.round((totalPages / pageTotal) * 100)) : null;
    return { totalMinutes, totalPages, lastDate, percent, pageTotal };
  }, [sessions, book]);
  const getStatusPill = (s) => {
    switch (s) {
      case 'reading': return 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30';
      case 'read': return 'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
      case 'to_read': return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30';
      default: return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50';
    }
  };

  const renderStars = (value, onClick) => {
    const uiVal = dbToUiRating(value);
    return (
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            onClick={onClick ? () => onClick(i) : undefined}
            className={`p-1 ${onClick ? 'hover:scale-110 transition-transform' : ''}`}
            title={`${i} star${i>1?'s':''}`}
          >
            <Star className={`w-5 h-5 ${i <= uiVal ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div 
      onClick={() => onBookClick && onBookClick(book)}
      className="overflow-hidden hover:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.25)] transition-all duration-500 hover:scale-105 hover:-translate-y-2 group rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl relative cursor-pointer"
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="h-72 w-full overflow-hidden rounded-t-3xl relative">
          {book.poster_path ? (
            <>
              <img
                src={book.poster_path}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              {/* Image overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/40 via-indigo-500/30 to-blue-500/40 flex items-center justify-center relative">
              <BookOpen className="w-20 h-20 text-white/60" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.1)_100%)]" />
            </div>
          )}
        </div>
        
        {/* Enhanced Status pill */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize backdrop-blur-md border border-white/20 shadow-lg ${getStatusPill(book.status)}`}>
            {book.status?.replace('_', ' ')}
          </div>
        </div>
        
        {/* Enhanced Type badge */}
        <div className="absolute top-4 left-4">
          <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-xs rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg">
            <BookOpen className="w-3.5 h-3.5" /> Book
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col">
        <h3 className="font-bold text-white/90 mb-3 line-clamp-2 text-lg leading-tight">{book.title}</h3>
        
        {book.director && (
          <p className="text-sm text-white/70 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-300" />
            {book.director}
          </p>
        )}
        
        {book.release_date && (
          <p className="text-sm text-white/70 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-300" />
            {new Date(book.release_date).getFullYear()}
          </p>
        )}
        
        <div className="flex items-center gap-3 mb-3">
          {renderStars(book.rating, onRatingChange)}
          <span className="text-sm font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">
            {formatRating(book.rating)}
          </span>
        </div>
        
        {/* Consistent description container */}
        <div className="mt-3 min-h-[3.75rem]">{/* ~3 lines at text-sm */}
          <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
            {book.overview && book.overview.trim().length > 0 ? book.overview : 'No description'}
          </p>
        </div>

        {/* Reading Progress (reserved height for consistency) */}
        <div className="mt-3 min-h-[52px]">
          {(progress.totalMinutes > 0 || progress.totalPages > 0) ? (
            <div className="space-y-2">
              {progress.percent != null && (
                <div>
                  <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                    <span>Progress</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-white/70">
                {progress.totalPages > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20">{progress.totalPages} pages</span>
                )}
                {progress.totalMinutes > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20">{progress.totalMinutes} min</span>
                )}
                {progress.lastDate && (
                  <span className="ml-auto text-[11px] text-white/60">Last: {new Date(progress.lastDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center text-xs text-white/50">No reading progress yet</div>
          )}
        </div>

        {Array.isArray(book.tags) && book.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {book.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm">{t}</span>
            ))}
            {book.tags.length > 3 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm">+{book.tags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Action buttons - pinned to bottom for consistency */}
        <div className="mt-4 flex items-center justify-center pt-2 border-t border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails(book);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-purple-400 hover:to-blue-400 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_-8px_rgba(139,92,246,0.4)] hover:scale-105"
          >
            Details
          </button>
        </div>
        
        {/* Subtle bottom accent */}
        <div className="mt-4 w-16 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-20 transition-all duration-500" />
      </div>
    </div>
  );
}
