import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RecentRsvpItem {
  id: string;
  guestName: string;
  status: 'attending' | 'not_attending';
  pax: number;
  wish: string | null;
  createdAt: string;
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  let stats = {
    totalGuests: 0,
    totalSeats: 0,
    openedCount: 0,
    openedPercentage: 0,
    attendingCount: 0,
    notAttendingCount: 0,
    unrespondedCount: 0,
    withoutPhoneCount: 0,
    needsReviewCount: 0,
    recentRsvps: [] as RecentRsvpItem[],
  };

  let dbError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data: guests, error: guestsErr } = await admin
      .from('guests')
      .select('id, phone, max_pax, open_count, needs_review');

    const { data: rsvps, error: rsvpsErr } = await admin
      .from('rsvps')
      .select('id, guest_id, status, pax, wish, created_at, guests(name)')
      .order('created_at', { ascending: false });

    if (guestsErr || rsvpsErr) {
      dbError = guestsErr?.message || rsvpsErr?.message || 'Gagal terhubung ke database';
    } else {
      const guestList = guests || [];
      const rsvpList = rsvps || [];

      const totalGuests = guestList.length;
      const totalSeats = guestList.reduce((sum, g) => sum + (g.max_pax || 2), 0);
      const openedCount = guestList.filter((g) => g.open_count > 0).length;
      const openedPercentage = totalGuests > 0 ? Math.round((openedCount / totalGuests) * 100) : 0;
      const withoutPhoneCount = guestList.filter((g) => !g.phone).length;
      const needsReviewCount = guestList.filter((g) => g.needs_review).length;

      const attendingCount = rsvpList.filter((r) => r.status === 'attending').length;
      const notAttendingCount = rsvpList.filter((r) => r.status === 'not_attending').length;
      const unrespondedCount = Math.max(0, totalGuests - (attendingCount + notAttendingCount));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recentRsvps: RecentRsvpItem[] = rsvpList.slice(0, 8).map((r: any) => ({
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
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : 'Terjadi kendala koneksi ke Supabase';
  }

  return (
    <div className="space-y-8">
      {/* DB Error Notification if connection failed */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--radius-sm)] p-4 text-xs text-red-800 flex items-start gap-3">
          <span className="text-base leading-none">⚠️</span>
          <div className="space-y-1">
            <strong className="font-semibold">Koneksi Database Supabase Terkendala:</strong>
            <p className="font-mono text-[11px] text-red-700">{dbError}</p>
            <p className="text-[11px] text-red-600 mt-1">
              Pastikan environment variable Supabase sudah benar dan file script{' '}
              <code className="bg-red-100 px-1 py-0.5 rounded font-mono">supabase/setup_complete.sql</code> sudah dijalankan di Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

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
            href="/admin/blast"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-medium tracking-wide transition-all shadow-xs"
          >
            <span>🚀 Buka WA Blasting</span>
          </Link>
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium tracking-wide transition-all shadow-xs"
          >
            <span>Buka Editor CMS</span>
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
            {stats.totalGuests > 0
              ? `Dari ${stats.totalGuests} link yang dibagikan`
              : 'Belum ada link dibagikan'}
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
                Daftar respons dan doa restu yang baru saja dikirim oleh para tamu.
              </p>
            </div>
            <Link
              href="/admin/guests"
              className="text-xs font-mono text-[#0F1B2D]/70 hover:text-[#0F1B2D] underline underline-offset-4"
            >
              Lihat Semua Tamu →
            </Link>
          </div>

          {stats.recentRsvps.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-[#0F1B2D]/15 rounded-[var(--radius-sm)] bg-[#FBFBFC]">
              <div className="w-12 h-12 rounded-full bg-[#0F1B2D]/5 text-[#0F1B2D]/60 flex items-center justify-center text-xl mx-auto mb-3">
                ✉️
              </div>
              <h4 className="font-serif text-base font-medium text-[#0F1B2D]">
                Belum Ada Konfirmasi RSVP
              </h4>
              <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-sm mx-auto leading-relaxed">
                Saat tamu membuka tautan undangan mereka dan mengisi kehadiran, respons serta ucapan doa akan otomatis muncul di sini.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link
                  href="/admin/guests"
                  className="px-3.5 py-2 rounded bg-[#0F1B2D] text-white hover:bg-[#1E293B] text-xs font-medium transition-all"
                >
                  + Tambah Tamu
                </Link>
                <Link
                  href="/admin/import"
                  className="px-3.5 py-2 rounded bg-white hover:bg-stone-50 border border-[#0F1B2D]/15 text-[#0F1B2D] text-xs font-medium transition-all"
                >
                  Import dari CSV
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#0F1B2D]/10 text-[#0F1B2D]/50 font-mono text-[10px] uppercase">
                    <th className="pb-3 font-normal w-10 text-center">No.</th>
                    <th className="pb-3 font-normal">Nama Tamu</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal">Pax</th>
                    <th className="pb-3 font-normal">Ucapan / Doa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1B2D]/5">
                  {stats.recentRsvps.map((rsvp, idx) => (
                    <tr key={rsvp.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3.5 text-center font-mono text-[11px] text-[#0F1B2D]/40 select-none">
                        {idx + 1}
                      </td>
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
          )}
        </div>

        {/* Quick Shortcuts & Guidance (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
            <h3 className="font-serif text-lg text-[#0F1B2D] font-medium mb-2">
              Aksi Cepat
            </h3>
            <p className="text-xs text-[#0F1B2D]/60 mb-5 leading-relaxed">
              Pintasan untuk mengedit konten undangan, menambah tamu, atau mengirim broadcast WA.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/blast"
                className="flex items-center justify-between p-3 rounded bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-200 transition-all text-xs font-medium text-emerald-900"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚀</span>
                  <span>WhatsApp Blasting</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">Blast WA →</span>
              </Link>

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
