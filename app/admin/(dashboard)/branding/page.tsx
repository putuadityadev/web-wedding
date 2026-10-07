import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { CmsContentEditor } from '@/components/admin/cms/CmsContentEditor';

export const dynamic = 'force-dynamic';

export default async function AdminBrandingPage() {
  await requireAdmin();
  const content = await getSiteContent();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
            BRANDING &amp; IDENTITAS DIGITAL
          </span>
          <h2 className="font-serif text-2xl text-[#0F1B2D] font-medium mt-0.5">
            Branding &amp; Meta WhatsApp
          </h2>
          <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
            Kelola judul preview, deskripsi OpenGraph, gambar thumbnail galeri, dan template teks saat link undangan dibagikan di WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview WA Aktif
          </span>
        </div>
      </div>

      {/* Interactive Editor with Branding Tab Pre-Selected */}
      <CmsContentEditor initialContent={content} initialTab="branding" />
    </div>
  );
}
