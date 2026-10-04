'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';

interface FooterProps {
  closingLine: string;
  groomName: string;
  brideName: string;
}

export function Footer({ closingLine, groomName, brideName }: FooterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bigNameRef = useRef<HTMLDivElement | null>(null);
  const { lenis } = useLenisContext();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Subtle scrub on giant name
      gsap.to(bigNameRef.current, {
        x: '-4vw',
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleBackToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={containerRef}
      id="footer"
      className="relative w-full pt-[var(--section-y)] pb-0 bg-[var(--baby-blue)] text-[var(--ink)] select-none overflow-hidden"
    >
      <div className="px-[var(--gutter)] max-w-4xl mx-auto text-center pb-20">
        <p className="display-m text-3xl sm:text-4xl md:text-5xl font-serif text-[var(--ink)] leading-[1.2] mb-12">
          {closingLine}
        </p>

        {/* Back to top button */}
        <button
          type="button"
          onClick={handleBackToTop}
          className="inline-flex items-center gap-2 label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-75 hover:opacity-100 transition-opacity border-b border-[var(--ink)]/40 pb-1"
        >
          <span>KEMBALI KE ATAS</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Giant Typography at bottom bleeding off edge */}
      <div
        ref={bigNameRef}
        className="w-full text-center whitespace-nowrap display-xl font-serif text-[var(--ink)] opacity-90 leading-[0.8] select-none pointer-events-none translate-y-3"
      >
        {groomName} &amp; {brideName}
      </div>
    </footer>
  );
}
