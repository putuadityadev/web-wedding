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

  // Sync origin whenever modal opens with a new entryOrigin
  useEffect(() => {
    if (isOpen) {
      setOrigin(entryOrigin);
    }
  }, [isOpen, entryOrigin]);

  // Swipe detection coordinates for mobile touch gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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
      // User opened from the full gallery -> return to the full gallery grid
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

  // Mobile swipe handlers for Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#0F1B2D]/95 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
    >
      {/* ============================================================== */}
      {/* 1. TOP STICKY HEADER BAR (Ultra Clean & Responsive)             */}
      {/* ============================================================== */}
      <header className="w-full border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 bg-[#0F1B2D]/80 backdrop-blur-md z-20">
        {/* Left: Couple & Section Identity */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-2 h-2 rounded-full bg-[var(--baby-blue)] shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.22em] text-white/50 uppercase block truncate">
              GALERI DOKUMENTASI
            </span>
            <h3 className="font-serif italic text-sm sm:text-base text-white font-light truncate">
              {groomName} &amp; {brideName}
              <span className="hidden sm:inline text-white/40 font-sans text-xs ml-2 font-normal">
                — {sectionTitle}
              </span>
            </h3>
          </div>
        </div>

        {/* Center: Desktop Filter Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#0F1B2D] font-semibold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('photo')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === 'photo'
                ? 'bg-white text-[#0F1B2D] font-semibold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Foto ({photoCount})
          </button>
          {videoCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('video')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                filter === 'video'
                  ? 'bg-white text-[#0F1B2D] font-semibold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Video ({videoCount})
            </button>
          )}
        </div>

        {/* Right: Clean Circular Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Galeri"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Mobile Filter Tabs (Clean Centered Pill Bar) */}
      <div className="flex md:hidden items-center justify-center gap-1.5 py-2 px-3 bg-[#0F1B2D]/95 border-b border-white/5 text-[11px] font-mono shrink-0">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-[#0F1B2D] font-bold shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Semua ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('photo')}
          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
            filter === 'photo'
              ? 'bg-white text-[#0F1B2D] font-bold shadow-xs'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Foto ({photoCount})
        </button>
        {videoCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter('video')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              filter === 'video'
                ? 'bg-white text-[#0F1B2D] font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Video ({videoCount})
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. MASONRY / EDITORIAL GRID WITH SMOOTH SCROLLING              */}
      {/* ============================================================== */}
      <div
        data-lenis-prevent="true"
        className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-10 scrollbar-thin scrollbar-thumb-white/20"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          scrollBehavior: 'smooth',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="py-24 text-center text-white/50 text-xs font-mono">
              Belum ada media di kategori ini.
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
              {filteredItems.map((item, idx) => {
                const isVideo = item.mediaType === 'video' || Boolean(item.videoSrc);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setOrigin('gallery');
                      setActiveLightboxIndex(idx);
                    }}
                    className="break-inside-avoid group relative rounded-[var(--radius-sm)] overflow-hidden bg-black/30 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                  >
                    {/* Media Container */}
                    <div className="relative w-full overflow-hidden">
                      {isVideo ? (
                        <div className="relative w-full aspect-video bg-black/60 flex items-center justify-center">
                          <video
                            src={item.videoSrc || item.src}
                            poster={item.posterSrc || item.src}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Video Play Badge */}
                          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-[9px] font-mono tracking-widest uppercase text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span>VIDEO</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="relative w-full"
                          style={{
                            aspectRatio:
                              item.aspectRatio === '16/10' || item.aspectRatio === '16/9'
                                ? '16/10'
                                : item.aspectRatio === '3/2'
                                ? '3/2'
                                : '3/4',
                          }}
                        >
                          {item.src ? (
                            <Image
                              src={item.src}
                              alt={item.title || 'Momen'}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized={item.src.startsWith('http')}
                            />
                          ) : (
                            <div className="w-full h-48 bg-white/5 flex items-center justify-center text-white/30 text-xs font-mono">
                              (Foto)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hover Overlay with Vignette & Title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-3.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/70 mb-1">
                          <span>{item.label}</span>
                          {item.isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                              ★ Utama
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif italic text-base sm:text-lg text-white drop-shadow-sm truncate">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. LIGHTBOX OVERLAY VIEW (Clean, Minimal, Dynamic Close)        */}
      {/* ============================================================== */}
      {currentLightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200"
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Minimalist Header Bar (Zero Clutter on Mobile) */}
          <div
            className="w-full px-4 sm:px-6 py-3 flex items-center justify-between z-20 shrink-0 border-b border-white/10 bg-black/50 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Compact Counter */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 tracking-wider">
                {activeLightboxIndex! + 1} / {filteredItems.length}
              </span>
              {currentLightboxItem.mediaType === 'video' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium">
                  🎬 VIDEO
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                  FOTO
                </span>
              )}
            </div>

            {/* Center: Title preview on tablet & desktop */}
            <div className="hidden sm:block text-center truncate max-w-sm px-2">
              <h4 className="font-serif italic text-base text-white truncate">
                {currentLightboxItem.title}
              </h4>
            </div>

            {/* Right: Actions (Full Gallery switch if from landing, plus clean Close Button) */}
            <div className="flex items-center gap-2">
              {origin === 'landing' && (
                <button
                  type="button"
                  onClick={handleSwitchToFullGallery}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-mono text-white/80 transition-all cursor-pointer"
                  title="Lihat seluruh koleksi di galeri pop-up"
                >
                  <span>Buka Galeri Penuh</span>
                  <span>↗</span>
                </button>
              )}

              {/* Clean Circular Close Button: dynamically closes back to landing or back to gallery */}
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

          {/* Lightbox Main Stage (With Touch Swipe Support) */}
          <div
            className="relative flex-1 flex items-center justify-center p-3 sm:p-8 overflow-hidden touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                  className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentLightboxItem.src}
                    alt={currentLightboxItem.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
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
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] font-mono text-white/50 mt-0.5">
              <span>{currentLightboxItem.label}</span>
              {currentLightboxItem.category && (
                <>
                  <span>•</span>
                  <span>{currentLightboxItem.category}</span>
                </>
              )}
            </div>

            {/* If opened from landing page, offer quick link to switch to full gallery */}
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
    </div>
  );
}
