import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { searchMusic } from '../../api/musicSearch';
import { searchLastfmTracks, searchLastfmAlbums } from '../../api/lastfm';
import { formatRating } from '../../utils/ratings.js';

export default function AddMusicModal({ 
  isOpen, 
  onClose, 
  formData, 
  onInputChange, 
  onSubmit 
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'manual'
  const [query, setQuery] = useState('');
  const [includeLastfm, setIncludeLastfm] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ tracks: [], albums: [] });

  const resetForm = () => {
    onInputChange('title', '');
    onInputChange('artist', '');
    onInputChange('album', '');
    onInputChange('year', '');
    onInputChange('genre', '');
    onInputChange('status', 'to_listen');
    onInputChange('rating', 0);
    onInputChange('review', '');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    onSubmit();
    resetForm();
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const base = await searchMusic(query, 10);
      let lfTracks = [];
      let lfAlbums = [];
      if (includeLastfm) {
        // Best-effort; may fail if API key is missing
        try { lfTracks = await searchLastfmTracks(query, 10); } catch {}
        try { lfAlbums = await searchLastfmAlbums(query, 10); } catch {}
      }

      // Merge and de-dup by title+artist
      const dedupe = (arr) => {
        const map = new Map();
        for (const it of arr) {
          const key = `${(it.artist||'').toLowerCase()}||${(it.title||'').toLowerCase()}||${it.type}`;
          if (!map.has(key)) map.set(key, it);
        }
        return Array.from(map.values());
      };

      setResults({
        tracks: dedupe([...(base.tracks||[]), ...lfTracks]),
        albums: dedupe([...(base.albums||[]), ...lfAlbums]),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const quickAddFromItem = (item) => {
    // Map normalized search item to form fields
    onInputChange('title', item.title || '');
    onInputChange('artist', item.artist || '');
    onInputChange('album', item.album || (item.type === 'album' ? item.title : ''));
    onInputChange('year', item.year || '');
    onInputChange('genre', '');
    onInputChange('status', 'to_listen');
    onInputChange('rating', 0);
    onInputChange('review', '');
    // Submit using existing flow
    handleSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Music/Album</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab==='search' ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >Search</button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab==='manual' ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >Manual</button>
          </div>

          {activeTab === 'search' ? (
            <div className="space-y-4">
              {/* Search controls */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracks or albums..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input type="checkbox" className="accent-pink-600" checked={includeLastfm} onChange={(e)=>setIncludeLastfm(e.target.checked)} />
                  Include Last.fm
                </label>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-lg hover:from-pink-700 hover:to-orange-700 transition-colors disabled:opacity-50"
                >{isSearching ? 'Searching...' : 'Search'}</button>
              </div>

              {/* Results */}
              {(results.tracks.length > 0 || results.albums.length > 0) ? (
                <div className="space-y-6">
                  {results.tracks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tracks</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {results.tracks.map((t, idx) => (
                          <div key={`t-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3 min-w-0">
                              {t.cover ? (<img src={t.cover} alt="" className="w-10 h-10 rounded object-cover" />) : (<div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700" />)}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{t.artist}{t.album ? ` • ${t.album}` : ''}{t.year ? ` • ${t.year}` : ''}</div>
                              </div>
                            </div>
                            <button onClick={() => quickAddFromItem(t)} className="px-3 py-1.5 text-xs bg-pink-600 text-white rounded-md hover:bg-pink-700">Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.albums.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Albums</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {results.albums.map((a, idx) => (
                          <div key={`a-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3 min-w-0">
                              {a.cover ? (<img src={a.cover} alt="" className="w-10 h-10 rounded object-cover" />) : (<div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700" />)}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{a.artist}{a.year ? ` • ${a.year}` : ''}</div>
                              </div>
                            </div>
                            <button onClick={() => quickAddFromItem(a)} className="px-3 py-1.5 text-xs bg-pink-600 text-white rounded-md hover:bg-pink-700">Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">Search iTunes/Deezer and Last.fm to quickly add music to your library.</p>
              )}
            </div>
          ) : null}

          {activeTab === 'manual' ? (
          <>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title/Song Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Enter song or album title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Artist
            </label>
            <input
              type="text"
              value={formData.artist}
              onChange={(e) => onInputChange('artist', e.target.value)}
              placeholder="Enter artist name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Album */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Album
            </label>
            <input
              type="text"
              value={formData.album}
              onChange={(e) => onInputChange('album', e.target.value)}
              placeholder="Enter album name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Year and Genre Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => onInputChange('year', e.target.value)}
                placeholder="2024"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => onInputChange('genre', e.target.value)}
                placeholder="Rock, Pop, Jazz..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="to_listen">To Listen</option>
              <option value="listening">Listening</option>
              <option value="listened">Listened</option>
              <option value="favorite">Favorite</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating (0–5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => onInputChange('rating', star)}
                  className={`p-1 rounded transition-colors ${
                    star <= formData.rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {formData.rating > 0 ? formatRating(formData.rating) : 'No rating'}
              </span>
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={formData.review}
              onChange={(e) => onInputChange('review', e.target.value)}
              placeholder="Share your thoughts about this music..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-lg hover:from-pink-700 hover:to-orange-700 transition-colors"
            >
              Add to Library
            </button>
          </div>
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
