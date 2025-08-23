import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useJournalStore } from '../store/index.jsx';
import { Plus, Calendar, Smile, Frown, Meh, Tag, Pencil, Trash2, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-600 dark:text-green-400' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-600 dark:text-blue-400' }
];

export default function JournalPage() {
  const { journalEntries, fetchJournalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, isLoading } = useJournalStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'recent'
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'neutral',
    tags: ''
  });
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await addJournalEntry({
        ...newEntry,
        date: selectedDate,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      setNewEntry({
        title: '',
        content: '',
        mood: 'neutral',
        tags: ''
      });
      setShowAddModal(false);
      toast.success('Journal entry added successfully');
    } catch (error) {
      toast.error('Failed to add journal entry');
    }
  };

  const normalizeDateStr = (d) => {
    try {
      const dt = new Date(d);
      if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
    } catch {}
    return String(d).slice(0, 10);
  };

  const filteredEntries = journalEntries
    .map(e => ({ ...e, _dateStr: normalizeDateStr(e.date) }))
    .filter(entry => entry._dateStr === selectedDate);

  // Recent view: last 90 days, grouped by date, newest first
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const recentEntries = journalEntries
    .map(e => ({ ...e, _dateStr: normalizeDateStr(e.date) }))
    .filter(e => {
      const ed = new Date(e._dateStr);
      return !isNaN(ed) && ed >= cutoff;
    })
    .sort((a, b) => (a._dateStr < b._dateStr ? 1 : -1));
  const groupedRecent = recentEntries.reduce((acc, e) => {
    (acc[e._dateStr] = acc[e._dateStr] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <PageHeader
          title="Journal"
          subtitle="Write about your day and track your mood"
          Icon={PenTool}
          iconGradient="from-pink-500 to-orange-600"
          titleGradient="from-pink-600 via-orange-600 to-red-600"
          centered={true}
        />
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Entry</span>
          </button>
        </div>
      </div>

      {/* View Mode + Date Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'day' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'}`}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('recent')}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'recent' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'}`}
          >
            Recent
          </button>
        </div>

        {viewMode === 'day' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Journal Entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading entries...</div>
        </div>
      ) : viewMode === 'day' ? (
        filteredEntries.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60">
            <div className="text-gray-600 dark:text-gray-300 mb-4">No entries for this date</div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
            >
              <Plus className="w-4 h-4" /> Write your first entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => {
              const MoodIcon = MOOD_OPTIONS.find(m => m.value === entry.mood)?.icon || Meh;
              const moodColor = MOOD_OPTIONS.find(m => m.value === entry.mood)?.color || 'text-gray-500';
              
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/70 shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-1.5 bg-blue-300 dark:bg-blue-700" />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {entry.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MoodIcon className={`w-4 h-4 ${moodColor}`} />
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => {
                              setEditingEntry({
                                ...entry,
                                tagsText: Array.isArray(entry.tags) ? entry.tags.join(', ') : ''
                              });
                              setShowEditModal(true);
                            }}
                            title="Edit entry"
                          >
                            <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </button>
                          <button
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                        <div className="rounded-lg bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-7">
                          {entry.content}
                        </div>
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Recent view
        Object.keys(groupedRecent).length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60">
            <div className="text-gray-600 dark:text-gray-300 mb-4">No recent entries</div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
            >
              <Plus className="w-4 h-4" /> Write an entry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRecent).map(([dateStr, entries]) => (
              <div key={dateStr} className="space-y-3">
                <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-100 dark:border-gray-800">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {new Date(dateStr).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-4">
                  {entries.map(entry => {
                    const MoodIcon = MOOD_OPTIONS.find(m => m.value === entry.mood)?.icon || Meh;
                    const moodColor = MOOD_OPTIONS.find(m => m.value === entry.mood)?.color || 'text-gray-500';
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/70 shadow-sm overflow-hidden"
                      >
                        <div className="flex">
                          <div className="w-1.5 bg-blue-300 dark:bg-blue-700" />
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <MoodIcon className={`w-4 h-4 ${moodColor}`} />
                                  <span>{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setEditingEntry({
                                      ...entry,
                                      tagsText: Array.isArray(entry.tags) ? entry.tags.join(', ') : ''
                                    });
                                    setShowEditModal(true);
                                  }}
                                  title="Edit entry"
                                >
                                  <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    setShowDeleteConfirm(true);
                                  }}
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                              <div className="rounded-lg bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-7">
                                {entry.content}
                              </div>
                            </div>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {entry.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200/70 dark:border-gray-800/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">New Journal Entry</h2>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entry title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write about your day..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mood
                  </label>
                  <div className="flex gap-2">
                    {MOOD_OPTIONS.map(mood => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setNewEntry({ ...newEntry, mood: mood.value })}
                        className={`p-2 rounded-lg transition-colors ${
                          newEntry.mood === mood.value
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <mood.icon className={`w-5 h-5 ${mood.color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., work, family, health"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Journal Entry</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingEntry.title.trim() || !editingEntry.content.trim()) {
                  toast.error('Title and content are required');
                  return;
                }
                try {
                  const updates = {
                    title: editingEntry.title,
                    content: editingEntry.content,
                    mood: editingEntry.mood,
                    tags: (editingEntry.tagsText || '')
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                  };
                  await updateJournalEntry(editingEntry.id, updates);
                  toast.success('Entry updated');
                  setShowEditModal(false);
                  setEditingEntry(null);
                } catch (err) {
                  toast.error('Failed to update entry');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <textarea
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mood</label>
                  <div className="flex gap-2">
                    {MOOD_OPTIONS.map(mood => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setEditingEntry({ ...editingEntry, mood: mood.value })}
                        className={`p-2 rounded-lg transition-colors ${
                          editingEntry.mood === mood.value
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <mood.icon className={`w-5 h-5 ${mood.color}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingEntry.tagsText || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, tagsText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Save Changes</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingEntry(null); }} className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete entry?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={async () => {
                  try {
                    await deleteJournalEntry(editingEntry.id);
                    toast.success('Entry deleted');
                    setShowDeleteConfirm(false);
                    setEditingEntry(null);
                  } catch (e) {
                    toast.error('Failed to delete entry');
                  }
                }}
              >
                Delete
              </button>
              <button
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => { setShowDeleteConfirm(false); setEditingEntry(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
