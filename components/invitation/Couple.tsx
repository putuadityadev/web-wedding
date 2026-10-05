'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { MediaFrame } from './MediaFrame';

export interface CoupleMember {
  name: string;
  childOf: string;
  bio: string;
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
  groom: CoupleMember;
  bride: CoupleMember;
}

export function Couple({
  sectionLabel,
  sectionTitle,
  sectionDesc,
  groomLabel = 'MEMPELAI PRIA',
  brideLabel = 'MEMPELAI WANITA',
  groom,
  bride,
}: CoupleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groomCardRef = useRef<HTMLDivElement | null>(null);
  const brideCardRef = useRef<HTMLDivElement | null>(null);
  const numeral1Ref = useRef<HTMLSpanElement | null>(null);
  const numeral2Ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.set(container, { perspective: 1200 });

      // 3D Parallax scrub on portraits
      gsap.to(groomCardRef.current, {
        y: '-6vh',
        rotateY: 4,
        rotateX: -2,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      gsap.to(brideCardRef.current, {
        y: '6vh',
        rotateY: -4,
        rotateX: 2,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // Floating Roman Numerals with 3D depth
      gsap.to([numeral1Ref.current, numeral2Ref.current], {
        y: '-30px',
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

      // 3D Text Reveal
      gsap.fromTo(
        '.couple-text-reveal',
        {
          opacity: 0,
          y: 40,
          rotateX: 20,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 70%',
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
      id="couple"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Optional Editorial Header */}
        {(sectionLabel || sectionTitle) && (
          <div className="mb-14 md:mb-20 text-center max-w-2xl mx-auto">
            {sectionLabel && (
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
                <span className="label-eyebrow tracking-[0.25em] text-[11px] text-[var(--ink)] opacity-60 uppercase">
                  {sectionLabel}
                </span>
              </div>
            )}
            {sectionTitle && (
              <h2 className="display-l font-serif text-3xl sm:text-4xl text-[var(--ink)] tracking-[-0.01em]">
                {sectionTitle}
              </h2>
            )}
            {sectionDesc && (
              <p className="body-base text-[var(--ink)] opacity-70 mt-3 text-sm sm:text-base leading-relaxed">
                {sectionDesc}
              </p>
            )}
          </div>
        )}

        {/* Profiles Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start">
          {/* PROFILE I: GROOM (Left-top) */}
          <div
            ref={groomCardRef}
            className="md:col-span-5 flex flex-col md:pr-4 transform-gpu origin-center"
          >
            <div className="flex items-center gap-4 mb-5">
              <span
                ref={numeral1Ref}
                className="font-serif italic text-3xl sm:text-4xl text-[var(--deep)] inline-block transform-gpu"
              >
                I
              </span>
              <span className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.22em] uppercase">
                {groomLabel}
              </span>
            </div>

            <div className="w-full max-w-sm mb-8 drop-shadow-md">
              <MediaFrame
                src={groom.photo?.src}
                alt={groom.photo?.alt || groom.name}
                aspectRatio="4/5"
                arch={true}
                label={groom.photo?.label || `POTRET ${groom.name.split(' ')[0].toUpperCase()}`}
              />
            </div>

            <h3 className="couple-text-reveal display-l text-[var(--ink)] font-serif text-3xl sm:text-4xl md:text-5xl mb-3">
              {groom.name}
            </h3>

            <p className="couple-text-reveal label-eyebrow text-[var(--ink)] opacity-70 tracking-[0.16em] mb-4">
              {groom.childOf}
            </p>

            <p className="couple-text-reveal body-base text-[var(--ink)] opacity-80 leading-relaxed max-w-md">
              {groom.bio}
            </p>

            {/* Parents Editorial Card with Small Premium Avatar */}
            {(groom.fatherName || groom.motherName || groom.parentsAvatarSrc) && (
              <div className="mt-8 pt-6 border-t border-[var(--ink)]/15 flex items-center gap-4">
                {groom.parentsAvatarSrc ? (
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[var(--baby-blue)] p-0.5 shrink-0 shadow-xs bg-white/50">
                    <img
                      src={groom.parentsAvatarSrc}
                      alt={groom.parentsTitle || 'Orang Tua Mempelai Pria'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border border-[var(--deep)]/30 flex items-center justify-center bg-white/60 backdrop-blur-xs shrink-0 text-xs font-serif italic text-[var(--deep)] font-semibold shadow-2xs">
                    {groom.fatherName?.charAt(0) || 'W'} &amp; {groom.motherName?.charAt(0) || 'M'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="label-eyebrow text-[9.5px] tracking-[0.2em] text-[var(--deep)] font-medium uppercase">
                    {groom.parentsTitle || 'Putra Pertama Dari Pasangan:'}
                  </span>
                  <span className="font-serif text-base sm:text-lg text-[var(--ink)] font-normal mt-0.5 leading-snug">
                    {groom.fatherName && `${groom.fatherName}`}
                    {groom.fatherName && groom.motherName && ' & '}
                    {groom.motherName && `${groom.motherName}`}
                  </span>
                  <span className="text-[10px] text-[var(--ink)]/55 font-mono mt-0.5">Keluarga Mempelai Pria</span>
                </div>
              </div>
            )}
          </div>

          {/* Spacer Column in Desktop */}
          <div className="hidden md:block md:col-span-2" />

          {/* PROFILE II: BRIDE (Right-bottom, offset ~20vh) */}
          <div
            ref={brideCardRef}
            className="md:col-span-5 flex flex-col md:mt-24 lg:mt-32 md:pl-4 transform-gpu origin-center"
          >
            <div className="flex items-center gap-4 mb-5">
              <span
                ref={numeral2Ref}
                className="font-serif italic text-3xl sm:text-4xl text-[var(--deep)] inline-block transform-gpu"
              >
                II
              </span>
              <span className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.22em] uppercase">
                {brideLabel}
              </span>
            </div>

            <div className="w-full max-w-sm mb-8 drop-shadow-md">
              <MediaFrame
                src={bride.photo?.src}
                alt={bride.photo?.alt || bride.name}
                aspectRatio="4/5"
                arch={true}
                label={bride.photo?.label || `POTRET ${bride.name.split(' ')[0].toUpperCase()}`}
              />
            </div>

            <h3 className="couple-text-reveal display-l text-[var(--ink)] font-serif text-3xl sm:text-4xl md:text-5xl mb-3">
              {bride.name}
            </h3>

            <p className="couple-text-reveal label-eyebrow text-[var(--ink)] opacity-70 tracking-[0.16em] mb-4">
              {bride.childOf}
            </p>

            <p className="couple-text-reveal body-base text-[var(--ink)] opacity-80 leading-relaxed max-w-md">
              {bride.bio}
            </p>

            {/* Parents Editorial Card with Small Premium Avatar */}
            {(bride.fatherName || bride.motherName || bride.parentsAvatarSrc) && (
              <div className="mt-8 pt-6 border-t border-[var(--ink)]/15 flex items-center gap-4">
                {bride.parentsAvatarSrc ? (
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[var(--baby-blue)] p-0.5 shrink-0 shadow-xs bg-white/50">
                    <img
                      src={bride.parentsAvatarSrc}
                      alt={bride.parentsTitle || 'Orang Tua Mempelai Wanita'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border border-[var(--deep)]/30 flex items-center justify-center bg-white/60 backdrop-blur-xs shrink-0 text-xs font-serif italic text-[var(--deep)] font-semibold shadow-2xs">
                    {bride.fatherName?.charAt(0) || 'W'} &amp; {bride.motherName?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="label-eyebrow text-[9.5px] tracking-[0.2em] text-[var(--deep)] font-medium uppercase">
                    {bride.parentsTitle || 'Putri Tercinta Dari Pasangan:'}
                  </span>
                  <span className="font-serif text-base sm:text-lg text-[var(--ink)] font-normal mt-0.5 leading-snug">
                    {bride.fatherName && `${bride.fatherName}`}
                    {bride.fatherName && bride.motherName && ' & '}
                    {bride.motherName && `${bride.motherName}`}
                  </span>
                  <span className="text-[10px] text-[var(--ink)]/55 font-mono mt-0.5">Keluarga Mempelai Wanita</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
