import React from 'react';
import { Music, Star, Calendar, CheckCircle, Play, Heart, Disc3, Plus } from 'lucide-react';
import Card from '../Card';

export default function LocalMusicLibrary({ musicEntries, isVisible, onToggle, onAdd }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'to_listen': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'listening': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'listened': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'favorite': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'to_listen': return <Music className="w-4 h-4" />;
      case 'listening': return <Play className="w-4 h-4" />;
      case 'listened': return <CheckCircle className="w-4 h-4" />;
      case 'favorite': return <Heart className="w-4 h-4" />;
      default: return <Disc3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Music className="w-6 h-6 text-pink-500" />
          Your Music Library
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
            ({musicEntries.length})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Music
          </button>
          <button
            onClick={onToggle}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {isVisible && (
        <div>
          {musicEntries.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No music in your library yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start building your music collection by adding albums and songs
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {musicEntries.map((music) => (
                <Card key={music.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {music.title}
                      </h3>
                      {music.artist && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          by {music.artist}
                        </p>
                      )}
                      {music.album && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                          Album: {music.album}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(music.status)}`}>
                      {getStatusIcon(music.status)}
                      {music.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {music.genre && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Genre:</span> {music.genre}
                      </p>
                    )}
                    {music.year && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {music.year}
                      </p>
                    )}
                    {music.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {music.rating}/10
                        </span>
                      </div>
                    )}
                    {music.review && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                        {music.review}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
