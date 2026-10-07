'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/lib/content/types';
import { useLenisContext } from '@/lib/motion/lenis';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  initialSelectedId?: string | number | null;
  entryOrigin?: 'landing' | 'gallery';
  sectionTitle?: string;
  groomName?: string;
  brideName?: string;
}

export function GalleryModal({
  isOpen,
  onClose,
  items,
  initialSelectedId = null,
  entryOrigin = 'gallery',
  sectionTitle = 'Momen Terindah',
  groomName = 'Dharma',
  brideName = 'Lutfhy',
}: GalleryModalProps) {
  const { lenis } = useLenisContext();
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<'landing' | 'gallery'>(entryOrigin);
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Touch drag-down to dismiss sheet
  const sheetTouchStartY = useRef<number | null>(null);
  const [sheetDragOffset, setSheetDragOffset] = useState<number>(0);

  // Swipe detection coordinates for mobile touch gestures in Lightbox
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync origin and reset visibleCount whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setOrigin(entryOrigin);
      setVisibleCount(24);
      setSheetDragOffset(0);
    }
  }, [isOpen, entryOrigin]);

  // Reset pagination when tab filter changes
  useEffect(() => {
    setVisibleCount(24);
  }, [filter]);

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    if (filter === 'photo') {
      return items.filter((it) => it.mediaType !== 'video');
    }
    if (filter === 'video') {
      return items.filter((it) => it.mediaType === 'video');
    }
    return items;
  }, [items, filter]);

  const photoCount = useMemo(() => items.filter((it) => it.mediaType !== 'video').length, [items]);
  const videoCount = useMemo(() => items.filter((it) => it.mediaType === 'video').length, [items]);

  // Progressive slice for 60fps smooth Pinterest-style masonry rendering
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // IntersectionObserver to auto-load next batches as user scrolls down
  useEffect(() => {
    if (!isOpen || visibleCount >= filteredItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 18, filteredItems.length));
        }
      },
      { rootMargin: '400px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [isOpen, visibleCount, filteredItems.length]);

  // Expand visible count if lightbox navigates near the end
  useEffect(() => {
    if (activeLightboxIndex !== null && activeLightboxIndex >= visibleCount - 3) {
      setVisibleCount((prev) => Math.min(prev + 18, filteredItems.length));
    }
  }, [activeLightboxIndex, visibleCount, filteredItems.length]);

  // Open specific item in lightbox if initialSelectedId is passed
  useEffect(() => {
    if (isOpen && initialSelectedId !== null && initialSelectedId !== undefined) {
      const idx = filteredItems.findIndex((it) => String(it.id) === String(initialSelectedId));
      if (idx !== -1) {
        setActiveLightboxIndex(idx);
      }
    } else if (isOpen && (initialSelectedId === null || initialSelectedId === undefined)) {
      setActiveLightboxIndex(null);
    }
  }, [isOpen, initialSelectedId, filteredItems]);

  // Dynamic close handler based on origin
  const handleCloseLightbox = useCallback(() => {
    if (origin === 'landing') {
      // User opened directly from landing page -> close everything and return to landing page
      setActiveLightboxIndex(null);
      onClose();
    } else {
      // User opened from the full gallery sheet -> return to the full gallery grid
      setActiveLightboxIndex(null);
    }
  }, [origin, onClose]);

  // Transition from direct landing preview into full gallery exploration
  const handleSwitchToFullGallery = useCallback(() => {
    setOrigin('gallery');
    setActiveLightboxIndex(null);
  }, []);

  // Keyboard navigation & Esc handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (activeLightboxIndex !== null) {
          handleCloseLightbox();
        } else {
          onClose();
        }
      } else if (activeLightboxIndex !== null) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          setActiveLightboxIndex((prev) =>
            prev !== null ? (prev + 1) % filteredItems.length : 0
          );
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          setActiveLightboxIndex((prev) =>
            prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
          );
        }
      }
    },
    [isOpen, activeLightboxIndex, filteredItems.length, handleCloseLightbox, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Seamless Lenis smooth-scroll freeze & unfreeze when modal is open
  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        lenis?.start();
      };
    }
  }, [isOpen, lenis]);

  // Drag down handlers for bottom sheet
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 5) return;
    sheetTouchStartY.current = e.touches[0].clientY;
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - sheetTouchStartY.current;
    if (deltaY > 0) {
      setSheetDragOffset(deltaY);
    }
  };

  const handleHeaderTouchEnd = () => {
    if (sheetDragOffset > 80) {
      onClose();
    }
    sheetTouchStartY.current = null;
    setSheetDragOffset(0);
  };

  // Mobile swipe handlers for Lightbox
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleLightboxTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped left -> Next
      setActiveLightboxIndex((prev) =>
        prev !== null ? (prev + 1) % filteredItems.length : 0
      );
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Previous
      setActiveLightboxIndex((prev) =>
        prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      );
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!isOpen) return null;

  const currentLightboxItem =
    activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. BACKDROP OVERLAY                                             */}
      {/* ============================================================== */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ============================================================== */}
      {/* 2. MOBILE APP STYLE BOTTOM SHEET (82-85% HEIGHT, CLEAN WHITE)   */}
      {/* ============================================================== */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Galeri Dokumentasi"
        style={{
          transform: sheetDragOffset > 0 ? `translateY(${sheetDragOffset}px)` : undefined,
          transition: sheetDragOffset > 0 ? 'none' : 'transform 0.25s ease-out',
        }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-4xl h-[82vh] sm:h-[86vh] max-h-[92vh] bg-white text-[#0F1B2D] rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl border-t border-stone-200/80 flex flex-col overflow-hidden animate-slide-up-sheet select-none"
      >
        {/* Drag Handle Bar (Top Center Grab Indicator) */}
        <div
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Sticky Sheet Header Bar */}
        <header
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          className="px-5 sm:px-7 py-2.5 sm:py-3 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white z-20"
        >
          {/* Left: Title & Count */}
          <div className="min-w-0 pr-2">
            <h3 className="font-serif text-lg sm:text-xl font-normal text-[#0F1B2D] truncate">
              Galeri Dokumentasi
            </h3>
            <p className="text-[11px] font-mono text-stone-500 truncate">
              {filteredItems.length} Momen Terabadikan
            </p>
          </div>

          {/* Center: Clean Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-full text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[var(--deep)] text-white font-medium shadow-xs'
                  : 'text-stone-600 hover:text-[var(--deep)]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilter('photo')}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'photo'
                  ? 'bg-[var(--deep)] text-white font-medium shadow-xs'
                  : 'text-stone-600 hover:text-[var(--deep)]'
              }`}
            >
              Foto
            </button>
            {videoCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('video')}
                className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                  filter === 'video'
                    ? 'bg-[var(--deep)] text-white font-medium shadow-xs'
                    : 'text-stone-600 hover:text-[var(--deep)]'
                }`}
              >
                Video
              </button>
            )}
          </div>

          {/* Right: Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Galeri"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Pinterest-Style 2-Column Masonry Grid */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 bg-white"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center text-stone-400 text-xs font-mono">
              Belum ada media di kategori ini.
            </div>
          ) : (
            <>
              <div className="columns-2 sm:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                {displayedItems.map((item, idx) => {
                  const isVideo = item.mediaType === 'video' || Boolean(item.videoSrc);

                  // Calculate natural aspect ratio
                  const aspectRatioClass =
                    item.aspectRatio === '16/9' || item.aspectRatio === '16/10'
                      ? 'aspect-[16/10]'
                      : item.aspectRatio === '1/1'
                      ? 'aspect-square'
                      : item.aspectRatio === '3/4'
                      ? 'aspect-[3/4]'
                      : 'aspect-[4/5]';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOrigin('gallery');
                        setActiveLightboxIndex(idx);
                      }}
                      className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/70 hover:border-stone-400/60 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      {/* Media Display */}
                      <div className={`relative w-full ${aspectRatioClass} overflow-hidden bg-stone-200`}>
                        {isVideo ? (
                          <div className="relative w-full h-full bg-stone-900 flex items-center justify-center">
                            <video
                              src={item.videoSrc || item.src}
                              poster={item.posterSrc || item.src}
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Video Badge */}
                            <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] font-mono tracking-wider uppercase text-white flex items-center gap-1 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              <span>VIDEO</span>
                            </div>
                          </div>
                        ) : item.src ? (
                          <Image
                            src={item.src}
                            alt={item.title || 'Momen'}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized={item.src.startsWith('http')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-mono">
                            Foto
                          </div>
                        )}

                        {/* Subtle Pinterest-style bottom caption */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <p className="font-serif text-sm text-white drop-shadow-sm truncate">
                            {item.title}
                          </p>
                          {item.label && (
                            <span className="text-[10px] font-mono text-white/70">
                              {item.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite scroll sentinel */}
              {visibleCount < filteredItems.length && (
                <div
                  ref={sentinelRef}
                  className="py-8 flex items-center justify-center text-stone-400 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200">
                    <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
                    <span>
                      Memuat lebih banyak ({displayedItems.length} dari {filteredItems.length})...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. LIGHTBOX OVERLAY VIEW (HIGH-RES PHOTO / VIDEO VIEWER)        */}
      {/* ============================================================== */}
      {currentLightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex flex-col justify-between animate-in fade-in duration-200 select-none"
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Minimalist Header */}
          <div
            className="w-full px-4 sm:px-6 py-3 flex items-center justify-between z-20 shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Counter */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 tracking-wider">
                {activeLightboxIndex! + 1} / {filteredItems.length}
              </span>
              {currentLightboxItem.mediaType === 'video' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium">
                  VIDEO
                </span>
              ) : null}
            </div>

            {/* Center: Title preview */}
            <div className="hidden sm:block text-center truncate max-w-sm px-2">
              <h4 className="font-serif italic text-base text-white truncate">
                {currentLightboxItem.title}
              </h4>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {origin === 'landing' && (
                <button
                  type="button"
                  onClick={handleSwitchToFullGallery}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-mono text-white/80 transition-all cursor-pointer"
                >
                  <span>Buka Galeri Penuh</span>
                  <span>↗</span>
                </button>
              )}

              {/* Close Button: closes back to sheet or back to landing */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                aria-label={origin === 'landing' ? 'Kembali ke Beranda' : 'Kembali ke Galeri'}
                title={origin === 'landing' ? 'Kembali ke Beranda' : 'Kembali ke Galeri'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div
            className="relative flex-1 flex items-center justify-center p-3 sm:p-8 overflow-hidden touch-pan-y"
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            {/* Prev Button */}
            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex((prev) =>
                    prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
                  );
                }}
                aria-label="Momen Sebelumnya"
                className="absolute left-2 sm:left-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 sm:bg-white/10 sm:hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-xl sm:text-2xl transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              >
                ‹
              </button>
            )}

            {/* Media Content */}
            <div
              className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {currentLightboxItem.mediaType === 'video' || Boolean(currentLightboxItem.videoSrc) ? (
                <video
                  key={currentLightboxItem.videoSrc || currentLightboxItem.src}
                  src={currentLightboxItem.videoSrc || currentLightboxItem.src}
                  poster={currentLightboxItem.posterSrc || currentLightboxItem.src}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentLightboxItem.src}
                    alt={currentLightboxItem.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Next Button */}
            {filteredItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % filteredItems.length : 0
                  );
                }}
                aria-label="Momen Selanjutnya"
                className="absolute right-2 sm:right-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 sm:bg-white/10 sm:hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-xl sm:text-2xl transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              >
                ›
              </button>
            )}
          </div>

          {/* Lightbox Minimal Footer */}
          <div
            className="w-full px-4 sm:px-6 py-3 border-t border-white/10 bg-black/60 backdrop-blur-md shrink-0 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif italic text-base sm:text-xl text-white truncate max-w-xl mx-auto">
              {currentLightboxItem.title}
            </h4>
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/50 mt-0.5">
              <span>{currentLightboxItem.label}</span>
              {currentLightboxItem.category && (
                <>
                  <span>•</span>
                  <span>{currentLightboxItem.category}</span>
                </>
              )}
            </div>

            {origin === 'landing' && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleSwitchToFullGallery}
                  className="text-[11px] font-mono text-white/70 hover:text-white underline underline-offset-4 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Buka Seluruh Koleksi Galeri ({items.length})</span>
                  <span>↗</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
