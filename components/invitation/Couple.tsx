'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { useLenisContext } from '@/lib/motion/lenis';
import { CoupleBackgroundMode } from '@/lib/content/types';
import { MediaFrame } from './MediaFrame';

export interface CoupleMember {
  name: string;
  childOf: string;
  bio?: string;
  photo?: {
    src?: string;
    alt: string;
    aspectRatio?: string;
    label?: string;
  };
  instagram?: string;
  fatherName?: string;
  motherName?: string;
  parentsTitle?: string;
  parentsAvatarSrc?: string;
}

export interface CoupleProps {
  sectionLabel?: string;
  sectionTitle?: string;
  sectionDesc?: string;
  groomLabel?: string;
  brideLabel?: string;
  bgMode?: CoupleBackgroundMode;
  groom: CoupleMember;
  bride: CoupleMember;
}

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 6L8 10.5L12.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Couple({
  groomLabel = 'MEMPELAI PRIA',
  brideLabel = 'MEMPELAI WANITA',
  bgMode = 'image',
  groom,
  bride,
}: CoupleProps) {
  const { lenis } = useLenisContext();
  const groomSectionRef = useRef<HTMLElement | null>(null);
  const brideSectionRef = useRef<HTMLElement | null>(null);

  const isImageMode = bgMode === 'image';

  // GSAP subtle entrance animations
  useEffect(() => {
    const groomSec = groomSectionRef.current;
    const brideSec = brideSectionRef.current;
    if (!groomSec || !brideSec) return;

    const ctx = gsap.context(() => {
      // Groom reveal
      gsap.fromTo(
        groomSec.querySelectorAll('.couple-reveal'),
        {
          opacity: 0,
          y: 24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: groomSec,
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Bride reveal
      gsap.fromTo(
        brideSec.querySelectorAll('.couple-reveal'),
        {
          opacity: 0,
          y: 24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: brideSec,
            start: 'top 75%',
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleScrollTo = (targetId: string) => {
    if (lenis) {
      lenis.scrollTo(targetId, { duration: 0.95 });
    } else {
      const el = document.querySelector(targetId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to format parent names cleanly
  const getParentsLine = (person: CoupleMember) => {
    if (person.fatherName && person.motherName) {
      return `Bapak ${person.fatherName} & Ibu ${person.motherName}`;
    }
    if (person.fatherName) return `Bapak ${person.fatherName}`;
    if (person.motherName) return `Ibu ${person.motherName}`;
    return null;
  };

  const groomParents = getParentsLine(groom);
  const brideParents = getParentsLine(bride);

  return (
    <>
      {/* ========================================================
          CHAPTER I: MEMPELAI PRIA (100% DVH FULL-SCREEN CHAPTER)
          ======================================================== */}
      <section
        ref={groomSectionRef}
        id="couple"
        className={`relative w-full min-h-[100dvh] flex flex-col justify-center items-center select-none overflow-hidden transition-colors px-6 py-20 sm:py-28 md:py-32 sm:px-12 ${
          isImageMode
            ? 'bg-[#0A121E] text-white'
            : 'bg-[var(--paper)] text-[var(--ink)]'
        }`}
      >
        {/* MODE A: FULL BLEED BACKGROUND PHOTO (Like reference image) */}
        {isImageMode && groom.photo?.src && (
          <div className="absolute inset-0 w-full h-full pointer-events-none origin-center">
            <img
              src={groom.photo.src}
              alt={groom.photo.alt || groom.name}
              className="w-full h-full object-cover object-[center_28%] sm:object-[center_25%] filter brightness-[0.82] contrast-[1.05]"
            />
            {/* Cinematic contrast gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
          </div>
        )}

        {/* Framing Content Container (Clean, Minimalist, No Clutter) */}
        <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto px-4">
          {/* MODE B ONLY: Elegant Portrait Arch Frame on Paper */}
          {!isImageMode && (
            <div className="couple-reveal w-full max-w-[200px] sm:max-w-[230px] aspect-[3/4] max-h-[32vh] drop-shadow-md mx-auto mb-4">
              <MediaFrame
                src={groom.photo?.src}
                alt={groom.photo?.alt || groom.name}
                aspectRatio="3/4"
                arch={true}
                label={groom.photo?.label || `POTRET ${groom.name.split(' ')[0].toUpperCase()}`}
                className="shadow-[0_8px_24px_rgba(15,27,45,0.08)] border border-[var(--baby-blue)]/30"
              />
            </div>
          )}

          {/* Chapter Eyebrow */}
          <div className="couple-reveal inline-flex items-center gap-2 mb-2 sm:mb-3">
            <span
              className={`font-serif italic text-base sm:text-lg ${
                isImageMode ? 'text-white/80' : 'text-[var(--deep)]'
              }`}
            >
              I
            </span>
            <span
              className={`w-1 h-1 rounded-full ${
                isImageMode ? 'bg-white/60' : 'bg-[var(--baby-blue)]'
              }`}
            />
            <span
              className={`label-eyebrow text-[10px] sm:text-[11px] tracking-[0.26em] uppercase ${
                isImageMode ? 'text-white/85 drop-shadow-sm' : 'text-[var(--ink)]/70'
              }`}
            >
              {groomLabel}
            </span>
          </div>

          {/* Stately Full Name */}
          <h2
            className={`couple-reveal font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-2 leading-tight ${
              isImageMode
                ? 'text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]'
                : 'text-[var(--ink)]'
            }`}
          >
            {groom.name}
          </h2>

          {/* Child of / Lineage line */}
          <p
            className={`couple-reveal text-xs sm:text-sm md:text-base font-light tracking-wide max-w-md mx-auto leading-relaxed ${
              isImageMode
                ? 'text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
                : 'text-[var(--ink)]/80'
            }`}
          >
            {groom.childOf || (groomParents ? `Putra dari ${groomParents}` : '')}
          </p>

          {/* Instagram Handle Chip (Clean, Minimalist) */}
          {groom.instagram && (
            <div className="couple-reveal mt-4">
              <a
                href={`https://instagram.com/${groom.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition-all duration-300 ${
                  isImageMode
                    ? 'bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 backdrop-blur-md shadow-sm'
                    : 'bg-white hover:bg-stone-50 text-[var(--ink)] border border-[var(--ink)]/15 shadow-2xs'
                }`}
              >
                <InstagramIcon className="w-3.5 h-3.5 opacity-80" />
                <span>@{groom.instagram.replace(/^@/, '')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Bottom Glide Chevron Button to Mempelai Wanita */}
        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-10 flex justify-center">
          <button
            type="button"
            onClick={() => handleScrollTo('#bride')}
            className={`group w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
              isImageMode
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
                : 'bg-white/90 hover:bg-white text-[var(--ink)] border border-[var(--ink)]/15'
            }`}
            aria-label="Gulir ke Mempelai Wanita"
          >
            <ChevronDownIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        </div>
      </section>

      {/* ========================================================
          CHAPTER II: MEMPELAI WANITA (100% DVH FULL-SCREEN CHAPTER)
          ======================================================== */}
      <section
        ref={brideSectionRef}
        id="bride"
        className={`relative w-full min-h-[100dvh] flex flex-col justify-center items-center select-none overflow-hidden transition-colors px-6 py-20 sm:py-28 md:py-32 sm:px-12 ${
          isImageMode
            ? 'bg-[#0A121E] text-white'
            : 'bg-[var(--paper)] text-[var(--ink)]'
        }`}
      >
        {/* MODE A: FULL BLEED BACKGROUND PHOTO (Like reference image) */}
        {isImageMode && bride.photo?.src && (
          <div className="absolute inset-0 w-full h-full pointer-events-none origin-center">
            <img
              src={bride.photo.src}
              alt={bride.photo.alt || bride.name}
              className="w-full h-full object-cover object-[center_28%] sm:object-[center_25%] filter brightness-[0.82] contrast-[1.05]"
            />
            {/* Cinematic contrast gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
          </div>
        )}

        {/* Framing Content Container (Clean, Minimalist, No Clutter) */}
        <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto px-4">
          {/* MODE B ONLY: Elegant Portrait Arch Frame on Paper */}
          {!isImageMode && (
            <div className="couple-reveal w-full max-w-[200px] sm:max-w-[230px] aspect-[3/4] max-h-[32vh] drop-shadow-md mx-auto mb-4">
              <MediaFrame
                src={bride.photo?.src}
                alt={bride.photo?.alt || bride.name}
                aspectRatio="3/4"
                arch={true}
                label={bride.photo?.label || `POTRET ${bride.name.split(' ')[0].toUpperCase()}`}
                className="shadow-[0_8px_24px_rgba(15,27,45,0.08)] border border-[var(--baby-blue)]/30"
              />
            </div>
          )}

          {/* Chapter Eyebrow */}
          <div className="couple-reveal inline-flex items-center gap-2 mb-2 sm:mb-3">
            <span
              className={`font-serif italic text-base sm:text-lg ${
                isImageMode ? 'text-white/80' : 'text-[var(--deep)]'
              }`}
            >
              II
            </span>
            <span
              className={`w-1 h-1 rounded-full ${
                isImageMode ? 'bg-white/60' : 'bg-[var(--baby-blue)]'
              }`}
            />
            <span
              className={`label-eyebrow text-[10px] sm:text-[11px] tracking-[0.26em] uppercase ${
                isImageMode ? 'text-white/85 drop-shadow-sm' : 'text-[var(--ink)]/70'
              }`}
            >
              {brideLabel}
            </span>
          </div>

          {/* Stately Full Name */}
          <h2
            className={`couple-reveal font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-2 leading-tight ${
              isImageMode
                ? 'text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]'
                : 'text-[var(--ink)]'
            }`}
          >
            {bride.name}
          </h2>

          {/* Child of / Lineage line */}
          <p
            className={`couple-reveal text-xs sm:text-sm md:text-base font-light tracking-wide max-w-md mx-auto leading-relaxed ${
              isImageMode
                ? 'text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
                : 'text-[var(--ink)]/80'
            }`}
          >
            {bride.childOf || (brideParents ? `Putri dari ${brideParents}` : '')}
          </p>

          {/* Instagram Handle Chip (Clean, Minimalist) */}
          {bride.instagram && (
            <div className="couple-reveal mt-4">
              <a
                href={`https://instagram.com/${bride.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition-all duration-300 ${
                  isImageMode
                    ? 'bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 backdrop-blur-md shadow-sm'
                    : 'bg-white hover:bg-stone-50 text-[var(--ink)] border border-[var(--ink)]/15 shadow-2xs'
                }`}
              >
                <InstagramIcon className="w-3.5 h-3.5 opacity-80" />
                <span>@{bride.instagram.replace(/^@/, '')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Bottom Glide Chevron Button to Story Section */}
        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-10 flex justify-center">
          <button
            type="button"
            onClick={() => handleScrollTo('#story')}
            className={`group w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
              isImageMode
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25'
                : 'bg-white/90 hover:bg-white text-[var(--ink)] border border-[var(--ink)]/15'
            }`}
            aria-label="Gulir ke Cerita Perjalanan"
          >
            <ChevronDownIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </button>
        </div>
      </section>
    </>
  );
}
