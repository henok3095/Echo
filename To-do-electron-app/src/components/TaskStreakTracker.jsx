import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";

// Utility to calculate the streak
function calculateStreak(tasks) {
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
}

export default function TaskStreakTracker({ tasks }) {
  const streak = useMemo(() => calculateStreak(tasks || []), [tasks]);

  // Track previous value to animate on increase
  const prevStreakRef = useRef(streak);
  const [ping, setPing] = useState(false);

  useEffect(() => {
    const prev = prevStreakRef.current;
    if (streak > prev) {
      setPing(true);
      const t = setTimeout(() => setPing(false), 900);
      return () => clearTimeout(t);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  return (
    <div className="flex items-center justify-center my-2">
      <div
        className="relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-orange-300/50 dark:border-orange-500/30 bg-gradient-to-r from-orange-50/80 via-amber-50/80 to-pink-50/80 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-pink-900/20 shadow-sm backdrop-blur select-none"
        title={streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak` : 'No current streak'}
        aria-label="Task completion streak"
      >
        {/* Animated ping when streak increases */}
        {ping && (
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 rounded-full bg-orange-400/60 animate-ping" />
        )}
        <div className="relative flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-500 dark:text-orange-400 drop-shadow-[0_0_6px_rgba(255,159,28,0.5)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-extrabold tracking-tight ${streak > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-300'}`}>
            {streak}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {streak === 1 ? 'day' : 'days'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">streak</span>
        </div>
        {streak > 0 ? (
          <span className="ml-1 text-xs font-semibold text-orange-600/80 dark:text-orange-400/80">
            Keep it up!
          </span>
        ) : (
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            Complete a task today to start
          </span>
        )}
      </div>
    </div>
  );
}
