import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
          KONFIGURASI SISTEM
        </span>
        <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
          Pengaturan Acara & Hak Akses
        </h2>
        <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
          Informasi zona waktu, tenggat RSVP, integrasi Supabase, dan email administrator yang berhak mengakses sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Admin Allowlist */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
            Email Admin Terdaftar (Allowlist)
          </h3>
          <p className="text-xs text-[#0F1B2D]/60 leading-relaxed">
            Hanya 2 akun Google berikut yang memiliki izin otorisasi SSO untuk masuk ke sistem dashboard ini:
          </p>

          <ul className="space-y-2 text-xs font-mono">
            <li className="p-2.5 rounded bg-[#F9FAFB] border border-[#0F1B2D]/10 flex items-center justify-between">
              <span>adityamph1@gmail.com</span>
              {admin.email === 'adityamph1@gmail.com' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Anda
                </span>
              )}
            </li>
            <li className="p-2.5 rounded bg-[#F9FAFB] border border-[#0F1B2D]/10 flex items-center justify-between">
              <span>arisiki123@gmail.com</span>
              {admin.email === 'arisiki123@gmail.com' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Anda
                </span>
              )}
            </li>
          </ul>
        </div>

        {/* Card 2: Environment & Timezone */}
        <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-medium text-[#0F1B2D]">
            Parameter Sistem
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#0F1B2D]/10">
              <span className="text-[#0F1B2D]/60 font-mono">Zona Waktu Default</span>
              <span className="font-medium text-[#0F1B2D]">Asia/Makassar (WITA, UTC+8)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#0F1B2D]/10">
              <span className="text-[#0F1B2D]/60 font-mono">Tenggat RSVP</span>
              <span className="font-medium text-[#0F1B2D]">28 November 2026 23:59 WITA</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#0F1B2D]/10">
              <span className="text-[#0F1B2D]/60 font-mono">Media Storage Bucket</span>
              <span className="font-medium text-[#0F1B2D] font-mono">wedding-assets</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#0F1B2D]/60 font-mono">Status Auth</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono">
                Aktif & Terlindungi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
