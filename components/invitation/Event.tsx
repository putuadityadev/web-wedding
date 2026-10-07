'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from '@/lib/motion/gsap';
import { downloadCalendarEvent } from '@/lib/calendar/ics';

// Safe dynamic client-side import for the map to prevent SSR hydration conflict
const InteractiveMap = dynamic(
  () => import('./InteractiveMap').then((m) => m.InteractiveMap),
  { ssr: false }
);

export interface EventProps {
  sectionLabel?: string;
  sectionTitle?: string;
  dayFormatted: string; // e.g. "SENIN"
  dateNumeral: string; // e.g. "12"
  monthYearFormatted: string; // e.g. "OKTOBER 2026"
  dateFormatted: string; // e.g. "Senin, 12 Oktober 2026"
  timeFormatted: string; // e.g. "11.00 – 14.00 WITA"
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lat?: number;
  lng?: number;
  countdownLabel?: string;
  guestArrivalTime?: string | null;
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
  sectionLabel = 'WAKTU & LOKASI',
  sectionTitle = 'Resepsi Pernikahan',
  dayFormatted = 'SENIN',
  dateNumeral = '12',
  monthYearFormatted = 'OKTOBER 2026',
  dateFormatted = 'Senin, 12 Oktober 2026',
  timeFormatted = '11.00 – 14.00 WITA',
  venueName = 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
  venueAddress = 'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
  mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
  lat = -8.3981403,
  lng = 115.3643337,
  countdownLabel = 'MENGHITUNG HARI',
  guestArrivalTime,
  startsAt,
  endsAt,
}: EventProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeCardRef = useRef<HTMLDivElement | null>(null);
  const locationCardRef = useRef<HTMLDivElement | null>(null);

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate Real-Time Countdown
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

  // Premium GSAP ScrollTrigger Entrance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Header reveal
      gsap.fromTo(
        '.event-header-reveal',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Left card (Time & Date) entrance
      if (timeCardRef.current) {
        gsap.fromTo(
          timeCardRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: timeCardRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // Right card (Location & Map) entrance
      if (locationCardRef.current) {
        gsap.fromTo(
          locationCardRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: locationCardRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  const handleDownloadICS = () => {
    downloadCalendarEvent({
      title: 'Pernikahan Dharma & Lutfhy',
      description: `Resepsi Pernikahan. Waktu: ${timeFormatted}. Tempat: ${venueName}, ${venueAddress}`,
      location: `${venueName}, ${venueAddress}`,
      startDate: startsAt,
      endDate: endsAt,
    });
  };

  return (
    <section
      ref={containerRef}
      id="event"
      className="relative w-full py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12 bg-[var(--paper)] select-none overflow-hidden"
    >
      {/* Ambient background lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(169, 203, 234, 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        {/* Section Header: Minimalist & Clean */}
        <div className="event-header-reveal text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep)]" />
            <span className="label-eyebrow tracking-[0.28em] text-[var(--deep)] text-[11px] font-mono uppercase font-semibold">
              {sectionLabel}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[var(--ink)] font-normal tracking-tight">
            {sectionTitle}
          </h2>
        </div>

        {/* 2-Column Balanced Editorial Layout: Waktu di Mana & Lokasi di Mana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* ========================================================
              CARD 1: WAKTU & TANGGAL RESEPSI (WHEN)
              ======================================================== */}
          <div
            ref={timeCardRef}
            className="bg-white/80 backdrop-blur-md border border-[var(--ink)]/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(15,27,45,0.04)] flex flex-col justify-between"
          >
            <div>
              {/* Card Tag */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--ink)]/10 mb-6">
                <span className="label-eyebrow tracking-[0.24em] text-[var(--deep)] text-[10px] sm:text-[11px] font-mono uppercase font-medium">
                  WAKTU &amp; TANGGAL
                </span>
                <span className="text-[10px] font-mono text-[var(--ink)]/40 uppercase">
                  RESEPSI
                </span>
              </div>

              {/* Architectural Date Display */}
              <div className="flex flex-col items-center text-center my-4">
                <span className="label-eyebrow tracking-[0.3em] text-[var(--deep)] text-xs sm:text-sm font-semibold uppercase mb-1">
                  {dayFormatted}
                </span>
                <div className="font-serif text-6xl sm:text-7xl lg:text-8xl text-[var(--ink)] leading-none my-1 font-light drop-shadow-xs">
                  {dateNumeral}
                </div>
                <span className="label-eyebrow tracking-[0.28em] text-[var(--ink)]/70 text-xs sm:text-sm uppercase mt-1">
                  {monthYearFormatted}
                </span>
              </div>

              {/* Time Badge */}
              <div className="mt-6 p-4 rounded-xl bg-[var(--paper)] border border-[var(--ink)]/8 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-[var(--deep)] text-xs font-mono tracking-wider uppercase mb-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Waktu Acara</span>
                </div>
                <span className="font-serif text-xl sm:text-2xl text-[var(--ink)] font-normal mt-0.5">
                  {timeFormatted}
                </span>
                {guestArrivalTime && guestArrivalTime !== timeFormatted && (
                  <span className="text-[11px] font-mono text-[var(--deep)] mt-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[var(--deep)]/20">
                    Sesi Kehadiran: {guestArrivalTime}
                  </span>
                )}
              </div>

              {/* Live Countdown Timer */}
              <div className="mt-6 pt-5 border-t border-[var(--ink)]/10 text-center">
                <span className="label-eyebrow tracking-[0.24em] text-[var(--ink)]/55 block mb-3 text-[10px] font-mono uppercase">
                  {countdownLabel}
                </span>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {/* Days */}
                  <div className="flex flex-col items-center py-2.5 px-1 bg-[var(--paper)] border border-[var(--ink)]/8 rounded-xl">
                    <div className="font-serif tabular-nums text-xl sm:text-2xl text-[var(--ink)] font-light">
                      {String(timeLeft.days).padStart(2, '0')}
                    </div>
                    <span className="text-[8.5px] tracking-[0.16em] text-[var(--ink)]/50 mt-1 font-mono uppercase">
                      HARI
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col items-center py-2.5 px-1 bg-[var(--paper)] border border-[var(--ink)]/8 rounded-xl">
                    <div className="font-serif tabular-nums text-xl sm:text-2xl text-[var(--ink)] font-light">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <span className="text-[8.5px] tracking-[0.16em] text-[var(--ink)]/50 mt-1 font-mono uppercase">
                      JAM
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="flex flex-col items-center py-2.5 px-1 bg-[var(--paper)] border border-[var(--ink)]/8 rounded-xl">
                    <div className="font-serif tabular-nums text-xl sm:text-2xl text-[var(--ink)] font-light">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <span className="text-[8.5px] tracking-[0.16em] text-[var(--ink)]/50 mt-1 font-mono uppercase">
                      MENIT
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="flex flex-col items-center py-2.5 px-1 bg-[var(--paper)] border border-[var(--ink)]/8 rounded-xl">
                    <div className="font-serif tabular-nums text-xl sm:text-2xl text-[var(--ink)] font-light">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <span className="text-[8.5px] tracking-[0.16em] text-[var(--ink)]/50 mt-1 font-mono uppercase">
                      DETIK
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action: Simpan ke Kalender */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleDownloadICS}
                className="btn-signature w-full bg-white hover:bg-[var(--mist)] border border-[var(--ink)]/20 text-[var(--ink)] transition-all cursor-pointer shadow-2xs"
              >
                <span>Simpan ke Kalender</span>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 4H13V14H3V4ZM3 7H13M6 2V4M10 2V4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ========================================================
              CARD 2: TEMPAT & LOKASI (WHERE)
              ======================================================== */}
          <div
            ref={locationCardRef}
            className="bg-white/80 backdrop-blur-md border border-[var(--ink)]/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(15,27,45,0.04)] flex flex-col justify-between"
          >
            <div>
              {/* Card Tag */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--ink)]/10 mb-6">
                <span className="label-eyebrow tracking-[0.24em] text-[var(--deep)] text-[10px] sm:text-[11px] font-mono uppercase font-medium">
                  TEMPAT &amp; LOKASI
                </span>
                <span className="text-[10px] font-mono text-[var(--ink)]/40 uppercase">
                  MAPS
                </span>
              </div>

              {/* Venue Name & Address */}
              <div className="my-2">
                <h3 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] font-normal leading-snug mb-3">
                  {venueName}
                </h3>
                <p className="body-base text-sm text-[var(--ink)]/75 leading-relaxed">
                  {venueAddress}
                </p>
              </div>

              {/* Interactive Map Embed */}
              <div className="my-6 rounded-xl overflow-hidden border border-[var(--ink)]/15 shadow-2xs">
                <div className="h-[220px] sm:h-[240px] w-full">
                  <InteractiveMap
                    lat={lat}
                    lng={lng}
                    zoom={16}
                    mapsUrl={mapsUrl}
                    venueName={venueName}
                    venueAddress={venueAddress}
                  />
                </div>
              </div>
            </div>

            {/* Action: Buka Google Maps */}
            <div className="mt-8 pt-4">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-signature w-full bg-[#0F1B2D] text-white hover:bg-[#1E2E44] border-transparent transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span>Buka Google Maps</span>
                <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 12L12 4M12 4H6M12 4V10"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
