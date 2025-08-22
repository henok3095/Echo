import React, { useState, useEffect } from "react";
import { useAuthStore } from '../store/index.jsx';
import toast from 'react-hot-toast';
import { fetchRecentTracks, fetchTopArtists, fetchTopAlbums, fetchTotalListeningMinutes, fetchNowPlaying } from "../api/lastfm";
import LastfmStats from "../components/music/LastfmStats";
import LastfmOnboarding from "../components/music/LastfmOnboarding";

export default function LastfmPage() {
  const { user } = useAuthStore();
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [listeningMinutes, setListeningMinutes] = useState(0);
  const [lastfmProfile, setLastfmProfile] = useState(null);
  const [nowPlaying, setNowPlaying] = useState({ isPlaying: false, track: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load Last.fm username from user profile
    if (user?.user_metadata?.lastfm_username) {
      setLastfmUsername(user.user_metadata.lastfm_username);
    }
  }, [user]);

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
        setListeningMinutes(minutes);
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
      setListeningMinutes(minutes);
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
    // TODO: Save to user profile in database
    toast.success('Last.fm connected successfully!');
  };

  const handleSkipLastfm = () => {
    // User chose to skip Last.fm setup - redirect to local music library
    window.location.href = '/music-library';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl shadow-lg">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Last.fm Music Stats
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Connect your Last.fm account to track your listening habits and discover your music patterns
          </p>
        </div>

        {/* Conditional Content: Last.fm Setup or Stats */}
        {!lastfmUsername ? (
          <LastfmOnboarding 
            onSetup={handleLastfmSetup}
            onSkip={handleSkipLastfm}
          />
        ) : (
          <LastfmStats 
            lastfmProfile={lastfmProfile}
            listeningMinutes={listeningMinutes}
            topArtists={topArtists}
            topAlbums={topAlbums}
            recentTracks={recentTracks}
            nowPlaying={nowPlaying}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
