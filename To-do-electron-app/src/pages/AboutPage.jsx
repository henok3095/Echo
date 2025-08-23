import React from 'react';
import { Sparkles, User as UserIcon, Info, Lightbulb, Github, Instagram, Mail } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// Inline Telegram logo (proper brand mark)
const TelegramIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    role="img"
    aria-label="Telegram"
    className={className}
    fill="currentColor"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12C24 5.373 18.627 0 12 0zm5.457 7.162c.2-.012.445.045.6.203.126.129.176.298.194.423.02.125.04.415.023.639-.205 2.61-1.089 7.152-1.544 9.09-.19.826-.653 1.103-1.072 1.135-.912.07-1.606-.612-2.484-1.2-1.376-.902-2.152-1.459-3.503-2.337-1.555-.994-.548-1.552.34-2.452.229-.236 4.211-3.879 4.292-4.21.01-.042.017-.196-.077-.279-.092-.082-.233-.06-.336-.035-.139.034-2.194 1.405-6.191 4.105-.578.394-1.089.592-1.548.585-.513-.01-1.484-.287-2.202-.527-.893-.296-1.605-.449-1.54-.951.035-.243.361-.494.994-.758 3.889-1.7 6.477-2.824 7.748-3.35 3.695-1.537 4.463-1.802 4.96-1.834z"/>
  </svg>
);

export default function AboutPage() {
  return (
    <div className="min-h-full">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-fuchsia-600/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-fuchsia-400/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          <PageHeader
            title="About Echo"
            subtitle="Echo is a calm, cohesive home for tasks, journals, memories, media, and connection — your personal studio."
            Icon={Info}
            iconGradient="from-pink-500 to-orange-600"
            titleGradient="from-pink-600 via-orange-600 to-red-600"
            centered={false}
          />
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-5xl mx-auto px-6 pb-16 mt-8 md:mt-12 grid gap-6 md:gap-8">
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
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>Tasks</strong> with smart streaks and momentum boosters.</li>
            <li><strong>Journals</strong> with mood tracking and quick capture.</li>
            <li><strong>Books</strong> tracking with progress, notes, and highlights.</li>
            <li><strong>Media</strong> tracking powered by insightful stats.</li>
            <li><strong>Profile & Social</strong> features for connection and inspiration.</li>
          </ul>
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
          <div className="mt-5 grid grid-cols-1 gap-3">
            {/* GitHub */}
            <a
              href="https://github.com/henok3095"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub - henok3095"
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-5 flex items-center gap-3 hover:shadow-lg transition-all"
            >
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                <Github className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">GitHub</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">@henok3095</div>
              </div>
              <div className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-gray-200/60 to-gray-100/40 dark:from-gray-700/30 dark:to-gray-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/henok_3095/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram - henok3095"
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10 p-5 flex items-center gap-3 hover:shadow-lg transition-all"
            >
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Instagram</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">@henok_3095</div>
              </div>
              <div className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-pink-300/40 to-rose-200/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/no_w_ay"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram - @no_w_ay"
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/10 p-5 flex items-center gap-3 hover:shadow-lg transition-all"
            >
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white">
                <TelegramIcon className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Telegram</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">@no_w_ay</div>
              </div>
              <div className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-sky-300/40 to-cyan-200/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Telegram Channel */}
            <a
              href="https://t.me/clouddeedd"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram Channel - @clouddeedd"
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/10 p-5 flex items-center gap-3 hover:shadow-lg transition-all"
            >
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <TelegramIcon className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Telegram Channel</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">@clouddeedd</div>
              </div>
              <div className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-300/40 to-violet-200/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Email */}
            <a
              href="mailto:henok3095@gmail.com"
              aria-label="Email - henok3095@gmail.com"
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 p-5 flex items-center gap-3 hover:shadow-lg transition-all"
            >
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Email</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">henok3095@gmail.com</div>
              </div>
              <div className="pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-200/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
