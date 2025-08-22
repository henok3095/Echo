import React, { useState, useEffect } from 'react';
import { Plus, Send, Check, X, User, Calendar, BookOpen, Star, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore, useMediaStore } from '../../store/index.jsx';
import { db } from '../../api/supabase.js';
import Card from '../Card';
import toast from 'react-hot-toast';

export default function BookRecommendations() {
  const { user } = useAuthStore();
  const { mediaEntries, fetchMediaEntries } = useMediaStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Get user's books for recommendations
  const userBooks = mediaEntries.filter(entry => entry.type === 'book');
  const [newRecommendation, setNewRecommendation] = useState({
    recipientUsername: '',
    selectedBookId: '',
    reason: ''
  });

  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchMediaEntries('book'); // Fetch user's books
    }
  }, [user, fetchMediaEntries]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getBookRecommendations(user.id);
      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendationId, status) => {
    try {
      const recommendation = recommendations.find(rec => rec.id === recommendationId);
      
      // If accepting, add book to user's library
      if (status === 'accepted' && recommendation) {
        const bookData = {
          type: 'book',
          title: recommendation.book?.title || recommendation.book_title,
          director: recommendation.book?.director || recommendation.book_author,
          poster_path: recommendation.book?.poster_path || recommendation.poster_path,
          release_date: recommendation.book?.release_date,
          overview: recommendation.book?.overview || recommendation.description,
          status: 'to_read', // Default status when accepting recommendation
          rating: 0
        };
        
        const { addMediaEntry } = useMediaStore.getState();
        await addMediaEntry(bookData);
      }
      
      const { error } = await db.updateBookRecommendation(recommendationId, { status });
      if (error) throw error;
      
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId ? { ...rec, status } : rec
        )
      );
      
      toast.success(status === 'accepted' ? 'Added to your library!' : 'Recommendation declined');
    } catch (error) {
      toast.error('Failed to update recommendation');
    }
  };

  const handleSendRecommendation = async (e) => {
    e.preventDefault();
    if (!newRecommendation.recipientUsername.trim() || !newRecommendation.selectedBookId) {
      toast.error('Please select a book and enter recipient username');
      return;
    }

    setSending(true);
    try {
      // In a real app, you'd look up the user by username
      // For now, we'll simulate with a placeholder user_id
      const selectedBook = userBooks.find(book => book.id === newRecommendation.selectedBookId);
      
      const recommendationData = {
        user_id: 'placeholder-user-id', // This should be the recipient's user_id
        recommended_by_user_id: user.id,
        media_entry_id: newRecommendation.selectedBookId,
        book_title: selectedBook?.title || '',
        book_author: selectedBook?.director || '', // director field stores author
        recommendation_reason: newRecommendation.reason,
        status: 'pending'
      };

      const { error } = await db.createBookRecommendation(recommendationData);
      if (error) throw error;

      toast.success('Recommendation sent successfully!');
      setShowSendModal(false);
      setNewRecommendation({
        recipientUsername: '',
        selectedBookId: '',
        reason: ''
      });
      fetchRecommendations();
    } catch (error) {
      toast.error('Failed to send recommendation');
      console.error('Error sending recommendation:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'read': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    }
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
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book Recommendations</h2>
          <p className="text-gray-600 dark:text-gray-400">Discover books recommended by friends</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
        >
          <Send className="w-4 h-4" />
          Recommend a Book
        </button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Ask friends to recommend books or recommend some to others!</p>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={rec.book?.poster_path || rec.poster_path || '/placeholder-book.jpg'} 
                        alt={rec.book?.title || rec.book_title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => { e.target.src = '/placeholder-book.jpg' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {rec.book?.title || rec.book_title}
                        </h4>
                        {(rec.book?.director || rec.book_author) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {rec.book?.director || rec.book_author}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex-1">
                    {rec.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.description}</p>
                    )}
                    {rec.recommendation_reason && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3">
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          <strong>Why recommended:</strong> {rec.recommendation_reason}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Recommended by {rec.recommended_by?.username || 'Someone'}</span>
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>
                      {rec.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRecommendationAction(rec.id, 'accepted')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRecommendationAction(rec.id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Recommend Book Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recommend a Book</h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Username *
                </label>
                <input
                  type="text"
                  value={newRecommendation.recipientUsername}
                  onChange={(e) => setNewRecommendation(prev => ({ ...prev, recipientUsername: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Book from Your Library *
                </label>
                <select
                  value={newRecommendation.selectedBookId}
                  onChange={(e) => setNewRecommendation(prev => ({ ...prev, selectedBookId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Choose a book to recommend...</option>
                  {userBooks.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.director && `by ${book.director}`}
                    </option>
                  ))}
                </select>
                {userBooks.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Add books to your library first to recommend them
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Why do you recommend this book?
                </label>
                <textarea
                  value={newRecommendation.reason}
                  onChange={(e) => setNewRecommendation(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Share why you think they'd love this book..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRecommendation}
                  disabled={sending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {sending ? 'Sending...' : 'Send Recommendation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
