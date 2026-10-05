'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';

export interface QuoteProps {
  label?: string;
  text: string;
  citation?: string;
}

export function Quote({
  label = 'KUTIPAN SUCI',
  text,
  citation,
}: QuoteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const words = text ? text.split(/\s+/) : [];

  useEffect(() => {
    const container = containerRef.current;
    if (!container || wordsRef.current.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(container, { perspective: 1000 });

      gsap.fromTo(
        wordsRef.current,
        {
          opacity: 0.12,
          y: 8,
          rotateX: 18,
          filter: 'blur(2px)',
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: 'blur(0px)',
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            end: 'bottom 45%',
            scrub: 1.2,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [words.length]);

  return (
    <section
      ref={containerRef}
      id="quote"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] flex flex-col justify-center select-none overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* 8/12 width indented paragraph with 3D word-by-word illuminating motion */}
        <div className="w-full md:w-11/12 lg:w-10/12 md:pl-8 lg:pl-16">
          {label && (
            <div className="mb-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--baby-blue)]" />
              <span className="label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.25em] text-[11px] uppercase">
                {label}
              </span>
            </div>
          )}

          <p className="display-m text-[var(--ink)] font-serif leading-[1.25] flex flex-wrap gap-x-[0.35em] gap-y-[0.15em] transform-gpu">
            {words.map((word, idx) => (
              <span
                key={idx}
                ref={(el) => {
                  wordsRef.current[idx] = el;
                }}
                className="inline-block transition-all transform-gpu origin-bottom"
                style={{ opacity: 0.12 }}
              >
                {word}
              </span>
            ))}
          </p>

          {citation && (
            <div className="mt-8 font-serif italic text-base sm:text-lg text-[var(--ink)] opacity-70">
              — {citation}
            </div>
          )}

          <div className="mt-12 flex items-center gap-4">
            <span className="w-2 h-2 rounded-full border border-[var(--deep)] opacity-60" />
            <span className="label-eyebrow text-[var(--ink)] opacity-50 tracking-[0.22em] text-[11px] uppercase">
              {citation ? citation : 'UNDANGAN RESEPSI PERNIKAHAN'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
