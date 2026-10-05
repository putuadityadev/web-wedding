import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  await requireAdmin();

  let stats = {
    totalGuests: 142,
    totalSeats: 284,
    openedCount: 98,
    openedPercentage: 69,
    attendingCount: 84,
    notAttendingCount: 12,
    unrespondedCount: 46,
    withoutPhoneCount: 8,
    needsReviewCount: 2,
    recentRsvps: [
      {
        id: '1',
        guestName: 'Bapak Budi & Keluarga',
        status: 'attending',
        pax: 2,
        wish: 'Selamat menempuh hidup baru Dharma & Lutfhy! Bahagia selalu selamanya.',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        guestName: 'Kadek Mahendra',
        status: 'attending',
        pax: 1,
        wish: 'Rahajeng ngemargiang pawiwahan bli Dharma!',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        guestName: 'Siti Rahmawati & Rekan',
        status: 'not_attending',
        pax: 0,
        wish: 'Mohon maaf belum bisa hadir langsung, doa terbaik untuk kalian berdua.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  };

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  if (isSupabaseConfigured) {
    try {
      const admin = createAdminClient();
      const { data: guests } = await admin
        .from('guests')
        .select('id, phone, max_pax, open_count, needs_review');

      const { data: rsvps } = await admin
        .from('rsvps')
        .select('id, guest_id, status, pax, wish, created_at, guests(name)')
        .order('created_at', { ascending: false });

      if (guests && guests.length > 0) {
        const totalGuests = guests.length;
        const totalSeats = guests.reduce((sum, g) => sum + (g.max_pax || 2), 0);
        const openedCount = guests.filter((g) => g.open_count > 0).length;
        const openedPercentage = Math.round((openedCount / totalGuests) * 100);
        const withoutPhoneCount = guests.filter((g) => !g.phone).length;
        const needsReviewCount = guests.filter((g) => g.needs_review).length;

        const rsvpList = rsvps || [];
        const attendingCount = rsvpList.filter((r) => r.status === 'attending').length;
        const notAttendingCount = rsvpList.filter((r) => r.status === 'not_attending').length;
        const unrespondedCount = Math.max(0, totalGuests - (attendingCount + notAttendingCount));

        // Format recent rsvps
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recentRsvps = rsvpList.slice(0, 8).map((r: any) => ({
          id: r.id,
          guestName: r.guests?.name || 'Tamu Undangan',
          status: r.status,
          pax: r.pax,
          wish: r.wish,
          createdAt: r.created_at,
        }));

        stats = {
          totalGuests,
          totalSeats,
          openedCount,
          openedPercentage,
          attendingCount,
          notAttendingCount,
          unrespondedCount,
          withoutPhoneCount,
          needsReviewCount,
          recentRsvps,
        };
      }
    } catch (e) {
      console.warn('Fallback to mock overview stats:', e);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            RINGKASAN PENYELENGGARAAN
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-1">
            Status Undangan Pernikahan
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1">
            Pantau kehadiran para tamu, RSVP, dan lakukan pembaruan konten secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide transition-all shadow-xs"
          >
            <span>Buka Editor Konten</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Guests */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/55">
              TOTAL UNDANGAN
            </span>
            <span className="text-[11px] text-[#0F1B2D]/40 font-mono">Pax: {stats.totalSeats}</span>
          </div>
          <div className="mt-3 font-serif text-3xl text-[#0F1B2D] font-light">
            {stats.totalGuests}
          </div>
          <div className="mt-2 text-[11px] text-[#0F1B2D]/60 flex items-center gap-1">
            <span>{stats.withoutPhoneCount} tanpa no. HP</span>
          </div>
        </div>

        {/* Card 2: Opened Rate */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/55">
              DIBUKA OLEH TAMU
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.openedPercentage}%
            </span>
          </div>
          <div className="mt-3 font-serif text-3xl text-[#0F1B2D] font-light">
            {stats.openedCount}
          </div>
          <div className="mt-2 text-[11px] text-[#0F1B2D]/60">
            Dari {stats.totalGuests} total link yang dibagikan
          </div>
        </div>

        {/* Card 3: Attending */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/55">
              KONFIRMASI HADIR
            </span>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              HADIR
            </span>
          </div>
          <div className="mt-3 font-serif text-3xl text-[#0F1B2D] font-light">
            {stats.attendingCount}
          </div>
          <div className="mt-2 text-[11px] text-[#0F1B2D]/60">
            {stats.notAttendingCount} berhalangan hadir
          </div>
        </div>

        {/* Card 4: Unresponded */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1B2D]/55">
              BELUM RESPONS
            </span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              PENDING
            </span>
          </div>
          <div className="mt-3 font-serif text-3xl text-[#0F1B2D] font-light">
            {stats.unrespondedCount}
          </div>
          <div className="mt-2 text-[11px] text-[#0F1B2D]/60">
            {stats.needsReviewCount} perlu review admin
          </div>
        </div>
      </div>

      {/* Recent RSVP & Actions Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent RSVPs (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg text-[#0F1B2D] font-medium">
                Konfirmasi RSVP Terbaru
              </h3>
              <p className="text-xs text-[#0F1B2D]/50 mt-0.5">
                Daftar respons dan doa restu yang baru saja dikirim oleh tamu.
              </p>
            </div>
            <Link
              href="/admin/guests"
              className="text-xs font-mono text-[#0F1B2D]/70 hover:text-[#0F1B2D] underline underline-offset-4"
            >
              Lihat Semua Tamu →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0F1B2D]/10 text-[#0F1B2D]/50 font-mono text-[10px] uppercase">
                  <th className="pb-3 font-normal">Nama Tamu</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 font-normal">Pax</th>
                  <th className="pb-3 font-normal">Ucapan / Doa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F1B2D]/5">
                {stats.recentRsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3.5 font-medium text-[#0F1B2D] whitespace-nowrap">
                      {rsvp.guestName}
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      {rsvp.status === 'attending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                          Berhalangan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-mono text-[#0F1B2D]/70">
                      {rsvp.pax || 0}
                    </td>
                    <td className="py-3.5 text-[#0F1B2D]/70 max-w-xs truncate" title={rsvp.wish || ''}>
                      {rsvp.wish || <span className="opacity-40 italic">Tanpa ucapan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Shortcuts & Guidance (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
            <h3 className="font-serif text-lg text-[#0F1B2D] font-medium mb-2">
              Aksi Cepat
            </h3>
            <p className="text-xs text-[#0F1B2D]/60 mb-5 leading-relaxed">
              Pintasan untuk mengedit konten undangan, menambah tamu, atau mengimpor daftar dari CSV.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/content"
                className="flex items-center justify-between p-3 rounded bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#0F1B2D]/5 transition-all text-xs font-medium text-[#0F1B2D]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✍️</span>
                  <span>Ubah Konten & Foto</span>
                </div>
                <span className="text-[10px] font-mono text-[#0F1B2D]/40">CMS →</span>
              </Link>

              <Link
                href="/admin/import"
                className="flex items-center justify-between p-3 rounded bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#0F1B2D]/5 transition-all text-xs font-medium text-[#0F1B2D]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📥</span>
                  <span>Import Tamu dari Excel/CSV</span>
                </div>
                <span className="text-[10px] font-mono text-[#0F1B2D]/40">CSV →</span>
              </Link>

              <Link
                href="/admin/wishes"
                className="flex items-center justify-between p-3 rounded bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#0F1B2D]/5 transition-all text-xs font-medium text-[#0F1B2D]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💌</span>
                  <span>Moderasi Dinding Ucapan</span>
                </div>
                <span className="text-[10px] font-mono text-[#0F1B2D]/40">Doa →</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#0F1B2D] text-white rounded-[var(--radius-sm)] p-5 shadow-xs">
            <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--baby-blue)] uppercase block mb-1">
              LIVE PREVIEW CMS
            </span>
            <h4 className="font-serif text-base font-medium">Preview Per Section</h4>
            <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
              Saat Anda mengubah teks atau foto di menu Editor Konten, frame preview interaktif di sisi kanan akan langsung memperbarui tampilannya secara seketika.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
