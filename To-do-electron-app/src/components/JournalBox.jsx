import React from "react";
import { BookOpen } from "lucide-react";

export default function JournalBox({ value = "", onChange, placeholder = "Write your thoughts..." }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">Journal</h3>
      </div>
      <textarea
        className="w-full min-h-[100px] bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none resize-none text-sm border-0 focus:ring-0"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
