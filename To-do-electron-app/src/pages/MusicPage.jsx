import React, { useState, useEffect } from "react";
import { Music, Plus, RefreshCw } from "lucide-react";
import DailyTopTrackModal from "../components/music/DailyTopTrackModal";
import { useMediaStore, useAuthStore } from '../store/index.jsx';
import toast from 'react-hot-toast';
import LastfmStats from "../components/music/LastfmStats";
import LastfmOnboarding from "../components/music/LastfmOnboarding";
import AddMusicModal from "../components/music/AddMusicModal";
import LocalMusicLibrary from "../components/music/LocalMusicLibrary";
import { db } from "../api/supabase.js";
import MediaStreakTracker from "../components/MediaStreakTracker";
import HeroBackground from "../components/music/HeroBackground";
import NowPlayingCard from "../components/music/NowPlayingCard";
import VisualizerStrip from "../components/music/VisualizerStrip";
import SnapCarousel from "../components/music/SnapCarousel";
import HighlightCard from "../components/music/HighlightCard";
import { resolveAlbumImage, resolveTrackImage, resolveArtistImage } from "../utils/artwork";

export default function MusicPage() {
  const { user } = useAuthStore();
  const { mediaEntries, addMediaEntry, fetchMediaEntries } = useMediaStore();
  const [showAddModal, setShowAddModal] = useState(false);
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
  
  // Last.fm state - persist in localStorage
  const [lastfmUsername, setLastfmUsername] = useState(() => 
    localStorage.getItem('lastfm_username') || ""
  );
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [listeningStats, setListeningStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [lastfmProfile, setLastfmProfile] = useState(null);
  const [nowPlaying, setNowPlaying] = useState({ isPlaying: false, track: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLocalLibrary, setShowLocalLibrary] = useState(false);

  // Resolved cover art fallbacks (album/track)
  const [resolvedAlbumImages, setResolvedAlbumImages] = useState({});
  const [resolvedTrackImages, setResolvedTrackImages] = useState({});
  const [resolvedArtistImages, setResolvedArtistImages] = useState({});

  // Helper to pick the largest non-empty image URL from Last.fm image arrays
  const getImageUrl = (imageArr) => {
    if (!Array.isArray(imageArr)) return "";
    for (let i = imageArr.length - 1; i >= 0; i--) {
      const item = imageArr[i];
      const url = (item && (item['#text'] || item)) || "";
      if (url) return url;
    }
    return "";
  };

  // After top lists change, resolve missing covers via iTunes/Deezer
  useEffect(() => {
    // Albums fallback (only if Last.fm image missing)
    (async () => {
      if (!topAlbums || topAlbums.length === 0) return;
      const updates = {};
      for (const al of topAlbums) {
        const title = al?.name || al?.album;
        const artistName = al?.artist?.name || al?.artist;
        if (!title || !artistName) continue;
        const key = `${artistName}||${title}`.toLowerCase();
        const hasImage = !!getImageUrl(al?.image);
        if (!hasImage && !resolvedAlbumImages[key]) {
          const url = await resolveAlbumImage(artistName, title);
          if (url) updates[key] = url;
        }
      }
      if (Object.keys(updates).length) {
        setResolvedAlbumImages(prev => ({ ...prev, ...updates }));
      }
    })();

    // Tracks fallback
    (async () => {
      if (!topTracks || topTracks.length === 0) return;
      const updates = {};
      for (const t of topTracks) {
        const title = t?.name || t?.track;
        const artistName = t?.artist?.name || t?.artist?.['#text'] || t?.artist;
        if (!title || !artistName) continue;
        const key = `${artistName}||${title}`.toLowerCase();
        const hasImage = !!getImageUrl(t?.image);
        if (!hasImage && !resolvedTrackImages[key]) {
          const url = await resolveTrackImage(artistName, title);
          if (url) updates[key] = url;
        }
      }
      if (Object.keys(updates).length) {
        setResolvedTrackImages(prev => ({ ...prev, ...updates }));
      }
    })();

    // Artists fallback
    (async () => {
      if (!topArtists || topArtists.length === 0) return;
      const updates = {};
      for (const a of topArtists) {
        const name = a?.name;
        if (!name) continue;
        const key = name.toLowerCase();
        const hasImage = !!getImageUrl(a?.image);
        if (!hasImage && !resolvedArtistImages[key]) {
          const url = await resolveArtistImage(name);
          if (url) updates[key] = url;
        }
      }
      if (Object.keys(updates).length) {
        setResolvedArtistImages(prev => ({ ...prev, ...updates }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topAlbums, topTracks, topArtists]);

  // Daily Top Track Modal state
  const [showTopTrackModal, setShowTopTrackModal] = useState(false);
  const [topTrackNotified, setTopTrackNotified] = useState(() => {
    // Persist notification state for today only
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem('topTrackNotifiedDate') === today;
  });

  // Show notification at custom time (e.g., 9:00 AM)
  useEffect(() => {
    // Show modal if either topTracks or topArtists has data
    const hasData = (topTracks && topTracks.length > 0) || (topArtists && topArtists.length > 0);
    if (!topTrackNotified && hasData) {
      const now = new Date();
      const customHour = 9; // 9 AM
      const customMinute = 0;
      if (
        now.getHours() === customHour &&
        now.getMinutes() === customMinute &&
        !showTopTrackModal
      ) {
        setShowTopTrackModal(true);
      }
    }
  }, [topTrackNotified, topTracks, topArtists, showTopTrackModal]);

  // When modal is acknowledged, persist state
  const handleAcknowledgeTopTrack = () => {
    setShowTopTrackModal(false);
    setTopTrackNotified(true);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('topTrackNotifiedDate', today);
  };

  // Filter only music/album entries
  const musicEntries = mediaEntries.filter(entry => 
    entry.type === 'album' || entry.type === 'music'
  );

  useEffect(() => {
    fetchMediaEntries();
    // If user has Last.fm username, fetch their data
    if (lastfmUsername) {
      fetchLastfmData();
    }
  }, [fetchMediaEntries, lastfmUsername]);

  const fetchLastfmData = async () => {
    if (!lastfmUsername) return;
    
    try {
      setIsRefreshing(true);
      
      // Fetch user info
      const userResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json`
      );
      const userData = await userResponse.json();
      
      if (userData.user) {
        setLastfmProfile(userData.user);
      }

      // Fetch recent tracks
      const recentResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json&limit=10`
      );
      const recentData = await recentResponse.json();
      
      if (recentData.recenttracks?.track) {
        const tracks = Array.isArray(recentData.recenttracks.track) 
          ? recentData.recenttracks.track 
          : [recentData.recenttracks.track];
        setRecentTracks(tracks);
        
        // Check for now playing and post activity
        const nowPlayingTrack = tracks.find(track => track['@attr']?.nowplaying);
        setNowPlaying({
          isPlaying: !!nowPlayingTrack,
          track: nowPlayingTrack || null
        });
        try {
          if (nowPlayingTrack && user?.id) {
            await db.createActivity({
              user_id: user.id,
              type: 'now_playing',
              payload: {
                title: nowPlayingTrack.name,
                artist: nowPlayingTrack.artist?.['#text'] || nowPlayingTrack.artist,
                album: nowPlayingTrack.album?.['#text'] || nowPlayingTrack.album,
                url: nowPlayingTrack.url || null
              }
            });
          }
        } catch (e) {
          console.warn('Failed to create now playing activity:', e);
        }
      }

      // Fetch top artists
      const artistsResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json&period=1month&limit=10`
      );
      const artistsData = await artistsResponse.json();
      
      if (artistsData.topartists?.artist) {
        const artists = Array.isArray(artistsData.topartists.artist) 
          ? artistsData.topartists.artist 
          : [artistsData.topartists.artist];
        console.log('Top Artists Data:', artists);
        setTopArtists(artists);
      }

      // Fetch top albums
      const albumsResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json&period=1month&limit=10`
      );
      const albumsData = await albumsResponse.json();
      
      if (albumsData.topalbums?.album) {
        const albums = Array.isArray(albumsData.topalbums.album) 
          ? albumsData.topalbums.album 
          : [albumsData.topalbums.album];
        setTopAlbums(albums);
      }

      // Fetch top tracks
      const tracksResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json&period=1month&limit=10`
      );
      const tracksData = await tracksResponse.json();
      if (tracksData.toptracks?.track) {
        const tracks = Array.isArray(tracksData.toptracks.track)
          ? tracksData.toptracks.track
          : [tracksData.toptracks.track];
        setTopTracks(tracks);
      } else {
        setTopTracks([]);
      }

      // Calculate today's, this week's, and this month's listening stats
      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get recent tracks for today and this week
      const recentTracksResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json&limit=200`
      );
      const recentTracksData = await recentTracksResponse.json();
      
      let todayTracks = 0;
      let weekTracks = 0;
      let monthTracks = 0;
      
      if (recentTracksData.recenttracks?.track) {
        const tracks = Array.isArray(recentTracksData.recenttracks.track) 
          ? recentTracksData.recenttracks.track 
          : [recentTracksData.recenttracks.track];
        
        const now = new Date();
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        tracks.forEach(track => {
          if (track.date) {
            const trackDate = new Date(track.date['#text']);
            
            // Count tracks from today
            if (trackDate >= oneDayAgo) {
              todayTracks++;
            }
            
            // Count tracks from this week
            if (trackDate >= oneWeekAgo) {
              weekTracks++;
            }
            
            // Count tracks from this month (last 30 days)
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (trackDate >= monthAgo) {
              monthTracks++;
            }
          }
        });
      }
      
      setListeningStats({
        today: todayTracks,
        week: weekTracks,
        month: monthTracks
      });

      // Create a daily activity summarizing music listening once per day
      try {
        const todayKey = `music_stat_activity_${new Date().toISOString().split('T')[0]}`;
        const alreadyPosted = localStorage.getItem(todayKey) === '1';
        if (!alreadyPosted && user?.id) {
          await db.createActivity({
            user_id: user.id,
            type: 'music_stat',
            payload: {
              today: todayTracks,
              week: weekTracks,
              month: monthTracks
            }
          });
          localStorage.setItem(todayKey, '1');
        }
      } catch (e) {
        console.warn('Failed to create daily music activity:', e);
      }
      
    } catch (error) {
      console.error('Error fetching Last.fm data:', error);
      toast.error('Failed to fetch Last.fm data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLastfmSetup = async (username) => {
    if (!username.trim()) {
      toast.error('Please enter a valid Last.fm username');
      return;
    }

    try {
      // Test if user exists
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json`
      );
      const data = await response.json();
      
      if (data.error) {
        toast.error('Last.fm user not found. Please check the username.');
        return;
      }
      
      setLastfmUsername(username);
      localStorage.setItem('lastfm_username', username);
      toast.success(`Connected to Last.fm as ${username}!`);
      
    } catch (error) {
      console.error('Error connecting to Last.fm:', error);
      toast.error('Failed to connect to Last.fm');
    }
  };

  const handleLastfmLogout = () => {
    setLastfmUsername("");
    localStorage.removeItem('lastfm_username');
    setLastfmProfile(null);
    setRecentTracks([]);
    setTopArtists([]);
    setTopAlbums([]);
    setListeningStats({ today: 0, week: 0, month: 0 });
    setNowPlaying({ isPlaying: false, track: null });
    toast.success('Logged out from Last.fm');
  };

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
      await addMediaEntry(musicData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative mb-8 pt-2">
          <HeroBackground />
          <div className="relative z-10 flex flex-col items-center gap-5">
            <h1 className="text-5xl md:text-6xl font-extrabold title-gradient tracking-tight">
              Music
            </h1>
            <p className="text-base md:text-lg text-[color:var(--text-med)]">
              Track your listening, stats and library with style
            </p>
            <NowPlayingCard nowPlaying={nowPlaying} />
            <VisualizerStrip playing={nowPlaying?.isPlaying} />
          </div>
        </div>

        {/* Music Streak Tracker */}
        <div className="relative z-10 mb-4">
          <MediaStreakTracker mediaEntries={musicEntries} />
        </div>

        {/* Last.fm Section */}
        <div className="mb-12">
          {!lastfmUsername ? (
            <LastfmOnboarding 
              onSetup={handleLastfmSetup}
              onSkip={() => setShowLocalLibrary(true)}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Last.fm Music Stats
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={fetchLastfmData}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleLastfmLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowTopTrackModal(true)}
                    disabled={topTracks.length === 0}
                    className="p-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors disabled:opacity-50 shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                    title="Show Daily Top Track"
                    aria-label="Show Daily Top Track"
                  >
                    <Music className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <LastfmStats 
                lastfmProfile={lastfmProfile}
                listeningStats={listeningStats}
                topArtists={topArtists}
                topAlbums={topAlbums}
                topTracks={topTracks}
                recentTracks={recentTracks}
                nowPlaying={nowPlaying}
                isRefreshing={isRefreshing}
                onRefresh={fetchLastfmData}
              />

              {/* Highlights Carousels */}
              {(topArtists?.length || topAlbums?.length || topTracks?.length) ? (
                <div className="space-y-8">
                  {topArtists?.length > 0 && (
                    <SnapCarousel title="Top Artists">
                      {topArtists.map((a, idx) => {
                        const name = a?.name || "Unknown Artist";
                        const image = getImageUrl(a?.image) || resolvedArtistImages[name.toLowerCase()] || "";
                        const href = a?.url;
                        return (
                          <div key={`artist-${idx}`} className="snap-start">
                            <HighlightCard image={image} title={name} subtitle="Artist" playcount={a?.playcount} href={href} />
                          </div>
                        );
                      })}
                    </SnapCarousel>
                  )}

                  {topAlbums?.length > 0 && (
                    <SnapCarousel title="Top Albums">
                      {topAlbums.map((al, idx) => {
                        const artistName = al?.artist?.name || al?.artist || "";
                        const title = al?.name || al?.album || "Unknown Album";
                        const fallbackKey = `${artistName}||${title}`.toLowerCase();
                        const image = getImageUrl(al?.image) || resolvedAlbumImages[fallbackKey] || "";
                        const href = al?.url;
                        return (
                          <div key={`album-${idx}`} className="snap-start">
                            <HighlightCard image={image} title={title} subtitle={artistName} playcount={al?.playcount} href={href} delay={idx * 40} />
                          </div>
                        );
                      })}
                    </SnapCarousel>
                  )}

                  {topTracks?.length > 0 && (
                    <SnapCarousel title="Top Tracks">
                      {topTracks.map((t, idx) => {
                        const title = t?.name || t?.track || "Unknown Track";
                        const artistName = t?.artist?.name || t?.artist?.['#text'] || t?.artist || "";
                        const fallbackKey = `${artistName}||${title}`.toLowerCase();
                        const image = getImageUrl(t?.image) || resolvedTrackImages[fallbackKey] || "";
                        const href = t?.url;
                        return (
                          <div key={`track-${idx}`} className="snap-start">
                            <HighlightCard image={image} title={title} subtitle={artistName} playcount={t?.playcount} href={href} delay={idx * 40} />
                          </div>
                        );
                      })}
                    </SnapCarousel>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>


        {/* Local Music Library Section */}
        <div className="space-y-4">
          <div className="glass neon-edge p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[color:var(--text-hi)]">
                My Music Library
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:from-pink-700 hover:to-orange-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Music</span>
              </button>
            </div>
          </div>

          <LocalMusicLibrary 
            musicEntries={musicEntries}
            isVisible={true}
            onToggle={() => {}}
          />
        </div>
      </div>

      {/* Add Music Modal */}
      <AddMusicModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleAddMusic}
      />
      {/* Daily Top Track Modal */}
      <DailyTopTrackModal
        isOpen={showTopTrackModal}
        onClose={handleAcknowledgeTopTrack}
        topTrack={topTracks[0]}
        topArtist={topArtists[0]}
        topAlbum={topAlbums[0]}
        listeningStats={listeningStats}
        lastfmProfile={lastfmProfile}
        date={new Date().toLocaleDateString()}
      />
    </div>
  );
}
