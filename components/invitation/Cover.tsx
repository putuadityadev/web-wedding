'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  const topFlapRef = useRef<HTMLDivElement | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement | null>(null);
  const sealRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const recipientContentRef = useRef<HTMLDivElement | null>(null);

  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { unlockScroll } = useLenisContext();

  // Entrance & Subtle Idle Float on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.1 }
        );
      }

      // Top Flap entrance
      if (topFlapRef.current) {
        gsap.fromTo(
          topFlapRef.current,
          { opacity: 0, y: -30, rotateX: 6 },
          { opacity: 1, y: 0, rotateX: 0, duration: 1.3, ease: 'power3.out', delay: 0.2 }
        );
      }

      // Bottom Panel and Recipient content entrance
      if (recipientContentRef.current) {
        gsap.fromTo(
          recipientContentRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.35 }
        );
      }

      // Seal entrance with soft organic pop
      if (sealRef.current) {
        gsap.fromTo(
          sealRef.current,
          { scale: 0.5, opacity: 0, rotate: -15 },
          { scale: 1, opacity: 1, rotate: 0, duration: 1.3, ease: 'back.out(1.8)', delay: 0.45 }
        );

        // Gentle breathing animation on seal
        gsap.to(sealRef.current, {
          scale: 1.04,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.8,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 3D Mouse Parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isOpened || isOpening || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      if (topFlapRef.current) {
        gsap.to(topFlapRef.current, {
          rotateY: x * 5,
          rotateX: -y * 4,
          duration: 0.8,
          ease: 'power2.out',
        });
      }
      if (sealRef.current) {
        gsap.to(sealRef.current, {
          x: x * 10,
          y: y * 8,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    },
    [isOpened, isOpening]
  );

  const handleMouseLeave = useCallback(() => {
    if (isOpened || isOpening) return;
    if (topFlapRef.current) {
      gsap.to(topFlapRef.current, {
        rotateY: 0,
        rotateX: 0,
        duration: 1.0,
        ease: 'power2.out',
      });
    }
    if (sealRef.current) {
      gsap.to(sealRef.current, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  }, [isOpened, isOpening]);

  // Grand Seamless Envelope Opening Sequence
  const handleOpen = () => {
    if (isOpened || isOpening) return;
    setIsOpening(true);
    setIsOpened(true);

    // Audio starts playing immediately
    onOpenInvitation();

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          unlockScroll();
          if (containerRef.current) containerRef.current.style.display = 'none';
        },
      });
      return;
    }

    if (sealRef.current) {
      gsap.killTweensOf(sealRef.current);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        unlockScroll();
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      },
    });

    // 1. Header fades out
    if (headerRef.current) {
      tl.to(headerRef.current, { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' }, 0);
    }

    // 2. Wax Seal pops up, cracks, and dissolves
    if (sealRef.current) {
      tl.to(
        sealRef.current,
        {
          scale: 1.25,
          rotate: 10,
          y: -10,
          duration: 0.24,
          ease: 'back.out(2)',
        },
        0.04
      );

      tl.to(
        sealRef.current,
        {
          scale: 0.3,
          opacity: 0,
          y: -28,
          duration: 0.3,
          ease: 'power2.in',
        },
        0.26
      );
    }

    // 3. Top Flap ("Kop Surat") folds smoothly UPWARDS in 3D (0deg -> 180deg)
    if (topFlapRef.current) {
      tl.to(
        topFlapRef.current,
        {
          rotateX: 180,
          duration: 1.15,
          ease: 'power3.inOut',
        },
        0.2
      );
    }

    // 4. Bottom Panel glides DOWNWARDS offscreen
    if (bottomPanelRef.current) {
      tl.to(
        bottomPanelRef.current,
        {
          yPercent: 105,
          opacity: 0.8,
          duration: 1.15,
          ease: 'power3.inOut',
        },
        0.2
      );
    }

    // 5. Seamless Match-Cut Reveal of Hero Section underneath!
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      tl.fromTo(
        heroEl,
        { scale: 1.1, filter: 'blur(10px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.35, ease: 'power3.out' },
        0.32
      );
    }

    // 6. Container fades out completely as panels part
    if (containerRef.current) {
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0.95
      );
    }
  };

  return (
    <div
      ref={containerRef}
      id="cover"
      className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-between text-[var(--ink)] select-none bg-[#EAF0F6]"
      style={{ height: '100dvh', perspective: 1800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Paper Fiber Grain Texture (Pure Procedural SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none z-40">
        <filter id="clean-cover-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#clean-cover-noise)" />
      </svg>

      {/* ============================================================== */}
      {/* 1. TOP HEADER (Responsive, never overlaps on mobile)           */}
      {/* ============================================================== */}
      <header
        ref={headerRef}
        className="absolute top-0 left-0 right-0 z-30 pt-6 sm:pt-8 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep)] opacity-70 animate-pulse" />
          <span className="label-eyebrow tracking-[0.24em] text-[var(--ink)] opacity-75 text-[10px] sm:text-xs font-semibold">
            THE WEDDING OF {groomName.toUpperCase()} &amp; {brideName.toUpperCase()}
          </span>
        </div>

        <div className="label-eyebrow tracking-[0.22em] text-[var(--ink)] opacity-55 text-[9px] sm:text-[11px] font-mono">
          {dateFormatted.toUpperCase()}
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. TOP FLAP ("KOP SURAT", 3D UPWARD FOLD)                       */}
      {/* Symmetrical SVG geometry so flap & gold trim always match 100%  */}
      {/* ============================================================== */}
      <div
        ref={topFlapRef}
        className="absolute top-0 left-0 right-0 h-[46vh] sm:h-[48vh] origin-top transform-gpu will-change-transform z-20"
        style={{
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0 14px 28px rgba(15, 30, 52, 0.16))',
        }}
      >
        {/* Flap Exterior (facing viewer when closed) */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Symmetrical Triangle SVG with integrated gold foil trim */}
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="w-full h-full block"
          >
            <defs>
              <linearGradient id="flapCleanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5F8FC" />
                <stop offset="60%" stopColor="#E6F0F8" />
                <stop offset="100%" stopColor="#D5E4F2" />
              </linearGradient>
              <linearGradient id="flapGoldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C8A96E" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#E2BE75" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#C8A96E" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Flap face polygon */}
            <polygon points="0,0 1000,0 500,600" fill="url(#flapCleanGrad)" />

            {/* Crisp Gold Foil Accent along the V-fold */}
            <polyline
              points="0,0 500,600 1000,0"
              fill="none"
              stroke="url(#flapGoldTrim)"
              strokeWidth="2.5"
            />
          </svg>

          {/* Minimalist Watermark Monogram */}
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-15 pointer-events-none">
            <span className="font-serif italic text-4xl sm:text-5xl tracking-widest text-[var(--deep)]">
              {groomName.charAt(0)} &amp; {brideName.charAt(0)}
            </span>
          </div>
        </div>

        {/* Flap Interior Lining (visible when folded open 180deg) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            transform: 'rotateX(180deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="w-full h-full block"
          >
            <defs>
              <pattern id="cleanLinerPattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <path
                  d="M24,6 Q30,16 24,24 Q18,16 24,6 Z M6,24 Q16,30 24,24 Q16,18 6,24 Z M42,24 Q32,30 24,24 Q32,18 42,24 Z M24,42 Q30,32 24,24 Q18,32 24,42 Z"
                  fill="none"
                  stroke="#F0D59B"
                  strokeWidth="0.8"
                />
                <circle cx="24" cy="24" r="2" fill="#F0D59B" opacity="0.8" />
              </pattern>
            </defs>
            <polygon points="0,0 1000,0 500,600" fill="#14263B" />
            <polygon points="0,0 1000,0 500,600" fill="url(#cleanLinerPattern)" opacity="0.22" />
          </svg>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM PANEL (Recipient info & CTA)                         */}
      {/* ============================================================== */}
      <div
        ref={bottomPanelRef}
        className="absolute inset-0 bg-[#E6EFF7] flex flex-col justify-end pb-8 sm:pb-12 px-6 z-10"
      >
        <div
          ref={recipientContentRef}
          className="w-full max-w-xl mx-auto flex flex-col items-center text-center mt-auto"
        >
          {/* Eyebrow salutation */}
          <span className="label-eyebrow tracking-[0.26em] text-[var(--deep)] text-[10px] sm:text-xs font-semibold mb-1.5 opacity-75">
            KEPADA YTH. {salutation ? salutation.toUpperCase() : 'BAPAK / IBU / SAUDARA/I'}
          </span>

          {/* Guest Name */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[var(--ink)] font-normal tracking-tight mb-2 leading-tight">
            {guestName}
          </h1>

          <div className="flex items-center gap-3 opacity-40 mb-6 sm:mb-8">
            <span className="w-8 h-[1px] bg-[var(--ink)]" />
            <span className="text-[9px] sm:text-[10px] label-eyebrow tracking-[0.22em]">
              DI TEMPAT
            </span>
            <span className="w-8 h-[1px] bg-[var(--ink)]" />
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleOpen}
            className="btn-signature group bg-white/80 hover:bg-white text-[var(--ink)] backdrop-blur-md border-[var(--ink)]/30 hover:border-[var(--ink)] py-3 px-8 sm:px-10 text-xs tracking-[0.22em] transition-all duration-300 shadow-[0_4px_20px_rgba(15,30,50,0.06)]"
            aria-label="Buka Undangan Pernikahan"
          >
            <span>BUKA UNDANGAN</span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
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

          <p className="label-eyebrow text-[9px] text-[var(--ink)] opacity-45 tracking-[0.22em] mt-3">
            KLIK SEGEL ATAU TOMBOL UNTUK MEMBUKA
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. 3D ORGANIC WAX SEAL (Centered exactly at apex of V-flap)    */}
      {/* ============================================================== */}
      <button
        ref={sealRef}
        type="button"
        onClick={handleOpen}
        className="absolute left-1/2 -translate-x-1/2 top-[46vh] sm:top-[48vh] -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center cursor-pointer group/seal focus:outline-hidden z-30 transform-gpu will-change-transform"
        aria-label="Buka Segel Lilin Undangan"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_10px_24px_rgba(10,22,36,0.42)] transform transition-transform duration-300 group-hover/seal:scale-108"
        >
          <defs>
            <radialGradient id="cleanWaxGrad" cx="35%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#3F688F" />
              <stop offset="38%" stopColor="#25466A" />
              <stop offset="80%" stopColor="#142A42" />
              <stop offset="100%" stopColor="#0B1A2A" />
            </radialGradient>
            <radialGradient id="cleanWaxHighlight" cx="32%" cy="26%" r="40%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cleanGoldMonogram" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D1" />
              <stop offset="50%" stopColor="#E2BE75" />
              <stop offset="100%" stopColor="#A8812E" />
            </linearGradient>
            <filter id="cleanWaxInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.8" dy="1.2" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Organic 12-lobed melted wax outer contour */}
          <path
            d="M 50,4 C 62,3 71,11 79,18 C 87,25 96,35 96,48 C 96,61 90,72 81,81 C 72,90 59,96 48,96 C 36,96 24,91 16,82 C 8,73 3,61 4,49 C 5,36 12,24 21,17 C 30,10 39,5 50,4 Z"
            fill="url(#cleanWaxGrad)"
          />

          {/* Specular highlight pool */}
          <path
            d="M 50,4 C 62,3 71,11 79,18 C 87,25 96,35 96,48 C 96,61 90,72 81,81 C 72,90 59,96 48,96 C 36,96 24,91 16,82 C 8,73 3,61 4,49 C 5,36 12,24 21,17 C 30,10 39,5 50,4 Z"
            fill="url(#cleanWaxHighlight)"
          />

          {/* Sunken debossed stamp basin */}
          <circle cx="50" cy="50" r="32" fill="#11243A" stroke="#254A70" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#D4AF37" strokeWidth="0.75" strokeDasharray="2,2" opacity="0.65" />

          {/* Monogram D & L */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontStyle="italic"
            fontSize="18"
            fontWeight="bold"
            fill="url(#cleanGoldMonogram)"
            filter="url(#cleanWaxInnerShadow)"
          >
            {groomName.charAt(0)} &amp; {brideName.charAt(0)}
          </text>
          <circle cx="50" cy="62" r="1.5" fill="#E2BE75" opacity="0.85" />
        </svg>

        {/* Ambient Attention Ring */}
        <div className="absolute -inset-1 rounded-full border border-[var(--deep)] opacity-35 animate-ping pointer-events-none" />
      </button>
    </div>
  );
}
