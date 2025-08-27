import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, BookOpen, Star, X, Loader, Trash2, CheckCircle, Clock, Bookmark, ChevronDown, Info, User, Calendar, Plus, Flame } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useMediaStore, useAuthStore } from '../store/index.jsx';
import { useReadingStore } from '../store/reading.jsx';
import { searchBooks } from '../api/books.js';
import { db } from '../api/supabase.js';
import Card from '../components/Card';
import ConfettiBurst from '../components/ConfettiBurst.jsx';
import BookCard from '../components/books/BookCard.jsx';
import BookSkeleton from '../components/books/BookSkeleton.jsx';
import BookRecommendations from '../components/books/BookRecommendations.jsx';
import { uiToDbRating, dbToUiRating, formatRating } from '../utils/ratings.js';
import toast from 'react-hot-toast';

// Debounce utility
const useDebounce = (callback, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => callback(...args), delay);
    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]);
  
  return debouncedCallback;
};

const STATUS_OPTIONS = [
  { value: 'to_read', label: 'To Read', icon: Bookmark },
  { value: 'reading', label: 'Reading', icon: Clock },
  { value: 'read', label: 'Read', icon: CheckCircle },
];

export default function BooksPage() {
  const { user } = useAuthStore();
  const { mediaEntries, fetchMediaEntries, addMediaEntry, updateMediaEntry, isLoading } = useMediaStore();
  const { addSession, fetchSessions } = useReadingStore();

  // Search and selection states (matching MoviesPage pattern)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Status selection flow states
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingBook, setPendingBook] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  
  // Existing book status change modal
  const [showExistingBookModal, setShowExistingBookModal] = useState(false);
  const [existingBookToUpdate, setExistingBookToUpdate] = useState(null);

  // Goodreads-like shelves & sorting
  const [activeShelf, setActiveShelf] = useState('all'); // all | to_read | reading | read
  const [sortBy, setSortBy] = useState('recent'); // recent | title | rating
  const [detailBook, setDetailBook] = useState(null);
  const [openShelfFor, setOpenShelfFor] = useState(null); // book.id for open shelf menu

  // Add Book modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Log Reading modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0,10));
  const [logMinutes, setLogMinutes] = useState(30);
  const [logPages, setLogPages] = useState('');
  const [logBookId, setLogBookId] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const books = useMemo(() => mediaEntries.filter(e => e.type === 'book'), [mediaEntries]);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (activeShelf !== 'all') list = list.filter(b => (b.status || '') === activeShelf);
    switch (sortBy) {
      case 'title':
        return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'rating':
        return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'recent':
      default:
        return [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
  }, [books, activeShelf, sortBy]);

  const shelfCounts = useMemo(() => ({
    all: books.length,
    to_read: books.filter(b => (b.status || '') === 'to_read').length,
    reading: books.filter(b => (b.status || '') === 'reading').length,
    read: books.filter(b => (b.status || '') === 'read').length,
  }), [books]);

  // Mini stats for above the list
  const miniStats = useMemo(() => {
    const booksWithRating = books.filter(b => b.rating != null);
    const readingBooks = books.filter(b => b.status === 'reading');
    const readBooks = books
      .filter(b => b.status === 'read')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    let currentStreak = 0;
    if (readBooks.length > 0) {
      const today = new Date();
      const lastReadDate = new Date(readBooks[0].created_at);
      const daysSinceLastRead = Math.floor((today - lastReadDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastRead <= 7) currentStreak = readBooks.length; // simple heuristic
    }

    const avgRating = booksWithRating.length > 0
      ? +(booksWithRating.reduce((a, b) => a + (b.rating || 0), 0) / booksWithRating.length).toFixed(1)
      : 0;

    return {
      currentlyReading: readingBooks.length,
      avgRating,
      ratedCount: booksWithRating.length,
      readingStreak: Math.max(0, currentStreak),
    };
  }, [books]);

  useEffect(() => {
    fetchMediaEntries('book');
    fetchSessions();
  }, [fetchMediaEntries, fetchSessions]);

  const runSearch = async (q) => {
    const term = (q ?? searchQuery)?.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchBooks(term, 12);
      setSearchResults(res);
      setError(null);
    } catch (e) {
      const errorMsg = e.message || 'Failed to search books';
      setError(errorMsg);
      toast.error(errorMsg);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const debouncedSearch = useDebounce(runSearch, 500);

  const handleAddBook = async () => {
    if (!selectedBook) return;
    // Prevent duplicates
    const dup = findDuplicateBook(selectedBook.title, selectedBook.authors?.[0] || '');
    if (dup) {
      toast.error('This book already exists in your library');
      setExistingBookToUpdate(dup);
      setShowExistingBookModal(true);
      return;
    }
    setAdding(true);
    try {
      await addMediaEntry({
        type: 'book',
        title: selectedBook.title,
        director: selectedBook.authors?.[0] || '',
        poster_path: selectedBook.image || '',
        release_date: normalizeReleaseDate(selectedBook.publishedDate),
        overview: selectedBook.description,
        status: 'to_read',
        rating: null,
        review: review?.trim() || null,
      });
      toast.success('Book added to library');
      setShowAddModal(false);
      setSelectedBook(null);
      setSelectedStatus('');
      setReview('');
      setRating(0);
      await fetchMediaEntries('book');
    } catch (error) {
      toast.error('Failed to add book');
    } finally {
      setAdding(false);
    }
  };

  const setBookStars = async (book, uiStars) => {
    try {
      const dbRating = uiToDbRating(uiStars);
      await updateMediaEntry(book.id, { rating: dbRating });
      toast.success(`Rated ${uiStars}/5 stars`);
      await fetchMediaEntries('book'); // Refresh to show updated rating
    } catch (e) {
      toast.error(e.message || 'Failed to update rating');
    }
  };

  const updateBookStatus = async (book, nextStatus) => {
    try {
      await updateMediaEntry(book.id, { status: nextStatus });
      toast.success(`Moved to ${nextStatus.replace('_', ' ')} shelf`);
      await fetchMediaEntries('book'); // Refresh to show updated status
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const removeBook = async (bookId) => {
    try {
      const { error } = await db.deleteMediaEntry(bookId);
      if (error) throw error;
      toast.success('Book removed from library');
      await fetchMediaEntries('book');
    } catch (e) {
      toast.error(e.message || 'Failed to remove book');
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

  const getStatusPill = (s) => {
    switch (s) {
      case 'reading': return 'text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30';
      case 'read': return 'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
      case 'to_read': return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30';
      default: return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50';
    }
  };

  // Normalize Google Books publishedDate to a valid SQL date (YYYY-MM-DD) or null
  const normalizeReleaseDate = (val) => {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // YYYY-MM
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    // YYYY
    if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
    return null;
  };

  // Detect duplicates by normalized title + author (stored as director in DB)
  const findDuplicateBook = (title, author) => {
    const t = (title || '').trim().toLowerCase();
    const a = (author || '').trim().toLowerCase();
    if (!t) return null;
    return books.find(b =>
      (b.title || '').trim().toLowerCase() === t &&
      ((b.director || '').trim().toLowerCase() === a)
    ) || null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    try {
      const results = await searchBooks(searchQuery.trim(), 12);
      setSearchResults(results);
    } catch (e) {
      const errorMsg = e.message || 'Failed to search books';
      setError(errorMsg);
      toast.error(errorMsg);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book) => {
    setPendingBook(book);
    // Close legacy Add Book modal to prevent it from overlaying the status modal
    setShowAddModal(false);
    setShowStatusSelection(true);
  };

  const handleStatusSelection = (status) => {
    setSelectedStatus(status);
    setShowStatusSelection(false);
    
    if (status === 'read') {
      setShowRatingModal(true);
    } else {
      addBookWithStatus(pendingBook, status);
    }
  };

  const addBookWithStatus = async (book, status) => {
    try {
      // Prevent duplicates
      const dup = findDuplicateBook(book.title, book.authors?.[0] || '');
      if (dup) {
        toast.error('This book already exists in your library');
        setExistingBookToUpdate(dup);
        setShowExistingBookModal(true);
        return;
      }
      const bookData = {
        type: 'book',
        title: book.title,
        director: book.authors?.[0] || '',
        poster_path: book.image,
        release_date: normalizeReleaseDate(book.publishedDate),
        overview: book.description,
        status: status,
        rating: null,
        review: null
      };
      await addMediaEntry(bookData);
      toast.success(`${book.title} added as ${status.replace('_', ' ')}! 📚`);
      resetModalStates();
      await fetchMediaEntries('book');
      
      // Auto-switch to the relevant tab to show the added book
      if (status === 'reading') {
        setActiveShelf('reading');
      } else if (status === 'to_read') {
        setActiveShelf('to_read');
      } else if (status === 'read') {
        setActiveShelf('read');
      }
    } catch (error) {
      toast.error('Failed to add book: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRatingSubmission = async () => {
    if (!pendingBook) return;
    
    try {
      // Prevent duplicates
      const dup = findDuplicateBook(pendingBook.title, pendingBook.authors?.[0] || '');
      if (dup) {
        toast.error('This book already exists in your library');
        setExistingBookToUpdate(dup);
        setShowExistingBookModal(true);
        return;
      }
      const bookData = {
        type: 'book',
        title: pendingBook.title,
        director: pendingBook.authors?.[0] || '',
        poster_path: pendingBook.image,
        release_date: normalizeReleaseDate(pendingBook.publishedDate),
        overview: pendingBook.description,
        status: 'read',
        // Map UI 1–5 stars to DB 0–10 scale per app convention
        rating: rating ? uiToDbRating(rating) : null,
        review: review.trim() || null
      };
      await addMediaEntry(bookData);
      toast.success(`${pendingBook.title} added as read with ${rating}/5 rating! ⭐`);
      resetModalStates();
      await fetchMediaEntries('book');
      
      // Auto-switch to read tab to show the added book
      setActiveShelf('read');
    } catch (error) {
      toast.error('Failed to add book: ' + (error.message || 'Unknown error'));
    }
  };

  const handleExistingBookClick = (book) => {
    setExistingBookToUpdate(book);
    setShowExistingBookModal(true);
  };

  const handleExistingBookStatusChange = async (newStatus) => {
    if (!existingBookToUpdate) return;
    
    try {
      await updateBookStatus(existingBookToUpdate, newStatus);
      toast.success(`${existingBookToUpdate.title} moved to ${newStatus.replace('_', ' ')}! 📚`);
      setShowExistingBookModal(false);
      setExistingBookToUpdate(null);
      
      // Auto-switch to the relevant tab
      if (newStatus === 'reading') {
        setActiveShelf('reading');
      } else if (newStatus === 'to_read') {
        setActiveShelf('to_read');
      } else if (newStatus === 'read') {
        setActiveShelf('read');
      }
    } catch (error) {
      toast.error('Failed to update book status');
    }
  };

  const resetModalStates = () => {
    setShowAddModal(false);
    setShowStatusSelection(false);
    setShowRatingModal(false);
    setShowExistingBookModal(false);
    setPendingBook(null);
    setExistingBookToUpdate(null);
    setSelectedStatus('');
    setRating(0);
    setReview('');
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="relative z-10 space-y-4">
          <PageHeader
            title="Books"
            subtitle="Track your reading journey"
            Icon={BookOpen}
            iconGradient="from-pink-500 to-orange-600"
            titleGradient="from-pink-600 via-orange-600 to-red-600"
            centered={true}
          />
          {/* Actions under title */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Log Reading</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add</span>
            </button>
          </div>
        </div>

        {/* Stats (match Series: Total, Reading, Completed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Total Books</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{shelfCounts.all}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Reading</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{shelfCounts.reading}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{shelfCounts.read}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filter Button Group moved under mini-stats */}

        {/* Books grid */}
        <div className="relative z-10 mb-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill().map((_, i) => <BookSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mini stats row inside grid, above cards */}
              <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Currently Reading */}
                <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 border-cyan-200/50 dark:border-cyan-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{miniStats.currentlyReading}</p>
                      <p className="text-sm text-cyan-600 dark:text-cyan-400">Currently Reading</p>
                    </div>
                  </div>
                </Card>

                {/* Average Rating */}
                <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-800/10 border-yellow-200/50 dark:border-yellow-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{formatRating(miniStats.avgRating)}</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Avg Rating</p>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-end">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(dbToUiRating(miniStats.avgRating)) ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-right">Based on {miniStats.ratedCount} rated</p>
                </Card>

                {/* Reading Streak */}
                <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-100/50 dark:from-red-900/20 dark:to-pink-800/10 border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{miniStats.readingStreak}</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Day Streak</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tabs under mini-stats */}
              <div className="col-span-full -mt-2 mb-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${activeShelf === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                    onClick={() => setActiveShelf('all')}
                  >
                    All Books
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${activeShelf === 'to_read' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                    onClick={() => setActiveShelf('to_read')}
                  >
                    To Read
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${activeShelf === 'reading' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                    onClick={() => setActiveShelf('reading')}
                  >
                    Reading
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${activeShelf === 'read' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                    onClick={() => setActiveShelf('read')}
                  >
                    Finished
                  </button>
                </div>
              </div>

              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onStatusChange={updateBookStatus}
                  onRatingChange={(i) => setBookStars(book, i)}
                  onShowDetails={setDetailBook}
                  openShelfFor={openShelfFor}
                  setOpenShelfFor={setOpenShelfFor}
                  onBookClick={(b) => { setLogBookId(b.id); setShowLogModal(true); }}
                />
              ))}
            </div>
          )}
        </div>

        

        {/* Status Selection Modal (matching MoviesPage) */}
        {showStatusSelection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add to Library</h2>
                <button
                  onClick={resetModalStates}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {pendingBook && (
                <div className="flex gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {pendingBook.image ? (
                    <img src={pendingBook.image} alt={pendingBook.title} className="w-12 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{pendingBook.title}</h3>
                    {pendingBook.authors?.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pendingBook.authors.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Choose reading status:</h3>
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelection(option.value)}
                    className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal (matching MoviesPage) */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rate & Review</h2>
                <button
                  onClick={resetModalStates}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {pendingBook && (
                <div className="flex gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {pendingBook.image ? (
                    <img src={pendingBook.image} alt={pendingBook.title} className="w-12 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{pendingBook.title}</h3>
                    {pendingBook.authors?.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pendingBook.authors.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating (optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.25}
                      value={Number(rating) || 0}
                      onChange={(e) => setRating(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatRating(uiToDbRating(rating || 0))}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review (optional)</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder="What did you think of this book?"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetModalStates}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRatingSubmission}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legacy Add Book Modal (keeping for compatibility) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Book</h2>
                <button
                  onClick={resetModalStates}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Search Books</h3>
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for books by title, author, or topic..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Search Results</h3>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map(book => (
                      <div key={book.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer" onClick={() => handleSelectBook(book)}>
                        <div className="flex gap-3">
                          {book.image ? (
                            <img src={book.image} alt={book.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{book.title}</h4>
                            {book.authors?.length > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{book.authors.join(', ')}</p>
                            )}
                            {book.publishedDate && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{book.publishedDate}</p>
                            )}
                            {book.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{book.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No books found. Try a different search term.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Search for books to add them to your library</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Log Reading Modal (consistent with TasksPage modal style) */}
        {showLogModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogModal(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Reading Session</h2>
                <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pages</label>
                    <input
                      type="number"
                      min="0"
                      value={logPages}
                      onChange={(e) => setLogPages(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book (optional)</label>
                  <select
                    value={logBookId}
                    onChange={(e) => setLogBookId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No specific book</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowLogModal(false)} 
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const minutes = Math.max(0, Number(logMinutes) || 0);
                      const pages = logPages === '' ? null : Math.max(0, Number(logPages) || 0);
                      if (minutes === 0 && !pages) { toast.error('Enter minutes or pages'); return; }
                      try {
                        await addSession({ book_id: logBookId || null, date: logDate, minutes, pages });
                        toast.success('Reading logged');
                        setShowLogModal(false);
                        setLogMinutes(30); setLogPages('');
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 1600);
                      } catch (e) {
                        toast.error('Failed to log reading');
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Save Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        

        {/* Existing Book Status Change Modal */}
        {showExistingBookModal && existingBookToUpdate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Status</h2>
                <button
                  onClick={() => setShowExistingBookModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Book preview */}
              <div className="flex gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {existingBookToUpdate.poster_path ? (
                  <img src={existingBookToUpdate.poster_path} alt={existingBookToUpdate.title} className="w-12 h-16 object-cover rounded" />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{existingBookToUpdate.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{existingBookToUpdate.director}</p>
                  <p className="text-xs text-gray-500 mt-1">Current: <span className="capitalize">{existingBookToUpdate.status?.replace('_', ' ')}</span></p>
                </div>
              </div>

              {/* Status options */}
              <div className="space-y-3">
                <button
                  onClick={() => handleExistingBookStatusChange('to_read')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${existingBookToUpdate.status === 'to_read' ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Bookmark className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">To Read</div>
                    <div className="text-sm text-gray-500">Add to your reading list</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExistingBookStatusChange('reading')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${existingBookToUpdate.status === 'reading' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Currently Reading</div>
                    <div className="text-sm text-gray-500">Mark as currently reading</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExistingBookStatusChange('read')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${existingBookToUpdate.status === 'read' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Finished</div>
                    <div className="text-sm text-gray-500">Mark as completed</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Book Recommendations */}
        <div className="relative z-10">
          <BookRecommendations />
        </div>

        {/* Details modal */}
        {detailBook && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailBook(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-gray-100 dark:bg-gray-800 aspect-[2/3]">
                  {detailBook.poster_path ? (
                    <img src={detailBook.poster_path} alt={detailBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="md:w-2/3 p-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{detailBook.title}</h2>
                      {detailBook.director && <p className="text-sm text-gray-600 dark:text-gray-400">{detailBook.director}</p>}
                      {detailBook.release_date && <p className="text-sm text-gray-600 dark:text-gray-400">Published {new Date(detailBook.release_date).getFullYear()}</p>}
                    </div>
                    <button onClick={() => setDetailBook(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderStars(detailBook.rating, async (i) => { await setBookStars(detailBook, i); setDetailBook({ ...detailBook, rating: uiToDbRating(i) }); })}
                    <div className="relative">
                      <select
                        value={detailBook.status || 'to_read'}
                        onChange={async (e) => { await updateBookStatus(detailBook, e.target.value); setDetailBook({ ...detailBook, status: e.target.value }); }}
                        className="appearance-none pr-7 pl-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="to_read">To Read</option>
                        <option value="reading">Reading</option>
                        <option value="read">Read</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {detailBook.overview && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-6">{detailBook.overview}</p>
                  )}

                  {detailBook.review && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Your Notes</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{detailBook.review}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => removeBook(detailBook.id)}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Remove from Library
                    </button>
                    <button
                      onClick={() => setDetailBook(null)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
