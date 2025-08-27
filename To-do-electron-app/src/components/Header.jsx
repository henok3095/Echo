import React from "react";
import { UserCircle, Menu, Sun, Moon, LogOut, Sparkles, Bell } from "lucide-react";
import Logo from "./Logo.jsx";

export default function Header({ username = "User", onMenuClick, onToggleTheme, onToggleNotifications, notificationsCount = 0, onSignOut, theme = "dark" }) {
  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-6 flex items-center justify-between relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <button
          className="p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105 active:scale-95 group"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" />
        </button>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 mb-1">
            <Logo className="w-6 h-6" showText={true} textClassName="text-lg font-bold" preferredSrc="/logo2.png" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 relative z-10">
        {/* Theme Toggle with Enhanced Animation */}
        <button
          className="relative p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 dark:from-blue-400/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
            )}
          </div>
        </button>

        {/* Notifications Toggle */}
        <button
          className="relative p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:scale-105 active:scale-95 group"
          onClick={onToggleNotifications}
          aria-label="Toggle notifications"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          {notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center shadow pointer-events-none">
              {notificationsCount > 99 ? '99+' : notificationsCount}
            </span>
          )}
        </button>
        
        {/* Enhanced User Profile */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="relative">
            <UserCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
            {username.split('@')[0]}
          </span>
        </div>
        
        {/* Enhanced Sign Out Button */}
        <button
          onClick={onSignOut}
          className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30 transition-all duration-200 hover:scale-105 active:scale-95 group border border-red-200/50 dark:border-red-800/50"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform duration-200" />
        </button>
      </div>
    </header>
  );
}
