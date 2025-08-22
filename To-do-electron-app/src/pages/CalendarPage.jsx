import React, { useState, useEffect } from 'react';
import { useTaskStore, useJournalStore, useMediaStore } from '../store/index.jsx';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, BookOpen, Film } from 'lucide-react';

export default function CalendarPage() {
  const { tasks } = useTaskStore();
  const { journalEntries } = useJournalStore();
  const { mediaEntries } = useMediaStore();
  
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
    
    const dateStr = date.toISOString().split('T')[0];
    const events = [];
    
    // Add tasks
    const dayTasks = tasks.filter(task => 
      task.due_date === dateStr
    );
    events.push(...dayTasks.map(task => ({
      type: 'task',
      title: task.title,
      status: task.status,
      priority: task.priority
    })));
    
    // Add journal entries
    const dayJournal = journalEntries.filter(entry => 
      entry.date === dateStr
    );
    events.push(...dayJournal.map(entry => ({
      type: 'journal',
      title: entry.title,
      mood: entry.mood
    })));
    
    // Add media entries
    const dayMedia = mediaEntries.filter(media => 
      new Date(media.created_at).toISOString().split('T')[0] === dateStr
    );
    events.push(...dayMedia.map(media => ({
      type: 'media',
      title: media.title,
      mediaType: media.type
    })));
    
    return events;
  };

  const getEventIcon = (event) => {
    switch (event.type) {
      case 'task':
        return <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />;
      case 'journal':
        return <BookOpen className="w-3 h-3 text-green-600 dark:text-green-400" />;
      case 'media':
        return <Film className="w-3 h-3 text-purple-600 dark:text-purple-400" />;
      default:
        return null;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">View your tasks, journal entries, and media logs</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const events = getEventsForDate(date);
            const dayEvents = events.slice(0, 2); // Show max 2 events per day
            
            return (
              <div
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors ${
                  !date ? 'bg-gray-50 dark:bg-gray-900' :
                  isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' :
                  isSelected(date) ? 'bg-gray-100 dark:bg-gray-800' :
                  'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(date) ? 'text-blue-600 dark:text-blue-400' :
                      isSelected(date) ? 'text-gray-900 dark:text-white' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className="flex items-center gap-1 text-xs p-1 rounded bg-gray-100 dark:bg-gray-800"
                        >
                          {getEventIcon(event)}
                          <span className="truncate text-gray-600 dark:text-gray-400">
                            {event.title}
                          </span>
                        </div>
                      ))}
                      
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="space-y-4">
            {getEventsForDate(selectedDate).map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getEventIcon(event)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {event.type}
                    {event.status && ` • ${event.status}`}
                    {event.priority && ` • ${event.priority} priority`}
                    {event.mood && ` • ${event.mood} mood`}
                  </div>
                </div>
              </div>
            ))}
            
            {getEventsForDate(selectedDate).length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No events for this date
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
