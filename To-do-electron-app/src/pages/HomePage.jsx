import React, { useState } from "react";
import TaskCard from "../components/TaskCard";
import MediaCard from "../components/MediaCard";
import JournalBox from "../components/JournalBox";
import ChartSummary from "../components/ChartSummary";
import CalendarSection from "../components/CalendarSection";

const demoTasks = [
  { title: "Finish UI Design", status: "In Progress", priority: "High" },
  { title: "Review Angular Docs", status: "In Progress", priority: "Medium" },
  { title: "Record Demo Video", status: "Completed", priority: "Low" },
];

const demoMedia = [
  { title: "Inception", type: "Movie", rating: 5, tags: ["Sci-Fi", "Favorite"] },
  { title: "The Beatles - Abbey Road", type: "Album", rating: 4, tags: ["Classic"] },
];

export default function HomePage({ username, date }) {
  const [journal, setJournal] = useState("");

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
          Welcome back, {username} 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{date}</p>
        
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Today's Focus</h2>
          <div className="space-y-3">
            {demoTasks.slice(0, 2).map((task, idx) => (
              <TaskCard key={idx} {...task} />
            ))}
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoMedia.map((media, idx) => (
          <MediaCard key={idx} {...media} />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <JournalBox value={journal} onChange={setJournal} placeholder="Quick Journal or Quote of the Day..." />
        </div>
        <div className="space-y-4">
          <ChartSummary />
          <CalendarSection />
        </div>
      </div>
    </div>
  );
}
