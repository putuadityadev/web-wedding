'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';

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
}

export function Hero({
  badge = 'THE WEDDING OF',
  groomName,
  brideName,
  subtitle = 'DUA GARIS · SATU BENANG PERJALANAN',
  dateShort = '12 · 12 · 2026',
  portraitSrc,
  portraitAlt,
  scrollHint = 'GULIR',
  imageAvif = '/KLK07943.avif',
  imageWebp = '/KLK07943.webp',
  imageSrc = '/KLK07943.jpg',
  videoSrc,
  posterSrc,
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const title1Ref = useRef<HTMLHeadingElement | null>(null);
  const title2Ref = useRef<HTMLHeadingElement | null>(null);
  const ampersandRef = useRef<HTMLSpanElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Set 3D perspective on container
      gsap.set(container, { perspective: 1200 });

      // Entrance sequence on load
      const tlEnter = gsap.timeline({ delay: 0.2 });

      tlEnter.fromTo(
        videoWrapRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.8, ease: 'power3.out' }
      );

      tlEnter.fromTo(
        topBarRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=1.2'
      );

      tlEnter.fromTo(
        [title1Ref.current, title2Ref.current],
        {
          opacity: 0,
          y: 70,
          rotateX: 25,
          filter: 'blur(8px)',
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 1.4,
          stagger: 0.18,
          ease: 'power4.out',
        },
        '-=1.0'
      );

      tlEnter.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.8'
      );

      tlEnter.fromTo(
        bottomBarRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        '-=0.8'
      );

      // Awwwards-style 3D ScrollTrigger Scrub
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // Background video slow cinematic zoom & gentle blur
      scrollTl.to(
        videoWrapRef.current,
        {
          scale: 1.18,
          y: '8vh',
          filter: 'blur(6px)',
          ease: 'none',
        },
        0
      );

      // Title 1 slides left with subtle 3D rotation
      scrollTl.to(
        title1Ref.current,
        {
          x: '-12vw',
          rotateY: -8,
          opacity: 0.25,
          ease: 'none',
        },
        0
      );

      // Title 2 slides right with subtle 3D rotation
      scrollTl.to(
        title2Ref.current,
        {
          x: '12vw',
          rotateY: 8,
          opacity: 0.25,
          ease: 'none',
        },
        0
      );

      // Ampersand subtle spin & depth recession
      if (ampersandRef.current) {
        scrollTl.to(
          ampersandRef.current,
          {
            rotate: 25,
            scale: 0.8,
            ease: 'none',
          },
          0
        );
      }

      // Subtitle fade
      scrollTl.to(
        subtitleRef.current,
        {
          opacity: 0,
          y: -30,
          ease: 'none',
        },
        0
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const isVideo =
    Boolean(videoSrc) ||
    Boolean(portraitSrc && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(portraitSrc));
  const activeVideoSrc = videoSrc || (isVideo ? portraitSrc : undefined);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[100svh] w-full flex flex-col justify-between overflow-hidden select-none bg-[var(--ink)] text-white"
    >
      {/* 1. Cinematic Background Media Layer: Ultra-Crisp Editorial AVIF */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 w-full h-full pointer-events-none origin-center transform-gpu"
      >
        {activeVideoSrc ? (
          <video
            ref={videoRef}
            src={activeVideoSrc}
            poster={posterSrc || imageAvif}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.08] saturate-[0.9]"
          />
        ) : (
          <picture className="block w-full h-full">
            {!portraitSrc && imageAvif && <source srcSet={imageAvif} type="image/avif" />}
            {!portraitSrc && imageWebp && <source srcSet={imageWebp} type="image/webp" />}
            <img
              src={portraitSrc || imageSrc}
              alt={portraitAlt || `${groomName} & ${brideName}`}
              className="w-full h-full object-cover object-[center_28%] sm:object-[center_32%] filter brightness-[0.84] contrast-[1.05] select-none"
            />
          </picture>
        )}

        {/* Quiet Luxury Overlays: Soft vignette & subtle gradient for unmatched typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,27,45,0.5)_100%)]" />
      </div>

      {/* 2. Top Eyebrow Bar (Elevated high with no fixed buttons obstructing) */}
      <div
        ref={topBarRef}
        className="relative z-10 w-full pt-8 sm:pt-10 md:pt-12 px-[var(--gutter)] max-w-7xl mx-auto flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
          <span className="label-eyebrow tracking-[0.28em] text-white/85 text-[11px] sm:text-xs uppercase">
            {badge}
          </span>
        </div>

        <div className="label-eyebrow tracking-[0.25em] text-white/75 text-[11px] sm:text-xs font-mono">
          {dateShort}
        </div>
      </div>

      {/* 3. Center Pure Editorial Titles (No container image box - clean, grand, poezabride aesthetic) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-[var(--gutter)] my-auto py-12 flex flex-col justify-center">
        {/* Dharma */}
        <div className="overflow-visible">
          <h1
            ref={title1Ref}
            className="display-xl font-serif text-white tracking-[-0.02em] leading-[0.88] text-left transform-gpu origin-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            {groomName}
          </h1>
        </div>

        {/* Delicate poetic middle line */}
        <div
          ref={subtitleRef}
          className="py-4 sm:py-6 pl-2 sm:pl-6 flex items-center gap-4 text-white/75"
        >
          <div className="w-12 sm:w-20 h-[1px] bg-white/40" />
          <span className="label-eyebrow tracking-[0.28em] text-[10px] sm:text-[11px] text-[var(--baby-blue)] uppercase">
            {subtitle}
          </span>
        </div>

        {/* & Lutfhy */}
        <div className="overflow-visible flex items-baseline justify-end sm:justify-start sm:pl-24 md:pl-48">
          <h2
            ref={title2Ref}
            className="display-xl font-serif text-white tracking-[-0.02em] leading-[0.88] transform-gpu origin-right drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-baseline gap-3 sm:gap-6"
          >
            <span
              ref={ampersandRef}
              className="font-serif italic text-[var(--baby-blue)] inline-block transform-gpu"
            >
              &amp;
            </span>
            <span>{brideName}</span>
          </h2>
        </div>
      </div>

      {/* 4. Bottom Scroll Prompt Only (Ultra Clean & Minimalist) */}
      <div
        ref={bottomBarRef}
        className="relative z-10 w-full pb-8 sm:pb-10 px-[var(--gutter)] max-w-7xl mx-auto flex items-center justify-center pointer-events-none"
      >
        <div className="flex items-center gap-3 label-eyebrow tracking-[0.28em] text-white/75 text-[10px] sm:text-xs">
          <span>{scrollHint}</span>
          <div className="w-8 sm:w-12 h-[1px] bg-white/30 relative overflow-hidden">
            <div className="w-full h-full bg-[var(--baby-blue)] animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
