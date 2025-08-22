import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, UserPlus, UserMinus, Check } from 'lucide-react';
import { useAuthStore } from '../store/index.jsx';
import { db } from '../api/supabase.js';
import toast from 'react-hot-toast';

export default function FollowersModal({
  showFollowers,
  showFollowing,
  setShowFollowers,
  setShowFollowing,
  followers,
  following,
  formatNumber,
  listOwnerId
}) {
  const navigate = useNavigate();
  const isOpen = showFollowers || showFollowing;
  const title = showFollowers ? 'Followers' : 'Following';
  const data = showFollowers ? followers : following;
  const { user } = useAuthStore();
  const isOwnList = user?.id && listOwnerId && user.id === listOwnerId;

  // Cache of user IDs the current user follows
  const [myFollowing, setMyFollowing] = useState(new Set());
  const [loadingId, setLoadingId] = useState(null);

  // Load my following when modal opens
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isOpen || !user?.id) return;
      try {
        const { data, error } = await db.fetchUserFollowing(user.id);
        if (!error && active) {
          setMyFollowing(new Set((data || []).map(r => r.following_id)));
        }
      } catch (_) { /* noop */ }
    };
    load();
    return () => { active = false; };
  }, [isOpen, user?.id]);

  const handleFollow = async (targetId) => {
    if (!user?.id || !targetId) return;
    try {
      setLoadingId(targetId);
      const { error } = await db.followUser(user.id, targetId);
      if (error) throw error;
      setMyFollowing(prev => new Set(prev).add(targetId));
      toast.success('Followed');
    } catch (e) {
      toast.error(e?.message || 'Failed to follow');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!user?.id || !targetId) return;
    try {
      setLoadingId(targetId);
      const { error } = await db.unfollowUser(user.id, targetId);
      if (error) throw error;
      setMyFollowing(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      toast.success('Unfollowed');
    } catch (e) {
      toast.error(e?.message || 'Failed to unfollow');
    } finally {
      setLoadingId(null);
    }
  };

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
                  {data.map((person) => {
                    const prof = person?.profiles || person || {};
                    const uid = prof.id || person.following_id || person.follower_id;
                    const uname = prof.username || '';
                    const avatar = prof.avatar_url || '';
                    const bio = prof.bio || '';
                    const to = `/profile/${encodeURIComponent(uname || uid || '')}`;
                    const iFollow = uid ? myFollowing.has(uid) : false;
                    return (
                      <div
                        key={uid}
                        onClick={() => { navigate(to); handleClose(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { navigate(to); handleClose(); } }}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {avatar ? (
                              <img 
                                src={avatar} 
                                alt={uname || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {uname || 'Unknown User'}
                            </p>
                            {bio && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-48">
                                {bio}
                              </p>
                            )}
                          </div>
                        </div>
                        {uid === user?.id ? null : iFollow ? (
                          <button
                            disabled={loadingId === uid}
                            onClick={(e) => { e.stopPropagation(); handleUnfollow(uid); }}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-sm rounded-lg transition-colors disabled:opacity-60"
                          >
                            <UserMinus className="w-3 h-3" />
                            Following
                          </button>
                        ) : (
                          <button
                            disabled={loadingId === uid}
                            onClick={(e) => { e.stopPropagation(); handleFollow(uid); }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-60"
                          >
                            <UserPlus className="w-3 h-3" />
                            Follow
                          </button>
                        )}
                      </div>
                    );
                  })}
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
