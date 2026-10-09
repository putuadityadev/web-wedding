import React, { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { WhatsAppBlaster } from '@/components/admin/blast/WhatsAppBlaster';

export const dynamic = 'force-dynamic';

export default async function AdminBlastPage() {
  await requireAdmin();
  const siteContent = await getSiteContent();

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-[#0F1B2D]/50 font-mono">
          Memuat sistem blasting WhatsApp...
        </div>
      }
    >
      <WhatsAppBlaster siteContent={siteContent} />
    </Suspense>
  );
}
