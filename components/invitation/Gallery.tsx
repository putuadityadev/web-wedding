'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { registerGSAP, gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { MediaFrame } from './MediaFrame';
import { GalleryModal } from './GalleryModal';
import { GalleryItem } from '@/lib/content/types';

export type { GalleryItem };

export interface GalleryProps {
  sectionLabel?: string;
  sectionTitle?: string;
  sectionDesc?: string;
  groomName?: string;
  brideName?: string;
  items: GalleryItem[];
}

export function Gallery({
  sectionLabel = 'GALERI KENANGAN',
  sectionTitle,
  sectionDesc,
  groomName,
  brideName,
  items,
}: GalleryProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | number | null>(null);
  const [entryOrigin, setEntryOrigin] = useState<'landing' | 'gallery'>('gallery');

  // Filter primary items for the pinned horizontal scroll front track (strictly up to 8 slots)
  const primaryItems = useMemo(() => {
    const explicitPrimary = items.filter((it) => it.isPrimary !== false);
    if (explicitPrimary.length > 0) {
      return explicitPrimary.slice(0, 8);
    }
    return items.slice(0, 8);
  }, [items]);

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

        // Awwwards-style individual card scale & opacity entry using containerAnimation (smooth GPU compositing)
        cardsRef.current.forEach((card) => {
          if (!card) return;

          gsap.fromTo(
            card,
            {
              opacity: 0.35,
              scale: 0.93,
              y: 16,
            },
            {
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
  }, [primaryItems.length]);

  const handleOpenItem = (id: string | number) => {
    setSelectedItemId(id);
    setEntryOrigin('landing');
    setIsModalOpen(true);
  };

  const handleOpenAll = () => {
    setSelectedItemId(null);
    setEntryOrigin('gallery');
    setIsModalOpen(true);
  };

  return (
    <>
      <section
        ref={sectionRef}
        id="gallery"
        className="relative w-full h-[100svh] bg-[var(--paper)] select-none overflow-hidden flex flex-col justify-between py-6 sm:py-8"
      >
        {/* Centered Top Header Bar (Safe from fixed RSVP & MENU badges) */}
        <div className="w-full max-w-md mx-auto px-4 pt-3 sm:pt-5 z-20 flex flex-col items-center justify-center text-center pointer-events-none">
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] font-normal tracking-tight">
            {sectionTitle || 'Galeri Kenangan'}
          </h2>
        </div>

        {/* Pinned Horizontal Gallery Track (Full Screen Immersion - Up to 8 Curated Slots) */}
        <div className="relative w-full my-auto overflow-visible z-10 flex items-center">
          <div
            ref={trackRef}
            className="flex gap-8 sm:gap-14 md:gap-20 items-center pl-[var(--gutter)] will-change-transform"
          >
            {primaryItems.map((item, index) => {
              const isOffset = index % 2 === 1;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cardsRef.current[index] = el;
                  }}
                  onClick={() => handleOpenItem(item.id)}
                  className={`flex-none w-[270px] sm:w-[340px] md:w-[420px] lg:w-[460px] flex flex-col will-change-[transform,filter,opacity] cursor-pointer group ${
                    isOffset ? 'translate-y-4 sm:translate-y-8' : '-translate-y-4 sm:-translate-y-6'
                  }`}
                >
                  {/* Image/Video Frame with subtle shadow & architectural styling */}
                  <div className="w-full mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-[var(--radius-sm)] overflow-hidden transition-shadow duration-500 relative">
                    <MediaFrame
                      src={item.src}
                      videoSrc={item.videoSrc}
                      posterSrc={item.posterSrc}
                      mediaType={item.mediaType}
                      alt={item.title}
                      aspectRatio={item.aspectRatio || '4/5'}
                      label={item.label}
                      arch={item.type === 'portrait' && index % 3 === 0}
                    />

                    {/* Subtle click indicator hint on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono tracking-wider shadow-sm">
                        Perbesar ⤢
                      </span>
                    </div>
                  </div>

                  {/* Caption Row */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-[var(--hairline)] px-1">
                    <span className="font-serif italic text-lg sm:text-xl text-[var(--ink)] group-hover:text-[var(--deep)] transition-colors">
                      {item.title}
                    </span>
                    <span className="label-eyebrow text-[var(--ink)] opacity-50 text-[10px] tracking-[0.18em]">
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 9th Slot: Interactive Ending CTA to browse all photos and videos */}
            <div
              key="more-cta-slot"
              ref={(el) => {
                cardsRef.current[primaryItems.length] = el;
              }}
              onClick={handleOpenAll}
              className="flex-none w-[260px] sm:w-[300px] md:w-[340px] flex flex-col justify-center items-center text-center cursor-pointer group will-change-[transform,opacity] translate-y-2 sm:translate-y-4"
            >
              <div className="w-full aspect-[4/5] rounded-2xl border border-[var(--ink)]/15 group-hover:border-[var(--deep)]/40 bg-white/80 backdrop-blur-md hover:bg-white transition-all duration-300 p-8 flex flex-col items-center justify-center relative shadow-[0_4px_20px_rgba(15,27,45,0.03)] group-hover:shadow-[0_8px_32px_rgba(15,27,45,0.08)] overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-[var(--mist)] text-[var(--deep)] group-hover:scale-110 group-hover:bg-[var(--deep)] group-hover:text-white transition-all duration-300 flex items-center justify-center mb-5 shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] mb-1.5 font-normal">
                  Lihat Semua Foto
                </h4>
                <p className="text-xs font-mono text-[var(--ink)]/60 mb-6">
                  {items.length} Dokumentasi Momen
                </p>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--deep)] text-white text-xs font-mono tracking-wider shadow-sm group-hover:bg-[#34587c] group-hover:scale-105 transition-all">
                  <span>Buka Galeri</span>
                  <span>↗</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discreet Centered Progress Bar */}
        <div className="w-full max-w-xs sm:max-w-sm mx-auto px-6 z-20 pointer-events-none pb-2">
          <div className="w-full h-[2px] bg-[var(--hairline)]/80 relative rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="absolute top-0 bottom-0 left-0 w-full bg-[var(--deep)] origin-left scale-x-0 transition-transform duration-75"
            />
          </div>
        </div>
      </section>

      {/* Full Screen Interactive Pop-up Gallery Modal */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items}
        initialSelectedId={selectedItemId}
        entryOrigin={entryOrigin}
        sectionTitle={sectionTitle}
        groomName={groomName}
        brideName={brideName}
      />
    </>
  );
}
