import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/index.jsx';
import { Save, Settings, Lock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage, auth } from '../api/supabase.js';

// Import the new components
import ProfileHeader from '../components/ProfileHeader.jsx';
import ProfileStats from '../components/ProfileStats.jsx';
import ProfileTabs from '../components/ProfileTabs.jsx';
import FollowersModal from '../components/FollowersModal.jsx';
import VisibilitySettings from '../components/VisibilitySettings.jsx';
import AvatarCropModal from '../components/AvatarCropModal.jsx';
import EditProfileModal from '../components/EditProfileModal.jsx';

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
    toggleFollow,
    deleteProfile
  } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const settingsPanelRef = useRef(null);
  const settingsCloseRef = useRef(null);
  // Delete profile confirmation state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  // Avatar cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // Object URL of selected image
  const [pendingFile, setPendingFile] = useState(null); // Original File to derive name
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) throw error;
      // Redirect handled by Supabase; session restored on return
    } catch (err) {
      console.error('Google sign-in failed:', err);
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  // Delete profile from Settings modal (type-to-confirm)
  const handleDeleteProfile = async () => {
    try {
      const expected = profile?.username || '';
      if (!expected || confirmText !== expected) {
        toast.error('Type your exact username to confirm');
        return;
      }
      setIsLoading(true);
      await deleteProfile();
      toast.success('Profile deleted');
      // Reset local editable state and close settings
      setEditProfile(prev => ({
        id: user?.id || '',
        username: '',
        bio: '',
        avatar_url: '',
        is_public: true,
        show_activity: true,
        show_media: true,
        show_music: true,
        show_tasks: true,
        show_journal: false,
        show_memories: false,
        social_links: {}
      }));
      setShowVisibilitySettings(false);
      setShowConfirmDelete(false);
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error(error.message || 'Failed to delete profile');
    } finally {
      setIsLoading(false);
    }
  };
  
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
    is_public: true,
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
        // Fetch the user's profile by username or ID using the store so userProfile is set
        const viewed = await fetchUserProfile(profileToView);
        
        // Fetch followers and following for the viewed profile
        const [followersRes, followingRes] = await Promise.all([
          db.fetchUserFollowers(viewed.id),
          db.fetchUserFollowing(viewed.id)
        ]);
        
        setFollowers(followersRes.data || []);
        setFollowing(followingRes.data || []);
        
        // Load profile stats for other users
        await loadProfileStats(viewed.id);
      } else {
        // For own profile, use the existing profile data
        setEditProfile({
          id: profile?.id || user?.id || '',
          username: profile?.username || '',
          bio: profile?.bio || '',
          avatar_url: profile?.avatar_url || '',
          is_public: profile?.is_public || true,
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
      is_public: profile?.is_public || true,
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

  // Keyboard a11y for Settings modal
  useEffect(() => {
    if (!showVisibilitySettings) return;
    settingsCloseRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowVisibilitySettings(false);
        return;
      }
      if (e.key === 'Tab') {
        const container = settingsPanelRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showVisibilitySettings]);

  const handleVisibilityChange = (setting, value) => {
    setEditProfile(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Quick toggle for public/private from the top of the profile page
  const handleTogglePublic = async () => {
    try {
      const newValue = !editProfile.is_public;
      // Optimistic UI update
      setEditProfile(prev => ({ ...prev, is_public: newValue }));
      setIsLoading(true);

      const payload = { ...editProfile, is_public: newValue, id: editProfile.id || user?.id };
      const { error } = await db.updateProfile(payload);
      if (error) throw error;

      await updateProfile(payload);
      toast.success(newValue ? 'Profile set to Public' : 'Profile set to Private');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
      // Revert optimistic update
      setEditProfile(prev => ({ ...prev, is_public: !prev.is_public }));
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar upload handler -> opens cropper modal
  const handleAvatarUpload = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (10MB limit to allow cropping; final output is smaller)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File must be less than 10MB');
        return;
      }

      // Open cropper with selected file
      const objectUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setCropSrc(objectUrl);
      setShowCropper(true);
      // Reset input value to allow re-selecting the same file
      e.target.value = '';
    } catch (_) {
      toast.error('Failed to open image');
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
    setShowCropper(false);
  };

  const handleCropConfirm = async (blob) => {
    try {
      setIsLoading(true);

      // Create a File from the blob to keep storage API consistent
      const fileName = `avatar_${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

      const { data, error } = await storage.uploadAvatar(user.id, croppedFile);
      if (error) throw error;

      const updatedProfile = { ...editProfile, avatar_url: data.path };
      const { error: updateError } = await db.updateProfile(updatedProfile);
      if (updateError) throw updateError;

      setEditProfile(updatedProfile);
      await updateProfile(updatedProfile);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsLoading(false);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setPendingFile(null);
      setShowCropper(false);
    }
  };

  const displayProfile = isViewingOwnProfile ? profile : userProfile;
  const displayName = displayProfile?.username || 'Profile';

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sign in</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Sign in to access your profile and sync data.</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.62 32.91 29.24 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.869 6.053 29.706 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.652-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.22 16.108 18.79 12 24 12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.869 6.053 29.706 4 24 4 15.317 4 7.966 8.992 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.24 36 24 36 24 36c-5.202 0-9.572-3.08-11.29-7.386l-6.54 5.04C8.792 39.03 15.868 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.083 3.09-3.403 5.572-6.094 7.035l6.191 5.238C38.907 37.682 44 32 44 24c0-1.341-.138-2.652-.389-3.917z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-6 space-y-6">
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

      <ProfileStats
        displayProfile={displayProfile}
        followers={followers}
        following={following}
        formatNumber={formatNumber}
        loadFollowers={loadFollowers}
        loadFollowing={loadFollowing}
        handleAvatarUpload={handleAvatarUpload}
        isViewingOwnProfile={isViewingOwnProfile}
        isEditing={false}
        editProfile={editProfile}
        setEditProfile={setEditProfile}
      />

      {isViewingOwnProfile ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Visibility:</span>
            <button
              onClick={handleTogglePublic}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {editProfile.is_public ? 'Public' : 'Private'}
            </button>
          </div>
          <button
            onClick={toggleVisibilitySettings}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Settings
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            {displayProfile?.is_public ? 'Public profile' : 'Private profile'}
          </span>
        </div>
      )}

      {isViewingOwnProfile && showVisibilitySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Profile settings">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowVisibilitySettings(false)} />
          <div className="relative z-10 w-[92vw] max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden" ref={settingsPanelRef}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile settings</h3>
              <button
                type="button"
                onClick={() => setShowVisibilitySettings(false)}
                className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                ref={settingsCloseRef}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <VisibilitySettings
                editProfile={editProfile}
                handleVisibilityChange={handleVisibilityChange}
              />
              <div className="mt-6 border-t border-red-200 dark:border-red-900 pt-4">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Danger zone</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Delete your profile. This does not delete your account or other data.</p>
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Delete profile
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Type your username <span className="font-semibold">{profile?.username}</span> to confirm
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter username to confirm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteProfile}
                        disabled={isLoading || !profile?.username || confirmText !== profile?.username}
                        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowConfirmDelete(false); setConfirmText(''); }}
                        className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayProfile={displayProfile}
        isViewingOwnProfile={isViewingOwnProfile}
        user={user}
        profileStats={profileStats}
      />

      <FollowersModal
        showFollowers={showFollowers}
        showFollowing={showFollowing}
        setShowFollowers={setShowFollowers}
        setShowFollowing={setShowFollowing}
        followers={followers}
        following={following}
        formatNumber={formatNumber}
        listOwnerId={isViewingOwnProfile ? user?.id : userProfile?.id}
      />

      {showCropper && (
        <AvatarCropModal
          src={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          aspect={1}
          outputSize={512}
        />
      )}
      {isEditing && !showCropper && (
        <EditProfileModal
          editProfile={editProfile}
          setEditProfile={setEditProfile}
          onCancel={handleCancelEdit}
          onSave={handleSaveProfile}
          handleAvatarUpload={handleAvatarUpload}
          isSaving={isLoading}
        />
      )}
    </div>
  );
}
