import React from "react";

export default function VisualizerStrip({ playing }) {
  return (
    <div className="mt-6 w-full max-w-3xl h-3 mx-auto rounded-full overflow-hidden bg-white/5 border border-white/10">
      <div className="h-full w-full flex gap-1 px-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="eq-bar flex-1 rounded-sm"
            style={{
              height: '100%',
              background: playing
                ? 'linear-gradient(180deg, var(--neon-cyan), var(--neon-pink))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))',
              animationDuration: playing ? `${900 + (i % 5) * 80}ms` : `${1400 + (i % 5) * 120}ms`,
              opacity: playing ? 0.9 : 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
