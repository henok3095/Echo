import React from "react";
import { CheckCircle, Flag } from "lucide-react";

export default function TaskCard({ title, status = "In Progress", priority = "High" }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600 dark:text-green-400";
      case "In Progress":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h3>
        <Flag className={`w-4 h-4 ${getPriorityColor(priority)}`} />
      </div>
      
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle className={`w-3 h-3 ${getStatusColor(status)}`} />
        <span className={`${getStatusColor(status)}`}>{status}</span>
        <span className="text-gray-500 dark:text-gray-400">•</span>
        <span className="text-gray-500 dark:text-gray-400">{priority} priority</span>
      </div>
    </div>
  );
}
