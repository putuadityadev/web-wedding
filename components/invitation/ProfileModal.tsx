'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CoupleMember } from './Couple';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPerson?: 'groom' | 'bride';
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

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FamilyEmblemIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileModal({
  isOpen,
  onClose,
  initialPerson = 'groom',
  groom,
  bride,
}: ProfileModalProps) {
  const [activePerson, setActivePerson] = useState<'groom' | 'bride'>(initialPerson);
  const [sheetDragOffset, setSheetDragOffset] = useState<number>(0);
  const sheetTouchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync active person when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePerson(initialPerson);
      setSheetDragOffset(0);
    }
  }, [isOpen, initialPerson]);

  // Lock body scroll cleanly while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Touch drag handlers to dismiss bottom sheet (only on the top grab handle)
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
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
    if (sheetDragOffset > 90) {
      onClose();
    }
    sheetTouchStartY.current = null;
    setSheetDragOffset(0);
  };

  if (!isOpen) return null;

  const currentPerson = activePerson === 'groom' ? groom : bride;
  const isGroom = activePerson === 'groom';
  const personRole = isGroom ? 'MEMPELAI PRIA' : 'MEMPELAI WANITA';

  const fatherName = currentPerson.fatherName || '';
  const motherName = currentPerson.motherName || '';
  const parentsPhoto = currentPerson.parentsAvatarSrc || '';
  const parentsTitle =
    currentPerson.parentsTitle ||
    (isGroom ? 'Putra Pertama Dari Pasangan:' : 'Putri Tercinta Dari Pasangan:');

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Bottom Sheet Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail Profil ${currentPerson.name}`}
        style={{
          transform: sheetDragOffset > 0 ? `translateY(${sheetDragOffset}px)` : undefined,
          transition: sheetDragOffset > 0 ? 'none' : 'transform 0.25s ease-out',
        }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl sm:max-w-4xl h-[86vh] sm:h-[88vh] max-h-[92vh] bg-[var(--paper,#FBFCFE)] text-[var(--ink,#0F1B2D)] rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl border-t border-stone-200/80 flex flex-col overflow-hidden animate-slide-up-sheet"
      >
        {/* Top Grab Handle Bar */}
        <div
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none bg-[var(--paper,#FBFCFE)]"
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Header Bar: Primary Theme Background, Minimalist Tabs (No Emojis) & Close Button */}
        <header className="px-5 sm:px-8 py-3 flex items-center justify-between border-b border-[var(--ink)]/10 shrink-0 bg-[var(--paper,#FBFCFE)] z-10">
          {/* Left Title */}
          <div className="hidden sm:block">
            <span className="label-eyebrow text-[10px] tracking-[0.24em] text-[var(--deep,#3F6A94)] font-semibold uppercase">
              PROFIL LENGKAP
            </span>
          </div>

          {/* Center: Segmented Control Pill Without Emojis */}
          <div className="inline-flex items-center p-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActivePerson('groom')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                isGroom
                  ? 'bg-[var(--deep,#3F6A94)] text-white font-medium shadow-xs'
                  : 'text-stone-600 hover:text-[var(--deep,#3F6A94)]'
              }`}
            >
              Mempelai Pria
            </button>
            <button
              type="button"
              onClick={() => setActivePerson('bride')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                !isGroom
                  ? 'bg-[var(--deep,#3F6A94)] text-white font-medium shadow-xs'
                  : 'text-stone-600 hover:text-[var(--deep,#3F6A94)]'
              }`}
            >
              Mempelai Wanita
            </button>
          </div>

          {/* Right: Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[var(--ink,#0F1B2D)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Tutup jendela profil"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Modal Body (With data-lenis-prevent and touchAction for 100% reliable scrolling) */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 sm:py-6 space-y-6 bg-[var(--paper,#FBFCFE)]"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {/* Balanced Side-by-Side Grid (Fits without scrolling on desktop, stacks cleanly on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* ============================================================== */}
            {/* COLUMN 1: PROFIL MEMPELAI (Foto, Nama, Silsilah, Bio)          */}
            {/* ============================================================== */}
            <div className="md:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs flex flex-col items-center text-center">
              {/* Foto Mempelai */}
              {currentPerson.photo?.src && (
                <div className="relative w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-stone-200 mb-4 bg-stone-100 shrink-0">
                  <Image
                    src={currentPerson.photo.src}
                    alt={currentPerson.photo.alt || currentPerson.name}
                    fill
                    className="object-cover object-[center_25%]"
                    sizes="160px"
                    unoptimized={currentPerson.photo.src.startsWith('data:')}
                  />
                </div>
              )}

              {/* Role Eyebrow (Clean, no chapter, no colorful dots) */}
              <span className="label-eyebrow text-[10px] tracking-[0.24em] text-[var(--deep,#3F6A94)] uppercase font-semibold mb-1">
                {personRole}
              </span>

              {/* Full Name */}
              <h3 className="font-serif text-2xl sm:text-3xl text-[var(--ink,#0F1B2D)] font-normal tracking-tight my-1">
                {currentPerson.name}
              </h3>

              {/* Silsilah / Urutan */}
              <p className="text-xs sm:text-sm text-[var(--deep,#3F6A94)] font-serif italic mb-3">
                {currentPerson.childOf}
              </p>

              {/* Bio Singkat */}
              {currentPerson.bio && (
                <p className="text-xs text-[var(--ink)]/75 font-light leading-relaxed mb-4 text-balance">
                  &ldquo;{currentPerson.bio}&rdquo;
                </p>
              )}

              {/* Instagram Chip (If available) */}
              {currentPerson.instagram && (
                <a
                  href={`https://instagram.com/${currentPerson.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider bg-stone-50 hover:bg-stone-100 text-[var(--ink)] border border-stone-200 shadow-2xs transition-all active:scale-95"
                >
                  <InstagramIcon className="w-3.5 h-3.5 opacity-80" />
                  <span>@{currentPerson.instagram.replace(/^@/, '')}</span>
                </a>
              )}
            </div>

            {/* ============================================================== */}
            {/* COLUMN 2: SECTION KHUSUS ORANG TUA (Foto CMS di Kiri, Nama Kanan) */}
            {/* ============================================================== */}
            <div className="md:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
              {/* Header Seksi Orang Tua */}
              <div className="border-b border-stone-100 pb-3">
                <span className="label-eyebrow text-[10px] tracking-[0.22em] text-[var(--deep,#3F6A94)] uppercase font-semibold block mb-0.5">
                  KEDUA ORANG TUA
                </span>
                <p className="text-xs font-serif italic text-[var(--ink)]/70">
                  {parentsTitle}
                </p>
              </div>

              {/* Konten Orang Tua: Foto Profil di Kiri + Nama Ayah & Ibu di Kanan */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pt-1">
                {/* Sisi Kiri: Foto Profil Orang Tua (dari CMS `parentsAvatarSrc`) */}
                <div className="relative shrink-0">
                  {parentsPhoto ? (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-stone-200/90 bg-stone-100">
                      <Image
                        src={parentsPhoto}
                        alt={`Orang Tua dari ${currentPerson.name}`}
                        fill
                        className="object-cover"
                        sizes="130px"
                        unoptimized={parentsPhoto.startsWith('data:')}
                      />
                    </div>
                  ) : (
                    /* Fallback Elegan jika belum unggah foto di CMS */
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100 border-2 border-white ring-1 ring-stone-200/80 flex flex-col items-center justify-center text-[var(--deep)] shadow-inner">
                      <FamilyEmblemIcon className="w-7 h-7 mb-1 opacity-60" />
                      <span className="font-serif italic text-xs font-semibold">
                        Keluarga
                      </span>
                    </div>
                  )}
                </div>

                {/* Sisi Kanan: Nama Ayah & Ibu */}
                <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                  {/* Ayahanda */}
                  <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/60">
                    <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--deep,#3F6A94)] font-semibold uppercase block mb-0.5">
                      AYAHANDA
                    </span>
                    <div className="font-serif text-base sm:text-lg text-[var(--ink,#0F1B2D)] font-normal">
                      {fatherName ? `Bapak ${fatherName}` : 'Bapak (Belum diisi di CMS)'}
                    </div>
                  </div>

                  {/* Ibunda */}
                  <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/60">
                    <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--deep,#3F6A94)] font-semibold uppercase block mb-0.5">
                      IBUNDA
                    </span>
                    <div className="font-serif text-base sm:text-lg text-[var(--ink,#0F1B2D)] font-normal">
                      {motherName ? `Ibu ${motherName}` : 'Ibu (Belum diisi di CMS)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan Silsilah Lengkap */}
              {currentPerson.childOf && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[11px] text-[var(--ink)]/65 font-light leading-relaxed">
                    {currentPerson.childOf}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Editorial Colophon Bawah */}
          <div className="pt-3 border-t border-[var(--ink)]/10 text-center space-y-0.5">
            <span className="label-eyebrow text-[9px] font-mono tracking-[0.24em] text-[var(--ink)]/40 uppercase block">
              THE WEDDING CELEBRATION
            </span>
            <p className="text-[11px] font-serif italic text-[var(--ink)]/60">
              Dharma &amp; Lutfhy
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
