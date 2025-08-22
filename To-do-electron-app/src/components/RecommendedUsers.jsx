import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, User, X, Loader } from 'lucide-react';
import { db, supabase } from '../api/supabase.js';
import toast from 'react-hot-toast';

export default function RecommendedUsers({ currentUserId, onFollow }) {
  const navigate = useNavigate();
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Load recommended users on component mount
  useEffect(() => {
    if (currentUserId) {
      loadRecommendedUsers();
    }
  }, [currentUserId]);

  const loadRecommendedUsers = async () => {
    try {
      console.log('Loading recommended users for currentUserId:', currentUserId);
      setIsLoading(true);
      
      // Debug: Check current user's profile status
      const { data: currentProfile } = await db.getUserProfile(currentUserId);
      console.log('Current user profile:', currentProfile);
      
      // Debug: Check total public profiles in database
      const { data: allPublicProfiles } = await supabase
        .from('profiles')
        .select('id, username, is_public')
        .eq('is_public', true);
      console.log('All public profiles in database:', allPublicProfiles);
      
      const { data, error } = await db.suggestProfilesToFollow(currentUserId);
      console.log('Recommended users response:', { data, error });
      if (error) throw error;
      
      setRecommendedUsers(data || []);
      console.log('Set recommended users:', data || []);
    } catch (error) {
      console.error('Error loading recommended users:', error);
      toast.error('Failed to load recommended users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const { data, error } = await db.searchProfiles(searchTerm, currentUserId);
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const { error } = await db.followUser(currentUserId, userId);
      if (error) throw error;
      
      toast.success('User followed successfully');
      
      // Remove from recommended users and search results
      setRecommendedUsers(prev => prev.filter(user => user.id !== userId));
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      // Call parent callback if provided
      if (onFollow) {
        onFollow(userId);
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const UserCard = ({ user, showFollowButton = true }) => (
    <div onClick={() => navigate(`/profile/${encodeURIComponent(user.username || user.id)}`)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'){ navigate(`/profile/${encodeURIComponent(user.username || user.id)}`)} }} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.username || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {user.username || 'Unknown User'}
          </h4>
          {user.bio && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-48">
              {user.bio}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {user.follower_count || 0} followers
          </p>
        </div>
      </div>
      
      {showFollowButton && (
        <button
          onClick={(e) => { e.stopPropagation(); handleFollow(user.id); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Follow
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Discover People
        </h3>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          Search Users
        </button>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isSearching ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Search Results ({searchResults.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">No users found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* Recommended Users */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Suggested for you
        </h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : recommendedUsers.length > 0 ? (
          <div className="space-y-3">
            {recommendedUsers.slice(0, 5).map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
            
            {recommendedUsers.length > 5 && (
              <button
                onClick={loadRecommendedUsers}
                className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Show more suggestions
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recommendations available</p>
            <button
              onClick={loadRecommendedUsers}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Refresh suggestions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
