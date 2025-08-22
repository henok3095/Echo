import React, { useState, useEffect } from 'react';
import { useMediaStore } from '../store/index.jsx';
import { Plus, Film, Music, Star, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchMulti, getMovieDetails, getTVDetails } from '../api/tmdb';
import MediaStreakTracker from "../components/MediaStreakTracker";

const MEDIA_TYPES = [
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'series', label: 'Series', icon: Film },
  { value: 'album', label: 'Album', icon: Music }
];

const STATUS_OPTIONS = [
  { value: 'to_watch', label: 'To Watch/Listen' },
  { value: 'watching', label: 'Watching/Listening' },
  { value: 'watched', label: 'Watched/Listened' }
];

export default function MediaPage() {
  const { mediaEntries, fetchMediaEntries, addMediaEntry, isLoading } = useMediaStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropup, setShowDropup] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'sections'
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

  useEffect(() => {
    fetchMediaEntries();
  }, [fetchMediaEntries]);

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
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMedia.title.trim()) {
      toast.error('Media title is required');
      return;
    }

    try {
      // Prepare the media data with proper tag handling
      const mediaData = {
        ...newMedia,
        tags: typeof newMedia.tags === 'string' 
          ? newMedia.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : newMedia.tags || []
      };
      
      // If selected from TMDB, include all the additional metadata
      if (selectedFromTmdb) {
        mediaData.tmdb_id = newMedia.tmdb_id;
        mediaData.director = newMedia.director;
        mediaData.popularity = newMedia.popularity;
        mediaData.poster_path = newMedia.poster_path;
        mediaData.release_date = newMedia.release_date;
        mediaData.overview = newMedia.overview;
      }
      
      console.log('Adding media with data:', mediaData);
      const result = await addMediaEntry(mediaData);
      console.log('Add media result:', result);
      
      // Force refresh the media list to ensure it shows up
      await fetchMediaEntries();
      
      // Reset form and close modal
      resetModalState();
      setShowAddModal(false);
      
      toast.success(selectedFromTmdb 
        ? `Added "${mediaData.title}" with your rating and review!` 
        : 'Media added successfully'
      );
    } catch (error) {
      console.error('Error adding media:', error);
      toast.error('Failed to add media');
    }
  };

  const handleTmdbSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsTmdbLoading(true);
    setTmdbError(null);
    try {
      const results = await searchMulti(searchTerm);
      setTmdbResults(results);
    } catch (err) {
      setTmdbError('Failed to fetch from TMDB');
      toast.error('Failed to search movies/series');
    } finally {
      setIsTmdbLoading(false);
    }
  };

  const handleSelectFromTmdb = async (item) => {
    setIsLoadingDetails(true);
    try {
      const isMovie = item.media_type === 'movie';
      let details;
      
      if (isMovie) {
        details = await getMovieDetails(item.id);
      } else {
        details = await getTVDetails(item.id);
      }
      
      const title = isMovie ? details.title : details.name;
      const releaseDate = isMovie ? details.release_date : details.first_air_date;
      
      // Autofill the form with TMDB details
      setNewMedia({
        title: title,
        type: isMovie ? 'movie' : 'series',
        status: 'to_watch',
        rating: 0, // User will set this
        review: '', // User will set this
        tags: details.genres ? details.genres.map(genre => genre.name).join(', ') : '',
        director: details.director || 'Unknown',
        popularity: Math.round(details.popularity || 0),
        poster_path: details.poster_path || '',
        release_date: releaseDate || '',
        overview: details.overview || '',
        tmdb_id: details.id
      });
      
      setSelectedFromTmdb(true);
      setTmdbResults([]);
      setSearchTerm('');
      toast.success(`Selected "${title}" - now add your rating and review!`);
    } catch (error) {
      toast.error('Failed to load movie details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredMedia = mediaEntries.filter(media => {
    const matchesFilter = filter === 'all' || media.type === filter;
    const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get top 10 movies by rating
  const getTop10Movies = () => {
    return mediaEntries
      .filter(media => media.type === 'movie' && media.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  };

  // Separate movies and series
  const getMovies = () => {
    return mediaEntries.filter(media => media.type === 'movie');
  };

  const getSeries = () => {
    return mediaEntries.filter(media => media.type === 'series');
  };

  const handleAddMediaType = (type) => {
    setNewMedia(prev => ({ ...prev, type }));
    setShowAddModal(true);
    setShowDropup(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  // MediaCard component for reusable media display
  const MediaCard = ({ media }) => {
    const MediaIcon = MEDIA_TYPES.find(t => t.value === media.type)?.icon || Film;
    const hasPosters = media.poster_path;
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
        {/* Poster Image */}
        {hasPosters && (
          <div className="relative h-64 bg-gray-100 dark:bg-gray-800">
            <img
              src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
              alt={media.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
              <MediaIcon className="w-12 h-12 text-gray-400" />
            </div>
            
            {/* Rating Badge */}
            {media.rating > 0 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                {media.rating}/10
              </div>
            )}
            
            {/* Type Badge */}
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
              {media.type}
            </div>
          </div>
        )}
        
        <div className="p-4">
          {/* Title and Icon (for non-poster items) */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              {!hasPosters && <MediaIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                {media.title}
              </h3>
            </div>
            {!hasPosters && (
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {media.type}
              </span>
            )}
          </div>

          {/* Rating */}
          {media.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {renderStars(media.rating)}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {media.rating}/10
              </span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
            <span className={`text-sm px-2 py-1 rounded-full ${
              media.status === 'watched' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : media.status === 'watching'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {STATUS_OPTIONS.find(s => s.value === media.status)?.label || media.status}
            </span>
          </div>

          {/* Tags */}
          {media.tags && media.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {media.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {media.tags.length > 3 && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                  +{media.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Review */}
          {media.review && (
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {media.review}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Media Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your movies, series, and music</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('sections')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'sections'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sections
            </button>
          </div>
          
          {/* Add Media Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAddMediaType('movie')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Film className="w-4 h-4" />
              Add Movie
            </button>
            <button
              onClick={() => handleAddMediaType('series')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Film className="w-4 h-4" />
              Add Series
            </button>
            <button
              onClick={() => handleAddMediaType('album')}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
            >
              <Music className="w-4 h-4" />
              Add Album
            </button>
          </div>
        </div>
      </div>

      {/* Media Streak Tracker */}
      <div className="relative z-10">
        <MediaStreakTracker mediaEntries={mediaEntries} />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your media..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {MEDIA_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading media...</div>
        </div>
      ) : mediaEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">No media found</div>
          <button
            onClick={() => setShowDropup(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first media
          </button>
        </div>
      ) : viewMode === 'sections' ? (
        /* Sections View */
        <div className="space-y-8">
          {/* Top 10 Movies */}
          {getTop10Movies().length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top 10 Movies</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">Highest rated</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {getTop10Movies().map((movie, index) => (
                  <div key={movie.id} className="relative group">
                    <div className="relative">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-lg text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        {movie.rating}
                      </div>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {movie.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movies Section */}
          {getMovies().length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Movies</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({getMovies().length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getMovies().map(movie => (
                  <MediaCard key={movie.id} media={movie} />
                ))}
              </div>
            </div>
          )}

          {/* Series Section */}
          {getSeries().length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Series</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({getSeries().length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSeries().map(series => (
                  <MediaCard key={series.id} media={series} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map(media => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Media</h2>
              <button
                onClick={() => {
                  resetModalState();
                  setShowAddModal(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
            <form onSubmit={handleAddMedia} className="space-y-6">
              {/* TMDB Search Section */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Search Movies & Series (TMDB)</h3>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTmdbSearch()}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search for movies and TV series..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTmdbSearch}
                    disabled={isTmdbLoading || !searchTerm.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isTmdbLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Search
                  </button>
                </div>

                {/* TMDB Results */}
                {tmdbError && (
                  <div className="text-red-600 dark:text-red-400 text-sm mb-3">
                    {tmdbError}
                  </div>
                )}

                {tmdbResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Found {tmdbResults.length} results. Click to add:
                    </p>
                    {tmdbResults.slice(0, 5).map((item) => {
                      const isMovie = item.media_type === 'movie';
                      const title = isMovie ? item.title : item.name;
                      const releaseDate = isMovie ? item.release_date : item.first_air_date;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                          onClick={() => handleSelectFromTmdb(item)}
                        >
                          {item.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={title}
                              className="w-12 h-18 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {title}
                              </h4>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {isMovie ? 'Movie' : 'TV'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
                            </p>
                            {item.overview && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {item.overview.length > 100 ? `${item.overview.substring(0, 100)}...` : item.overview}
                              </p>
                            )}
                          </div>
                          {isLoadingDetails ? (
                          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Or add manually below:
                  </p>
                </div>
              </div>

              {/* Show TMDB Movie Details if selected */}
              {selectedFromTmdb && newMedia.poster_path && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Selected from TMDB
                  </h3>
                  <div className="flex gap-4">
                    <img
                      src={`https://image.tmdb.org/t/p/w154${newMedia.poster_path}`}
                      alt={newMedia.title}
                      className="w-20 h-30 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{newMedia.title}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Release:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {newMedia.release_date ? new Date(newMedia.release_date).getFullYear() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Director:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{newMedia.director}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="ml-2 text-gray-900 dark:text-white capitalize">{newMedia.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Popularity:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{newMedia.popularity}</span>
                        </div>
                      </div>
                      {newMedia.overview && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                          {newMedia.overview}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      ✨ Now add your personal rating and review below!
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Title Input (only show if not selected from TMDB) */}
              {!selectedFromTmdb && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newMedia.title}
                    onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter media title"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newMedia.type}
                    onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {MEDIA_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newMedia.status}
                    onChange={(e) => setNewMedia({ ...newMedia, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={selectedFromTmdb ? 'p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800' : ''}>
                <label className={`block text-sm font-medium mb-3 ${selectedFromTmdb ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  {selectedFromTmdb ? '⭐ Your Rating (1-10)' : 'Rating (1-10)'}
                </label>
                
                {/* Interactive Star Rating */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewMedia({ ...newMedia, rating: i + 1 })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            i < newMedia.rating 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={newMedia.rating}
                      onChange={(e) => setNewMedia({ ...newMedia, rating: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
                  </div>
                </div>
                
                {selectedFromTmdb && newMedia.rating > 0 && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {newMedia.rating <= 3 && "Not great, but that's okay! 😅"}
                    {newMedia.rating > 3 && newMedia.rating <= 6 && "Pretty decent! 👍"}
                    {newMedia.rating > 6 && newMedia.rating <= 8 && "Really good! 🎉"}
                    {newMedia.rating > 8 && "Amazing! This is a favorite! ⭐"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Review
                </label>
                <textarea
                  value={newMedia.review}
                  onChange={(e) => setNewMedia({ ...newMedia, review: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your review..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newMedia.tags}
                  onChange={(e) => setNewMedia({ ...newMedia, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., action, drama, indie"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors order-2 sm:order-1"
                >
                  {selectedFromTmdb ? 'Add to My Collection' : 'Add Media'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetModalState();
                    setShowAddModal(false);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors order-1 sm:order-2"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
