'use client';

import React, { useState } from 'react';
import { RSVPStatus, GuestView } from '@/lib/guests/view';
import { downloadCalendarEvent } from '@/lib/calendar/ics';

interface RsvpProps {
  guest: GuestView;
  onRsvpSubmitted?: (rsvpData: {
    status: RSVPStatus;
    pax: number;
    wish: string | null;
    phone?: string | null;
  }) => void;
}

export function Rsvp({ guest, onRsvpSubmitted }: RsvpProps) {
  const [status, setStatus] = useState<RSVPStatus | null>(guest.rsvp?.status || null);
  const [pax, setPax] = useState<number>(guest.rsvp?.pax || 1);
  const [phone, setPhone] = useState<string>(guest.phone || '');
  const [wish, setWish] = useState<string>(guest.rsvp?.wish || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(Boolean(guest.rsvp));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxPax = guest.maxPax || 2;
  const isPastDeadline = guest.event.rsvpDeadline
    ? new Date().getTime() > new Date(guest.event.rsvpDeadline).getTime()
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setErrorMsg('Silakan pilih salah satu opsi kehadiran.');
      return;
    }

    if (!guest.phone && !phone.trim()) {
      setErrorMsg('Silakan isi nomor WhatsApp Anda untuk konfirmasi.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Send RSVP to API endpoint
      const res = await fetch('/api/public/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: guest.token,
          status,
          pax: status === 'attending' ? pax : 0,
          wish: wish.trim() || null,
          phone: guest.phone ? undefined : phone.trim(),
        }),
      });

      if (!res.ok) {
        // Fallback for mock/offline phase
        console.warn('API returned non-OK, applying optimistic local state');
      }

      setIsSuccess(true);
      if (onRsvpSubmitted) {
        onRsvpSubmitted({
          status,
          pax: status === 'attending' ? pax : 0,
          wish: wish.trim() || null,
          phone: phone.trim() || guest.phone,
        });
      }
    } catch (err) {
      console.warn('Network error or API offline, applying local state:', err);
      setIsSuccess(true);
      if (onRsvpSubmitted) {
        onRsvpSubmitted({
          status,
          pax: status === 'attending' ? pax : 0,
          wish: wish.trim() || null,
          phone: phone.trim() || guest.phone,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgain = () => {
    setIsSuccess(false);
  };

  return (
    <section
      id="rsvp"
      className="relative w-full py-[var(--section-y)] px-[var(--gutter)] bg-[var(--paper)] select-none"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 md:p-12 bg-[var(--mist)]/60 border border-[var(--hairline)] rounded-[var(--radius-sm)] text-center my-6">
            {/* Draw checkmark icon */}
            <div className="w-14 h-14 rounded-full border border-[var(--deep)] flex items-center justify-center mx-auto mb-6 text-[var(--deep)] bg-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="display-m text-3xl md:text-4xl text-[var(--ink)] font-serif mb-4">
              {status === 'attending'
                ? guest.copy.rsvpThanksAttending
                : guest.copy.rsvpThanksDeclining}
            </h3>

            <p className="body-base text-[var(--ink)] opacity-75 max-w-lg mx-auto mb-8">
              {status === 'attending'
                ? `Kami telah mencatat kehadiran untuk ${pax} orang. Terima kasih telah berkenan menjadi bagian dari hari bahagia kami.`
                : 'Terima kasih atas konfirmasi dan doa tulus yang Anda kirimkan untuk kami.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {status === 'attending' && (
                <button
                  type="button"
                  onClick={() =>
                    downloadCalendarEvent({
                      title: 'Pernikahan Dharma & Lutfhy',
                      description: 'Konfirmasi Hadir Resepsi Pernikahan',
                      location: `${guest.event.venueName}, ${guest.event.venueAddress}`,
                      startDate: guest.arrivalAt || guest.event.startsAt,
                    })
                  }
                  className="btn-signature w-full sm:w-auto bg-white"
                >
                  <span>Tambah ke Kalender</span>
                </button>
              )}

              {!isPastDeadline && (
                <button
                  type="button"
                  onClick={handleEditAgain}
                  className="label-eyebrow px-6 py-3 border border-[var(--ink)] rounded-[var(--radius-sm)] hover:bg-white transition-colors"
                >
                  UBAH JAWABAN
                </button>
              )}
            </div>
          </div>
        ) : isPastDeadline ? (
          <div className="p-8 bg-[var(--mist)] border border-[var(--hairline)] rounded-[var(--radius-sm)] text-center">
            <h3 className="display-m text-2xl font-serif text-[var(--ink)] mb-2">
              Tenggat RSVP Telah Berakhir
            </h3>
            <p className="body-base text-[var(--ink)] opacity-75 max-w-md mx-auto">
              Batas waktu konfirmasi kehadiran telah lewat. Apabila ada perubahan, silakan hubungi mempelai secara langsung.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            {/* Title & prompt */}
            <div className="text-center max-w-xl mx-auto">
              <h2 className="display-l text-4xl sm:text-5xl font-serif text-[var(--ink)] mb-3">
                Akan Hadir?
              </h2>
              <p className="body-base text-[var(--ink)] opacity-75">
                {guest.copy.rsvpPrompt}
              </p>
            </div>

            {errorMsg && (
              <div
                aria-live="polite"
                className="p-4 bg-[var(--mist)] border border-[var(--deep)]/30 rounded-[var(--radius-sm)] text-sm text-[var(--deep)] text-center"
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Two Large Choice Radio Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus('attending')}
                className={`p-6 min-h-[96px] border text-left flex flex-col justify-between rounded-[var(--radius-sm)] transition-all duration-300 ${
                  status === 'attending'
                    ? 'bg-[var(--baby-blue)] border-[var(--ink)]'
                    : 'border-[var(--hairline)] hover:border-[var(--ink)] hover:bg-[var(--mist)]/50'
                }`}
              >
                <span className="label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-60">
                  PILIHAN 01
                </span>
                <span className="font-serif text-2xl sm:text-3xl text-[var(--ink)]">
                  Dengan senang hati hadir
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('not_attending')}
                className={`p-6 min-h-[96px] border text-left flex flex-col justify-between rounded-[var(--radius-sm)] transition-all duration-300 ${
                  status === 'not_attending'
                    ? 'bg-[var(--baby-blue)] border-[var(--ink)]'
                    : 'border-[var(--hairline)] hover:border-[var(--ink)] hover:bg-[var(--mist)]/50'
                }`}
              >
                <span className="label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-60">
                  PILIHAN 02
                </span>
                <span className="font-serif text-2xl sm:text-3xl text-[var(--ink)]">
                  Belum bisa hadir
                </span>
              </button>
            </div>

            {/* 2. Stepper for Pax (only if attending) */}
            {status === 'attending' && (
              <div className="p-6 border border-[var(--hairline)] rounded-[var(--radius-sm)] bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="label-eyebrow text-[var(--deep)] tracking-[0.2em] block mb-1">
                    JUMLAH TAMU
                  </span>
                  <span className="body-base text-[var(--ink)] opacity-75">
                    Maksimal alokasi kursi untuk Anda: {maxPax} orang
                  </span>
                </div>

                <div className="flex items-center gap-4 self-center sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPax(Math.max(1, pax - 1))}
                    disabled={pax <= 1}
                    className="w-11 h-11 border border-[var(--ink)] rounded-[var(--radius-sm)] flex items-center justify-center font-mono text-xl hover:bg-[var(--mist)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Kurangi satu tamu"
                  >
                    −
                  </button>

                  <span className="font-serif text-3xl tabular-nums text-[var(--ink)] w-10 text-center">
                    {pax}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPax(Math.min(maxPax, pax + 1))}
                    disabled={pax >= maxPax}
                    className="w-11 h-11 border border-[var(--ink)] rounded-[var(--radius-sm)] flex items-center justify-center font-mono text-xl hover:bg-[var(--mist)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Tambah satu tamu"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 3. Phone number input (only if guest has no phone recorded) */}
            {!guest.phone && (
              <div className="flex flex-col gap-2">
                <label className="label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-80">
                  NOMOR WHATSAPP (AKTIF)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full py-3 bg-transparent border-b border-[var(--hairline)] focus:border-[var(--ink)] text-lg text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink)]/30"
                />
                <span className="text-xs text-[var(--ink)] opacity-60">
                  Diperlukan untuk konfirmasi dan pengingat jadwal kedatangan.
                </span>
              </div>
            )}

            {/* 4. Wishes Textarea (auto-grow feel, max 500 chars) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="label-eyebrow tracking-[0.2em] text-[var(--ink)] opacity-80">
                  UCAPAN &amp; DOA RESTU (OPSIONAL)
                </label>
                <span className="text-xs font-mono text-[var(--ink)] opacity-50">
                  {wish.length}/500
                </span>
              </div>

              <textarea
                value={wish}
                onChange={(e) => setWish(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Tuliskan ucapan atau doa baik Anda untuk kami..."
                className="w-full p-4 bg-white/50 border border-[var(--hairline)] rounded-[var(--radius-sm)] focus:border-[var(--ink)] text-base text-[var(--ink)] outline-none transition-colors resize-none placeholder:text-[var(--ink)]/30"
              />
            </div>

            {/* 5. Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-signature w-full sm:w-auto min-w-[220px]"
              >
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}</span>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
