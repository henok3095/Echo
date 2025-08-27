import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Star, 
  Calendar, 
  User, 
  Film, 
  Tv,
  X,
  Loader,
  Play,
  Clock,
  CheckCircle,
  Eye,
  Heart,
  Filter
} from "lucide-react";
import { useMediaStore, useAuthStore } from '../store/index.jsx';
import { searchMulti, getMovieDetails, getTVDetails } from "../api/tmdb";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import toast from 'react-hot-toast';
import { uiToDbRating, dbToUiRating, formatRating } from "../utils/ratings";
// Removed MediaStreakTracker import as streak display is no longer used

const MEDIA_TYPES = [
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'tv', label: 'TV Show', icon: Tv }
];

const STATUS_OPTIONS = [
  { value: 'to_watch', label: 'To Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
  { value: 'dropped', label: 'Dropped' }
];

export default function MoviesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mediaEntries, addMediaEntry, fetchMediaEntries, isLoading } = useMediaStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropup, setShowDropup] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMedia, setNewMedia] = useState({
    title: '',
    type: 'movie',
    status: 'to_watch',
    rating: 0,
    review: '',
    tags: '',
    director: '',
    popularity: 0,
    poster_path: '',
    release_date: '',
    overview: '',
    tmdb_id: null
  });
  const [tmdbResults, setTmdbResults] = useState([]);
  const [isTmdbLoading, setIsTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedFromTmdb, setSelectedFromTmdb] = useState(false);

  // Add missing modal state hooks
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rating, setRating] = useState(0); // UI scale 0-5 in 0.25 steps
  const [review, setReview] = useState('');
  const [status, setStatus] = useState('to_watch');
  const [isSearching, setIsSearching] = useState(false);

  // Enhanced movie selection flow states
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Add at the top of the component (inside MoviesPage):
  const [showTop10Modal, setShowTop10Modal] = useState(false);
  // Add new state for Watch Diary:
  const [showWatchDiaryModal, setShowWatchDiaryModal] = useState(false);
  const [showWatchDateModal, setShowWatchDateModal] = useState(false);
  const [selectedMovieForWatchDate, setSelectedMovieForWatchDate] = useState(null);
  const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Movie Mood Tracker removed per request

  // Filter only movies (do not show TV entries on Movies page)
  const movieEntries = mediaEntries.filter(entry => entry.type === 'movie');

  useEffect(() => {
    fetchMediaEntries();
  }, [fetchMediaEntries]);

  // Duplicate detection: prefer TMDB ID, fallback to title + release year
  const normalizeTitle = (s) => (s || '').trim().toLowerCase();
  const getYear = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const y = d.getFullYear();
    return isNaN(y) ? '' : String(y);
  };
  const findDuplicateMedia = (title, mediaType, tmdbId, releaseDate) => {
    const t = normalizeTitle(title);
    const y = getYear(releaseDate);
    return movieEntries.find(m => {
      if (m.type !== mediaType) return false;
      if (tmdbId && m.tmdb_id) return m.tmdb_id === tmdbId;
      const mt = normalizeTitle(m.title);
      const my = getYear(m.release_date);
      return mt === t && (y ? my === y : true);
    }) || null;
  };

  // Close dropup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropup && !event.target.closest('.dropup-container')) {
        setShowDropup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropup]);

  const resetModalState = () => {
    setNewMedia({
      title: '',
      type: 'movie',
      status: 'to_watch',
      rating: 0,
      review: '',
      tags: '',
      director: '',
      popularity: 0,
      poster_path: '',
      release_date: '',
      overview: '',
      tmdb_id: null
    });
    setSelectedFromTmdb(false);
    setTmdbResults([]);
    setSearchTerm('');
    setTmdbError(null);
    setIsTmdbLoading(false);
    setIsLoadingDetails(false);
    resetModalStates();
  };

  const handleAddMediaType = (type) => {
    // Reset all modal-related state and set type
    resetModalState();
    setNewMedia(prev => ({ ...prev, type }));
    setSelectedMedia(null);
    setSearchResults([]);
    setSearchQuery("");
    setRating(0);
    setReview("");
    setStatus("to_watch");
    setShowAddModal(true);
    setShowDropup(false);
  };

  // Search TMDB for movies/TV shows
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchMulti(searchQuery);
      const onlyMovies = (results || []).filter(r => r.media_type === 'movie');
      setSearchResults(onlyMovies.slice(0, 10));
    } catch (error) {
      toast.error('Failed to search TMDB. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a movie from search results - block TV on Movies page
  const handleSelectMedia = async (item) => {
    setIsSearching(true);
    try {
      if (item.media_type !== 'movie') {
        toast.error('This is a TV series. Please add it from the Series page.');
        return;
      }
      const details = await getMovieDetails(item.id);
      const movieData = {
        ...item,
        director: details.director || (details.created_by && details.created_by[0]?.name) || '',
        overview: details.overview || item.overview || '',
        release_date: item.release_date || item.first_air_date || '',
        poster_path: item.poster_path || '',
        tags: details.genres ? details.genres.map(g => g.name).join(', ') : '',
      };
      setPendingMovie(movieData);
      setShowStatusSelection(true);
    } catch (error) {
      toast.error('Failed to fetch details from TMDB');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle status selection from the new status modal
  const handleStatusSelection = (selectedStatus) => {
    setSelectedStatus(selectedStatus);
    setShowStatusSelection(false);
    
    if (selectedStatus === 'watched') {
      // Show rating modal for watched movies
      setShowRatingModal(true);
    } else if (selectedStatus === 'to_watch') {
      // Add directly to watch diary
      addToWatchDiary(pendingMovie);
    } else {
      // For other statuses (watching, dropped), add with default values
      addMovieWithStatus(pendingMovie, selectedStatus);
    }
  };

  // Add movie to watch diary
  const addToWatchDiary = async (movie) => {
    try {
      // Prevent duplicates
      const dup = findDuplicateMedia(
        movie.title || movie.name,
        'movie',
        movie.id,
        movie.release_date || movie.first_air_date
      );
      if (dup) {
        toast.error('This item already exists in your library');
        return;
      }
      const mediaData = {
        title: movie.title || movie.name,
        type: 'movie',
        status: 'to_watch',
        rating: null,
        review: null,
        tags: typeof movie.tags === 'string' ? movie.tags.split(',').map(tag => tag.trim()).filter(Boolean) : movie.tags || [],
        director: movie.director || '',
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        overview: movie.overview || '',
        tmdb_id: movie.id,
        visibility: 'private',
      };
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added to your watch diary! 📚`);
      resetModalStates();
      await fetchMediaEntries();
    } catch (error) {
      toast.error('Failed to add to watch diary: ' + (error.message || 'Unknown error'));
    }
  };

  // Add movie with specific status
  const addMovieWithStatus = async (movie, status) => {
    try {
      // Prevent duplicates
      const dup = findDuplicateMedia(
        movie.title || movie.name,
        'movie',
        movie.id,
        movie.release_date || movie.first_air_date
      );
      if (dup) {
        toast.error('This item already exists in your library');
        return;
      }
      const mediaData = {
        title: movie.title || movie.name,
        type: 'movie',
        status: status,
        rating: null,
        review: null,
        tags: typeof movie.tags === 'string' ? movie.tags.split(',').map(tag => tag.trim()).filter(Boolean) : movie.tags || [],
        director: movie.director || '',
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        overview: movie.overview || '',
        tmdb_id: movie.id,
        visibility: 'private',
      };
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added as ${status.replace('_', ' ')}! 🎬`);
      resetModalStates();
      await fetchMediaEntries();
    } catch (error) {
      toast.error('Failed to add movie: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle rating submission for watched movies
  const handleRatingSubmission = async () => {
    if (!pendingMovie) return;
    
    try {
      // Prevent duplicates
      const dup = findDuplicateMedia(
        pendingMovie.title || pendingMovie.name,
        'movie',
        pendingMovie.id,
        pendingMovie.release_date || pendingMovie.first_air_date
      );
      if (dup) {
        toast.error('This item already exists in your library');
        return;
      }
      const mediaData = {
        title: pendingMovie.title || pendingMovie.name,
        type: 'movie',
        status: 'watched',
        rating: uiToDbRating(rating), // Convert 0-5 to 0-10
        review: review.trim() || null,
        tags: typeof pendingMovie.tags === 'string' ? pendingMovie.tags.split(',').map(tag => tag.trim()).filter(Boolean) : pendingMovie.tags || [],
        director: pendingMovie.director || '',
        poster_path: pendingMovie.poster_path || '',
        release_date: pendingMovie.release_date || '',
        overview: pendingMovie.overview || '',
        tmdb_id: pendingMovie.id,
        visibility: 'private',
        watch_date: new Date().toISOString(),
      };
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added as watched with ${rating}/5 rating! ⭐`);
      resetModalStates();
      await fetchMediaEntries();
    } catch (error) {
      toast.error('Failed to add movie: ' + (error.message || 'Unknown error'));
    }
  };

  // Reset all modal states
  const resetModalStates = () => {
    setShowAddModal(false);
    setShowStatusSelection(false);
    setShowRatingModal(false);
    setPendingMovie(null);
    setSelectedStatus('');
    setSelectedMedia(null);
    setSearchResults([]);
    setSearchQuery('');
    setRating(0);
    setReview('');
    setStatus('to_watch');
  };

  // Update handleAddMedia to use selectedMedia, rating, review, status
  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!selectedMedia || !(selectedMedia.title || selectedMedia.name)) {
      toast.error('Media title is required');
      return;
    }
    if (selectedMedia.media_type && selectedMedia.media_type !== 'movie') {
      toast.error('This is a TV series. Please add it from the Series page.');
      return;
    }
    try {
      // Prevent duplicates
      const dup = findDuplicateMedia(
        selectedMedia.title || selectedMedia.name,
        'movie',
        selectedMedia.id,
        selectedMedia.release_date || selectedMedia.first_air_date
      );
      if (dup) {
        toast.error('This item already exists in your library');
        return;
      }
      const mediaData = {
        title: selectedMedia.title || selectedMedia.name,
        type: 'movie',
        status,
        rating: uiToDbRating(rating), // Convert 0-5 to 0-10
        review: review.trim() || null,
        tags: typeof selectedMedia.tags === 'string' ? selectedMedia.tags.split(',').map(tag => tag.trim()).filter(Boolean) : selectedMedia.tags || [],
        director: selectedMedia.director || '',
        poster_path: selectedMedia.poster_path || '',
        release_date: selectedMedia.release_date || '',
        overview: selectedMedia.overview || '',
        tmdb_id: selectedMedia.id,
        visibility: 'private',
      };
      await addMediaEntry(mediaData);
      toast.success(`${mediaData.title} added successfully!`);
      setShowAddModal(false);
      setSelectedMedia(null);
      setSearchResults([]);
      setSearchQuery("");
      setRating(0);
      setReview("");
      setStatus("to_watch");
      await fetchMediaEntries();
    } catch (error) {
      toast.error('Failed to add media: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watching': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'watched': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'to_watch': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'dropped': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'watching': return <Play className="w-3 h-3" />;
      case 'watched': return <CheckCircle className="w-3 h-3" />;
      case 'to_watch': return <Clock className="w-3 h-3" />;
      case 'dropped': return <X className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <PageHeader 
            title="Movies"
            subtitle="Track your favorite movies"
            Icon={Film}
            iconGradient="from-pink-500 to-orange-600"
            titleGradient="from-pink-600 via-orange-600 to-red-600"
            centered={true}
          />

          {/* Actions under title */}
          <div className="flex items-center justify-between">
            {/* Segmented toggle: Movies | Series - moved to left */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                className="px-5 py-3 flex items-center gap-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-medium"
                aria-current="page"
              >
                <Film className="w-5 h-5" />
                Movies
              </button>
              <button
                onClick={() => navigate('/series')}
                className="px-5 py-3 flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Tv className="w-5 h-5" />
                Series
              </button>
            </div>
            
            {/* Action buttons on the right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWatchDiaryModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Watch Diary</span>
              </button>
              <button
                onClick={() => { setShowAddModal(true); setShowDropup(false); }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Film className="w-5 h-5" />
                <span className="font-medium">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Movies Streak Tracker removed per request */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Total</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{movieEntries.length}</p>
              </div>
              <Film className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Watched</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {movieEntries.filter(m => m.status === 'watched').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Watching</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {movieEntries.filter(m => m.status === 'watching').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">To Watch</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {movieEntries.filter(m => m.status === 'to_watch').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filter Button Group */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'to_watch' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
            onClick={() => setFilter('to_watch')}
          >
            <Clock className="inline w-4 h-4 mr-1" />
            To Watch
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'watching' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
            onClick={() => setFilter('watching')}
          >
            <Play className="inline w-4 h-4 mr-1" />
            Watching
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'watched' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
            onClick={() => setFilter('watched')}
          >
            <CheckCircle className="inline w-4 h-4 mr-1" />
            Watched
          </button>
          
          {/* Favorites filter */}
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${filter === 'favorites' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}
            onClick={() => setFilter('favorites')}
          >
            <Heart className="inline w-4 h-4 mr-1" fill={filter === 'favorites' ? 'currentColor' : 'none'} /> Favorites
          </button>
        </div>

        {/* Movies Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movieEntries
            .filter(movie => {
              if (filter === 'all') return true;
              if (filter === 'favorites') return movie.favorite;
              return movie.status === filter;
            })
            .map((movie) => (
              <Card key={movie.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="relative">

                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                      <Film className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(movie.status)}`}>
                      {getStatusIcon(movie.status)}
                      <span className="capitalize">{movie.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {movie.type && (
                    <div className="absolute top-3 left-3">
                      <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                        {movie.type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                        <span className="capitalize">{movie.type}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{movie.title}</h3>
                  {movie.director && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {movie.director}
                    </p>
                  )}
                  {movie.release_date && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                  )}
                  {movie.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatRating(movie.rating, { outOfFive: true, decimals: 2 })}
                      </span>
                    </div>
                  )}
                  {movie.review && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                      {movie.review}
                    </p>
                  )}
                  {movie.watch_date && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Watched: {new Date(movie.watch_date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex items-end gap-2 justify-between">
                    <div className="flex gap-2">
                      {movie.status === 'watched' && !movie.watch_date && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovieForWatchDate(movie);
                            setWatchDate(new Date().toISOString().split('T')[0]);
                            setShowWatchDateModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          Log Watch Date
                        </button>
                      )}
                      {movie.watch_date && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovieForWatchDate(movie);
                            setWatchDate(movie.watch_date);
                            setShowWatchDateModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          Edit Watch Date
                        </button>
                      )}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await useMediaStore.getState().toggleFavoriteMediaEntry(movie.id);
                          toast.success(movie.favorite ? 'Removed from favorites' : 'Added to favorites');
                        } catch (err) {
                          toast.error('Failed to update favorite');
                        }
                      }}
                      className={`p-2 rounded-full bg-white/90 dark:bg-gray-900/80 shadow transition-colors hover:scale-110 border border-gray-200 dark:border-gray-700 ${movie.favorite ? 'text-pink-600' : 'text-gray-400 hover:text-pink-500'}`}
                      title={movie.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-6 h-6 transition-all duration-200 ${movie.favorite ? 'fill-current' : ''}`} fill={movie.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {movieEntries.length === 0 && (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl inline-block mb-6">
              <Film className="w-16 h-16 text-purple-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No movies yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start building your watchlist by adding your first movie!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Movie</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedMedia(null);
                  setSearchResults([]);
                  setSearchQuery("");
                  setRating(0);
                  setReview("");
                  setStatus("to_watch");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!selectedMedia ? (
                <>
                  {/* Search */}
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search for movies..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {isSearching ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Search Results</h3>
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectMedia(item)}
                          className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          {item.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={item.title || item.name}
                              className="w-16 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              <Film className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.title || item.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.release_date || item.first_air_date ? 
                                new Date(item.release_date || item.first_air_date).getFullYear() : 
                                'Unknown year'
                              }
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex items-center gap-1">
                                {item.media_type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Selected Media Details */}
                  <div className="flex gap-4">
                    {selectedMedia.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${selectedMedia.poster_path}`}
                        alt={selectedMedia.title || selectedMedia.name}
                        className="w-32 h-48 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-32 h-48 bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                        <Film className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedMedia.title || selectedMedia.name}
                      </h3>
                      {selectedMedia.director && (
                        <p className="text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Director:</strong> {selectedMedia.director}
                        </p>
                      )}
                      {(selectedMedia.release_date || selectedMedia.first_air_date) && (
                        <p className="text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Release:</strong> {new Date(selectedMedia.release_date || selectedMedia.first_air_date).getFullYear()}
                        </p>
                      )}
                      {selectedMedia.overview && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-4">
                          {selectedMedia.overview}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="to_watch">To Watch</option>
                      <option value="watching">Watching</option>
                      <option value="watched">Watched</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rating (0-5)
                    </label>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.25"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full accent-yellow-500"
                      />
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rating > 0 ? `${rating.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}/5` : 'No rating'}
                      </span>
                    </div>
                  </div>

                  {/* Review */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review (Optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your thoughts about this movie/show..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedMedia(null);
                        setRating(0);
                        setReview("");
                        setStatus("to_watch");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Back to Search
                    </button>
                    <button
                      onClick={handleAddMedia}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                      Add to Library
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons Container */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-3">
        {/* Top 10 Rated Movies Button */}
        <button
          onClick={() => setShowTop10Modal(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-full shadow-lg p-4 md:p-5 flex items-center justify-center transition-all duration-200 group"
          title="Show Top 10 Rated"
          aria-label="Show Top 10 Rated"
          style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
        >
          <Star className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" fill="currentColor" />
        </button>
      </div>

      {/* Top 10 Rated Modal */}
      {showTop10Modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowTop10Modal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close Top 10 Modal"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="p-8 pb-4 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Top 10 Rated Movies & Series</h2>
            </div>
            <div className="px-8 pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {movieEntries
                  .filter(m => m.rating)
                  .sort((a, b) => b.rating - a.rating || new Date(b.release_date || 0) - new Date(a.release_date || 0))
                  .slice(0, 10)
                  .map((movie, idx) => (
                    <Card key={movie.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group border-yellow-400 dark:border-yellow-600">
                      <div className="relative">
                        {/* Rank Number Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-white dark:border-gray-900">
                            {idx + 1}
                          </div>
                        </div>
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                            <Film className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`}>
                            <Star className="w-3 h-3" />
                            {formatRating(movie.rating, { outOfFive: true, decimals: 2 })}
                          </div>
                        </div>
                        {movie.type && (
                          <div className="absolute bottom-3 left-3">
                            <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                              {movie.type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                              <span className="capitalize">{movie.type}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{movie.title}</h3>
                        {movie.director && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {movie.director}
                          </p>
                        )}
                        {movie.release_date && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        )}
                        {movie.review && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                            {movie.review}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                {movieEntries.filter(m => m.rating).length === 0 && (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                    No rated movies or series yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watch Diary Modal */}
      {showWatchDiaryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowWatchDiaryModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close Watch Diary Modal"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="p-8 pb-4 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Watch Diary</h2>
            </div>
            <div className="px-8 pb-8">
              {movieEntries.filter(m => m.watch_date).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No watch history yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">Start logging your watch dates to build your diary!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {movieEntries
                    .filter(m => m.watch_date)
                    .sort((a, b) => new Date(b.watch_date) - new Date(a.watch_date))
                    .map((movie) => (
                      <div key={movie.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{movie.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {movie.type === 'movie' ? 'Movie' : 'TV Show'} • {movie.director && `Directed by ${movie.director}`}
                          </p>
                          {movie.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatRating(movie.rating, { outOfFive: true, decimals: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(movie.watch_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(movie.watch_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Watch Date Modal */}
      {showWatchDateModal && selectedMovieForWatchDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Watch Date</h2>
              <button
                onClick={() => {
                  setShowWatchDateModal(false);
                  setSelectedMovieForWatchDate(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {selectedMovieForWatchDate.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${selectedMovieForWatchDate.poster_path}`}
                    alt={selectedMovieForWatchDate.title}
                    className="w-16 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <Film className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedMovieForWatchDate.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedMovieForWatchDate.type === 'movie' ? 'Movie' : 'TV Show'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  When did you watch this?
                </label>
                <input
                  type="date"
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowWatchDateModal(false);
                    setSelectedMovieForWatchDate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await useMediaStore.getState().updateMediaEntry(selectedMovieForWatchDate.id, { watch_date: watchDate });
                      toast.success('Watch date logged successfully!');
                      setShowWatchDateModal(false);
                      setSelectedMovieForWatchDate(null);
                      await fetchMediaEntries();
                    } catch (error) {
                      toast.error('Failed to log watch date');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
                >
                  Save Watch Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Selection Modal - Enhanced Flow */}
      {showStatusSelection && pendingMovie && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowStatusSelection(false);
                setPendingMovie(null);
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close Status Selection"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {pendingMovie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${pendingMovie.poster_path}`}
                      alt={pendingMovie.title || pendingMovie.name}
                      className="w-16 h-24 object-cover rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {pendingMovie.title || pendingMovie.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {pendingMovie.release_date && new Date(pendingMovie.release_date).getFullYear()}
                    </p>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  What's your status with this {pendingMovie.media_type}?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose your current status to continue
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStatusSelection('watched')}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-2 border-green-200 dark:border-green-800/30 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div className="text-center">
                    <div className="font-semibold text-green-700 dark:text-green-300">Watched</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">Rate & review</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleStatusSelection('to_watch')}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 border-2 border-orange-200 dark:border-orange-800/30 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <div className="text-center">
                    <div className="font-semibold text-orange-700 dark:text-orange-300">To Watch</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Add to diary</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleStatusSelection('watching')}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-2 border-blue-200 dark:border-blue-800/30 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Play className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="text-center">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">Watching</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Currently viewing</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleStatusSelection('dropped')}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-2 border-red-200 dark:border-red-800/30 rounded-xl hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/20 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                  <div className="text-center">
                    <div className="font-semibold text-red-700 dark:text-red-300">Dropped</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">Didn't finish</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal for Watched Movies */}
      {showRatingModal && pendingMovie && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowRatingModal(false);
                setPendingMovie(null);
                setRating(0);
                setReview('');
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close Rating Modal"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {pendingMovie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${pendingMovie.poster_path}`}
                      alt={pendingMovie.title || pendingMovie.name}
                      className="w-16 h-24 object-cover rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {pendingMovie.title || pendingMovie.name}
                    </h3>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Watched</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  How would you rate it?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Share your rating and thoughts
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                    Rating (0-5)
                  </label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.25"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rating > 0 ? `${rating.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}/5` : 'No rating yet'}
                    </span>
                  </div>
                </div>

                {/* Review */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="What did you think about this movie/show? Share your thoughts..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRatingModal(false);
                      setShowStatusSelection(true);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRatingSubmission}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium shadow-lg"
                  >
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Movie Mood Tracker removed */}
      </div>
    );
}
