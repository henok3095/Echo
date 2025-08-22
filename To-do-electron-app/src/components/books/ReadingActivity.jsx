import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, BookOpen, Clock, TrendingUp, Filter } from 'lucide-react';
import { db } from '../../api/supabase.js';
import { useAuthStore, useMediaStore } from '../../store/index.jsx';
import Card from '../Card';

export default function ReadingActivity() {
  const { user } = useAuthStore();
  const { mediaEntries } = useMediaStore();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, this_week, this_month

  useEffect(() => {
    if (user) {
      fetchReadingActivity();
    }
  }, [user, filter]);

  const fetchReadingActivity = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getReadingActivity(user.id);
      if (error) throw error;
      
      let filteredData = data || [];
      const now = new Date();
      
      if (filter === 'this_week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(activity => 
          new Date(activity.activity_date) >= weekAgo
        );
      } else if (filter === 'this_month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredData = filteredData.filter(activity => 
          new Date(activity.activity_date) >= monthAgo
        );
      }
      
      setActivities(filteredData);
    } catch (error) {
      console.error('Error fetching reading activity:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'started': return '🚀';
      case 'progress_update': return '📖';
      case 'finished': return '🎉';
      case 'paused': return '⏸️';
      case 'resumed': return '▶️';
      default: return '📚';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'started': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'progress_update': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'finished': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'resumed': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatActivityText = (activity) => {
    const bookTitle = activity.book?.title || 'Unknown Book';
    switch (activity.activity_type) {
      case 'started':
        return `Started reading "${bookTitle}"`;
      case 'progress_update':
        return `Read ${activity.pages_read || 0} pages of "${bookTitle}"${activity.minutes_read ? ` (${activity.minutes_read} min)` : ''}`;
      case 'finished':
        return `Finished reading "${bookTitle}"`;
      case 'paused':
        return `Paused reading "${bookTitle}"`;
      case 'resumed':
        return `Resumed reading "${bookTitle}"`;
      default:
        return `Activity on "${bookTitle}"`;
    }
  };

  const getWeeklyStats = () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActivities = activities.filter(activity => 
      new Date(activity.activity_date) >= weekAgo
    );
    
    const totalPages = weeklyActivities.reduce((sum, activity) => 
      sum + (activity.pages_read || 0), 0
    );
    
    const totalMinutes = weeklyActivities.reduce((sum, activity) => 
      sum + (activity.minutes_read || 0), 0
    );
    
    const uniqueDays = new Set(weeklyActivities.map(activity => 
      activity.activity_date
    )).size;
    
    return { totalPages, totalMinutes, uniqueDays, totalActivities: weeklyActivities.length };
  };

  const stats = getWeeklyStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill().map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array(5).fill().map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reading Activity</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your daily reading habits and progress</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'this_month', label: 'This Month' },
            { key: 'this_week', label: 'This Week' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Pages Read</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalPages}</p>
            </div>
            <BookOpen className="w-6 h-6 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Minutes</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalMinutes}</p>
            </div>
            <Clock className="w-6 h-6 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Active Days</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.uniqueDays}</p>
            </div>
            <Calendar className="w-6 h-6 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Activities</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.totalActivities}</p>
            </div>
            <Activity className="w-6 h-6 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activity yet</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Start reading and tracking your progress to see your activity here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.activity_type)}`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatActivityText(activity)}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(activity.activity_date).toLocaleDateString()}
                    </span>
                    {activity.minutes_read > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.minutes_read} min
                      </span>
                    )}
                    {activity.pages_read > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {activity.pages_read} pages
                      </span>
                    )}
                  </div>
                  {activity.notes && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                      "{activity.notes}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
