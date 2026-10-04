'use client';

import React, { useRef, useState, useEffect } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';

interface CoverProps {
  guestName: string;
  salutation: string;
  groomName: string;
  brideName: string;
  dateFormatted: string;
  onOpenInvitation: () => void;
}

export function Cover({
  guestName,
  salutation,
  groomName,
  brideName,
  dateFormatted,
  onOpenInvitation,
}: CoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topPanelRef = useRef<HTMLDivElement | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hairlineRef = useRef<HTMLDivElement | null>(null);
  const [isOpened, setIsOpened] = useState(false);
  const { unlockScroll } = useLenisContext();

  // Entrance animation on mount
  useEffect(() => {
    if (!contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cover-reveal-item',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.14,
          ease: 'power3.out',
        }
      );

      if (hairlineRef.current) {
        gsap.fromTo(
          hairlineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, ease: 'expo.out', delay: 0.3 }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleOpen = () => {
    if (isOpened) return;
    setIsOpened(true);

    // Call parent handler (starts audio, fires /api/public/open if applicable)
    onOpenInvitation();

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          unlockScroll();
          if (containerRef.current) {
            containerRef.current.style.display = 'none';
          }
        },
      });
      return;
    }

    // Split Panels animation: Top panel translates -100%, bottom panel translates +100%
    const tl = gsap.timeline({
      onComplete: () => {
        unlockScroll();
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      },
    });

    // Fade out inner content slightly ahead of split
    tl.to(contentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.45,
      ease: 'power2.in',
    });

    tl.to(
      topPanelRef.current,
      {
        yPercent: -100,
        duration: 1.2,
        ease: 'power4.inOut',
      },
      '-=0.15'
    );

    tl.to(
      bottomPanelRef.current,
      {
        yPercent: 100,
        duration: 1.2,
        ease: 'power4.inOut',
      },
      '<'
    );

    // Hero subtle scale in from 1.15 to 1
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      tl.fromTo(
        heroEl,
        { scale: 1.15, filter: 'blur(4px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'power4.out' },
        '-=1.0'
      );
    }
  };

  return (
    <div
      ref={containerRef}
      id="cover"
      className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-between text-[var(--ink)] select-none"
      style={{ height: '100dvh' }}
    >
      {/* Top half panel */}
      <div
        ref={topPanelRef}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[var(--baby-blue)] pointer-events-none"
        style={{ zIndex: 1 }}
      />
      {/* Bottom half panel */}
      <div
        ref={bottomPanelRef}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[var(--baby-blue)] pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Main Content layer */}
      <div
        ref={contentRef}
        className="relative z-10 w-full h-full flex flex-col justify-between px-[var(--gutter)] py-12 md:py-16 max-w-4xl mx-auto"
      >
        {/* Top Eyebrow */}
        <div className="cover-reveal-item flex items-center justify-between">
          <span className="label-eyebrow tracking-[0.25em] text-[var(--ink)] opacity-75">
            UNDANGAN PERNIKAHAN
          </span>
          <span className="label-eyebrow text-[var(--ink)] opacity-50 font-serif italic text-sm">
            {groomName} & {brideName}
          </span>
        </div>

        {/* Center: Guest Personalization */}
        <div className="flex flex-col items-start my-auto py-8">
          <p className="cover-reveal-item label-eyebrow text-[var(--ink)] opacity-70 mb-3 tracking-[0.2em]">
            {salutation ? `KEPADA YTH. ${salutation.toUpperCase()}` : 'KEPADA YTH.'}
          </p>

          <h1 className="cover-reveal-item display-l text-[var(--ink)] leading-[0.95] max-w-2xl font-serif">
            {guestName}
          </h1>

          <div
            ref={hairlineRef}
            className="w-24 h-[1px] bg-[var(--ink)] opacity-25 mt-8 mb-6 origin-left"
          />

          <p className="cover-reveal-item body-base text-[var(--ink)] opacity-80 max-w-md">
            Tanpa mengurangi rasa hormat, kami bermaksud mengundang Anda untuk hadir dan berbagi doa di hari bahagia kami.
          </p>
        </div>

        {/* Bottom: Couple, Date & Open Button */}
        <div className="cover-reveal-item flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
          <div>
            <div className="font-serif text-xl md:text-2xl text-[var(--ink)]">
              {groomName} &amp; {brideName}
            </div>
            <p className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em] mt-1">
              {dateFormatted}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="btn-signature group self-start sm:self-auto bg-white/40 backdrop-blur-xs border-[var(--ink)]"
            aria-label="Buka Undangan Pernikahan"
          >
            <span>Buka Undangan</span>
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
