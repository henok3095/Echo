import React, { useMemo } from 'react';

// Lightweight CSS-based confetti burst.
// Renders absolutely-positioned pieces that fall and rotate, then auto-remove via parent unmount.
export default function ConfettiBurst({ pieces = 120, duration = 1800 }) {
  const items = useMemo(() => Array.from({ length: pieces }, (_, i) => i), [pieces]);
  const colors = ['#22d3ee', '#6366f1', '#a78bfa', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {items.map((i) => {
        const left = Math.random() * 100; // vw
        const size = 6 + Math.random() * 6; // px
        const delay = Math.random() * 0.25; // s
        const rotate = Math.random() * 360;
        const color = colors[i % colors.length];
        const style = {
          left: `${left}vw`,
          width: `${size}px`,
          height: `${size * 0.4}px`,
          backgroundColor: color,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}ms`,
          transform: `rotate(${rotate}deg)`
        };
        return <span key={i} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}
