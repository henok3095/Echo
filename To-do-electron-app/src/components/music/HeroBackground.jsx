import React from "react";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient blobs */}
      <div className="absolute -top-32 -left-24 w-80 h-80 bg-[radial-gradient(circle_at_center,var(--neon-pink),transparent_60%)] opacity-40 blur-3xl rounded-full animate-blob" />
      <div className="absolute -bottom-40 -right-24 w-96 h-96 bg-[radial-gradient(circle_at_center,var(--neon-orange),transparent_60%)] opacity-40 blur-3xl rounded-full animate-blob-delay" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-[radial-gradient(circle_at_center,var(--neon-red),transparent_60%)] opacity-30 blur-3xl rounded-full animate-blob-delay-2" />

      {/* Faint radial grid / vignette */}
      <div className="absolute inset-0 radial-vignette" />
    </div>
  );
}
