import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Share2, 
  MoreVertical, 
  Plus, 
  Search, 
  Filter,
  Star, 
  Calendar, 
  Film, 
  Globe, 
  Lock, 
  Users,
  Heart,
  Trash2,
  Grid3X3,
  List,
  UserPlus,
  UserMinus,
  X
} from 'lucide-react';
import { useMediaStore } from '../store/index.jsx';
import { useAuthStore } from '../store/index.jsx';
import { formatRating } from '../utils/ratings.js';
import ListCreationModal from '../components/ListCreationModal';
import toast from 'react-hot-toast';

const ListDetailPage = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { lists, mediaEntries, removeFromList, updateList, deleteList, addCollaborator, removeCollaborator, canEditList } = useMediaStore();
  const { user, fetchFriends } = useAuthStore();
  
  const [list, setList] = useState(null);
  const [listMedia, setListMedia] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('added_desc');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  useEffect(() => {
    const foundList = lists.find(l => l.id === listId);
    if (foundList) {
      setList(foundList);
      // Get media items for this list
      const media = mediaEntries.filter(m => foundList.items?.includes(m.id));
      setListMedia(media);
      
      // Load collaborators if they exist
      if (foundList.collaborators?.length > 0) {
        loadCollaborators(foundList.collaborators);
      }
    }
  }, [listId, lists, mediaEntries]);

  const loadCollaborators = async (collaboratorIds) => {
    // In a real app, you'd fetch user profiles by IDs
    // For now, we'll simulate this with the friends list
    try {
      const friendsList = await fetchFriends();
      const listCollaborators = friendsList.filter(friend => 
        collaboratorIds.includes(friend.id)
      );
      setCollaborators(listCollaborators);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const handleAddCollaborator = async (friendId) => {
    try {
      await addCollaborator(listId, friendId);
      toast.success('Collaborator added successfully!');
      setShowCollaboratorModal(false);
      
      // Refresh the list
      const updatedList = lists.find(l => l.id === listId);
      if (updatedList) {
        loadCollaborators(updatedList.collaborators);
      }
    } catch (error) {
      toast.error('Failed to add collaborator');
      console.error('Error adding collaborator:', error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await removeCollaborator(listId, collaboratorId);
      toast.success('Collaborator removed successfully!');
      
      // Refresh collaborators
      const updatedList = lists.find(l => l.id === listId);
      if (updatedList) {
        loadCollaborators(updatedList.collaborators);
      }
    } catch (error) {
      toast.error('Failed to remove collaborator');
      console.error('Error removing collaborator:', error);
    }
  };

  const loadFriends = async () => {
    try {
      console.log('Loading friends...');
      const friendsList = await fetchFriends();
      console.log('Raw friends list:', friendsList);
      
      // Filter out already added collaborators
      const availableFriends = friendsList.filter(friend => 
        !list?.collaborators?.includes(friend.id)
      );
      console.log('Available friends after filtering:', availableFriends);
      console.log('Current list collaborators:', list?.collaborators);
      
      setFriends(availableFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
    }
  };

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">List not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The list you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/lists')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lists
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort media
  const filteredMedia = listMedia
    .filter(media => {
      const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || media.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc':
          return (a.rating || 0) - (b.rating || 0);
        case 'year_desc':
          return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        case 'year_asc':
          return new Date(a.release_date || 0) - new Date(b.release_date || 0);
        case 'added_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const handleRemoveFromList = async (mediaId) => {
    try {
      await removeFromList(list.id, mediaId);
      setListMedia(prev => prev.filter(m => m.id !== mediaId));
      toast.success('Removed from list');
    } catch (error) {
      toast.error('Failed to remove from list');
      console.error('Remove from list error:', error);
    }
  };

  const handleDeleteList = async () => {
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This action cannot be undone.`)) {
      try {
        await deleteList(list.id);
        toast.success('List deleted successfully');
        navigate('/lists');
      } catch (error) {
        toast.error('Failed to delete list');
        console.error('Delete list error:', error);
      }
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/lists/${list.id}`;
    navigator.clipboard.writeText(url);
    toast.success('List URL copied to clipboard!');
  };

  // Calculate stats
  const totalItems = listMedia.length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/lists')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {list.name}
                </h1>
                <div className="flex items-center gap-1">
                  {list.visibility === 'private' ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
              
              {list.description && (
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                  {list.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{totalItems} items</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[160px]">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit List Details
                  </button>
                  {list.owner_id === user?.id && (
                    <button
                      onClick={() => {
                        setShowCollaboratorModal(true);
                        loadFriends();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
                    >
                      <UserPlus className="w-4 h-4" />
                      Manage Collaborators
                    </button>
                  )}
                  <button
                    onClick={handleDeleteList}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats and Controls */}
        <div className="flex gap-4">
          {/* Total Items Stat */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 w-fit">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Film className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-1">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
              {/* Search */}
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="w-32">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="movie">Movies</option>
                  <option value="tv">TV Series</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="w-40">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="added">Recently Added</option>
                  <option value="title">Title A-Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="year">Release Year</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborators Section */}
        {(collaborators.length > 0 || list.owner_id === user?.id) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborators {collaborators.length > 0 && `(${collaborators.length})`}
              </h3>
              {list.owner_id === user?.id && (
                <button
                  onClick={() => {
                    setShowCollaboratorModal(true);
                    loadFriends();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  Add Collaborators
                </button>
              )}
            </div>
            
            {collaborators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    {collaborator.avatar_url ? (
                      <img
                        src={collaborator.avatar_url}
                        alt={collaborator.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {collaborator.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {collaborator.full_name || collaborator.username}
                    </span>
                    {list.owner_id === user?.id && (
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="Remove collaborator"
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No collaborators added yet. Add friends to collaborate on this list.
              </p>
            )}
          </div>
        )}

        {/* Media Grid */}
        {filteredMedia.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
              : 'space-y-4'
          }>
            {filteredMedia.map((media) => (
              <div
                key={media.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 group ${
                  viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''
                }`}
              >
                {/* Poster */}
                <div className={`${viewMode === 'list' ? 'w-16 h-24 flex-shrink-0' : 'aspect-[2/3]'} bg-gray-100 dark:bg-gray-700 relative overflow-hidden`}>
                  {media.poster_path ? (() => {
                    const p = media.poster_path || '';
                    const isAbsolute = /^https?:\/\//.test(p) || p.startsWith('data:');
                    const isAlreadyTmdbFull = p.startsWith('/t/p/');
                    const src = isAbsolute
                      ? p
                      : isAlreadyTmdbFull
                        ? `https://image.tmdb.org${p}`
                        : `https://image.tmdb.org/t/p/w342${p}`;
                    return (
                      <img
                        src={src}
                        alt={media.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    );
                  })() : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFromList(media.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Content */}
                <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : 'p-4'}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                    {media.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {media.type}
                    </span>
                    {media.release_date && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(media.release_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  
                  {media.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatRating(media.rating)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-auto">
              <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterType !== 'all' ? 'No items found' : 'Empty list'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : 'Add some movies and series to get started'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ListCreationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editingList={list}
      />

      {/* Collaborator Management Modal */}
      {showCollaboratorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Collaborators
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadFriends}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Refresh friends list"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowCollaboratorModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add friends as collaborators to let them edit this list. Only mutual friends are shown.
              </p>

              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No available friends</p>
                  <p className="text-xs">Follow each other to become friends</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {friend.username?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {friend.full_name || friend.username}
                          </div>
                          {friend.full_name && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{friend.username}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddCollaborator(friend.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListDetailPage;
