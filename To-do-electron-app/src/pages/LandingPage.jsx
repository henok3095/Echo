import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Music,
  Film,
  BookOpen,
  CheckCircle,
  Calendar,
  TrendingUp,
  Star,
  Play,
  ArrowRight,
  Zap,
  Heart,
  Target,
  Instagram,
  MessageCircle
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

// Custom Telegram Logo Component
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: CheckCircle,
      title: "Task Management",
      description: "Organize your daily tasks with smart prioritization",
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
    },
    {
      icon: Film,
      title: "Movie Tracking",
      description: "Track movies & TV shows with TMDB integration",
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
    },
    {
      icon: Music,
      title: "Music Stats",
      description: "Real-time Last.fm integration for music insights",
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
    },
    {
      icon: BookOpen,
      title: "Journal & Notes",
      description: "Capture thoughts and track your personal growth",
      color: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-white">
              Echo
            </h1>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 font-medium shadow-lg"
          >
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full border border-blue-200/50 dark:border-blue-700/30">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Your Personal Productivity Hub
                  </span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Track Everything
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                    That Matters
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  Your personal productivity & taste tracker. Manage tasks, track movies and music, journal thoughts, and visualize your progress—all in one beautiful, modern interface.
                </p>
              </div>

              <div className="flex justify-center lg:justify-start">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 font-bold text-lg flex items-center justify-center gap-3"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column - Feature Showcase */}
            <div className="relative">
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 rounded-3xl"></div>
                
                {/* Feature Cards */}
                <div className="relative space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Everything You Need
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Powerful features in one place
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      const isActive = currentFeature === index;
                      
                      return (
                        <div
                          key={index}
                          className={`p-6 rounded-2xl transition-all duration-500 transform ${
                            isActive 
                              ? `bg-gradient-to-br ${feature.bgColor} scale-105 shadow-lg border-2 border-blue-200 dark:border-blue-700` 
                              : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50'
                          }`}
                        >
                          <div className={`p-3 rounded-xl mb-4 bg-gradient-to-br ${feature.color} w-fit`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Indicators */}
                  <div className="flex justify-center gap-2 pt-4">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentFeature === index 
                            ? 'bg-blue-600 w-8' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </main>

        {/* Minimalistic Footer */}
        <footer className="p-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">
              Created by <span className="text-white font-medium">Henok</span>
            </p>
            <p className="text-gray-500 text-xs">
              Made in Ethiopia • Echo v1.0
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <a 
                href="https://instagram.com/henok3095" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://t.me/no_wa_y" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <TelegramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
