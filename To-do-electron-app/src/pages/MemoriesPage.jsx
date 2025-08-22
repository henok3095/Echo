import React, { useState, useEffect } from 'react';
import '../styles/sticky-notes.css';
import { useMemoryStore } from '../store/index.jsx';
import { Plus, Heart, Quote, Image, Tag, Calendar, AlertCircle, LayoutGrid, List, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/index.jsx';

export default function MemoriesPage() {
  const { user } = useAuthStore();
  const { 
    memories, 
    fetchMemories, 
    addMemory, 
    isLoading, 
    error: memoryError 
  } = useMemoryStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layout, setLayout] = useState('timeline'); // 'timeline' | 'grid'
  const [selectedTypes, setSelectedTypes] = useState(['thought','quote','highlight','image']);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    type: 'thought',
    tags: ''
  });
  
  // Reset error when component mounts or user changes
  useEffect(() => {
    if (memoryError) {
      toast.error(memoryError);
      useMemoryStore.getState().setError(null); // Clear error after showing
    }
  }, [memoryError]);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        await fetchMemories();
      } catch (error) {
        console.error('Failed to load memories:', error);
        toast.error(error.message || 'Failed to load memories');
      }
    };
    
    if (user) {
      loadMemories();
    }
  }, [fetchMemories, user]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to add a memory');
      return;
    }
    
    if (!newMemory.title.trim() || !newMemory.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMemory({
        ...newMemory,
        tags: newMemory.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      
      setNewMemory({
        title: '',
        content: '',
        type: 'thought',
        tags: ''
      });
      
      setShowAddModal(false);
      toast.success('Memory added successfully');
    } catch (error) {
      console.error('Add memory error:', error);
      toast.error(error.message || 'Failed to add memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMemories = memories
    .filter(memory => selectedTypes.includes(memory.type || 'thought'))
    .filter(memory =>
      memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const groupByDate = (items) => {
    // Group by YYYY-MM-DD
    return items.reduce((acc, item) => {
      const d = new Date(item.created_at);
      const key = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  const getMemoryIcon = (type) => {
    switch (type) {
      case 'quote':
        return Quote;
      case 'highlight':
        return Heart;
      case 'image':
        return Image;
      default:
        return Heart;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Memories</h1>
          <p className="text-gray-600 dark:text-gray-400">Capture moments, thoughts, quotes, and highlights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setLayout('timeline')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${layout==='timeline' ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <List className="w-4 h-4" /> Timeline
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${layout==='grid' ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Filter className="w-3 h-3" /> Filter by type:
          </span>
          {['thought','quote','highlight','image'].map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedTypes.includes(t)
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {memoryError && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">Error loading memories</h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {memoryError}
            </p>
            <button
              onClick={fetchMemories}
              className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
              disabled={isLoading}
            >
              {isLoading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      )}
      
      {/* Memories Grid */}
      {isLoading && memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <div className="animate-pulse flex space-x-4 w-full max-w-md">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading your memories...</div>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-gray-700 dark:text-gray-300 font-medium mb-1">No memories yet</div>
          <div className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Start capturing your moments and thoughts.</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add your first memory
          </button>
        </div>
      ) : (
        <>
          {layout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sticky-note-grid">
              {filteredMemories.map(memory => {
                const MemoryIcon = getMemoryIcon(memory.type);
                return (
                  <div
                    key={memory.id}
                    className="sticky-note-card p-4 shadow-xl transition-transform hover:-translate-y-1 hover:rotate-1 relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MemoryIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-medium text-gray-900 dark:text-yellow-900 text-lg sticky-note-title">
                          {memory.title}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {memory.type}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                      {memory.content}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                      </div>

                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Timeline layout
            <div className="relative">
              <div className="absolute left-3 md:left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-10">
                {Object.entries(groupByDate(filteredMemories)).map(([date, items]) => (
                  <div key={date} className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-purple-600 text-white grid place-items-center text-xs shadow">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">{date}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-10">
                      {items.map((memory) => {
                        const MemoryIcon = getMemoryIcon(memory.type);
                        return (
                          <div key={memory.id} className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="grid place-items-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                  <MemoryIcon className="w-3.5 h-3.5" />
                                </span>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{memory.title}</h4>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">{memory.type}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line">{memory.content}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(memory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {memory.tags && memory.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {memory.tags.map((tag, index) => (
                                    <span key={index} className="text-[10px] inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                      <Tag className="w-3 h-3" /> {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Memory</h2>
            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Memory title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="thought">Thought</option>
                  <option value="quote">Quote</option>
                  <option value="highlight">Highlight</option>
                  <option value="image">Image Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Write your memory..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., family, travel, milestone"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Memory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Add Button (mobile) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg grid place-items-center"
        aria-label="Add Memory"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
