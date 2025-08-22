import React from 'react';
import { Activity, Film, CheckCircle, BookOpen, Star, Music } from 'lucide-react';

export default function VisibilitySettings({
  editProfile,
  handleVisibilityChange
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Visibility</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {editProfile.is_public
              ? 'Your profile is visible to everyone'
              : 'Your profile is private and only visible to you'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleVisibilityChange('is_public', !editProfile.is_public)}
          className={`${
            editProfile.is_public ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          role="switch"
          aria-checked={editProfile.is_public}
        >
          <span className="sr-only">Toggle public profile</span>
          <span
            aria-hidden="true"
            className={`${
              editProfile.is_public ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Visibility</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Choose which sections are visible on your profile
        </p>
        
        <div className="space-y-3">
          {[
            { id: 'show_activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
            { id: 'show_media', label: 'Media', icon: <Film className="w-4 h-4" /> },
            { id: 'show_tasks', label: 'Tasks', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'show_journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'show_memories', label: 'Memories', icon: <Star className="w-4 h-4" /> },
            { id: 'show_music', label: 'Music', icon: <Music className="w-4 h-4" /> },
          ].map((section) => (
            <div key={section.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {section.icon}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {section.label}
                </span>
              </div>
              {section.id === 'show_media' || section.id === 'show_music' ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Always visible when profile is public
                </span>
              ) : (
                <select
                  value={editProfile[section.id] ? 'visible' : 'hidden'}
                  onChange={(e) => handleVisibilityChange(section.id, e.target.value === 'visible')}
                  className="text-xs rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
