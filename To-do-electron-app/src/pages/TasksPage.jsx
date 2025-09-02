import React, { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../store/index.jsx';
import { Plus, Lightbulb, CheckCircle, Clock, Flag, Trash2, Edit, LayoutGrid, List, Filter, Search, SortAsc, SortDesc, ChevronDown, Flame } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TaskStreakTracker from "../components/TaskStreakTracker";
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  High: 'text-red-600 dark:text-red-400',
  Medium: 'text-yellow-600 dark:text-yellow-400',
  Low: 'text-green-600 dark:text-green-400'
};

const STATUS_COLORS = {
  'Not Started': 'text-gray-600 dark:text-gray-400',
  'In Progress': 'text-blue-600 dark:text-blue-400',
  'Completed': 'text-green-600 dark:text-green-400'
};

export default function TasksPage() {
  const { tasks, fetchTasks, addTask, updateTask, deleteTask, isLoading } = useTaskStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'board'
  const [statusFilter, setStatusFilter] = useState('all'); // all | Not Started | In Progress | Completed
  const [priorityFilter, setPriorityFilter] = useState('all'); // all | High | Medium | Low
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('due'); // due | priority | title
  const [sortDir, setSortDir] = useState('asc');
  const [quickInput, setQuickInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Life',
    priority: 'Medium',
    status: 'Not Started',
    due_date: ''
  });
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load persisted UI prefs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tasksPagePrefs');
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.view) setView(prefs.view);
      if (prefs.filter) setFilter(prefs.filter);
      if (prefs.statusFilter) setStatusFilter(prefs.statusFilter);
      if (prefs.priorityFilter) setPriorityFilter(prefs.priorityFilter);
      if (typeof prefs.showCompleted === 'boolean') setShowCompleted(prefs.showCompleted);
      if (prefs.sortBy) setSortBy(prefs.sortBy);
      if (prefs.sortDir) setSortDir(prefs.sortDir);
      if (typeof prefs.searchTerm === 'string') setSearchTerm(prefs.searchTerm);
    } catch {}
  }, []);

  // Persist UI prefs
  useEffect(() => {
    const prefs = { view, filter, statusFilter, priorityFilter, showCompleted, sortBy, sortDir, searchTerm };
    try { localStorage.setItem('tasksPagePrefs', JSON.stringify(prefs)); } catch {}
  }, [view, filter, statusFilter, priorityFilter, showCompleted, sortBy, sortDir, searchTerm]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await addTask(newTask);
      setNewTask({
        title: '',
        description: '',
        category: 'Life',
        priority: 'Medium',
        status: 'Not Started',
        due_date: ''
      });
      setShowAddTask(false);
      toast.success('Task added successfully');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newIdea.title.trim()) {
      toast.error('Idea title is required');
      return;
    }

    try {
      await addTask({
        ...newIdea,
        category: 'Ideas',
        priority: 'Low',
        status: 'Not Started',
        tags: newIdea.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      setNewIdea({
        title: '',
        description: '',
        tags: ''
      });
      setShowAddIdea(false);
      toast.success('Idea added successfully');
    } catch (error) {
      toast.error('Failed to add idea');
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      await updateTask(id, updates);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  // Derived, filtered, and sorted tasks
  const categoryFiltered = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'ideas') return task.category === 'Ideas';
    return task.category === filter;
  });

  const furtherFiltered = categoryFiltered.filter(task => {
    if (!showCompleted && task.status === 'Completed') return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inTitle = task.title?.toLowerCase().includes(q);
      const inDesc = task.description?.toLowerCase().includes(q);
      const inTags = (task.tags || []).some(t => (t || '').toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inTags) return false;
    }
    return true;
  });

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

  const filteredTasks = [...furtherFiltered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'priority') {
      const pa = priorityOrder[a.priority] ?? 99;
      const pb = priorityOrder[b.priority] ?? 99;
      return (pa - pb) * dir;
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '') * dir;
    }
    // default: due
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return (da - db) * dir;
  });

  const statuses = ['Not Started', 'In Progress', 'Completed'];

  // Buckets for list view
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const today = new Date();
  const buckets = {
    Overdue: filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date(today.getFullYear(), today.getMonth(), today.getDate())),
    Today: filteredTasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), today)),
    Upcoming: filteredTasks.filter(t => t.due_date && new Date(t.due_date) > new Date(today.getFullYear(), today.getMonth(), today.getDate())),
    'No Due Date': filteredTasks.filter(t => !t.due_date),
  };

  const categories = ['Life', 'School', 'Work', 'Side Projects'];
  const priorities = ['High', 'Medium', 'Low'];

  // Calculate streak for tasks
  const calculateStreak = (tasks) => {
    // Get all completed task dates (YYYY-MM-DD)
    const completedDates = tasks
      .filter((t) => t.status === "Completed" && t.completed_at)
      .map((t) => new Date(t.completed_at).toISOString().slice(0, 10));
    if (completedDates.length === 0) return 0;
    // Make a set for fast lookup
    const dateSet = new Set(completedDates);
    // Start from today, count backwards
    let streak = 0;
    let current = new Date();
    for (;;) {
      const iso = current.toISOString().slice(0, 10);
      if (dateSet.has(iso)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };
  
  // Quick Add parser: title words + tokens: #tag, !high/!medium/!low, due:YYYY-MM-DD|today|tomorrow
  const handleQuickAdd = async () => {
    const text = quickInput.trim();
    if (!text) return;
    const tokens = text.split(/\s+/);
    let priority = null;
    let tags = [];
    let due_date = '';
    const titleTokens = [];
    const norm = (s) => s.toLowerCase();
    for (const tk of tokens) {
      if (/^!high$/i.test(tk)) { priority = 'High'; continue; }
      if (/^!medium$/i.test(tk)) { priority = 'Medium'; continue; }
      if (/^!low$/i.test(tk)) { priority = 'Low'; continue; }
      const mDue = tk.match(/^due:(.+)$/i);
      if (mDue) {
        const val = norm(mDue[1]);
        const today = new Date();
        if (val === 'today') {
          due_date = today.toISOString().slice(0,10);
        } else if (val === 'tomorrow') {
          const tm = new Date(today);
          tm.setDate(tm.getDate() + 1);
          due_date = tm.toISOString().slice(0,10);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          due_date = val;
        }
        continue;
      }
      if (/^#\w+/.test(tk)) { tags.push(tk.replace(/^#/, '')); continue; }
      titleTokens.push(tk);
    }
    const title = titleTokens.join(' ').trim();
    if (!title) { toast.error('Task title is required'); return; }
    const category = (filter !== 'all' && filter !== 'ideas') ? filter : 'Life';
    const payload = {
      title,
      description: '',
      category,
      priority: priority || 'Medium',
      status: 'Not Started',
      due_date,
      tags: tags.length ? tags : undefined
    };
    try {
      await addTask(payload);
      setQuickInput('');
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    }
  };

  return (
    <div className="relative min-h-screen p-0 md:p-6 space-y-6 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header standardized to Music style */}
      <div className="relative z-10 pt-8 pb-2 space-y-4">
        <PageHeader
          title="Tasks & Ideas"
          subtitle="Track your tasks and ideas"
          Icon={CheckCircle}
          iconGradient="from-pink-500 to-orange-600"
          titleGradient="from-pink-600 via-orange-600 to-red-600"
          centered={true}
        />
        <div className="w-full flex items-center gap-3 flex-wrap justify-start sm:justify-end">
          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${view==='list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <List className="w-4 h-4" /> List
              </button>
              <button onClick={() => setView('board')} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${view==='board' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <LayoutGrid className="w-4 h-4" /> Board
              </button>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <Flame className="w-4 h-4" />
                <span>{calculateStreak(tasks)}</span>
                <span className="hidden sm:inline"> day{tasks.length !== 1 ? 's' : ''}</span>
              </button>
              <div className="absolute z-20 hidden group-hover:block w-48 p-2 mt-1 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <TaskStreakTracker tasks={tasks} />
              </div>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              style={{ pointerEvents: showAddDropdown ? 'none' : 'auto' }}
            >
              <Plus className="w-4 h-4" />
              Add New
              <ChevronDown className={`w-4 h-4 transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showAddDropdown && (
              <div
                className="absolute right-0 top-full mt-6 pt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl pointer-events-auto"
                style={{ zIndex: 9999 }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddTask(true); setShowAddDropdown(false); }}
                  onMouseDown={(e) => { e.stopPropagation(); setShowAddTask(true); setShowAddDropdown(false); }}
                  onClick={(e) => { e.stopPropagation(); setShowAddTask(true); setShowAddDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-t-lg"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Add Task</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Create a new task with details</div>
                  </div>
                </button>
                <button
                  type="button"
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddIdea(true); setShowAddDropdown(false); }}
                  onMouseDown={(e) => { e.stopPropagation(); setShowAddIdea(true); setShowAddDropdown(false); }}
                  onClick={(e) => { e.stopPropagation(); setShowAddIdea(true); setShowAddDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-b-lg"
                >
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Add Idea</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Capture a quick idea or thought</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Simplified Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          All Tasks
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === category
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            }`}
          >
            {category}
          </button>
        ))}
        <button
          onClick={() => setFilter('ideas')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'ideas'
              ? 'bg-pink-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/30'
          }`}
        >
          💡 Ideas
        </button>
      </div>

      {/* Collapsible Advanced Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-3"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          <span className="text-xs">({filteredTasks.length} tasks)</span>
        </button>
        
        {showAdvancedFilters && (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e)=>setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                />
              </div>
              
              <select 
                value={statusFilter} 
                onChange={(e)=>setStatusFilter(e.target.value)} 
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              
              <select 
                value={priorityFilter} 
                onChange={(e)=>setPriorityFilter(e.target.value)} 
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e)=>setSortBy(e.target.value)} 
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
              >
                <option value="due">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={showCompleted} 
                  onChange={(e)=>setShowCompleted(e.target.checked)} 
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Show completed tasks</span>
              </label>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={()=>setSortDir(d=> d==='asc'?'desc':'asc')} 
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={`Sort ${sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortDir==='asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { 
                    setSearchTerm(''); 
                    setStatusFilter('all'); 
                    setPriorityFilter('all'); 
                    setShowCompleted(true); 
                    setSortBy('due'); 
                    setSortDir('asc'); 
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-16 h-16 text-blue-400 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">No tasks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-2">You're all caught up or haven't added any tasks yet!</p>
          <button
            onClick={() => setShowAddTask(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold text-lg"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <>
          {view === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statuses.map((col) => (
                <div key={col} className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide">{col}</h3>
                    <span className="text-xs text-gray-500">{filteredTasks.filter(t=>t.status===col).length}</span>
                  </div>
                  <div className="space-y-3">
                    {filteredTasks.filter(t=>t.status===col).map(task => {
                      // Vibrant gradient backgrounds and border colors
                      const gradientMap = {
                        High: 'from-pink-400/30 to-red-200/40 border-pink-400 dark:border-pink-600',
                        Medium: 'from-yellow-300/30 to-orange-200/40 border-yellow-400 dark:border-yellow-600',
                        Low: 'from-green-300/30 to-blue-200/40 border-green-400 dark:border-green-600'
                      };
                      const statusIcon = {
                        'Completed': <CheckCircle className="w-6 h-6 text-gray-400" />, 
                        'In Progress': <Clock className="w-6 h-6 text-gray-400" />, 
                        'Not Started': <Flag className="w-6 h-6 text-gray-400" />
                      };
                      return (
                        <div key={task.id} className="relative group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="absolute -top-4 -right-4 opacity-20">
                            {statusIcon[task.status]}
                          </div>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white pr-2 truncate">{task.title}</h4>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateTask(task.id, { status: task.status === 'Completed' ? 'Not Started' : 'Completed', completed_at: task.status === 'Completed' ? null : new Date().toISOString() })} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title={task.status === 'Completed' ? 'Mark as Not Started' : 'Mark as Completed'}>
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Delete Task">
                                <Trash2 className="w-5 h-5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          {task.description && (<p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">{task.description}</p>)}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium">
                              <Flag className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{task.priority}</span>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(buckets).map(([bucket, items]) => (
                items.length === 0 ? null : (
                  <div key={bucket}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${
                        bucket === 'Overdue' ? 'bg-red-500' :
                        bucket === 'Today' ? 'bg-orange-500' :
                        bucket === 'Upcoming' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}></div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{bucket}</h3>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map(task => (
                        <div
                          key={task.id}
                          className={`group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-all duration-200 ${
                            task.status === 'Completed' ? 'opacity-75' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleUpdateTask(task.id, { 
                                status: task.status === 'Completed' ? 'Not Started' : 'Completed', 
                                completed_at: task.status === 'Completed' ? null : new Date().toISOString() 
                              })}
                              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                task.status === 'Completed' 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                              }`}
                            >
                              {task.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                            </button>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className={`font-medium text-gray-900 dark:text-white ${
                                  task.status === 'Completed' ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                }`}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-1 ml-2">
                                  {/* Priority indicator */}
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.priority === 'High' ? 'bg-red-500' :
                                    task.priority === 'Medium' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}></div>
                                  
                                  {/* Delete button */}
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <span className="capitalize">{task.category}</span>
                                </div>
                                
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {task.tags.slice(0, 2).map((tag, index) => (
                                      <span
                                        key={index}
                                        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {task.tags.length > 2 && (
                                      <span className="text-gray-400">+{task.tags.length - 2}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </>
      )}


      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Idea Modal */}
      {showAddIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Idea</h2>
            <form onSubmit={handleAddIdea} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter idea title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your idea"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newIdea.tags}
                  onChange={(e) => setNewIdea({ ...newIdea, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., project, creative, business"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Idea
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddIdea(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 