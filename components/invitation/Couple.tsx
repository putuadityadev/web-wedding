'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { MediaFrame } from './MediaFrame';

interface CoupleMember {
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
}

interface CoupleProps {
  groom: CoupleMember;
  bride: CoupleMember;
}

export function Couple({ groom, bride }: CoupleProps) {
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
              <span className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.22em]">
                MEMPELAI PRIA
              </span>
            </div>

            <div className="w-full max-w-sm mb-8 drop-shadow-md">
              <MediaFrame
                src={groom.photo?.src}
                alt={groom.photo?.alt || groom.name}
                aspectRatio="4/5"
                arch={true}
                label={groom.photo?.label || 'POTRET DHARMA'}
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
              <span className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.22em]">
                MEMPELAI WANITA
              </span>
            </div>

            <div className="w-full max-w-sm mb-8 drop-shadow-md">
              <MediaFrame
                src={bride.photo?.src}
                alt={bride.photo?.alt || bride.name}
                aspectRatio="4/5"
                arch={true}
                label={bride.photo?.label || 'POTRET LUTFHY'}
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
          </div>
        </div>
      </div>
    </section>
  );
}
