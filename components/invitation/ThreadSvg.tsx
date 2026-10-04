'use client';

import React, { useEffect, useRef } from 'react';
import { registerGSAP, gsap, ScrollTrigger } from '@/lib/motion/gsap';

export function ThreadSvg() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathLeftRef = useRef<SVGPathElement | null>(null);
  const pathRightRef = useRef<SVGPathElement | null>(null);
  const mobileLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGSAP();

    let ctx: gsap.Context | null = null;

    const timer = setTimeout(() => {
      const leftPath = pathLeftRef.current;
      const rightPath = pathRightRef.current;
      const coupleEl = document.querySelector('#couple');
      const eventEl = document.querySelector('#event');

      if (!leftPath || !rightPath || !coupleEl || !eventEl || typeof leftPath.getTotalLength !== 'function') {
        return;
      }

      ctx = gsap.context(() => {
        const leftLen = leftPath.getTotalLength();
        const rightLen = rightPath.getTotalLength();

        gsap.set(leftPath, {
          strokeDasharray: leftLen,
          strokeDashoffset: leftLen,
        });
        gsap.set(rightPath, {
          strokeDasharray: rightLen,
          strokeDashoffset: rightLen,
        });

        const mm = gsap.matchMedia();

        // Desktop: two curves merging towards center from #couple to #event
        mm.add('(min-width: 768px)', () => {
          const stDraw = ScrollTrigger.create({
            trigger: coupleEl,
            endTrigger: eventEl,
            start: 'top 60%',
            end: 'center center',
            scrub: 1.2,
            onUpdate: (self) => {
              const progress = self.progress;
              gsap.to(leftPath, {
                strokeDashoffset: leftLen * (1 - progress),
                overwrite: 'auto',
                duration: 0.1,
              });
              gsap.to(rightPath, {
                strokeDashoffset: rightLen * (1 - progress),
                overwrite: 'auto',
                duration: 0.1,
              });
            },
          });

          const stFade = ScrollTrigger.create({
            trigger: eventEl,
            start: 'center center',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              if (svgRef.current) {
                svgRef.current.style.opacity = `${Math.max(0, 1 - self.progress * 1.5)}`;
              }
            },
          });

          return () => {
            stDraw.kill();
            stFade.kill();
          };
        });

        // Mobile: vertical thread on left gutter
        mm.add('(max-width: 767px)', () => {
          if (!mobileLineRef.current) return;
          const st = ScrollTrigger.create({
            trigger: coupleEl,
            endTrigger: eventEl,
            start: 'top 70%',
            end: 'center center',
            scrub: true,
            onUpdate: (self) => {
              if (mobileLineRef.current) {
                mobileLineRef.current.style.transform = `scaleY(${self.progress})`;
                mobileLineRef.current.style.opacity = `${0.2 + self.progress * 0.8}`;
              }
            },
          });

          const stFadeMobile = ScrollTrigger.create({
            trigger: eventEl,
            start: 'center center',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              if (mobileLineRef.current) {
                mobileLineRef.current.style.opacity = `${Math.max(0, 1 - self.progress * 1.5)}`;
              }
            },
          });

          return () => {
            st.kill();
            stFadeMobile.kill();
          };
        });
      }, containerRef);
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* Desktop SVG Curves */}
      <div className="hidden md:block fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full transition-opacity duration-300"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            ref={pathLeftRef}
            d="M 240 100 C 350 400, 600 600, 720 850"
            stroke="var(--deep)"
            strokeWidth="1"
            strokeOpacity="0.45"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={pathRightRef}
            d="M 1200 200 C 1050 450, 840 650, 720 850"
            stroke="var(--deep)"
            strokeWidth="1"
            strokeOpacity="0.45"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Mobile Vertical Gutter Thread */}
      <div className="md:hidden fixed left-[16px] top-0 bottom-0 w-[1px] pointer-events-none z-10">
        <div
          ref={mobileLineRef}
          className="w-full h-full bg-[var(--deep)] origin-top opacity-20"
          style={{ transform: 'scaleY(0)' }}
        />
      </div>
    </div>
  );
}
