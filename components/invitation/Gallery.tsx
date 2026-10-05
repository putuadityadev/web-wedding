'use client';

import React, { useRef, useEffect } from 'react';
import { registerGSAP, gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { MediaFrame } from './MediaFrame';

export interface GalleryItem {
  id: number | string;
  label: string;
  type: string;
  title: string;
  aspectRatio: string;
  src?: string;
}

export interface GalleryProps {
  sectionLabel?: string;
  sectionTitle?: string;
  sectionDesc?: string;
  items: GalleryItem[];
}

export function Gallery({
  sectionLabel = 'GALERI KENANGAN',
  sectionTitle,
  sectionDesc,
  items,
}: GalleryProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGSAP();

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    let ctx: gsap.Context | null = null;

    // Small delay to ensure layout and image containers are measured accurately
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Calculate the total horizontal distance the track needs to travel
        const getScrollDistance = () => {
          return track.scrollWidth - window.innerWidth + window.innerWidth * 0.15;
        };

        // Main Pin & Horizontal Translation Timeline
        const horizontalTween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Update bottom progress bar
              if (progressBarRef.current) {
                progressBarRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        // Awwwards-style individual card blur & scale entry using containerAnimation
        cardsRef.current.forEach((card) => {
          if (!card) return;

          gsap.fromTo(
            card,
            {
              filter: 'blur(14px)',
              opacity: 0.25,
              scale: 0.9,
              y: 20,
            },
            {
              filter: 'blur(0px)',
              opacity: 1,
              scale: 1,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween,
                start: 'left 92%',
                end: 'left 55%',
                scrub: 1,
              },
            }
          );
        });
      }, sectionRef);

      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(timer);
      ctx?.revert();
    };
  }, [items.length]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative w-full h-[100svh] bg-[var(--paper)] select-none overflow-hidden flex flex-col justify-between py-6 sm:py-8"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto px-[var(--gutter)] pt-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
          <span className="label-eyebrow tracking-[0.25em] text-[11px] text-[var(--ink)] opacity-70 uppercase">
            {sectionLabel}
          </span>
        </div>
        {sectionTitle && (
          <span className="font-serif italic text-sm sm:text-base text-[var(--ink)] opacity-70 hidden sm:inline-block">
            {sectionTitle}
          </span>
        )}
      </div>

      {/* Pinned Horizontal Gallery Track (Full Screen Immersion) */}
      <div className="relative w-full my-auto overflow-visible z-10 flex items-center">
        <div
          ref={trackRef}
          className="flex gap-8 sm:gap-14 md:gap-20 items-center pl-[var(--gutter)] will-change-transform"
        >
          {items.map((item, index) => {
            const isOffset = index % 2 === 1;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className={`flex-none w-[270px] sm:w-[340px] md:w-[420px] lg:w-[460px] flex flex-col will-change-[transform,filter,opacity] ${
                  isOffset ? 'translate-y-4 sm:translate-y-8' : '-translate-y-4 sm:-translate-y-6'
                }`}
              >
                {/* Image Frame with subtle shadow & architectural styling */}
                <div className="w-full mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[var(--radius-sm)] overflow-hidden">
                  <MediaFrame
                    src={item.src}
                    alt={item.title}
                    aspectRatio={item.aspectRatio || '4/5'}
                    label={item.label}
                    arch={item.type === 'portrait' && index % 3 === 0}
                  />
                </div>

                {/* Caption Row */}
                <div className="flex items-baseline justify-between pt-2 border-t border-[var(--hairline)] px-1">
                  <span className="font-serif italic text-lg sm:text-xl text-[var(--ink)]">
                    {item.title}
                  </span>
                  <span className="label-eyebrow text-[var(--ink)] opacity-50 text-[10px] tracking-[0.18em]">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discreet Centered Progress Bar (Zero Collision with Fixed Badges) */}
      <div className="w-full max-w-xs sm:max-w-sm mx-auto px-6 z-20 pointer-events-none pb-2">
        <div className="w-full h-[2px] bg-[var(--hairline)]/80 relative rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="absolute top-0 bottom-0 left-0 w-full bg-[var(--deep)] origin-left scale-x-0 transition-transform duration-75"
          />
        </div>
      </div>
    </section>
  );
}
