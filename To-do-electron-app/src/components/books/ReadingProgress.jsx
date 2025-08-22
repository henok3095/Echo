import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Calendar, TrendingUp, Edit3, Save, X, Plus } from 'lucide-react';
import { db } from '../../api/supabase.js';
import { useAuthStore, useMediaStore } from '../../store/index.jsx';
import Card from '../Card';
import toast from 'react-hot-toast';

export default function ReadingProgress() {
  const { user } = useAuthStore();
  const { mediaEntries } = useMediaStore();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProgress, setNewProgress] = useState({
    book_id: '',
    current_page: 0,
    total_pages: 0,
    reading_goal_date: '',
    notes: ''
  });

  const currentlyReadingBooks = mediaEntries?.filter(book => 
    book.type === 'book' && book.status === 'reading'
  ) || [];

  useEffect(() => {
    if (user) {
      fetchReadingProgress();
    }
  }, [user]);

  const fetchReadingProgress = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getReadingProgress(user.id);
      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error fetching reading progress:', error);
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (progressId, updates) => {
    try {
      const { error } = await db.upsertReadingProgress({
        id: progressId,
        user_id: user.id,
        ...updates,
        last_read_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      
      await fetchReadingProgress();
      setEditingProgress(null);
      toast.success('Progress updated!');
      
      // Log reading activity
      await db.createReadingActivity({
        user_id: user.id,
        book_id: updates.book_id,
        activity_type: 'progress_update',
        pages_read: updates.current_page,
        activity_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleAddProgress = async () => {
    if (!newProgress.book_id || !newProgress.total_pages) {
      toast.error('Please select a book and enter total pages');
      return;
    }

    try {
      await handleUpdateProgress(null, {
        ...newProgress,
        user_id: user.id
      });
      
      setShowAddModal(false);
      setNewProgress({
        book_id: '',
        current_page: 0,
        total_pages: 0,
        reading_goal_date: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to add progress tracking');
    }
  };

  const getProgressPercentage = (current, total) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDaysToGoal = (goalDate) => {
    if (!goalDate) return null;
    const today = new Date();
    const goal = new Date(goalDate);
    const diffTime = goal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill().map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reading Progress</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your progress through current books</p>
        </div>
        {currentlyReadingBooks.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Track Progress
          </button>
        )}
      </div>

      {/* Progress Cards */}
      <div className="space-y-4">
        {progressData.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No progress tracked yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start tracking your reading progress to see detailed insights
            </p>
            {currentlyReadingBooks.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Tracking
              </button>
            )}
          </Card>
        ) : (
          progressData.map((progress) => {
            const percentage = getProgressPercentage(progress.current_page, progress.total_pages);
            const daysToGoal = getDaysToGoal(progress.reading_goal_date);
            const isEditing = editingProgress === progress.id;
            
            return (
              <motion.div
                key={progress.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex gap-4">
                    {progress.book?.poster_path ? (
                      <img
                        src={progress.book.poster_path}
                        alt={progress.book.title}
                        className="w-16 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {progress.book?.title || 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {progress.book?.director || 'Unknown Author'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingProgress(isEditing ? null : progress.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Current Page
                              </label>
                              <input
                                type="number"
                                defaultValue={progress.current_page}
                                onChange={(e) => setEditingProgress({...progress, current_page: parseInt(e.target.value) || 0})}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Total Pages
                              </label>
                              <input
                                type="number"
                                defaultValue={progress.total_pages}
                                onChange={(e) => setEditingProgress({...progress, total_pages: parseInt(e.target.value) || 0})}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Goal Date
                            </label>
                            <input
                              type="date"
                              defaultValue={progress.reading_goal_date}
                              onChange={(e) => setEditingProgress({...progress, reading_goal_date: e.target.value})}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateProgress(progress.id, editingProgress)}
                            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            <Save className="w-3 h-3" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {percentage}% Complete
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {progress.current_page} / {progress.total_pages} pages
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Last read: {progress.last_read_date ? 
                                  new Date(progress.last_read_date).toLocaleDateString() : 
                                  'Not set'
                                }
                              </span>
                            </div>
                            {daysToGoal !== null && (
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                <span className={daysToGoal < 0 ? 'text-red-500' : daysToGoal < 7 ? 'text-yellow-500' : ''}>
                                  {daysToGoal < 0 ? `${Math.abs(daysToGoal)} days overdue` : 
                                   daysToGoal === 0 ? 'Due today' : 
                                   `${daysToGoal} days left`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {progress.notes && (
                            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{progress.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Progress Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Track Reading Progress</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Book *
                </label>
                <select
                  value={newProgress.book_id}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, book_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Choose a book...</option>
                  {currentlyReadingBooks.map(book => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Page
                  </label>
                  <input
                    type="number"
                    value={newProgress.current_page}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, current_page: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Pages *
                  </label>
                  <input
                    type="number"
                    value={newProgress.total_pages}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, total_pages: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reading Goal Date
                </label>
                <input
                  type="date"
                  value={newProgress.reading_goal_date}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, reading_goal_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={newProgress.notes}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Any thoughts or goals..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProgress}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Start Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
