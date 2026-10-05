'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface MediaFrameProps {
  src?: string;
  videoSrc?: string;
  posterSrc?: string;
  mediaType?: 'photo' | 'video';
  alt: string;
  aspectRatio?: string; // e.g. "4/5", "16/10", "3/4"
  label?: string;
  arch?: boolean;
  priority?: boolean;
  className?: string;
}

export function MediaFrame({
  src,
  videoSrc,
  posterSrc,
  mediaType = 'photo',
  alt,
  aspectRatio = '4/5',
  label = 'DOKUMENTASI',
  arch = false,
  priority = false,
  className = '',
}: MediaFrameProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = mediaType === 'video' || Boolean(videoSrc);

  return (
    <div
      className={`group relative w-full overflow-hidden bg-[var(--mist)] hairline-box transition-all duration-700 ${
        arch ? 'arch-frame' : 'rounded-[var(--radius-sm)]'
      } ${className}`}
      style={{ aspectRatio }}
    >
      {isVideo ? (
        <div className="relative w-full h-full bg-black/40">
          <video
            src={videoSrc || src}
            poster={posterSrc || src}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-all duration-1000 ease-[var(--ease-out)] group-hover:scale-105"
          />
          {/* Subtle Video Badge */}
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-[9px] font-mono tracking-widest uppercase text-white flex items-center gap-1.5 shadow-sm pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>VIDEO</span>
          </div>
          {/* Filmic sheen overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      ) : src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setIsLoaded(true)}
            className={`object-cover transition-all duration-1000 ease-[var(--ease-out)] group-hover:scale-105 ${
              isLoaded ? 'opacity-100 scale-100 filter-none' : 'opacity-0 scale-105 blur-sm'
            }`}
          />
          {/* Subtle filmic sheen overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="absolute inset-4 border border-[var(--hairline)] pointer-events-none opacity-50" />
          <div className="w-8 h-8 rounded-full border border-[var(--hairline)] flex items-center justify-center text-[10px] text-[var(--deep)] font-serif italic mb-3">
            A&amp;C
          </div>
          <p className="label-eyebrow text-[var(--deep)] opacity-70 tracking-[0.25em]">
            {label}
          </p>
          <span className="text-[10px] text-[var(--ink)] opacity-40 font-mono mt-1">
            {aspectRatio.replace('/', ' : ')}
          </span>
        </div>
      )}
    </div>
  );
}
