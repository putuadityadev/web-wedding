'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenisContext } from '@/lib/motion/lenis';
import { gsap } from '@/lib/motion/gsap';

interface PersistentBarProps {
  audioSrc?: string;
  isUnlocked: boolean;
  dateFormatted?: string;
  coupleNames?: string;
  showGift?: boolean;
}

const ALL_MENU_ITEMS = [
  { label: 'Pembuka', href: '#hero' },
  { label: 'Tentang Kami', href: '#couple' },
  { label: 'Cerita', href: '#story' },
  { label: 'Acara & Lokasi', href: '#event' },
  { label: 'Galeri Momen', href: '#gallery' },
  { label: 'Kirim Hadiah', href: '#gift' },
  { label: 'Konfirmasi RSVP', href: '#rsvp' },
  { label: 'Dinding Ucapan', href: '#wishes' },
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export function PersistentBar({
  audioSrc,
  isUnlocked,
  dateFormatted = 'SABTU, 17 OKTOBER 2026',
  coupleNames = 'DHARMA & LUTHFI',
  showGift = true,
}: PersistentBarProps) {
  const { lenis } = useLenisContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPastHero, setIsPastHero] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const menuItems = ALL_MENU_ITEMS
    .filter((item) => showGift || item.href !== '#gift')
    .map((item, index) => ({
      ...item,
      numeral: ROMAN_NUMERALS[index] || `${index + 1}`,
    }));

  // Native window scroll listener for Hero threshold detection
  useEffect(() => {
    const checkScroll = () => {
      const heroThreshold = window.innerHeight * 0.4;
      setIsPastHero(window.scrollY > heroThreshold);
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  // Lenis Scroll Progress & Hero threshold sync
  useEffect(() => {
    if (!lenis) return;
    const onScroll = (e: { progress: number; scroll: number }) => {
      setScrollProgress(e.progress);
      const heroThreshold = window.innerHeight * 0.4;
      setIsPastHero(e.scroll > heroThreshold);
    };
    lenis.on('scroll', onScroll);
    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [lenis]);

  // Audio initialization when cover unlocks
  useEffect(() => {
    if (isUnlocked && audioSrc && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isUnlocked, audioSrc]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    if (lenis) {
      lenis.scrollTo(href, { offset: 0, duration: 1.2 });
    } else {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Menu overlay animation
  useEffect(() => {
    if (!overlayRef.current) return;
    if (isMenuOpen) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, pointerEvents: 'none' },
        { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.menu-overlay-item',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.1 }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isMenuOpen]);

  if (!isUnlocked) return null;

  return (
    <>
      {/* 1px Scroll Progress Line at top - Only after Hero */}
      <div
        className={`fixed top-0 left-0 right-0 h-[2px] bg-[var(--hairline)] z-50 pointer-events-none transition-opacity duration-500 ${
          isPastHero ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-[var(--baby-blue)] transition-all duration-75 origin-left"
          style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
        />
      </div>

      {/* Top Bar: RSVP button (left) & MENU button (right) - Only appears after scrolling past Hero */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 px-[var(--gutter)] py-5 flex items-center justify-between pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isPastHero ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
        }`}
      >
        {/* Left: RSVP Quick Link */}
        <button
          type="button"
          onClick={() => handleNavClick('#rsvp')}
          className="pointer-events-auto label-eyebrow text-[var(--ink)] bg-white/90 backdrop-blur-md px-4 py-2 border border-[var(--ink)]/15 rounded-[var(--radius-sm)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:bg-white hover:border-[var(--ink)] transition-all duration-300 tracking-[0.22em] text-[10px] sm:text-[11px]"
        >
          RSVP
        </button>

        {/* Right: MENU toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto label-eyebrow text-[var(--ink)] bg-white/90 backdrop-blur-md px-4 py-2 border border-[var(--ink)]/15 rounded-[var(--radius-sm)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:bg-white hover:border-[var(--ink)] transition-all duration-300 tracking-[0.22em] flex items-center gap-2 text-[10px] sm:text-[11px]"
          aria-label="Buka Menu Navigasi"
        >
          <span>MENU</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep)]" />
        </button>
      </header>

      {/* Bottom-left: Audio Toggle - Only appears after scrolling past Hero */}
      {audioSrc && (
        <aside
          className={`fixed bottom-6 left-[var(--gutter)] z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isPastHero ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <audio ref={audioRef} src={audioSrc} loop preload="auto" />
          <button
            type="button"
            onClick={toggleMusic}
            className="flex items-center gap-3 px-3.5 py-2.5 bg-white/90 backdrop-blur-md border border-[var(--ink)]/15 rounded-[var(--radius-sm)] text-[var(--ink)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:bg-white transition-all duration-300 select-none"
            aria-label={isPlaying ? 'Heningkan musik' : 'Putar musik'}
          >
            <div className="flex items-center gap-1 h-3.5 w-3.5 justify-center">
              {isPlaying ? (
                <>
                  <div className="wave-bar bg-[var(--ink)]" />
                  <div className="wave-bar bg-[var(--ink)]" />
                  <div className="wave-bar bg-[var(--ink)]" />
                </>
              ) : (
                <div className="w-2.5 h-[1px] bg-[var(--ink)]" />
              )}
            </div>
            <span className="label-eyebrow text-[10px] tracking-[0.18em]">
              {isPlaying ? 'MUSIK' : 'SENYAP'}
            </span>
          </button>
        </aside>
      )}

      {/* Fullscreen Editorial Menu Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between px-[var(--gutter)] py-8 md:py-12 opacity-0 pointer-events-none"
      >
        <div className="flex items-center justify-between">
          <span className="label-eyebrow tracking-[0.25em] text-[var(--deep)]">
            NAVIGASI
          </span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="label-eyebrow tracking-[0.2em] px-4 py-2 border border-[var(--ink)] rounded-[var(--radius-sm)] hover:bg-[var(--mist)] transition-colors"
          >
            TUTUP [ESC]
          </button>
        </div>

        <nav className="my-auto py-8">
          <ul className="flex flex-col gap-4 md:gap-6 max-w-2xl">
            {menuItems.map((item) => (
              <li key={item.href} className="menu-overlay-item flex items-baseline gap-4 md:gap-6 border-b border-[var(--hairline)] pb-3">
                <span className="label-eyebrow text-[var(--deep)] opacity-60 w-8">
                  {item.numeral}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className="font-serif text-3xl md:text-5xl hover:italic hover:text-[var(--deep)] transition-all text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between text-[11px] label-eyebrow text-[var(--ink)] opacity-50">
          <span>{coupleNames.toUpperCase()}</span>
          <span>{dateFormatted.toUpperCase()}</span>
        </div>
      </div>
    </>
  );
}
