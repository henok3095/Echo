import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

export default function EditProfileModal({
  editProfile,
  setEditProfile,
  onCancel,
  onSave,
  handleAvatarUpload,
  isSaving = false,
}) {
  const panelRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => {
    // focus initial button
    saveRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }
      if (e.key === 'Tab') {
        const container = panelRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      <div className="relative z-10 w-[92vw] max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden" ref={panelRef}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit profile</h3>
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar uploader */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {editProfile?.avatar_url ? (
                    <img src={editProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 border border-gray-300 dark:border-gray-700 shadow flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-gray-800">
                  <Camera className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <span className="sr-only">Change avatar</span>
                </label>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={editProfile.username}
              onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent"
              placeholder="Username"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              value={editProfile.bio}
              onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
              rows={4}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent"
              placeholder="Tell us about yourself…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-2 text-sm border border-gray-900 dark:border-gray-100 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 disabled:opacity-60"
              ref={saveRef}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
