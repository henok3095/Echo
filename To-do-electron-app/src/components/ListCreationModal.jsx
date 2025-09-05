import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff, Tag, Hash, Users, UserPlus, Film, Sparkles, Lock, Globe } from 'lucide-react';
import { useMediaStore } from '../store/index.jsx';
import { useAuthStore } from '../store/index.jsx';
import toast from 'react-hot-toast';

const ListCreationModal = ({ isOpen, onClose, editingList = null }) => {
  const { createList, updateList } = useMediaStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    tags: '',
    category: 'general',
    collaborators: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const { fetchFriends } = useAuthStore();

  const categories = [
    { value: 'general', label: 'General', icon: Film },
    { value: 'favorites', label: 'Favorites', icon: Sparkles },
    { value: 'watchlist', label: 'Watchlist', icon: Film },
    { value: 'genres', label: 'By Genre', icon: Tag },
    { value: 'yearly', label: 'Yearly Lists', icon: Tag },
    { value: 'themed', label: 'Themed', icon: Users }
  ];

  useEffect(() => {
    if (editingList) {
      setFormData({
        name: editingList.name || '',
        description: editingList.description || '',
        visibility: editingList.visibility || 'private',
        tags: editingList.tags?.join(', ') || '',
        category: editingList.category || 'general',
        collaborators: editingList.collaborators || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        visibility: 'private',
        tags: '',
        category: 'general',
        collaborators: []
      });
    }
  }, [editingList, isOpen]);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendsList = await fetchFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const listData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        collaborators: formData.collaborators
      };

      if (editingList) {
        await updateList(editingList.id, listData);
        toast.success('List updated successfully!');
      } else {
        await createList(listData);
        toast.success('List created successfully!');
      }
      
      onClose();
    } catch (error) {
      toast.error(editingList ? 'Failed to update list' : 'Failed to create list');
      console.error('List operation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleCollaborator = (friendId) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.includes(friendId)
        ? prev.collaborators.filter(id => id !== friendId)
        : [...prev.collaborators, friendId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingList ? 'Edit List' : 'Create New List'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="list-creation-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Favorite Movies"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A curated collection of my all-time favorite films..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Private</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Only you can see this list</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Globe className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Public</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Anyone can discover and view this list</div>
                </div>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="action, thriller, 2023, must-watch"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate tags with commas
            </p>
          </div>

          {/* Collaborators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserPlus className="w-4 h-4 inline mr-2" />
              Collaborators
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Add friends who can edit this list. Only mutual friends are shown.
            </p>
            
            {loadingFriends ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Loading friends...</span>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No friends available</p>
                <p className="text-xs">Add friends by following each other</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.collaborators.includes(friend.id)}
                      onChange={() => toggleCollaborator(friend.id)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {friend.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {friend.full_name || friend.username}
                        </div>
                        {friend.full_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{friend.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            {formData.collaborators.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {formData.collaborators.length} collaborator{formData.collaborators.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          </form>
        </div>

        {/* Fixed Actions Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="list-creation-form"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting 
                ? (editingList ? 'Updating...' : 'Creating...') 
                : (editingList ? 'Update List' : 'Create List')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListCreationModal;
