'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from '@/lib/motion/gsap';
import { downloadCalendarEvent } from '@/lib/calendar/ics';

// Safe dynamic client-side import for the map to prevent any SSR hydration conflict
const InteractiveMap = dynamic(
  () => import('./InteractiveMap').then((m) => m.InteractiveMap),
  { ssr: false }
);

export interface EventProps {
  sectionLabel?: string;
  sectionTitle?: string;
  dayFormatted: string; // e.g. "SABTU"
  dateNumeral: string; // e.g. "12"
  monthYearFormatted: string; // e.g. "DESEMBER 2026"
  dateFormatted: string; // e.g. "Sabtu, 12 Desember 2026"
  timeFormatted: string; // e.g. "11.00 – 14.00 WITA"
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lat?: number;
  lng?: number;
  countdownLabel?: string;
  guestArrivalTime?: string | null; // e.g. "11.00 – 12.00 WITA"
  inviteLine?: string | null;
  startsAt: string; // ISO
  endsAt?: string | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Event({
  sectionLabel = 'Waktu & Lokasi Acara',
  sectionTitle,
  dayFormatted = 'SABTU',
  dateNumeral = '12',
  monthYearFormatted = 'DESEMBER 2026',
  dateFormatted = 'Sabtu, 12 Desember 2026',
  timeFormatted = '11.00 – 14.00 WITA',
  venueName = 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
  venueAddress = 'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
  mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
  lat = -8.3981403,
  lng = 115.3643337,
  countdownLabel = 'MENGHITUNG HARI',
  guestArrivalTime,
  inviteLine,
  startsAt,
  endsAt,
}: EventProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dateCardRef = useRef<HTMLDivElement | null>(null);

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate Countdown
  useEffect(() => {
    if (!startsAt) return;
    const target = new Date(startsAt).getTime();
    if (isNaN(target)) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startsAt]);

  // Motion setup with 3D perspective
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      gsap.set(container, { perspective: 1000 });

      // Color scrub to baby-blue
      gsap.to(container, {
        backgroundColor: 'var(--baby-blue)',
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top 80%',
          end: 'top 20%',
          scrub: true,
        },
      });

