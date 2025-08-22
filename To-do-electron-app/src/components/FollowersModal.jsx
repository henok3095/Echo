import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserPlus } from 'lucide-react';

export default function FollowersModal({
  showFollowers,
  showFollowing,
  setShowFollowers,
  setShowFollowing,
  followers,
  following,
  formatNumber
}) {
  const navigate = useNavigate();
  const isOpen = showFollowers || showFollowing;
  const title = showFollowers ? 'Followers' : 'Following';
  const data = showFollowers ? followers : following;

  const handleClose = () => {
    setShowFollowers(false);
    setShowFollowing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title} ({formatNumber(data?.length || 0)})
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-80">
              {data && data.length > 0 ? (
                <div className="p-4 space-y-3">
                  {data.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => { navigate(`/profile/${encodeURIComponent(person.username || person.id)}`); handleClose(); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/profile/${encodeURIComponent(person.username || person.id)}`); handleClose(); } }}
                      role="button"
                      tabIndex={0}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {person.avatar_url ? (
                            <img 
                              src={person.avatar_url} 
                              alt={person.username || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {person.username || 'Unknown User'}
                          </p>
                          {person.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-48">
                              {person.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                        <UserPlus className="w-3 h-3" />
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No {title.toLowerCase()} yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
