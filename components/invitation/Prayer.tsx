'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';

export interface PrayerProps {
  sectionLabel?: string;
  title?: string;
  arabicOrSanskrit?: string;
  translation?: string;
  blessingText?: string;
  citation?: string;
}

export function Prayer({
  sectionLabel = 'DOA & RESTU WIWAHA',
  title = 'Asung Kertha Wara Nugraha',
  arabicOrSanskrit = 'Om Ihaiva stam ma vi yaustam, visvam ayur vyasnutam, kridantau putrair naptrbhih modamanau sve grhe.',
  translation = 'Wahai pasangan pengantin, semoga engkau senantiasa tetap bersatu, tidak pernah terpisahkan, mencapai usia hidup yang panjang dan bahagia, dikaruniai keturunan yang utama, serta senantiasa damai dan tenteram di dalam rumah tanggamu.',
  blessingText = 'Om Swastyastu. Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, kami memohon doa restu agar perjalanan mahligai rumah tangga kami senantiasa dilimpahi kerahayuan, ketulusan, kedamaian lahir dan batin. Om Shanti, Shanti, Shanti, Om.',
  citation = 'Rg Veda X.85.42',
}: PrayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 40,
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            once: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="prayer"
      className="relative w-full py-16 sm:py-20 md:py-24 px-[var(--gutter)] bg-[var(--paper)] select-none overflow-hidden"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          {title && (
            <h2 className="display-l font-serif text-3xl sm:text-4xl text-[var(--ink)] tracking-[-0.01em]">
              {title}
            </h2>
          )}
        </div>

        {/* Editorial Prayer Card with Quiet Luxury Frame */}
        <div
          ref={cardRef}
          className="relative bg-white/70 backdrop-blur-md border border-[var(--ink)]/15 rounded-[var(--radius-sm)] p-8 sm:p-12 md:p-14 shadow-[0_12px_40px_rgba(15,27,45,0.04)] text-center max-w-3xl mx-auto"
        >
          {/* Top Delicate Ornament */}
          <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
            <div className="w-10 sm:w-16 h-[1px] bg-[var(--ink)]/30" />
            <span className="text-xs font-serif italic text-[var(--deep)]">✦</span>
            <div className="w-10 sm:w-16 h-[1px] bg-[var(--ink)]/30" />
          </div>

          {/* Sacred Sanskrit / Bali Verse */}
          {arabicOrSanskrit && (
            <p className="font-serif italic text-lg sm:text-2xl text-[var(--ink)] leading-[1.6] sm:leading-[1.8] mb-6 tracking-wide font-normal">
              &ldquo;{arabicOrSanskrit}&rdquo;
            </p>
          )}

          {/* Translation */}
          {translation && (
            <p className="font-serif text-sm sm:text-base text-[var(--ink)]/80 leading-relaxed max-w-2xl mx-auto mb-6">
              {translation}
            </p>
          )}

          {/* Blessing Text */}
          {blessingText && (
            <p className="body-base text-xs sm:text-sm text-[var(--ink)]/75 leading-relaxed max-w-xl mx-auto mt-4 pt-4 border-t border-[var(--ink)]/10">
              {blessingText}
            </p>
          )}

          {/* Citation / Surah / Sumber */}
          {citation && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep)] opacity-40" />
              <span className="label-eyebrow text-[10px] tracking-[0.24em] text-[var(--deep)] font-medium uppercase">
                {citation}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
