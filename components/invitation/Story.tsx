'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { MediaFrame } from './MediaFrame';

interface StoryMoment {
  numeral: string;
  title: string;
  date: string;
  desc: string;
  photo: {
    src?: string;
    alt: string;
    aspectRatio?: string;
    label?: string;
  };
}

interface StoryProps {
  moments: StoryMoment[];
}

export function Story({ moments }: StoryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.story-moment-card').forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 50,
            rotateX: 12,
            scale: 0.96,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              once: true,
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="story"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* 3 Moments List with 3D Perspective */}
        <div className="flex flex-col gap-24 md:gap-36" style={{ perspective: '1200px' }}>
          {moments.map((moment, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={moment.numeral}
                className={`story-moment-card grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center transform-gpu ${
                  isReversed ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Text column */}
                <div
                  className={`md:col-span-6 flex flex-col ${
                    isReversed ? 'md:order-2 md:pl-8' : 'md:pr-8'
                  }`}
                >
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="font-serif text-5xl md:text-6xl text-[var(--deep)] font-light">
                      {moment.numeral}
                    </span>
                    <span className="label-eyebrow text-[var(--ink)] opacity-50 tracking-[0.2em]">
                      {moment.date}
                    </span>
                  </div>

                  <h3 className="display-m text-2xl sm:text-3xl md:text-4xl text-[var(--ink)] font-serif mb-4">
                    {moment.title}
                  </h3>

                  <div className="w-16 h-[1px] bg-[var(--hairline)] mb-6" />

                  <p className="body-base text-[var(--ink)] opacity-80 leading-relaxed max-w-lg">
                    {moment.desc}
                  </p>
                </div>

                {/* Media column */}
                <div
                  className={`md:col-span-6 ${
                    isReversed ? 'md:order-1' : ''
                  }`}
                >
                  <div className="w-full max-w-md mx-auto drop-shadow-md">
                    <MediaFrame
                      src={moment.photo.src}
                      alt={moment.photo.alt}
                      aspectRatio={moment.photo.aspectRatio || '4/5'}
                      label={moment.photo.label || `MOMEN ${moment.numeral}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
