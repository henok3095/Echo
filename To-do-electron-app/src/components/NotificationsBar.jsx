import React from 'react';
import { Bell, X, UserPlus } from 'lucide-react';

export default function NotificationsBar({ notifications = [], onClearAll, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <div className="relative z-20 w-full border-b border-blue-200/50 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/50 dark:to-indigo-950/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Bell className="w-5 h-5" />
          <span className="text-sm font-semibold">Notifications</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{notifications.length}</span>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/70 border border-blue-200/60 dark:border-blue-900/50 shadow-sm"
              >
                {n.type === 'follow' ? (
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">
                  {n.message}
                </span>
                <button
                  className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onDismiss?.(n.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          className="text-xs text-blue-700 dark:text-blue-300 hover:underline"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}


