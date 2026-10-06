import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { GalleryManager } from '@/components/admin/gallery/GalleryManager';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage() {
  await requireAdmin();
  const content = await getSiteContent();

  const gallery = content.gallery || {
    sectionLabel: 'GALERI KENANGAN',
    sectionTitle: 'Momen Terindah Kami',
    sectionDesc: 'Kilas balik perjalanan cinta dalam frame dokumentasi.',
    items: [],
  };

  return (
    <div className="space-y-6">
      <GalleryManager initialGallery={gallery} />
    </div>
  );
}
