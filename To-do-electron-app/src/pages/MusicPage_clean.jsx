import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useMediaStore, useAuthStore } from '../store/index.jsx';
import toast from 'react-hot-toast';
import { fetchRecentTracks, fetchTopArtists, fetchTopAlbums, fetchTotalListeningMinutes, fetchNowPlaying } from "../api/lastfm";
import LastfmStats from "../components/music/LastfmStats";
import LastfmOnboarding from "../components/music/LastfmOnboarding";
import AddMusicModal from "../components/music/AddMusicModal";
import LocalMusicLibrary from "../components/music/LocalMusicLibrary";

export default function MusicPage() {
  const { user } = useAuthStore();
  const { mediaEntries, addMediaEntry, fetchMediaEntries } = useMediaStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('stats'); // 'stats' | 'library'
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
    year: "",
    genre: "",
    status: "to_listen",
    rating: 0,
    review: ""
  });
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [listeningStats, setListeningStats] = useState({ today: 0, week: 0, month: 0 });
  const [showLocalLibrary, setShowLocalLibrary] = useState(false);
  const [lastfmProfile, setLastfmProfile] = useState(null);
  const [nowPlaying, setNowPlaying] = useState({ isPlaying: false, track: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter only music/album entries
  const musicEntries = mediaEntries.filter(entry => 
    entry.type === 'album' || entry.type === 'music'
  );

  useEffect(() => {
    fetchMediaEntries();
    
    // Load Last.fm username from user profile
    if (user?.user_metadata?.lastfm_username) {
      setLastfmUsername(user.user_metadata.lastfm_username);
    }
  }, [fetchMediaEntries, user]);

  useEffect(() => {
    if (!lastfmUsername) return;
    
    // Initial data fetch with error handling
    const fetchData = async () => {
      try {
        const [tracks, artists, albums, minutes, playing] = await Promise.all([
          fetchRecentTracks(lastfmUsername, 10).catch(() => []),
          fetchTopArtists(lastfmUsername, "7day", 5).catch(() => []),
          fetchTopAlbums(lastfmUsername, "7day", 5).catch(() => []),
          fetchTotalListeningMinutes(lastfmUsername, "7day").catch(() => 0),
          fetchNowPlaying(lastfmUsername).catch(() => ({ isPlaying: false, track: null }))
        ]);
        
        setRecentTracks(tracks);
        setTopArtists(artists);
        setTopAlbums(albums);
        // We currently fetch only 7-day minutes; map to stats object with sane defaults
        setListeningStats({ today: 0, week: minutes || 0, month: 0 });
        setNowPlaying(playing);
      } catch (error) {
        console.error('Error fetching Last.fm data:', error);
      }
    };
    
    fetchData();
    
    // Fetch Last.fm profile info
    fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setLastfmProfile(data.user);
        } else {
          console.error('Invalid Last.fm username');
          toast.error('Invalid Last.fm username');
        }
      })
      .catch(error => {
        console.error('Error fetching Last.fm profile:', error);
        toast.error('Failed to fetch Last.fm profile');
      });
    
    // Set up interval to check for now playing updates every 30 seconds
    const nowPlayingInterval = setInterval(() => {
      fetchNowPlaying(lastfmUsername)
        .then(setNowPlaying)
        .catch(error => {
          console.error('Error fetching now playing:', error);
        });
    }, 30000);
    
    return () => clearInterval(nowPlayingInterval);
  }, [lastfmUsername]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMusic = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const musicData = {
      user_id: user.id,
      title: formData.title.trim(),
      type: 'album',
      status: formData.status,
      rating: formData.rating || null,
      review: formData.review.trim() || null,
      tags: formData.genre ? [formData.genre] : [],
      visibility: 'private',
      director: formData.artist || null,
      release_date: formData.year ? `${formData.year}-01-01` : null,
      overview: formData.album || null,
      popularity: null,
      tmdb_id: null
    };

    try {
      const result = await addMediaEntry(musicData);
      
      toast.success(`${formData.title} added successfully!`);
      setShowAddModal(false);
      setFormData({
        title: "",
        artist: "",
        album: "",
        year: "",
        genre: "",
        status: "to_listen",
        rating: 0,
        review: ""
      });
      await fetchMediaEntries();
    } catch (error) {
      console.error('Error adding music:', error);
      toast.error('Failed to add music: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRefresh = async () => {
    if (!lastfmUsername || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Refresh all Last.fm data
      const [tracks, artists, albums, minutes, profile, playing] = await Promise.all([
        fetchRecentTracks(lastfmUsername, 10),
        fetchTopArtists(lastfmUsername, "7day", 5),
        fetchTopAlbums(lastfmUsername, "7day", 5),
        fetchTotalListeningMinutes(lastfmUsername, "7day"),
        fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json`)
          .then(res => res.json())
          .then(data => data.user),
        fetchNowPlaying(lastfmUsername)
      ]);
      
      setRecentTracks(tracks);
      setTopArtists(artists);
      setTopAlbums(albums);
      setListeningStats({ today: 0, week: minutes || 0, month: 0 });
      setLastfmProfile(profile);
      setNowPlaying(playing);
      
      toast.success('Last.fm data refreshed!');
    } catch (error) {
      console.error('Error refreshing Last.fm data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLastfmSetup = (username) => {
    setLastfmUsername(username);
  };

  const handleSkipLastfm = () => {
    // User chose to skip Last.fm setup
    setShowLocalLibrary(true);
    setViewMode('library');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-orange-600 rounded-3xl shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Music Tracking
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Track your music listening habits and discover your musical journey
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-end mb-8">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              onClick={() => setViewMode('stats')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'stats' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Stats
            </button>
            <button
              onClick={() => { setViewMode('library'); setShowLocalLibrary(true); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'library' ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Library
            </button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'stats' ? (
          !lastfmUsername ? (
            <LastfmOnboarding 
              onSetup={handleLastfmSetup}
              onSkip={handleSkipLastfm}
            />
          ) : (
            <LastfmStats 
              lastfmProfile={lastfmProfile}
              listeningStats={listeningStats}
              topArtists={topArtists}
              topAlbums={topAlbums}
              recentTracks={recentTracks}
              nowPlaying={nowPlaying}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )
        ) : (
          <LocalMusicLibrary 
            musicEntries={musicEntries}
            isVisible={showLocalLibrary}
            onToggle={() => setShowLocalLibrary(!showLocalLibrary)}
            onAdd={() => setShowAddModal(true)}
          />
        )}
        
      </div>

      {/* Add Music Modal */}
      <AddMusicModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleAddMusic}
      />
    </div>
  );
}
