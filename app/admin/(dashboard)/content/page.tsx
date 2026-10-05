import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { CmsContentEditor } from '@/components/admin/cms/CmsContentEditor';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  await requireAdmin();
  const content = await getSiteContent();

  return (
    <div className="space-y-6">
      {/* Page Title & Explanation */}
      <div className="bg-white border border-[#0F1B2D]/10 rounded-[var(--radius-sm)] p-6 shadow-xs">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#0F1B2D]/50 font-mono block">
          PENGATURAN KONTEN & MEDIA
        </span>
        <h2 className="font-serif text-2xl text-[#0F1B2D] font-light mt-0.5">
          Editor Konten Undangan (CMS)
        </h2>
        <p className="text-xs text-[#0F1B2D]/60 mt-1 max-w-2xl leading-relaxed">
          Ubah judul, subjudul, kutipan, foto potret, momen cerita, hingga nomor rekening.
          Gunakan frame <strong>Live Preview</strong> di sisi kanan untuk melihat simulasi visual secara instan sebelum menyimpan.
        </p>
      </div>

      {/* Interactive Editor + Preview */}
      <CmsContentEditor initialContent={content} />
    </div>
  );
}
