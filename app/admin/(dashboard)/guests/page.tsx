import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { GuestManager } from '@/components/admin/guests/GuestManager';

export const dynamic = 'force-dynamic';

export default async function AdminGuestsPage() {
  await requireAdmin();
  const siteContent = await getSiteContent();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
          BUKU TAMU & UNDANGAN
        </span>
        <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
          Manajemen Tamu Undangan
        </h2>
        <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
          Kelola daftar tamu, salin tautan undangan personal, atau kirim undangan secara instan via WhatsApp.
        </p>
      </div>

      <GuestManager siteContent={siteContent} />
    </div>
  );
}
