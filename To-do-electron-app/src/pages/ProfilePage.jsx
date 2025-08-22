import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/index.jsx';
import { Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage } from '../api/supabase.js';

// Import the new components
import ProfileHeader from '../components/ProfileHeader.jsx';
import ProfileStats from '../components/ProfileStats.jsx';
import ProfileTabs from '../components/ProfileTabs.jsx';
import FollowersModal from '../components/FollowersModal.jsx';
import VisibilitySettings from '../components/VisibilitySettings.jsx';
import RecommendedUsers from '../components/RecommendedUsers.jsx';

// Simplified: removed in-page suggestions/search to declutter profile



export default function ProfilePage() {
  const { username } = useParams();
  const { 
    user, 
    profile, 
    userProfile, 
    isFollowing,
    updateProfile, 
    fetchUserProfile, 
    toggleFollow
  } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  // Additional state for Supabase data
  const [profileStats, setProfileStats] = useState({
    tasksCompleted: 0,
    journalEntries: 0,
    mediaRated: 0,
    memories: 0
  });
  
  const [editProfile, setEditProfile] = useState({
    id: '',
    username: '',
    bio: '',
    avatar_url: '',
    is_public: false,
    show_activity: true,
    show_media: true,
    show_music: true,
    show_tasks: true,
    show_journal: false,
    show_memories: false,
    social_links: {}
  });

  // Format number with K/M suffix
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Load profile data when component mounts or username changes
  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const profileToView = username || user.id;
      const isOwnProfile = !username || username === profile?.username || username === user.id;
      setIsViewingOwnProfile(isOwnProfile);
      
      if (!isOwnProfile) {
        // Fetch the user's profile by username or ID
        const { data: profileData, error } = await db.fetchUserProfile(profileToView);
        if (error) throw error;
        
        // Fetch followers and following
        const [followersRes, followingRes] = await Promise.all([
          db.fetchUserFollowers(profileData.id),
          db.fetchUserFollowing(profileData.id)
        ]);
        
        setFollowers(followersRes.data || []);
        setFollowing(followingRes.data || []);
        
        // Load profile stats for other users
        await loadProfileStats(profileData.id);
      } else {
        // For own profile, use the existing profile data
        setEditProfile({
          id: profile?.id || user?.id || '',
          username: profile?.username || '',
          bio: profile?.bio || '',
          avatar_url: profile?.avatar_url || '',
          is_public: profile?.is_public || false,
          show_activity: profile?.show_activity ?? true,
          show_media: profile?.show_media ?? true,
          show_music: profile?.show_music ?? true,
          show_tasks: profile?.show_tasks ?? true,
          show_journal: profile?.show_journal ?? false,
          show_memories: profile?.show_memories ?? false,
          social_links: profile?.social_links || {}
        });
        
        // Fetch followers and following for own profile
        const [followersRes, followingRes] = await Promise.all([
          db.fetchUserFollowers(user.id),
          db.fetchUserFollowing(user.id)
        ]);
        
        setFollowers(followersRes.data || []);
        setFollowing(followingRes.data || []);
        
        // Load own profile stats
        await loadProfileStats(user.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      await loadProfile();
    };
    run();
  }, [user, username, profile]);

  // Load profile statistics from Supabase
  const loadProfileStats = async (userId) => {
    try {
      const [tasksRes, mediaRes, memoriesRes] = await Promise.all([
        db.getTasks(userId),
        db.getMediaEntries(userId),
        db.getMemories(userId)
      ]);
      
      const completedTasks = tasksRes.data?.filter(task => task.status === 'completed').length || 0;
      const mediaCount = mediaRes.data?.length || 0;
      const memoriesCount = memoriesRes.data?.length || 0;
      
      setProfileStats({
        tasksCompleted: completedTasks,
        journalEntries: 0, // Will be implemented when journal API is ready
        mediaRated: mediaCount,
        memories: memoriesCount
      });
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Ensure we always include an id for the update filter
      const payload = { ...editProfile, id: editProfile.id || user?.id };
      const { error } = await db.updateProfile(payload);
      if (error) throw error;
      
      // Update the local store
      await updateProfile(payload);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFollowToggle = async () => {
    try {
      setIsLoading(true);
      const targetUserId = userProfile?.id;
      
      if (isFollowing) {
        const { error } = await db.unfollowUser(user.id, targetUserId);
        if (error) throw error;
        toast.success('Unfollowed user');
      } else {
        const { error } = await db.followUser(user.id, targetUserId);
        if (error) throw error;
        toast.success('Followed user');
      }
      
      // Update the follow status in the store
      await toggleFollow(targetUserId);
      
      // Refresh followers/following lists
      const [followersRes, followingRes] = await Promise.all([
        db.fetchUserFollowers(targetUserId),
        db.fetchUserFollowing(user.id)
      ]);
      
      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error.message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFollowers = async () => {
    try {
      const userId = isViewingOwnProfile ? user?.id : userProfile?.id;
      if (!userId) return;
      
      const { data, error } = await db.fetchUserFollowers(userId);
      if (error) throw error;
      
      setFollowers(data || []);
      setShowFollowers(true);
    } catch (error) {
      console.error('Error loading followers:', error);
      toast.error('Failed to load followers');
    }
  };
  
  const loadFollowing = async () => {
    try {
      const userId = isViewingOwnProfile ? user?.id : userProfile?.id;
      if (!userId) return;
      
      const { data, error } = await db.fetchUserFollowing(userId);
      if (error) throw error;
      
      setFollowing(data || []);
      setShowFollowing(true);
    } catch (error) {
      console.error('Error loading following:', error);
      toast.error('Failed to load following');
    }
  };
  
  const handleCancelEdit = () => {
    setEditProfile({
      id: profile?.id || user?.id || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
      is_public: profile?.is_public || false,
      show_activity: profile?.show_activity ?? true,
      show_media: profile?.show_media ?? true,
      show_music: profile?.show_music ?? true,
      show_tasks: profile?.show_tasks ?? true,
      show_journal: profile?.show_journal ?? false,
      show_memories: profile?.show_memories ?? false,
      social_links: profile?.social_links || {}
    });
    setIsEditing(false);
  };

  const toggleVisibilitySettings = () => {
    setShowVisibilitySettings(!showVisibilitySettings);
  };

  const handleVisibilityChange = (setting, value) => {
    setEditProfile(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    // Validate image dimensions (optional)
    const img = new Image();
    img.onload = async () => {
      if (img.width > 2000 || img.height > 2000) {
        toast.error('Image dimensions must be less than 2000x2000 pixels');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Upload avatar to Supabase storage
        const { data, error } = await storage.uploadAvatar(user.id, file);
        if (error) throw error;
        
        // Update profile with new avatar URL
        const updatedProfile = { ...editProfile, avatar_url: data.path };
        const { error: updateError } = await db.updateProfile(updatedProfile);
        if (updateError) throw updateError;
        
        // Update local state
        setEditProfile(updatedProfile);
        await updateProfile(updatedProfile);
        
        toast.success('Avatar updated successfully');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Failed to upload avatar');
      } finally {
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
      toast.error('Invalid image file');
    };
    
    img.src = URL.createObjectURL(file);
  };

  // Get the profile data to display (own profile or viewed profile)
  const displayProfile = isViewingOwnProfile ? { ...profile, ...editProfile } : userProfile;
  const displayName = displayProfile?.username || user?.email?.split('@')[0] || 'User';
  
  if (isLoading && !displayProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader
        displayName={displayName}
        displayProfile={displayProfile}
        isViewingOwnProfile={isViewingOwnProfile}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isFollowing={isFollowing}
        handleFollowToggle={handleFollowToggle}
        isLoading={isLoading}
      />

      {/* Profile Stats */}
      <ProfileStats
        displayProfile={displayProfile}
        followers={followers}
        following={following}
        formatNumber={formatNumber}
        loadFollowers={loadFollowers}
        loadFollowing={loadFollowing}
        handleAvatarUpload={handleAvatarUpload}
        isViewingOwnProfile={isViewingOwnProfile}
        isEditing={isEditing}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
      />

      {/* Who to follow / Recommendations */}
      <RecommendedUsers
        currentUserId={user?.id}
        onFollow={async () => {
          // Refresh following to reflect the new connection
          try {
            const { data } = await db.fetchUserFollowing(user?.id);
            setFollowing(data || []);
          } catch (e) {
            // noop
          }
        }}
      />

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
            <button
              onClick={toggleVisibilitySettings}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Privacy Settings
            </button>
          </div>

          {showVisibilitySettings && (
            <VisibilitySettings
              editProfile={editProfile}
              handleVisibilityChange={handleVisibilityChange}
            />
          )}

          {/* Social Links */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Social Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Website (full URL)</label>
                <input
                  type="url"
                  value={editProfile.social_links?.website || ''}
                  onChange={(e) => setEditProfile({ ...editProfile, social_links: { ...editProfile.social_links, website: e.target.value } })}
                  placeholder="https://your-site.com"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Twitter (full URL)</label>
                <input
                  type="url"
                  value={editProfile.social_links?.twitter || ''}
                  onChange={(e) => setEditProfile({ ...editProfile, social_links: { ...editProfile.social_links, twitter: e.target.value } })}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Instagram (full URL)</label>
                <input
                  type="url"
                  value={editProfile.social_links?.instagram || ''}
                  onChange={(e) => setEditProfile({ ...editProfile, social_links: { ...editProfile.social_links, instagram: e.target.value } })}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">GitHub (full URL)</label>
                <input
                  type="url"
                  value={editProfile.social_links?.github || ''}
                  onChange={(e) => setEditProfile({ ...editProfile, social_links: { ...editProfile.social_links, github: e.target.value } })}
                  placeholder="https://github.com/yourname"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Telegram (full URL)</label>
                <input
                  type="url"
                  value={editProfile.social_links?.telegram || ''}
                  onChange={(e) => setEditProfile({ ...editProfile, social_links: { ...editProfile.social_links, telegram: e.target.value } })}
                  placeholder="https://t.me/yourhandle"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please enter full URLs starting with https://</p>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Profile Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayProfile={displayProfile}
        isViewingOwnProfile={isViewingOwnProfile}
        user={user}
        profileStats={profileStats}
      />

      {/* Followers Modal */}
      <FollowersModal
        showFollowers={showFollowers}
        showFollowing={showFollowing}
        setShowFollowers={setShowFollowers}
        setShowFollowing={setShowFollowing}
        followers={followers}
        following={following}
        formatNumber={formatNumber}
      />


    </div>
  );
}
