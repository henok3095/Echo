import React from 'react';
import { formatRating } from '../utils/ratings.js';
import RecommendedUsers from './RecommendedUsers.jsx';
import { UserCheck, Globe, Twitter, Instagram, Github, Send, List as ListIcon, Lock, Users } from 'lucide-react';

export default function ProfileTabs({
  activeTab,
  setActiveTab,
  displayProfile,
  isViewingOwnProfile,
  user,
  profileStats
}) {
  const FavoritesGrid = ({ userId, canView }) => {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [innerTab, setInnerTab] = React.useState('movies'); // 'movies' | 'series'

    React.useEffect(() => {
      const run = async () => {
        if (!userId || !canView) return;
        setLoading(true);
        setError(null);
        try {
          const { db } = await import('../api/supabase.js');
          const { data, error } = await db.getMediaEntries(userId);
          if (error) throw error;
          const favs = (data || []).filter(e => (e.favorite === true) && (e.type === 'movie' || e.type === 'tv'));
          setItems(favs);
        } catch (e) {
          setError(e.message || 'Failed to load favorites');
        } finally {
          setLoading(false);
        }
      };
      run();
    }, [userId, canView]);

    if (!canView) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">Media is private.</div>;
    }
    if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading favorites…</div>;
    if (error) return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
    if (!items.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No favorite movies or series yet.</div>;

    const buildPosterUrl = (p) => {
      if (!p) return null;
      if (typeof p === 'string' && /^https?:\/\//i.test(p)) return p;
      // TMDB relative path
      return `https://image.tmdb.org/t/p/w500${p}`;
    };

    const movies = items.filter(i => i.type === 'movie');
    const series = items.filter(i => i.type === 'tv');

    const Grid = ({ list }) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {list.map(item => (
          <div key={item.id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800">
              {buildPosterUrl(item.poster_path) ? (
                <img src={buildPosterUrl(item.poster_path)} alt={item.title || 'Media'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase">{item.type === 'tv' ? 'Series' : 'Movie'}</div>
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Inner Tabs">
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium ${innerTab === 'movies' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setInnerTab('movies')}
            >
              Movies <span className="ml-2 text-xs text-gray-400">{movies.length}</span>
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium ${innerTab === 'series' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setInnerTab('series')}
            >
              Series <span className="ml-2 text-xs text-gray-400">{series.length}</span>
            </button>
          </nav>
        </div>
        {innerTab === 'movies' ? (
          movies.length ? <Grid list={movies} /> : <div className="text-sm text-gray-500 dark:text-gray-400">No favorite movies yet.</div>
        ) : (
          series.length ? <Grid list={series} /> : <div className="text-sm text-gray-500 dark:text-gray-400">No favorite series yet.</div>
        )}
      </div>
    );
  };
  const TopRatedSection = ({ userId, canView }) => {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [innerTab, setInnerTab] = React.useState('movies'); // 'movies' | 'series'

    React.useEffect(() => {
      const run = async () => {
        if (!userId || !canView) return;
        setLoading(true);
        setError(null);
        try {
          const { db } = await import('../api/supabase.js');
          const { data, error } = await db.getMediaEntries(userId);
          if (error) throw error;
          const rated = (data || []).filter(e => e.rating != null && (e.type === 'movie' || e.type === 'tv'));
          setItems(rated);
        } catch (e) {
          setError(e.message || 'Failed to load top rated');
        } finally {
          setLoading(false);
        }
      };
      run();
    }, [userId, canView]);

    const buildPosterUrl = (p) => {
      if (!p) return null;
      if (typeof p === 'string' && /^https?:\/\//i.test(p)) return p;
      return `https://image.tmdb.org/t/p/w500${p}`;
    };

    if (!canView) return <div className="text-sm text-gray-500 dark:text-gray-400">Media is private.</div>;
    if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading top rated…</div>;
    if (error) return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
    if (!items.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No rated movies or series yet.</div>;

    const topMovies = items
      .filter(i => i.type === 'movie')
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 10);
    const topSeries = items
      .filter(i => i.type === 'tv')
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 10);

    const Grid = ({ list }) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {list.map((item, idx) => (
          <div key={item.id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
            <div className="absolute top-2 left-2 z-10">
              <div className="w-7 h-7 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</div>
            </div>
            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800">
              {buildPosterUrl(item.poster_path) ? (
                <img src={buildPosterUrl(item.poster_path)} alt={item.title || 'Media'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{item.title || 'Untitled'}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{item.type === 'tv' ? 'Series' : 'Movie'}</div>
                {item.rating != null && (
                  <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{formatRating(item.rating)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Inner Tabs">
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium ${innerTab === 'movies' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setInnerTab('movies')}
            >
              Movies <span className="ml-2 text-xs text-gray-400">{topMovies.length}</span>
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium ${innerTab === 'series' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setInnerTab('series')}
            >
              Series <span className="ml-2 text-xs text-gray-400">{topSeries.length}</span>
            </button>
          </nav>
        </div>
        {innerTab === 'movies' ? (
          topMovies.length ? <Grid list={topMovies} /> : <div className="text-sm text-gray-500 dark:text-gray-400">No rated movies yet.</div>
        ) : (
          topSeries.length ? <Grid list={topSeries} /> : <div className="text-sm text-gray-500 dark:text-gray-400">No rated series yet.</div>
        )}
      </div>
    );
  };
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

  const ListsSection = ({ userId, canView }) => {
    const [lists, setLists] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      const run = async () => {
        if (!userId || !canView) return;
        setLoading(true);
        setError(null);
        try {
          const { useMediaStore } = await import('../store/index.jsx');
          const fetchedLists = await useMediaStore.getState().fetchLists();
          // Filter lists by visibility - show public lists for other users, all lists for own profile
          const visibleLists = isViewingOwnProfile 
            ? fetchedLists 
            : fetchedLists.filter(list => list.visibility === 'public');
          setLists(visibleLists || []);
        } catch (e) {
          setError(e.message || 'Failed to load lists');
        } finally {
          setLoading(false);
        }
      };
      run();
    }, [userId, canView]);

    if (!canView) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">Lists are private.</div>;
    }
    if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading lists…</div>;
    if (error) return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
    if (!lists.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No lists yet.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map(list => (
          <div key={list.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</h4>
                {list.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{list.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                {list.visibility === 'private' ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : (
                  <Users className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-400">
                  {list.items?.length || 0} items
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {list.category || 'general'}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {list.created_at ? new Date(list.created_at).toLocaleDateString() : ''}
              </span>
            </div>

            {list.tags && list.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {list.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
                {list.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    +{list.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'About' },
    { id: 'lists', label: 'Lists', icon: ListIcon },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'friends', label: 'Friends', icon: UserCheck },
  ];

  // Filter tabs based on visibility settings
  const canViewMedia = isViewingOwnProfile || (!!displayProfile?.is_public && !!displayProfile?.show_media);
  const visibleTabs = (isViewingOwnProfile || (displayProfile?.is_public ?? true))
    ? tabs.filter(t => (t.id === 'favorites' || t.id === 'top_rated' ? canViewMedia : true))
    : tabs
        .filter(t => t.id !== 'friends')
        .filter(t => (t.id === 'favorites' || t.id === 'top_rated' ? canViewMedia : true));

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
                    <a href={buildUrl('website', social.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:underline">
                      <Globe className="w-4 h-4" /> Website
                    </a>
                  )}
                  {social.twitter && (
                    <a href={buildUrl('twitter', social.twitter)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:underline">
                      <Twitter className="w-4 h-4" /> Twitter
                    </a>
                  )}
                  {social.instagram && (
                    <a href={buildUrl('instagram', social.instagram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:underline">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {social.github && (
                    <a href={buildUrl('github', social.github)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:underline">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {social.telegram && (
                    <a href={buildUrl('telegram', social.telegram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 hover:underline">
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

            {isViewingOwnProfile && (
              <div className="pt-2">
                <RecommendedUsers currentUserId={user?.id} />
              </div>
            )}
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

      case 'top_rated':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Rated</h3>
            <TopRatedSection userId={displayProfile?.id || user?.id} canView={canViewMedia} />
          </div>
        );

      case 'lists':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lists</h3>
            <ListsSection userId={displayProfile?.id || user?.id} canView={canViewMedia} />
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Favorite Movies & Series</h3>
            <FavoritesGrid userId={displayProfile?.id || user?.id} canView={canViewMedia} />
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
                  ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-200'
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
