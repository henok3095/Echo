import React, { useState, useEffect } from "react";
import { Plus, Music } from "lucide-react";
import { useMediaStore, useAuthStore } from '../store/index.jsx';
import toast from 'react-hot-toast';
import AddMusicModal from "../components/music/AddMusicModal";
import LocalMusicLibrary from "../components/music/LocalMusicLibrary";

export default function LocalMusicLibraryPage() {
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

  // Filter only music/album entries
  const musicEntries = mediaEntries.filter(entry => 
    entry.type === 'album' || entry.type === 'music'
  );

  useEffect(() => {
    fetchMediaEntries();
  }, [fetchMediaEntries]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-lg">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              My Music Library
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Manually track and organize your personal music collection
          </p>
        </div>

        {/* Add Music Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-lg font-medium"
          >
            <Plus className="w-6 h-6" />
            <span>Add Music to Library</span>
          </button>
        </div>

        {/* Music Library */}
        <LocalMusicLibrary 
          musicEntries={musicEntries}
          isVisible={true} // Always visible on this dedicated page
          onToggle={() => {}} // No toggle needed on dedicated page
        />

        {/* Quick Stats */}
        {musicEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {musicEntries.length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                Total Albums/Songs
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {musicEntries.filter(entry => entry.status === 'listened').length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Listened
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {musicEntries.filter(entry => entry.status === 'listening').length}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                Currently Listening
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {musicEntries.filter(entry => entry.status === 'favorite').length}
              </div>
              <div className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                Favorites
              </div>
            </div>
          </div>
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
