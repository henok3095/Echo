import React, { useState } from 'react';
import { Music, ExternalLink, User, X } from 'lucide-react';
import Card from '../Card';
import toast from 'react-hot-toast';

export default function LastfmOnboarding({ onSetup, onSkip }) {
  const [showSetup, setShowSetup] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  const handleSetup = async () => {
    if (!tempUsername.trim()) {
      toast.error('Please enter a Last.fm username');
      return;
    }

    try {
      // Verify the username exists
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${tempUsername}&api_key=fd99b428351a736183dcc173ac31cb1b&format=json`
      );
      const data = await response.json();
      
      if (data.error) {
        toast.error('Last.fm username not found');
        return;
      }

      onSetup(tempUsername);
      toast.success('Last.fm connected successfully!');
    } catch (error) {
      console.error('Error verifying Last.fm username:', error);
      toast.error('Failed to verify Last.fm username');
    }
  };

  if (showSetup) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Connect Last.fm
          </h3>
          <button
            onClick={() => setShowSetup(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last.fm Username
            </label>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter your Last.fm username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSetup()}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowSetup(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSetup}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 text-white text-center">
        <div className="py-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Connect Your Last.fm</h2>
          <p className="text-white/90 text-lg mb-6">
            Track your listening habits and discover your music stats
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowSetup(true)}
              className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Connect Last.fm Account
            </button>
            <a
              href="https://www.last.fm/join"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Create Last.fm Account
            </a>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Track Your Listening
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            See your recent tracks, top artists, and listening statistics
          </p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Discover Patterns
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your music taste and discover new favorites
          </p>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Share Your Taste
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with friends and share your music discoveries
          </p>
        </Card>
      </div>

      {/* Alternative Option */}
      <Card className="text-center bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Prefer Manual Tracking?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You can still use Echo to track your music library manually
        </p>
        <button
          onClick={onSkip}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Continue Without Last.fm
        </button>
      </Card>
    </div>
  );
}
