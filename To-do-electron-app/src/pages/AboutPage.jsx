import React from 'react';
import { Sparkles, CheckSquare, BookOpen, Calendar, Music, Film, User as UserIcon, Info, Lightbulb } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-full">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-fuchsia-600/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-fuchsia-400/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-lg">
              HE
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-fuchsia-400">
                  About Echo
                </span>
              </h1>
              <p className="mt-2 text-gray-700 dark:text-gray-300 max-w-3xl">
                Echo is a calm, cohesive home for the important parts of life — tasks, journals, memories,
                media, and connection — designed to feel like your personal studio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-5xl mx-auto px-6 pb-16 grid gap-6 md:gap-8">
        {/* 1. Introduction — Who I Am */}
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl md:text-2xl font-bold">1. Introduction — Who I Am</h2>
          </div>
          <div className="h-0.5 w-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4" />
          <p className="text-gray-700 dark:text-gray-300">
            I’m <strong>Henok Eyayalem</strong>, a <strong>5th-year Software Engineering student at Addis Ababa University, Ethiopia</strong>.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            I’m a <strong>data and stats enthusiast</strong> — basically a proud nerd who loves tracking and storing details of everything I do.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            What drives me in software is turning complexity into simple, beautiful tools that make life easier.
          </p>
        </section>

        {/* 2. Why I Built Echo */}
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl md:text-2xl font-bold">2. Why I Built Echo</h2>
          </div>
          <div className="h-0.5 w-14 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full mb-4" />
          <p className="text-gray-700 dark:text-gray-300">
            Echo grew from my love of stats and my desire for one place to capture all the important parts of my life —
            tasks, journals, memories, media, and social connections.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            The problem: everything is fragmented across many apps and platforms. Echo is a personal life hub where these
            pieces come together seamlessly.
          </p>
        </section>

        {/* 3. What Echo Offers */}
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
            <h2 className="text-xl md:text-2xl font-bold">3. What Echo Offers</h2>
          </div>
          <div className="h-0.5 w-14 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-full mb-4" />
          <div className="grid sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3"><CheckSquare className="w-5 h-5 mt-0.5 text-green-600 dark:text-green-400" /><p><strong>Tasks</strong> with smart streaks and momentum boosters.</p></div>
            <div className="flex items-start gap-3"><BookOpen className="w-5 h-5 mt-0.5 text-indigo-600 dark:text-indigo-400" /><p><strong>Journals</strong> with mood tracking and quick capture.</p></div>
            <div className="flex items-start gap-3"><Sparkles className="w-5 h-5 mt-0.5 text-yellow-600 dark:text-yellow-400" /><p><strong>Memories</strong> timeline for meaningful moments.</p></div>
            <div className="flex items-start gap-3"><Music className="w-5 h-5 mt-0.5 text-pink-600 dark:text-pink-400" /><p><strong>Media</strong> tracking powered by insightful stats.</p></div>
            <div className="flex items-start gap-3"><UserIcon className="w-5 h-5 mt-0.5 text-teal-600 dark:text-teal-400" /><p><strong>Profile & Social</strong> features for connection and inspiration.</p></div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mt-3">
            Offline-first and customizable — Echo is designed to feel like a personal studio, yours to shape.
          </p>
        </section>

        {/* 4. My Philosophy & Vision */}
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl md:text-2xl font-bold">4. My Philosophy & Vision</h2>
          </div>
          <div className="h-0.5 w-14 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full mb-4" />
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Clean, thoughtful architecture</strong> that scales with clarity.</li>
            <li><strong>User-first design</strong> balancing productivity and creativity.</li>
            <li><strong>Calm yet powerful</strong> — quiet by default, deep when you need it.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mt-3">
            I’m excited for Echo’s future — to grow through real feedback, refine details, and keep learning.
          </p>
        </section>

        {/* 5. Let’s Connect */}
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl md:text-2xl font-bold">5. Let’s Connect</h2>
          </div>
          <div className="h-0.5 w-14 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full mb-4" />
          <p className="text-gray-700 dark:text-gray-300">
            I’d love to hear your thoughts — feedback, ideas, or just to chat. Thanks to early supporters and the community.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="mailto:henok@example.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <span>Email</span>
            </a>
            <a
              href="https://github.com/your-username"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <span>GitHub</span>
            </a>
            <a
              href="https://x.com/your-handle"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <span>Twitter</span>
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Tip: Update the links above in <code>src/pages/AboutPage.jsx</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
