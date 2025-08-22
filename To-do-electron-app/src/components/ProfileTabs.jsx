import React from 'react';
import { UserCheck, Globe, Twitter, Instagram, Github, Send } from 'lucide-react';

export default function ProfileTabs({
  activeTab,
  setActiveTab,
  displayProfile,
  isViewingOwnProfile,
  user,
  profileStats
}) {
  const FriendsList = ({ userId }) => {
    const [friends, setFriends] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
      const run = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
          const { db } = await import('../api/supabase.js');
          // Get following
          const [followingRes, followersRes] = await Promise.all([
            db.fetchUserFollowing(userId),
            db.fetchUserFollowers(userId),
          ]);
          const following = (followingRes.data || []).map(r => r.profiles || r).map(p => p.id ? p : { ...p, id: p.id });
          const followers = (followersRes.data || []).map(r => r.profiles || r).map(p => p.id ? p : { ...p, id: p.id });
          const followerIds = new Set(followers.map(p => p.id));
          const mutuals = following.filter(p => followerIds.has(p.id));
          setFriends(mutuals);
        } catch (e) {
          setError(e.message || 'Failed to load friends');
        } finally {
          setLoading(false);
        }
      };
      run();
    }, [userId]);

    if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading friends…</div>;
    if (error) return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
    if (!friends.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No friends yet</div>;

    return (
      <div className="space-y-3">
        {friends.map(friend => (
          <a
            key={friend.id}
            onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `#/profile/${encodeURIComponent(friend.username || friend.id)}`); window.dispatchEvent(new HashChangeEvent('hashchange')); }}
            href={`#/profile/${encodeURIComponent(friend.username || friend.id)}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt={friend.username || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">{(friend.username || 'U').slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{friend.username || 'Unknown User'}</div>
              {friend.bio && <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{friend.bio}</div>}
            </div>
          </a>
        ))}
      </div>
    );
  };
  const tabs = [
    { id: 'overview', label: 'About' },
    { id: 'friends', label: 'Friends', icon: UserCheck },
  ];

  // Filter tabs based on visibility settings
  const visibleTabs = (isViewingOwnProfile || (displayProfile?.is_public ?? true))
    ? tabs
    : tabs.filter(t => t.id !== 'friends');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': {
        const joinedAt = displayProfile?.created_at || user?.created_at;
        const social = displayProfile?.social_links || {};
        const buildUrl = (type, val) => {
          if (!val) return null;
          // now we expect full URLs; only accept https?://
          if (!/^https?:\/\//i.test(val)) return null;
          return val;
        };
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {displayProfile?.bio || 'No bio yet.'}
              </p>
              {joinedAt && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Joined {new Date(joinedAt).toLocaleDateString()}
                </div>
              )}
              {(social.website || social.twitter || social.instagram || social.github || social.telegram) && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {social.website && (
                    <a href={buildUrl('website', social.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Globe className="w-4 h-4" /> Website
                    </a>
                  )}
                  {social.twitter && (
                    <a href={buildUrl('twitter', social.twitter)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Twitter className="w-4 h-4" /> Twitter
                    </a>
                  )}
                  {social.instagram && (
                    <a href={buildUrl('instagram', social.instagram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {social.github && (
                    <a href={buildUrl('github', social.github)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {social.telegram && (
                    <a href={buildUrl('telegram', social.telegram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Send className="w-4 h-4" /> Telegram
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Highlights</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{profileStats?.tasksCompleted || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{profileStats?.mediaRated || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Media</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{profileStats?.memories || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Memories</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{profileStats?.journalEntries || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Journal</div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'friends':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Friends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">People you follow who also follow you back</p>
            <FriendsList userId={displayProfile?.id || user?.id} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 px-4 md:px-6" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
