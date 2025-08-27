import React, { useEffect } from 'react';
import { Bell, UserPlus, Trash2, X } from 'lucide-react';

export default function NotificationsPopup({
  notifications = [],
  followingIds = new Set(),
  onFollowBack,
  onDismiss,
  onClearAll,
  onClose,
}) {
  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog">
      {/* Click-away overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute right-6 top-16 w-80 md:w-96 z-50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" /> Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3 flex items-start gap-3">
                  {n.type === 'follow' ? (
                    n?.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt={n.actor.username || 'avatar'} className="w-7 h-7 rounded-full object-cover mt-0.5" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1" />
                    )
                  ) : (
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 dark:text-gray-100">
                      {n.type === 'follow' && n.actor ? (
                        <span>
                          <a
                            href={`/profile/${encodeURIComponent(n.actor.username || n.actor.id)}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {n.actor.username || 'Someone'}
                          </a>
                          <span> started following you</span>
                        </span>
                      ) : (
                        n.message
                      )}
                    </div>
                    {(n.created_at || n.time) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {n.time || new Date(n.created_at).toLocaleString()}
                      </div>
                    )}
                    {n.type === 'follow' && n.actor && !followingIds.has?.(n.actor.id) && (
                      <div className="mt-2">
                        <button
                          onClick={() => onFollowBack?.(n.actor.id)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Follow back
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDismiss?.(n.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


