import React, { useState, useEffect } from 'react';
import { X, Plus, Check, List as ListIcon, Lock, Globe } from 'lucide-react';
import { useMediaStore } from '../store/index.jsx';
import toast from 'react-hot-toast';

const AddToListModal = ({ isOpen, onClose, media }) => {
  const { lists, addToList, removeFromList, createList, getListsForMedia } = useMediaStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mediaLists, setMediaLists] = useState([]);

  useEffect(() => {
    if (media && isOpen) {
      const listsContainingMedia = getListsForMedia(media.id);
      setMediaLists(listsContainingMedia.map(l => l.id));
    }
  }, [media, isOpen, lists, getListsForMedia]);

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleList = async (listId) => {
    try {
      const isInList = mediaLists.includes(listId);
      
      if (isInList) {
        await removeFromList(listId, media.id);
        setMediaLists(prev => prev.filter(id => id !== listId));
        toast.success('Removed from list');
      } else {
        await addToList(listId, media);
        setMediaLists(prev => [...prev, listId]);
        toast.success('Added to list');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update list');
      console.error('Toggle list error:', error);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsCreating(true);
    try {
      const newList = await createList({
        name: newListName.trim(),
        description: `Created for ${media.title}`,
        visibility: 'private'
      });
      
      await addToList(newList.id, media);
      setMediaLists(prev => [...prev, newList.id]);
      
      setNewListName('');
      setShowCreateForm(false);
      toast.success('List created and item added!');
    } catch (error) {
      toast.error('Failed to create list');
      console.error('Create list error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add to List</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{media.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lists */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {filteredLists.length > 0 ? (
            <div className="p-4 space-y-2">
              {filteredLists.map((list) => {
                const isInList = mediaLists.includes(list.id);
                return (
                  <button
                    key={list.id}
                    onClick={() => handleToggleList(list.id)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      isInList
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded ${
                          isInList 
                            ? 'bg-blue-100 dark:bg-blue-800/50' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {list.visibility === 'private' ? (
                            <Lock className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Globe className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium truncate ${
                            isInList 
                              ? 'text-blue-900 dark:text-blue-100' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {list.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {list.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isInList
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isInList && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ListIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No lists found' : 'No lists yet'}
              </p>
            </div>
          )}
        </div>

        {/* Create New List */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {showCreateForm ? (
            <form onSubmit={handleCreateList} className="space-y-3">
              <input
                type="text"
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewListName('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newListName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create & Add'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New List
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
