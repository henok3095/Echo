import React, { useRef, useEffect } from "react";
import { animate } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SnapCarousel({ title, children }) {
  const scrollerRef = useRef(null);

  // Framer Motion-driven smooth scroll
  const animateScrollBy = (delta, duration = 380) => {
    const el = scrollerRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || duration <= 0) {
      el.scrollLeft += delta;
      return;
    }
    const start = el.scrollLeft;
    const target = start + delta;
    const controls = animate(start, target, {
      duration: duration / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.scrollLeft = v;
      },
    });
    return () => controls.stop();
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        animateScrollBy(360);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        animateScrollBy(-360);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h3 className="text-2xl font-bold text-white/90 relative z-10">{title}</h3>
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-lg -z-10 animate-pulse" />
        </div>
        <div className="hidden md:flex gap-3">
          <button
            onClick={() => animateScrollBy(-360)}
            className="group relative px-3 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_-8px_rgba(139,92,246,0.3)]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <button
            onClick={() => animateScrollBy(360)}
            className="group relative px-3 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-[0_8px_25px_-8px_rgba(139,92,246,0.3)]"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="no-scrollbar relative flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
        tabIndex={0}
        role="region"
        aria-label={`${title} carousel`}
        style={{ willChange: 'scroll-position' }}
      >
        {children}
      </div>
      
      {/* Subtle gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-current to-transparent opacity-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-current to-transparent opacity-10 pointer-events-none" />
    </section>
  );
}
