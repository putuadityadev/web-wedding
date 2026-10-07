'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';
import { GalleryItem, HeroBackgroundMode, HeroSlideshowSource } from '@/lib/content/types';

export interface HeroProps {
  badge?: string;
  groomName: string;
  brideName: string;
  subtitle?: string;
  dateShort?: string;
  portraitSrc?: string;
  portraitAlt?: string;
  scrollHint?: string;
  imageAvif?: string;
  imageWebp?: string;
  imageSrc?: string;
  videoSrc?: string;
  posterSrc?: string;
  // Multi-mode Background Options
  bgMode?: HeroBackgroundMode;
  slideshowSource?: HeroSlideshowSource;
  slideshowImages?: string[];
  slideshowDuration?: number;
  galleryItems?: GalleryItem[];
}

export function Hero({
  badge = 'THE WEDDING OF',
  groomName,
  brideName,
  subtitle,
  dateShort = 'SENIN, 12 OKTOBER 2026',
  portraitSrc,
  portraitAlt,
  scrollHint = 'GULIR',
  imageAvif = '/KLK07943.avif',
  imageWebp = '/KLK07943.webp',
  imageSrc = '/KLK07943.jpg',
  videoSrc,
  posterSrc,
  bgMode = 'image',
  slideshowSource = 'gallery',
  slideshowImages = [],
  slideshowDuration = 5,
  galleryItems = [],
}: HeroProps) {
  const { lenis } = useLenisContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const headerWrapRef = useRef<HTMLDivElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  // 1. Entrance & Parallax Motion
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Entrance choreography on mount
      const tlEnter = gsap.timeline({ delay: 0.2 });

      tlEnter.fromTo(
        videoWrapRef.current,
        { scale: 1.08, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' }
      );

      if (headerWrapRef.current) {
        tlEnter.fromTo(
          headerWrapRef.current,
          {
            opacity: 0,
            y: -24,
            filter: 'blur(6px)',
          },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.3,
            ease: 'power3.out',
          },
          '-=1.1'
        );
      }

      if (bottomBarRef.current) {
        tlEnter.fromTo(
          bottomBarRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
          '-=0.8'
        );
      }

      // High-end ScrollTrigger Parallax & Fade
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.0,
        },
      });

      if (videoWrapRef.current) {
        scrollTl.to(
          videoWrapRef.current,
          {
            scale: 1.12,
            y: '6vh',
            ease: 'none',
          },
          0
        );
      }

      if (headerWrapRef.current) {
        scrollTl.to(
          headerWrapRef.current,
          {
            y: -40,
            opacity: 0,
            ease: 'none',
          },
          0
        );
      }

      if (bottomBarRef.current) {
        scrollTl.to(
          bottomBarRef.current,
          {
            opacity: 0,
            y: 20,
            ease: 'none',
          },
          0
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 2. Video Detection
  const isVideoMode =
    bgMode === 'video' ||
    Boolean(videoSrc) ||
    Boolean(portraitSrc && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(portraitSrc));
  const activeVideoSrc = videoSrc || (isVideoMode ? portraitSrc : undefined);

  // 3. Slideshow Images Resolution (Custom selection or Auto-shuffle gallery)
  const isSlideshowMode = bgMode === 'slideshow';

  const slides = useMemo(() => {
    if (!isSlideshowMode) return [];

    if (slideshowSource === 'custom' && slideshowImages && slideshowImages.length > 0) {
      return slideshowImages;
    }

    // Auto-shuffle from gallery items
    const photoUrls = (galleryItems || [])
      .filter((it) => it.mediaType !== 'video' && !it.videoSrc && Boolean(it.src))
      .map((it) => it.src);

    if (photoUrls.length > 0) {
      return photoUrls;
    }

    // Fallback to single portrait
    return [portraitSrc || imageSrc || '/KLK07943.jpg'];
  }, [isSlideshowMode, slideshowSource, slideshowImages, galleryItems, portraitSrc, imageSrc]);

  // 4. Cinematic Morphing Slideshow Engine
  const [slideIndex, setSlideIndex] = useState(0);
  const durationSec = Math.max(2, Math.min(20, slideshowDuration || 5));

  useEffect(() => {
    if (!isSlideshowMode || slides.length <= 1) return;

    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, durationSec * 1000);

    return () => clearInterval(interval);
  }, [isSlideshowMode, slides.length, durationSec]);

  const coupleNames = `${groomName || 'Dharma'} & ${brideName || 'Lutfhy'}`;

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden select-none bg-[var(--ink)] text-white"
    >
      {/* 1. Cinematic Background Media Layer with Lightroom-style Soft Fog / White Mist */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 w-full h-full pointer-events-none origin-center transform-gpu"
      >
        {/* MODE A: VIDEO BACKGROUND */}
        {isSlideshowMode ? (
          /* MODE B: CINEMATIC MORPHING SLIDESHOW */
          <div className="relative w-full h-full overflow-hidden">
            {slides.map((slideUrl, idx) => {
              const isActive = idx === slideIndex;

              return (
                <div
                  key={`${slideUrl}-${idx}`}
                  className="absolute inset-0 w-full h-full transform-gpu transition-opacity pointer-events-none"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 2 : 1,
                    transitionDuration: '1800ms',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <img
                    src={slideUrl}
                    alt={`${coupleNames} - Momen ${idx + 1}`}
                    className={`w-full h-full object-cover object-[center_35%] sm:object-[center_30%] filter brightness-[0.88] contrast-[1.04] select-none transform-gpu transition-transform ease-out ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                    style={{
                      transitionDuration: `${durationSec + 1.8}s`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : activeVideoSrc ? (
          <video
            ref={videoRef}
            src={activeVideoSrc}
            poster={posterSrc || imageAvif}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.04]"
          />
        ) : (
          /* MODE C: SINGLE PORTRAIT PHOTO */
          <picture className="block w-full h-full">
            {!portraitSrc && imageAvif && <source srcSet={imageAvif} type="image/avif" />}
            {!portraitSrc && imageWebp && <source srcSet={imageWebp} type="image/webp" />}
            <img
              src={portraitSrc || imageSrc}
              alt={portraitAlt || coupleNames}
              className="w-full h-full object-cover object-[center_35%] sm:object-[center_30%] filter brightness-[0.88] contrast-[1.04] select-none"
            />
          </picture>
        )}

        {/* Base contrast gradient for crisp text legibility over any background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/50" />

        {/* 
          Lightroom-style cinematic gradient: 
          Soft white mist / ethereal sunlit fog bloom across the upper screen
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 48% at 50% 0%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          }}
        />

        {/* Subtle atmospheric vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,27,45,0.4)_100%)]" />
      </div>

      {/* 
        2. Editorial Centered Minimalist Typography at the Top
        Matches reference photo layout (Mobile & Desktop perfectly centered)
      */}
      <div
        ref={headerWrapRef}
        className="relative z-10 w-full pt-10 sm:pt-14 md:pt-16 px-6 max-w-4xl mx-auto flex flex-col items-center text-center pointer-events-none"
      >
        {/* Eyebrow: THE WEDDING OF */}
        <span className="label-eyebrow tracking-[0.32em] text-white/90 text-[10px] sm:text-[11px] md:text-xs font-mono uppercase mb-2 sm:mb-2.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
          {badge || 'THE WEDDING OF'}
        </span>

        {/* Couple Names: Yoga & Putri / Dharma & Lutfhy */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-normal tracking-tight my-1 sm:my-2 leading-[1.1] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]">
          {coupleNames}
        </h1>

        {/* Date: SENIN, 12 OKTOBER 2026 */}
        <span className="label-eyebrow tracking-[0.26em] text-white/85 text-[10px] sm:text-[11px] font-mono uppercase mt-2 sm:mt-2.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
          {dateShort || 'SENIN, 12 OKTOBER 2026'}
        </span>
      </div>

      {/* 3. Bottom Scroll Indicator (Minimalist circular chevron button, reference layout) */}
      <div
        ref={bottomBarRef}
        className="relative z-10 w-full pb-8 sm:pb-12 px-6 flex flex-col items-center justify-center"
      >
        <button
          type="button"
          onClick={() => {
            if (lenis) {
              lenis.scrollTo('#quote', { duration: 1.0 });
            } else {
              const target = document.getElementById('quote');
              target?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="group w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#0F1B2D] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-sm cursor-pointer"
          aria-label="Gulir ke konten undangan"
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5"
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
