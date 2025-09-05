import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List as ListIcon, 
  Star, 
  Clock, 
  Globe, 
  Lock,
  Film,
  Sparkles,
  Tag,
  Users,
  TrendingUp
} from 'lucide-react';
import { useMediaStore } from '../store/index.jsx';
import ListCard from '../components/ListCard';
import ListCreationModal from '../components/ListCreationModal';
import toast from 'react-hot-toast';

const ListsPage = () => {
  const { lists, fetchLists, deleteList, mediaEntries } = useMediaStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingList, setEditingList] = useState(null);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Filter and sort lists
  const filteredLists = lists
    .filter(list => {
      const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          list.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || list.category === filterCategory;
      const matchesVisibility = filterVisibility === 'all' || list.visibility === filterVisibility;
      
      return matchesSearch && matchesCategory && matchesVisibility;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'items_desc':
          return (b.items?.length || 0) - (a.items?.length || 0);
        case 'items_asc':
          return (a.items?.length || 0) - (b.items?.length || 0);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const handleDeleteList = async (list) => {
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This action cannot be undone.`)) {
      try {
        await deleteList(list.id);
        toast.success('List deleted successfully');
      } catch (error) {
        toast.error('Failed to delete list');
        console.error('Delete list error:', error);
      }
    }
  };

  const handleViewList = (list) => {
    // Navigate to list detail view
    window.location.href = `/lists/${list.id}`;
  };

  const handleEditList = (list) => {
    setEditingList(list);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingList(null);
  };

  // Quick stats
  const totalLists = lists.length;
  const publicLists = lists.filter(l => l.visibility === 'public').length;
  const totalItems = lists.reduce((acc, list) => acc + (list.items?.length || 0), 0);
  const avgItemsPerList = totalLists > 0 ? Math.round(totalItems / totalLists) : 0;

  const categories = [
    { value: 'all', label: 'All Categories', icon: ListIcon },
    { value: 'general', label: 'General', icon: Film },
    { value: 'favorites', label: 'Favorites', icon: Sparkles },
    { value: 'watchlist', label: 'Watchlist', icon: Clock },
    { value: 'genres', label: 'By Genre', icon: Tag },
    { value: 'yearly', label: 'Yearly Lists', icon: TrendingUp },
    { value: 'themed', label: 'Themed', icon: Users }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Lists
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize your movies and series into curated collections
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create List
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ListIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLists}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Lists</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{publicLists}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Public Lists</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgItemsPerList}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg per List</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search lists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility Filter */}
            <div className="lg:w-40">
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="items_desc">Most Items</option>
                <option value="items_asc">Fewest Items</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                } transition-colors`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                } transition-colors`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Lists Grid/List */}
        {filteredLists.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                compact={viewMode === 'list'}
                onEdit={handleEditList}
                onDelete={handleDeleteList}
                onView={handleViewList}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-auto">
              <ListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterCategory !== 'all' || filterVisibility !== 'all'
                  ? 'No lists found'
                  : 'No lists yet'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterCategory !== 'all' || filterVisibility !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : 'Create your first list to organize your favorite movies and series'
                }
              </p>
              {!searchTerm && filterCategory === 'all' && filterVisibility === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First List
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ListCreationModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        editingList={editingList}
      />
    </div>
  );
};

export default ListsPage;
