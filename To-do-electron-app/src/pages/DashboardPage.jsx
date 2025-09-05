import React, { useState, useEffect } from "react";
import { formatRating } from '../utils/ratings.js';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Star, 
  TrendingUp, 
  Calendar, 
  Film, 
  BookOpen, 
  Target,
  Zap,
  Heart,
  ArrowRight,
  Sparkles,
  Activity,
  Sun,
  Moon,
  List
} from "lucide-react";
import { useTaskStore, useMediaStore, useJournalStore, useAuthStore } from '../store/index.jsx';
import Card from "../components/Card";

// Map safe Tailwind gradient classes instead of dynamic strings (prevents purging)
const greetingGradientClasses = {
  indigo: "from-indigo-400 to-indigo-600",
  amber: "from-amber-400 to-amber-600",
  orange: "from-orange-400 to-orange-600",
  purple: "from-purple-400 to-purple-600"
};

// Reusable stat card with decorative background and optional progress bar
const StatCard = ({
  title,
  value,
  subtitle,
  color = "blue",
  icon: Icon,
  progress // 0-100 optional
}) => {
  const colorMap = {
    blue: {
      bg: "from-blue-50 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-800/10",
      text: "text-blue-900 dark:text-blue-100",
      sub: "text-blue-600/70 dark:text-blue-400/70",
      ring: "ring-blue-200/60 dark:ring-blue-800/40",
      chip: "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-300",
      accent: "from-blue-400/30 to-indigo-500/30"
    },
    purple: {
      bg: "from-purple-50 to-purple-100/60 dark:from-purple-900/20 dark:to-purple-800/10",
      text: "text-purple-900 dark:text-purple-100",
      sub: "text-purple-600/70 dark:text-purple-400/70",
      ring: "ring-purple-200/60 dark:ring-purple-800/40",
      chip: "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300",
      accent: "from-purple-400/30 to-pink-500/30"
    },
    green: {
      bg: "from-green-50 to-green-100/60 dark:from-green-900/20 dark:to-green-800/10",
      text: "text-green-900 dark:text-green-100",
      sub: "text-green-600/70 dark:text-green-400/70",
      ring: "ring-green-200/60 dark:ring-green-800/40",
      chip: "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-300",
      accent: "from-green-400/30 to-teal-500/30"
    },
    orange: {
      bg: "from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-800/10",
      text: "text-orange-900 dark:text-orange-100",
      sub: "text-orange-600/70 dark:text-orange-400/70",
      ring: "ring-orange-200/60 dark:ring-orange-800/40",
      chip: "bg-orange-100 dark:bg-orange-800/40 text-orange-600 dark:text-orange-300",
      accent: "from-orange-400/30 to-amber-500/30"
    }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className={`relative overflow-hidden p-6 bg-gradient-to-br ${c.bg} border-0 ring-1 ${c.ring} hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]`}> 
      {/* Decorative gradient blobs */}
      <div className={`pointer-events-none absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br ${c.accent} rounded-full blur-2xl opacity-70`}></div>
      <div className={`pointer-events-none absolute -bottom-10 -left-10 w-28 h-28 bg-gradient-to-br ${c.accent} rounded-full blur-2xl opacity-60`}></div>

      <div className="flex items-center justify-between relative">
        <div>
          <p className={`${c.sub} text-sm font-medium mb-1`}>{title}</p>
          <p className={`text-3xl font-bold ${c.text}`}>
            <AnimatedCounter value={value} />
          </p>
          {subtitle && (
            <p className={`${c.sub} text-xs mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full ${c.chip}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      {typeof progress === 'number' && (
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-white/60 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${c.accent}`}
              style={{ width: `${Math.max(0, Math.min(100, Math.round(progress)))}%` }}
            />
          </div>
          <div className={`${c.sub} text-[11px] mt-1`}>{Math.round(progress)}% complete</div>
        </div>
      )}
    </Card>
  );
};

