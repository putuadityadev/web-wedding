import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F1B2D] text-white select-none">
      {/* Soft Ambient Radial Light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(30, 52, 84, 0.4) 0%, rgba(15, 27, 45, 1) 75%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-xs text-center px-6">
        {/* Monogram */}
        <span className="font-serif italic text-4xl sm:text-5xl text-white tracking-widest mb-4 font-light opacity-95 drop-shadow-[0_2px_16px_rgba(255,255,255,0.25)] animate-pulse">
          D &amp; L
        </span>

        <span className="tracking-[0.32em] text-[10px] text-white/60 uppercase mb-6 font-mono">
          MEMUAT UNDANGAN
        </span>

        {/* Minimalist White Pulse Indicator */}
        <div className="relative w-36 h-[1.5px] bg-white/15 rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-white animate-[shimmer_1.4s_infinite_ease-in-out] shadow-[0_0_8px_rgba(255,255,255,0.85)]" />
        </div>
      </div>
    </div>
  );
}
