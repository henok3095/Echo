import React from "react";
import { BarChart2 } from "lucide-react";

export default function ChartSummary() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">Weekly Summary</h3>
      </div>
      <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Chart placeholder
      </div>
    </div>
  );
}
