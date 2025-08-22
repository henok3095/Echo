import React from 'react';
import { User, Users, Camera } from 'lucide-react';

export default function ProfileStats({
  displayProfile,
  followers,
  following,
  formatNumber,
  loadFollowers,
  loadFollowing,
  handleAvatarUpload,
  isViewingOwnProfile,
  isEditing,
  editProfile,
  setEditProfile
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
            {displayProfile?.avatar_url ? (
              <img 
                src={displayProfile.avatar_url} 
                alt={displayProfile.username || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          {isViewingOwnProfile && isEditing && (
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer transition-colors">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={editProfile.username}
                    onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Username"
                  />
                ) : (
                  displayProfile?.username || 'User'
                )}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                {isEditing ? (
                  <textarea
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full mt-2"
                    placeholder="Tell us about yourself..."
                    rows="3"
                  />
                ) : (
                  displayProfile?.bio || 'No bio available'
                )}
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-8 mt-4 md:mt-0">
              <button
                onClick={loadFollowers}
                className="text-center hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors"
              >
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(followers?.length || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
              </button>
              
              <button
                onClick={loadFollowing}
                className="text-center hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors"
              >
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(following?.length || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