      // Date number 3D reveal
      if (dateCardRef.current) {
        gsap.fromTo(
          dateCardRef.current,
          {
            opacity: 0,
            y: 50,
            rotateX: 20,
            scale: 0.95,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.3,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 70%',
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleDownloadICS = () => {
    downloadCalendarEvent({
      title: 'Pernikahan Dharma & Lutfhy',
      description: guestArrivalTime
        ? `Waktu kehadiran: ${guestArrivalTime}. ${inviteLine || ''}`
        : 'Resepsi Pernikahan I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo',
      location: `${venueName}, ${venueAddress}`,
      startDate: startsAt,
      endDate: endsAt,
    });
  };

  return (
    <section
      ref={containerRef}
      id="event"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] transition-colors select-none overflow-hidden"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Section Eyebrow */}
        <div className="text-center mb-6">
          <span className="label-eyebrow tracking-[0.32em] text-[var(--deep)] text-[10px] sm:text-xs font-semibold uppercase">
            {sectionLabel}
          </span>
          {sectionTitle && (
            <h2 className="display-l font-serif text-3xl sm:text-4xl text-[var(--ink)] mt-2">
              {sectionTitle}
            </h2>
          )}
        </div>

        {/* Date Display */}
        <div
          ref={dateCardRef}
          className="flex flex-col items-center text-center my-6 transform-gpu"
        >
          <span className="label-eyebrow tracking-[0.3em] text-[var(--ink)] opacity-70 mb-2">
            {dayFormatted}
          </span>
          <div className="event-date-numeral display-xl font-serif text-[var(--ink)] leading-none my-1 font-light drop-shadow-sm">
            {dateNumeral}
          </div>
          <span className="label-eyebrow tracking-[0.3em] text-[var(--ink)] opacity-70 mt-2">
            {monthYearFormatted}
          </span>
        </div>

        {/* Simple & Clean Personalized Arrival Time (Quiet Luxury) */}
        {guestArrivalTime && (
          <div className="my-10 p-6 sm:p-8 bg-white/60 backdrop-blur-xs border border-[var(--ink)]/15 rounded-[var(--radius-sm)] max-w-xl mx-auto text-center">
            <span className="label-eyebrow tracking-[0.24em] text-[var(--deep)] text-[10px] sm:text-xs block mb-2 font-medium">
              WAKTU KEHADIRAN ANDA
            </span>
            <div className="font-serif text-3xl sm:text-4xl text-[var(--ink)] mb-2 font-normal">
              {guestArrivalTime}
            </div>
            {inviteLine && (
              <p className="body-base text-[var(--ink)] opacity-80 text-xs sm:text-sm leading-relaxed mt-2">
                {inviteLine}
              </p>
            )}
          </div>
        )}

        {/* Event Details: Clean Hairline Rows */}
        <div className="border-t border-[var(--ink)]/20 divide-y divide-[var(--ink)]/15 my-12 max-w-3xl mx-auto">
          {/* Row 1: Tanggal */}
          <div className="py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em] text-[10px] sm:text-xs">
              TANGGAL
            </span>
            <span className="sm:col-span-8 font-serif text-lg sm:text-xl text-[var(--ink)]">
              {dateFormatted}
            </span>
          </div>

          {/* Row 2: Waktu Acara */}
          <div className="py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em] text-[10px] sm:text-xs">
              WAKTU ACARA
            </span>
            <span className="sm:col-span-8 font-serif text-lg sm:text-xl text-[var(--ink)]">
              {timeFormatted}
            </span>
          </div>

          {/* Row 3: Lokasi */}
          <div className="py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em] text-[10px] sm:text-xs">
              LOKASI
            </span>
            <div className="sm:col-span-8 flex flex-col">
              <span className="font-serif text-lg sm:text-xl text-[var(--ink)] font-normal">
                {venueName}
              </span>
              <span className="body-base text-[var(--ink)] opacity-70 text-xs sm:text-sm mt-1 leading-relaxed">
                {venueAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-8">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-signature w-full sm:w-auto bg-white/80"
          >
            <span>Buka Google Maps</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 12L12 4M12 4H6M12 4V10"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          <button
            type="button"
            onClick={handleDownloadICS}
            className="btn-signature w-full sm:w-auto bg-transparent border-[var(--ink)]"
          >
            <span>Simpan ke Kalender</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 4H13V14H3V4ZM3 7H13M6 2V4M10 2V4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Clean Interactive Map */}
        <div className="my-10">
          <InteractiveMap
            lat={lat}
            lng={lng}
            zoom={16}
            mapsUrl={mapsUrl}
            venueName={venueName}
            venueAddress={venueAddress}
          />
        </div>

        {/* Countdown Timer Block */}
        <div className="mt-16 pt-10 border-t border-[var(--ink)]/15 text-center">
          <span className="label-eyebrow tracking-[0.25em] text-[var(--ink)] opacity-60 block mb-6 text-[10px] uppercase">
            {countdownLabel}
          </span>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
            {/* Days */}
            <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)]">
              <div className="font-serif tabular-nums text-2xl sm:text-4xl text-[var(--ink)] font-light">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] tracking-[0.2em] text-[var(--ink)] opacity-55 mt-1.5 font-mono">
                HARI
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)]">
              <div className="font-serif tabular-nums text-2xl sm:text-4xl text-[var(--ink)] font-light">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] tracking-[0.2em] text-[var(--ink)] opacity-55 mt-1.5 font-mono">
                JAM
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)]">
              <div className="font-serif tabular-nums text-2xl sm:text-4xl text-[var(--ink)] font-light">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] tracking-[0.2em] text-[var(--ink)] opacity-55 mt-1.5 font-mono">
                MENIT
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)]">
              <div className="font-serif tabular-nums text-2xl sm:text-4xl text-[var(--ink)] font-light">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] tracking-[0.2em] text-[var(--ink)] opacity-55 mt-1.5 font-mono">
                DETIK
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