// Utility function to get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Working late?", icon: Moon, color: "indigo" };
  if (hour < 12) return { text: "Good morning", icon: Sun, color: "amber" };
  if (hour < 17) return { text: "Good afternoon", icon: Sun, color: "orange" };
  if (hour < 22) return { text: "Good evening", icon: Moon, color: "purple" };
  return { text: "Good night", icon: Moon, color: "indigo" };
};

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;
    
    const totalMilSecDur = parseInt(duration);
    const incrementTime = (totalMilSecDur / end) > 50 ? 50 : (totalMilSecDur / end);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(String(start));
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span>{count}</span>;
};

// Progress ring component
const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color = "blue" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const colorClasses = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    purple: "stroke-purple-500",
    orange: "stroke-orange-500"
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClasses[color]} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Quick action button component
const QuickActionButton = ({ icon: Icon, label, onClick, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 ring-1 ring-blue-200/60 dark:ring-blue-800/40",
    green: "bg-green-50/80 dark:bg-green-900/20 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 ring-1 ring-green-200/60 dark:ring-green-800/40",
    purple: "bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 ring-1 ring-purple-200/60 dark:ring-purple-800/40",
    orange: "bg-orange-50/80 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 ring-1 ring-orange-200/60 dark:ring-orange-800/40"
  };
  
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${colorClasses[color]} group relative overflow-hidden`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col items-center gap-2">
        <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
        <span className="text-xs font-medium">{label}</span>
      </div>
    </button>
  );
};

// Tiny badge component for list chips
const Badge = ({ children, color = "gray" }) => {
  const map = {
    gray: "bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/50",
    green: "bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-800/40",
    purple: "bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40",
    blue: "bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40",
    orange: "bg-orange-100/70 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40",
    yellow: "bg-yellow-100/70 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/40"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${map[color] || map.gray}`}>{children}</span>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { mediaEntries, lists } = useMediaStore();
  const { journalEntries } = useJournalStore();
  
  const greeting = getTimeBasedGreeting();
  const GreetingIcon = greeting.icon;
  
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const todayTasks = tasks.filter(task => {
    const today = new Date().toDateString();
    return task.due_date && new Date(task.due_date).toDateString() === today;
  }).length;
  const todayPendingTasks = tasks
    .filter(task => {
      const today = new Date().toDateString();
      const isToday = task.due_date && new Date(task.due_date).toDateString() === today;
      const isDone = (task.status || '').toLowerCase() === 'completed' || (task.status || '').toLowerCase() === 'done';
      return isToday && !isDone;
    })
    .sort((a, b) => {
      // Prioritize by priority (High > Medium > Low), then by due time if present
      const order = { High: 0, Medium: 1, Low: 2 };
      const pa = order[a.priority] ?? 3;
      const pb = order[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      const ta = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const tb = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ta - tb;
    })
    .slice(0, 5);
  
  const totalMedia = mediaEntries.length;
  const watchedMedia = mediaEntries.filter(media => media.status === 'watched' || media.status === 'completed').length;
  const avgRating = mediaEntries.length > 0 
    ? mediaEntries.filter(m => m.rating).reduce((acc, m) => acc + m.rating, 0) / mediaEntries.filter(m => m.rating).length
    : 0;
  
  const totalJournals = journalEntries.length;
  const thisWeekJournals = journalEntries.filter(entry => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(entry.date) >= weekAgo;
  }).length;
  
  // List stats
  const totalLists = lists.length;
  const publicLists = lists.filter(l => l.visibility === 'public').length;
  const totalListItems = lists.reduce((acc, list) => acc + (list.items?.length || 0), 0);
  
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const mediaCompletionRate = totalMedia > 0 ? (watchedMedia / totalMedia) * 100 : 0;
  
  // Recent activities
  const recentMedia = mediaEntries
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  
  const recentTasks = tasks
    .filter(task => task.status === 'Completed')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-8">
        {/* Gradient Banner Header */}
        <div className="relative">
          <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-gray-100/70 to-white/40 dark:from-gray-800/40 dark:to-gray-900/30 border border-white/60 dark:border-white/10 shadow-xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${greetingGradientClasses[greeting.color]} text-white shadow-lg`}>
                  <GreetingIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                    {greeting.text}, {user?.email?.split('@')[0] || 'there'}!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">{Math.round(taskCompletionRate)}% tasks complete</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Avg rating {formatRating(avgRating)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today Focus */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today Focus</h2>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/40">{todayPendingTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href="/tasks" className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Open Tasks</a>
              <a href="/calendar" className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Calendar</a>
            </div>
          </div>
          {todayPendingTasks.length > 0 ? (
            <ul className="space-y-2">
              {todayPendingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                      <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {task.priority && (
                          <span className="px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                            {task.priority}
                          </span>
                        )}
                        {task.category && (
                          <span className="px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                            {task.category}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a href="/tasks" className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap">Details</a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-60" />
              <p>No tasks due today. Plan something meaningful!</p>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Tasks" 
            value={totalTasks}
            subtitle={`${completedTasks} completed`}
            color="blue"
            icon={CheckCircle}
            progress={taskCompletionRate}
          />

          <StatCard 
            title="Media Tracked" 
            value={totalMedia}
            subtitle={`Avg rating: ${formatRating(avgRating)}`}
            color="purple"
            icon={Film}
            progress={mediaCompletionRate}
          />

          <StatCard 
            title="My Lists" 
            value={totalLists}
            subtitle={`${totalListItems} total items`}
            color="orange"
            icon={List}
          />

          <StatCard 
            title="Journal Entries" 
            value={totalJournals}
            subtitle={`${thisWeekJournals} this week`}
            color="green"
            icon={BookOpen}
          />

          <StatCard 
            title="Today's Focus" 
            value={todayTasks}
            subtitle={`tasks due today`}
            color="orange"
            icon={Target}
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              icon={Plus} 
              label="Add Task" 
              color="blue"
              onClick={() => window.location.href = '/tasks'}
            />
            <QuickActionButton 
              icon={Film} 
              label="Add Media" 
              color="purple"
              onClick={() => window.location.href = '/media'}
            />
            <QuickActionButton 
              icon={BookOpen} 
              label="Write Journal" 
              color="green"
              onClick={() => window.location.href = '/journal'}
            />
            <QuickActionButton 
              icon={List} 
              label="Create List" 
              color="orange"
              onClick={() => window.location.href = '/lists'}
            />
          </div>
        </Card>

        {/* Recent Activity & Upcoming */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Media */}
          <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Media</h2>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">{recentMedia.length}</span>
              </div>
              <a href="/media" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <span className="text-sm">View all</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="space-y-4">
              {recentMedia.length > 0 ? recentMedia.map((media, index) => (
                <div key={media.id} className="group flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-md relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-400 to-pink-500" />
                  {media.poster_path ? (() => {
                    const p = media.poster_path || '';
                    const isAbsolute = /^https?:\/\//.test(p) || p.startsWith('data:');
                    const isAlreadyTmdbFull = p.startsWith('/t/p/');
                    const src = isAbsolute
                      ? p
                      : isAlreadyTmdbFull
                        ? `https://image.tmdb.org${p}`
                        : `https://image.tmdb.org/t/p/w92${p}`;
                    return (
                      <img
                        src={src}
                        alt={media.title}
                        className="w-12 h-16 object-cover rounded-md shadow-sm"
                        loading="lazy"
                      />
                    );
                  })() : (
                    <div className="w-12 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md flex items-center justify-center">
                      <Film className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{media.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge color="purple">{media.type}</Badge>
                      <Badge color="blue">{media.status}</Badge>
                      {media.rating != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {formatRating(media.rating)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No media tracked yet</p>
                  <p className="text-sm">Start adding movies and shows!</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Tasks */}
          <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Completions</h2>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/40">{recentTasks.length}</span>
              </div>
              <a href="/tasks" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <span className="text-sm">View all</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="space-y-4">
              {recentTasks.length > 0 ? recentTasks.map((task, index) => (
                <div key={task.id} className="group flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-md relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-green-400 to-teal-500" />
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {task.category && <Badge color="blue">{task.category}</Badge>}
                      {task.priority && <Badge color={task.priority === 'High' ? 'orange' : task.priority === 'Medium' ? 'yellow' : 'gray'}>{task.priority}</Badge>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No completed tasks yet</p>
                  <p className="text-sm">Complete some tasks to see them here!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
