'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';

export interface FooterProps {
  closingLine?: string;
  groomName: string;
  brideName: string;
  copyright?: string;
}

export function Footer({ closingLine, groomName, brideName, copyright }: FooterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bigNameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { lenis } = useLenisContext();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Gentle parallax drift on the giant signature text
      if (bigNameRef.current) {
        gsap.to(bigNameRef.current, {
          x: '-3vw',
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        });
      }

      // Smooth entrance of footer content
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleBackToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={containerRef}
      id="footer"
      className="relative w-full pt-20 sm:pt-28 pb-[calc(7.5rem+env(safe-area-inset-bottom,2.5rem))] bg-gradient-to-b from-[#E2EDF7] to-[#D3E4F4] text-[var(--ink)] select-none overflow-hidden"
    >
      {/* Decorative Subtle Hairline Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--ink)]/20 to-transparent" />

      <div
        ref={contentRef}
        className="px-[var(--gutter)] max-w-3xl mx-auto text-center relative z-10"
      >
        {/* Monogram Seal Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-full border border-[var(--deep)]/30 flex items-center justify-center bg-white/60 backdrop-blur-sm shadow-xs">
            <span className="font-serif italic text-base text-[var(--deep)] font-semibold tracking-wider">
              {groomName.charAt(0)} &amp; {brideName.charAt(0)}
            </span>
          </div>
        </div>

        {/* Closing Thank You Quote */}
        <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--ink)] leading-[1.3] font-normal mb-8 text-balance">
          {closingLine ||
            'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.'}
        </p>

        {/* Signature & Family Acknowledgment */}
        <div className="my-10 flex flex-col items-center">
          <span className="label-eyebrow tracking-[0.28em] text-[10px] text-[var(--deep)] font-medium uppercase mb-2">
            Kami Yang Berbahagia
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--ink)] font-light tracking-tight my-1">
            {groomName} &amp; {brideName}
          </div>
          <span className="body-xs text-[var(--ink)] opacity-60 text-xs tracking-wider mt-1">
            Beserta Keluarga Besar Kedua Mempelai
          </span>
        </div>

        {/* Back to Top Interactive Button */}
        <div className="mt-12 mb-14">
          <button
            type="button"
            onClick={handleBackToTop}
            className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/70 hover:bg-white text-[var(--ink)] border border-[var(--ink)]/20 hover:border-[var(--ink)]/40 transition-all duration-300 shadow-[0_2px_12px_rgba(15,30,50,0.06)] active:scale-95"
            aria-label="Kembali ke bagian atas halaman"
          >
            <span className="label-eyebrow tracking-[0.22em] text-[10px] font-semibold">
              KEMBALI KE ATAS
            </span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Bottom Editorial Colophon */}
        <div className="pt-8 border-t border-[var(--ink)]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono label-eyebrow opacity-55">
          <span>THE WEDDING OF {groomName.toUpperCase()} &amp; {brideName.toUpperCase()}</span>
          <span>{copyright || 'BANGLI, BALI · 2026'}</span>
        </div>
      </div>

      {/* Giant Ambient Typographic Watermark Background */}
      <div
        ref={bigNameRef}
        className="w-full text-center whitespace-nowrap text-[14vw] font-serif text-[var(--ink)] opacity-[0.06] leading-none select-none pointer-events-none mt-6"
      >
        {groomName} &amp; {brideName}
      </div>
    </footer>
  );
}
