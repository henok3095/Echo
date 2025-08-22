import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, X, UserMinus, UserPlus, Lock, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileHeader({
  displayName,
  displayProfile,
  isViewingOwnProfile,
  isEditing,
  setIsEditing,
  isFollowing,
  handleFollowToggle,
  isLoading
}) {
  const navigate = useNavigate();
  const handleCopyLink = async () => {
    try {
      const slug = encodeURIComponent(displayProfile?.username || displayProfile?.id || '');
      const path = `#/profile/${slug}`;
      const absolute = `${window.location.origin}/${path}`;
      await navigator.clipboard.writeText(absolute);
      toast.success('Profile link copied');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex items-start justify-between">
      <div>
        {!isViewingOwnProfile && (
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {displayName}
          {!displayProfile?.is_public && !isViewingOwnProfile && (
            <span className="ml-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
              <Lock className="inline w-3 h-3 mr-1" /> Private
            </span>
          )}
        </h1>
      </div>
      
      {isViewingOwnProfile ? (
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
      ) : (
        <div className="flex space-x-3">
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isFollowing
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
            ) : isFollowing ? (
              <>
                <UserMinus className="w-4 h-4" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow
              </>
            )}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
