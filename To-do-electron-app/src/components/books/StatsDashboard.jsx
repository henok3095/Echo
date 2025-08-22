import React, { useEffect, useMemo, useState } from 'react';
import { useReadingStore } from '../../store/reading.jsx';
import { useMediaStore } from '../../store/index.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ReadingStreakHeatmap from './ReadingStreakHeatmap.jsx';
import { motion } from 'framer-motion';
import { Clock, Star, Flame, BookOpen, TrendingUp, Award } from 'lucide-react';
import Card from '../Card';
import BookRecommendations from './BookRecommendations.jsx';
import ReadingProgress from './ReadingProgress.jsx';
import ReadingActivity from './ReadingActivity.jsx';

const NEON = ['#22d3ee', '#6366f1', '#a78bfa'];

// Tabs Container Component
function TabsContainer() {
  const [activeTab, setActiveTab] = React.useState('recommendations');
  
  const tabs = [
    { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
    { id: 'progress', label: 'Reading Progress', icon: BookOpen },
    { id: 'activity', label: 'Activity', icon: Award }
  ];
  
  return (
    <Card className="p-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'recommendations' && <BookRecommendations />}
        {activeTab === 'progress' && <ReadingProgress />}
        {activeTab === 'activity' && <ReadingActivity />}
      </div>
    </Card>
  );
}

export default function StatsDashboard() {
  const { sessions, fetchSessions } = useReadingStore();
  const { mediaEntries } = useMediaStore();

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Prepare weekly minutes (sum by week label)
  const weekly = useMemo(() => {
    const byWeek = new Map();
    (sessions || []).forEach(s => {
      const d = new Date(s.date);
      const year = d.getFullYear();
      const oneJan = new Date(d.getFullYear(),0,1);
      const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay()+1)/7);
      const key = `${year}-W${week}`;
      byWeek.set(key, (byWeek.get(key) || 0) + (s.minutes || 0));
    });
    return Array.from(byWeek.entries()).slice(-8).map(([name, minutes]) => ({ name, minutes }));
  }, [sessions]);

  // Enhanced stats calculations
  const stats = useMemo(() => {
    const books = (mediaEntries || []).filter(e => e.type === 'book');
    const booksWithRating = books.filter(b => b.rating != null);
    const readingBooks = books.filter(b => b.status === 'reading');
    
    // Calculate reading streak (simplified - based on consecutive days with books marked as read)
    const readBooks = books.filter(b => b.status === 'read').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    let currentStreak = 0;
    if (readBooks.length > 0) {
      const today = new Date();
      const lastReadDate = new Date(readBooks[0].created_at);
      const daysSinceLastRead = Math.floor((today - lastReadDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastRead <= 7) currentStreak = readBooks.length; // Simple streak based on books read
    }
    
    return {
      avgRating: booksWithRating.length > 0 
        ? +(booksWithRating.reduce((a, b) => a + (b.rating || 0), 0) / booksWithRating.length).toFixed(1)
        : 0,
      readingStreak: Math.max(0, currentStreak),
      booksThisMonth: books.filter(b => {
        const bookDate = new Date(b.created_at);
        const now = new Date();
        return bookDate.getMonth() === now.getMonth() && bookDate.getFullYear() === now.getFullYear();
      }).length,
      currentlyReading: readingBooks.length
    };
  }, [mediaEntries]);

  // Longest book placeholder: based on available pages field if present
  const longestBook = useMemo(() => {
    const books = (mediaEntries || []).filter(e => e.type === 'book');
    const withPages = books.map(b => ({ ...b, pages: b.pages || b.page_count || null }));
    const best = withPages.reduce((acc, b) => (b.pages && (!acc || b.pages > acc.pages)) ? b : acc, null);
    return best;
  }, [mediaEntries]);

  // Remove unused donut calculation

  return (
    <div className="space-y-6">
      {/* Beautiful Mini Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Currently Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 border-cyan-200/50 dark:border-cyan-800/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{stats.currentlyReading}</p>
                <p className="text-sm text-cyan-600 dark:text-cyan-400">Currently Reading</p>
              </div>
            </div>
            <div className="h-16 flex items-center justify-center">
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(stats.currentlyReading, 5) }, (_, i) => (
                  <div key={i} className="w-3 h-4 bg-cyan-500 rounded-sm animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                ))}
                {stats.currentlyReading > 5 && (
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 ml-2">+{stats.currentlyReading - 5}</span>
                )}
              </div>
            </div>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 text-center">Books in progress</p>
          </Card>
        </motion.div>

        {/* Average Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-800/10 border-yellow-200/50 dark:border-yellow-800/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.avgRating}/10</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Avg Rating</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-16">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(stats.avgRating/2) ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
              Based on {(mediaEntries || []).filter(e => e.type === 'book' && e.rating != null).length} rated books
            </p>
          </Card>
        </motion.div>

        {/* Reading Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-100/50 dark:from-red-900/20 dark:to-pink-800/10 border-red-200/50 dark:border-red-800/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.readingStreak}</p>
                <p className="text-sm text-red-600 dark:text-red-400">Day Streak</p>
              </div>
            </div>
            <div className="h-16 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.readingStreak > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full ${stats.readingStreak > 3 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                <div className={`w-2 h-2 rounded-full ${stats.readingStreak > 7 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                <div className={`w-3 h-3 rounded-full ${stats.readingStreak > 14 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              </div>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
              {stats.readingStreak > 0 ? 'Keep it up!' : 'Start your streak today'}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Tabbed Content for Advanced Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <TabsContainer />
      </motion.div>
    </div>
  );
}
