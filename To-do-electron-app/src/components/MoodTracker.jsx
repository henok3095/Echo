import React from "react";
import { Smile, Frown, Meh } from "lucide-react";

export default function MoodTracker({ mood = "neutral", onChange }) {
  const moods = [
    { id: "happy", icon: Smile, color: "text-green-600 dark:text-green-400" },
    { id: "neutral", icon: Meh, color: "text-yellow-600 dark:text-yellow-400" },
    { id: "sad", icon: Frown, color: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Smile className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">How are you feeling?</h3>
      </div>
      <div className="flex items-center gap-3">
        {moods.map(({ id, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`p-2 rounded-lg transition-all ${
              mood === id
                ? `bg-gray-100 dark:bg-gray-800 ${color}`
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
