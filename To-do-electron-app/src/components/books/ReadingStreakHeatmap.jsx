import React from 'react';
import { aggregateMinutesPerDay } from '../../store/reading.jsx';

// Simple heatmap for last 12 weeks (84 days)
export default function ReadingStreakHeatmap({ sessions }) {
  const data = aggregateMinutesPerDay(sessions, 84);

  // map weeks (columns) and days (rows 0..6, Mon-Sun)
  const byWeek = [];
  data.forEach((d, idx) => {
    const weekIdx = Math.floor(idx / 7);
    if (!byWeek[weekIdx]) byWeek[weekIdx] = [];
    byWeek[weekIdx].push(d);
  });

  const level = (m) => {
    if (!m || m <= 0) return 'bg-slate-800';
    if (m < 15) return 'bg-amber-300/40';
    if (m < 30) return 'bg-amber-400/60';
    if (m < 60) return 'bg-orange-500/70';
    return 'bg-red-500/80';
  };

  return (
    <div className="flex items-end gap-1 overflow-x-auto py-2">
      {byWeek.map((week, i) => (
        <div key={i} className="flex flex-col gap-1">
          {week.map((d) => (
            <div
              key={d.date}
              className={`h-3 w-3 rounded-sm ${level(d.minutes)} transition-colors`}
              title={`${d.date}: ${d.minutes || 0} min`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
