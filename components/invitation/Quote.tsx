'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';
import { QuoteBackgroundMode } from '@/lib/content/types';

export interface QuoteProps {
  label?: string;
  text: string;
  citation?: string;
  bgMode?: QuoteBackgroundMode;
  bgImage?: string;
}

export function Quote({
  label = 'OM SWASTYASTU',
  text,
  citation,
  bgMode = 'solid',
  bgImage,
}: QuoteProps) {
  const { lenis } = useLenisContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        {
          opacity: 0,
          y: 28,
          filter: 'blur(6px)',
        },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.25,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 82%',
            once: true,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  const isImageMode = bgMode === 'image' && Boolean(bgImage);

  return (
    <section
      ref={containerRef}
      id="quote"
      data-snap-section="true"
      className={`relative w-full min-h-[100dvh] h-[100dvh] flex flex-col justify-center items-center select-none overflow-hidden transition-colors snap-start ${
        isImageMode
          ? 'px-6 py-12 sm:px-12 text-white bg-[#0A121E]'
          : 'px-6 py-12 sm:px-12 bg-[var(--paper)] text-[var(--ink)]'
      }`}
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'normal',
      }}
    >
      {/* 1. Atmospheric Image Background (when bgMode === 'image') */}
      {isImageMode && (
        <div className="absolute inset-0 w-full h-full pointer-events-none origin-center">
          <img
            src={bgImage}
            alt={label || 'Latar Belakang Kutipan'}
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
          />

          {/* Cinematic Deep Vignette & Contrast Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/75" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)]" />
        </div>
      )}

      {/* 2. Pure Editorial Centered Content Container */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-2xl mx-auto w-full flex flex-col items-center text-center px-4"
      >
        {/* Title / Salam / Label (Grand Classical Serif in Caps) */}
        {label && (
          <h2
            className={`font-serif text-2xl sm:text-3xl md:text-4xl tracking-[0.14em] uppercase font-normal mb-5 sm:mb-6 ${
              isImageMode
                ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]'
                : 'text-[var(--ink)]'
            }`}
          >
            {label}
          </h2>
        )}

        {/* Isi Kutipan / Doa Pembuka */}
        {text && (
          <p
            className={`text-sm sm:text-base md:text-lg leading-relaxed font-light tracking-wide max-w-xl mx-auto ${
              isImageMode
                ? 'text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
                : 'text-[var(--ink)]/85'
            }`}
          >
            {text}
          </p>
        )}

        {/* Citation / Sumber / Subtext (Rendered cleanly only once) */}
        {citation && citation.trim() && (
          <div
            className={`mt-6 sm:mt-7 font-serif italic text-xs sm:text-sm tracking-widest uppercase ${
              isImageMode ? 'text-white/75 drop-shadow-sm' : 'text-[var(--ink)]/60'
            }`}
          >
            — {citation.trim()}
          </div>
        )}
      </div>

      {/* 3. Bottom Scroll Indicator to Mempelai Pria */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-10 flex justify-center">
        <button
          type="button"
          onClick={() => {
            if (lenis) {
              lenis.scrollTo('#couple', { duration: 1.0 });
            } else {
              const target = document.getElementById('couple');
              target?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`group w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
            isImageMode
              ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
              : 'bg-white/80 hover:bg-white text-[var(--ink)] border border-[var(--ink)]/15'
          }`}
          aria-label="Gulir ke Mempelai"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3.5 6L8 10.5L12.5 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
