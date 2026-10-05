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
      {/* Interactive Editor + Preview */}
      <CmsContentEditor initialContent={content} />
    </div>
  );
}
