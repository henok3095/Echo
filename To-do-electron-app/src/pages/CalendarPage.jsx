import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore, useJournalStore, useMediaStore } from '../store/index.jsx';
import { useReadingStore } from '../store/reading.jsx';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, BookOpen, Film, Clock, Activity } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

export default function CalendarPage() {
  const { tasks } = useTaskStore();
  const { journalEntries } = useJournalStore();
  const { mediaEntries } = useMediaStore();
  const { sessions } = useReadingStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get current month's calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty days for padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const events = [];
    
    // Add tasks
    const dayTasks = tasks.filter(task => 
      task.due_date === dateStr
    );
    events.push(...dayTasks.map(task => ({
      type: 'task',
      title: task.title,
      status: task.status,
      priority: task.priority,
      color: task.status === 'completed' ? 'green' : task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'blue'
    })));
    
    // Add journal entries
    const dayJournal = journalEntries.filter(entry => 
      entry.date === dateStr
    );
    events.push(...dayJournal.map(entry => ({
      type: 'journal',
      title: entry.title,
      mood: entry.mood,
      color: 'purple'
    })));
    
    // Add media entries
    const dayMedia = mediaEntries.filter(media => {
      if (!media.created_at) return false;
      const mediaDate = new Date(media.created_at);
      const mediaYear = mediaDate.getFullYear();
      const mediaMonth = String(mediaDate.getMonth() + 1).padStart(2, '0');
      const mediaDay = String(mediaDate.getDate()).padStart(2, '0');
      const mediaDateStr = `${mediaYear}-${mediaMonth}-${mediaDay}`;
      return mediaDateStr === dateStr;
    });
    events.push(...dayMedia.map(media => ({
      type: 'media',
      title: media.title,
      mediaType: media.type,
      color: 'indigo'
    })));
    
    // Add reading sessions
    const daySessions = sessions.filter(session => 
      session.date === dateStr
    );
    events.push(...daySessions.map(session => ({
      type: 'reading',
      title: `${session.pages || 0} pages • ${session.minutes || 0} min`,
      bookTitle: session.book_title,
      color: 'emerald'
    })));
    
    return events;
  };

  const getEventIcon = (event) => {
    const iconClass = "w-3 h-3";
    switch (event.type) {
      case 'task':
        return <CheckCircle className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
      case 'journal':
        return <BookOpen className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
      case 'media':
        return <Film className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
      case 'reading':
        return <Clock className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
      default:
        return <Activity className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date && date.toDateString() === selectedDate.toDateString();
  };

  const calendarDays = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];


  // Get activity intensity for heatmap
  const getActivityIntensity = (date) => {
    if (!date) return 0;
    const events = getEventsForDate(date);
    if (events.length === 0) return 0;
    if (events.length <= 2) return 1;
    if (events.length <= 4) return 2;
    return 3;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="relative z-10">
          <PageHeader
            title="Calendar"
            subtitle="Track your productivity journey"
            Icon={Calendar}
            iconGradient="from-blue-500 to-purple-600"
            titleGradient="from-blue-600 via-purple-600 to-indigo-600"
            centered={true}
          />
        </div>


        {/* Calendar Navigation & Controls */}
        <Card className="p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </Card>

        {/* Calendar Grid */}
        <Card className="overflow-hidden relative z-10 shadow-xl">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const events = getEventsForDate(date);
              const dayEvents = events.slice(0, 3);
              const intensity = getActivityIntensity(date);
              
              return (
                <div
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`min-h-[140px] p-3 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:z-10 relative group ${
                    !date ? 'bg-gray-50 dark:bg-gray-900' :
                    isToday(date) ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 ring-2 ring-blue-400 dark:ring-blue-500' :
                    isSelected(date) ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 ring-2 ring-purple-400 dark:ring-purple-500' :
                    intensity === 3 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10' :
                    intensity === 2 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10' :
                    intensity === 1 ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10' :
                    'bg-white dark:bg-gray-900 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700'
                  } last:border-r-0`}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-lg font-bold transition-colors ${
                          isToday(date) ? 'text-blue-700 dark:text-blue-300' :
                          isSelected(date) ? 'text-purple-700 dark:text-purple-300' :
                          'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}>
                          {date.getDate()}
                        </div>
                        {intensity > 0 && (
                          <div className={`w-2 h-2 rounded-full ${
                            intensity === 3 ? 'bg-green-500' :
                            intensity === 2 ? 'bg-yellow-500' :
                            'bg-orange-500'
                          }`} />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="flex items-center gap-2 text-xs p-2 rounded-lg transition-all duration-200 hover:scale-105 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          >
                            {getEventIcon(event)}
                            <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                              {event.type === 'reading' ? event.bookTitle : event.title}
                            </span>
                          </div>
                        ))}
                        
                        {events.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium bg-gray-100 dark:bg-gray-800 rounded-full py-1">
                            +{events.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card className="p-6 relative z-10 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              {isToday(selectedDate) && (
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  Today
                </span>
              )}
            </div>
            
            <div className="grid gap-4">
              {getEventsForDate(selectedDate).map((event, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {getEventIcon(event)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {event.type === 'reading' ? event.bookTitle : event.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {event.type}
                      {event.status && ` • ${event.status}`}
                      {event.priority && ` • ${event.priority} priority`}
                      {event.mood && ` • ${event.mood} mood`}
                      {event.type === 'reading' && ` • ${event.title}`}
                    </div>
                  </div>
                </div>
              ))}
              
              {getEventsForDate(selectedDate).length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No events for this date</p>
                  <p className="text-sm">Your day is free!</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
