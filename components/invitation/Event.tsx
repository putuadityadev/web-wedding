'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from '@/lib/motion/gsap';
import { downloadCalendarEvent } from '@/lib/calendar/ics';

interface EventProps {
  dayFormatted: string; // e.g. "SABTU"
  dateNumeral: string; // e.g. "12"
  monthYearFormatted: string; // e.g. "DESEMBER 2026"
  dateFormatted: string; // e.g. "Sabtu, 12 Desember 2026"
  timeFormatted: string; // e.g. "11.00 – 14.00 WITA"
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
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
  dayFormatted = 'SABTU',
  dateNumeral = '12',
  monthYearFormatted = 'DESEMBER 2026',
  dateFormatted = 'Sabtu, 12 Desember 2026',
  timeFormatted = '11.00 – 14.00 WITA',
  venueName = 'The Glasshouse Ballroom',
  venueAddress = 'Jl. Metro Tanjung Bunga No. 88, Makassar',
  mapsUrl = 'https://maps.google.com/?q=The+Glasshouse+Makassar',
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
    const target = new Date(startsAt).getTime();

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
      gsap.fromTo(
        dateCardRef.current,
        {
          opacity: 0,
          y: 60,
          rotateX: 25,
          scale: 0.94,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 1.4,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 65%',
            once: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleDownloadICS = () => {
    downloadCalendarEvent({
      title: 'Pernikahan Aditya & Clarissa (Resepsi)',
      description: guestArrivalTime
        ? `Waktu kehadiran Anda: ${guestArrivalTime}. ${inviteLine || ''}`
        : 'Resepsi Pernikahan Aditya Pratama & Clarissa Maharani',
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
      <div className="max-w-5xl mx-auto w-full">
        {/* Section Tag */}
        <div className="flex items-center justify-between border-b border-[var(--ink)]/20 pb-4 mb-16">
          <span className="label-eyebrow tracking-[0.25em] text-[var(--ink)]">
            RESEPSI PERNIKAHAN
          </span>
          <span className="label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-60">
            WAKTU &amp; LOKASI
          </span>
        </div>

        {/* Date Display with 3D Card Treatment */}
        <div
          ref={dateCardRef}
          className="flex flex-col items-center text-center my-10 transform-gpu"
        >
          <span className="label-eyebrow tracking-[0.3em] text-[var(--ink)] opacity-75 mb-2">
            {dayFormatted}
          </span>
          <div className="event-date-numeral display-xl font-serif text-[var(--ink)] leading-none my-2 font-light drop-shadow-sm">
            {dateNumeral}
          </div>
          <span className="label-eyebrow tracking-[0.3em] text-[var(--ink)] opacity-75 mt-2">
            {monthYearFormatted}
          </span>
        </div>

        {/* Personalized Arrival Time Box */}
        {guestArrivalTime && (
          <div className="my-12 p-6 md:p-8 bg-white/75 backdrop-blur-md border border-[var(--ink)]/20 rounded-[var(--radius-sm)] shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-2xl mx-auto text-center">
            <span className="label-eyebrow tracking-[0.22em] text-[var(--deep)] block mb-2">
              WAKTU KEHADIRAN ANDA
            </span>
            <div className="font-serif text-3xl md:text-4xl text-[var(--ink)] mb-3">
              {guestArrivalTime}
            </div>
            {inviteLine && (
              <p className="body-base text-[var(--ink)] opacity-85 leading-relaxed">
                {inviteLine}
              </p>
            )}
          </div>
        )}

        {/* Event Details: 3 Hairline Rows */}
        <div className="border-t border-[var(--ink)]/20 divide-y divide-[var(--ink)]/20 my-16 max-w-3xl mx-auto">
          {/* Row 1: Tanggal */}
          <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em]">
              TANGGAL
            </span>
            <span className="sm:col-span-8 body-l font-serif text-[var(--ink)]">
              {dateFormatted}
            </span>
          </div>

          {/* Row 2: Waktu */}
          <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em]">
              WAKTU ACARA
            </span>
            <span className="sm:col-span-8 body-l font-serif text-[var(--ink)]">
              {timeFormatted}
            </span>
          </div>

          {/* Row 3: Lokasi */}
          <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
            <span className="sm:col-span-4 label-eyebrow text-[var(--ink)] opacity-60 tracking-[0.2em]">
              LOKASI
            </span>
            <div className="sm:col-span-8 flex flex-col">
              <span className="body-l font-serif text-[var(--ink)] font-medium">
                {venueName}
              </span>
              <span className="body-base text-[var(--ink)] opacity-75 mt-1">
                {venueAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Maps & Calendar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-10">
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

        {/* Countdown Timer Block with 3D Depth */}
        <div className="mt-20 pt-12 border-t border-[var(--ink)]/20 text-center">
          <span className="label-eyebrow tracking-[0.25em] text-[var(--ink)] opacity-70 block mb-8">
            MENGHITUNG HARI
          </span>

          <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
            {/* Days */}
            <div className="flex flex-col items-center p-3 sm:p-5 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)] shadow-xs">
              <div className="display-l font-serif tabular-nums text-[var(--ink)]">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--ink)] opacity-60 mt-2">
                HARI
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center p-3 sm:p-5 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)] shadow-xs">
              <div className="display-l font-serif tabular-nums text-[var(--ink)]">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--ink)] opacity-60 mt-2">
                JAM
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center p-3 sm:p-5 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)] shadow-xs">
              <div className="display-l font-serif tabular-nums text-[var(--ink)]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--ink)] opacity-60 mt-2">
                MENIT
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center p-3 sm:p-5 bg-white/50 backdrop-blur-xs border border-[var(--ink)]/10 rounded-[var(--radius-sm)] shadow-xs">
              <div className="display-l font-serif tabular-nums text-[var(--ink)]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className="label-eyebrow text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--ink)] opacity-60 mt-2">
                DETIK
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
