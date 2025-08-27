import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar } from 'lucide-react';
import { useReadingStore } from '../../store/reading.jsx';
import Card from '../../components/Card';
import { getPageAndChapters, findPageCountByTitleAuthor } from '../../api/books.js';

const STATUS_OPTIONS = [
  { value: 'to_read', label: 'To Read', icon: BookOpen },
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'read', label: 'Read', icon: BookOpen },
];

export default function BookCard({ 
  book,
  onBookClick,
}) {
  const { sessions } = useReadingStore();
  const initialPageTotal = book.page_count || book.pages || book.pageCount || null;
  const [pageTotal, setPageTotal] = useState(initialPageTotal);

  // Try to fetch page count from Google Books if missing
  useEffect(() => {
    let cancelled = false;
    setPageTotal(book.page_count || book.pages || book.pageCount || null);
    const gbId = book.googleBooksId || book.google_books_id || book.google_booksId || book.googleBooksID;
    const alreadyHasPages = !!(book.page_count || book.pages || book.pageCount);
    if (alreadyHasPages) return;
    (async () => {
      try {
        let pageCount = null;
        if (gbId) {
          console.debug('[BookCard] fetching pageCount by googleBooksId', { id: gbId, title: book.title });
          const res = await getPageAndChapters(gbId);
          pageCount = res?.pageCount || null;
        }
        // Fallback: search by title/author
        if (!pageCount) {
          const author = book.director || (Array.isArray(book.authors) ? book.authors[0] : undefined) || '';
          console.debug('[BookCard] fetching pageCount by title/author', { title: book.title, author });
          pageCount = await findPageCountByTitleAuthor(book.title, author);
        }
        if (!cancelled && pageCount) {
          console.debug('[BookCard] resolved pageCount', { title: book.title, pageCount });
          setPageTotal(pageCount);
        } else {
          console.debug('[BookCard] pageCount not found', { title: book.title });
        }
      } catch (_) {
        console.warn('[BookCard] pageCount fetch failed', _);
      }
    })();
    return () => { cancelled = true; };
  }, [book]);

  // Aggregate reading progress for this book
  const progress = useMemo(() => {
    const forBook = (sessions || []).filter(s => s.book_id === book.id);
    const totalMinutes = forBook.reduce((a, s) => a + (s.minutes || 0), 0);
    const totalPages = forBook.reduce((a, s) => a + (s.pages || 0), 0);
    const lastDate = forBook.length > 0 ? forBook.map(s => s.date).sort().slice(-1)[0] : null;
    const total = pageTotal || null;
    const percent = total ? Math.min(100, Math.round(((totalPages || 0) / total) * 100)) : 0;
    return { totalMinutes, totalPages, lastDate, percent, pageTotal: total };
  }, [sessions, book.id, pageTotal]);
  const getStatusPill = (s) => {
    switch (s) {
      case 'reading': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'read': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'to_read': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer" onClick={() => onBookClick && onBookClick(book)}>
      <div className="relative">
        {book.poster_path ? (
          <img
            src={book.poster_path}
            alt={book.title}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusPill(book.status)}`}>
            {book.status?.replace('_', ' ')}
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>Book</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{book.title}</h3>
        {book.release_date && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(book.release_date).getFullYear()}
          </p>
        )}
        {pageTotal ? (
          <div className="mb-2">
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {pageTotal} pages
            </span>
          </div>
        ) : null}
        {/* Progress */}
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-2 bg-indigo-500 transition-all" style={{ width: `${progress.percent || 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress.totalPages || 0}/{progress.pageTotal || 0} pages • {progress.percent || 0}%</p>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onBookClick && onBookClick(book); }}
            className="px-3 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
          >
            Log Progress
          </button>
        </div>
      </div>
    </Card>
  );
}
