import React from "react";
import { LayoutDashboard, CheckSquare, Film, BookOpen, Lightbulb, Calendar, User, Sparkles, Music, Info, PenTool } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";

const ROUTES = [
  "/dashboard",
  "/activities",
  "/tasks",
  "/movies",
  "/music",
  "/journal",
  "/books",
  "/calendar",
  "/profile",
  "/about",
];

const ICONS = [
  <LayoutDashboard className="w-5 h-5" key="dashboard" />,
  <Sparkles className="w-5 h-5" key="activities" />,
  <CheckSquare className="w-5 h-5" key="tasks" />,
  <Film className="w-5 h-5" key="movies" />,
  <Music className="w-5 h-5" key="music" />,
  <PenTool className="w-5 h-5" key="journal" />,
  <BookOpen className="w-5 h-5" key="books" />,
  <Calendar className="w-5 h-5" key="calendar" />,
  <User className="w-5 h-5" key="profile" />,
  <Info className="w-5 h-5" key="about" />,
];

const LABELS = [
  "Dashboard",
  "Activities",
  "Tasks",
  "Movies",
  "Music",
  "Journal",
  "Books",
  "Calendar",
  "Profile",
  "About",
];

const COLORS = [
  "blue",
  "green",
  "purple",
  "pink",
  "orange",
  "indigo",
  "teal",
  "cyan",
  "teal",
  "purple",
];

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getColorClasses = (color, isActive) => {
    if (isActive) {
      return {
        blue: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/10",
        green: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50 shadow-lg shadow-green-500/10",
        purple: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 shadow-lg shadow-purple-500/10",
        orange: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-700/50 shadow-lg shadow-orange-500/10",
        pink: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/20 text-pink-700 dark:text-pink-300 border border-pink-200/50 dark:border-pink-700/50 shadow-lg shadow-pink-500/10",
        indigo: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg shadow-indigo-500/10",
        teal: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-700/50 shadow-lg shadow-teal-500/10",
      }[color];
    }
    return "text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white";
  };

  return (
    <aside className={`h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 relative overflow-hidden ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-100/50 dark:from-gray-800/20 dark:via-transparent dark:to-gray-900/20 pointer-events-none"></div>
      
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <Logo 
          className={collapsed ? "w-8 h-8 mx-auto" : "w-10 h-10"} 
          showText={!collapsed}
          textClassName="text-2xl font-bold"
        />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-3 relative z-10">
        {ROUTES.map((route, idx) => {
          const isActive = location.pathname === route;
          const color = COLORS[idx];
          return (
            <button
              key={route}
              onClick={() => navigate(route)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-105 active:scale-95 ${
                getColorClasses(color, isActive)
              }`}
            >
              <div className={`transition-all duration-300 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {ICONS[idx]}
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm transition-all duration-200">
                  {LABELS[idx]}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <div className="ml-auto">
                  <div className={`w-2 h-2 rounded-full bg-current animate-pulse`}></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
      
    </aside>
  );
}
