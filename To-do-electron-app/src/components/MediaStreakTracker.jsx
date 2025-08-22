import React, { useEffect, useMemo, useRef, useState } from "react";
import { Music, Flame } from "lucide-react";

// Calculate media streak: count consecutive days (today backwards)
// with at least one media marked as watched/listened.
function calculateMediaStreak(mediaEntries) {
  const dates = (mediaEntries || [])
    .filter((m) => (m.status || '').toLowerCase() === 'watched')
    .map((m) => {
      const iso = (m.updated_at || m.created_at || new Date().toISOString()).toString();
      return new Date(iso).toISOString().slice(0, 10);
    });
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  let cur = new Date();
  for (;;) {
    const d = cur.toISOString().slice(0, 10);
    if (set.has(d)) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function MediaStreakTracker({ mediaEntries }) {
  const streak = useMemo(() => calculateMediaStreak(mediaEntries), [mediaEntries]);

  const prevRef = useRef(streak);
  const [ping, setPing] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (streak > prev) {
      setPing(true);
      const t = setTimeout(() => setPing(false), 900);
      return () => clearTimeout(t);
    }
    prevRef.current = streak;
  }, [streak]);

  return (
    <div className="flex items-center justify-center my-2">
      <div
        className="relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-orange-300/50 dark:border-orange-500/30 bg-gradient-to-r from-orange-50/80 via-amber-50/80 to-pink-50/80 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-pink-900/20 shadow-sm backdrop-blur select-none"
        title={streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} media streak` : 'No current media streak'}
        aria-label="Media completion streak"
      >
        {ping && (
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 rounded-full bg-orange-400/60 animate-ping" />
        )}
        <div className="relative flex items-center justify-center">
          {/* Combine music + subtle flame for consistency */}
          <Music className="w-6 h-6 text-orange-500 dark:text-orange-400 mr-1" />
          <Flame className="w-4 h-4 text-orange-400/80 hidden sm:block" />
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
            Keep listening/watching!
          </span>
        ) : (
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            Finish something today to start
          </span>
        )}
      </div>
    </div>
  );
}
