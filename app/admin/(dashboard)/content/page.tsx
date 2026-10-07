import React from 'react';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent } from '@/lib/content/service';
import { CmsContentEditor } from '@/components/admin/cms/CmsContentEditor';

import { SiteContent } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function AdminContentPage({ searchParams }: PageProps) {
  await requireAdmin();
  const content = await getSiteContent();
  const sp = await searchParams;
  const initialTab = sp?.tab as keyof SiteContent | undefined;

  return (
    <div className="space-y-6">
      {/* Interactive Editor + Preview */}
      <CmsContentEditor initialContent={content} initialTab={initialTab} />
    </div>
  );
}

