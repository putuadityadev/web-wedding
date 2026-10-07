import React from 'react';
import { getSiteContent } from '@/lib/content/service';
import { getMockGuestView } from '@/lib/guests/mock';
import { PreviewClient } from '@/components/preview/PreviewClient';

export const dynamic = 'force-dynamic';

interface PreviewPageProps {
  searchParams?: Promise<{
    unlocked?: string;
  }>;
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const sp = await searchParams;
  const isUnlocked = sp?.unlocked === '1' || sp?.unlocked === 'true';

  const content = await getSiteContent();
  const guest = getMockGuestView({
    name: 'Bapak Budi & Rekan',
    tone: 'warm',
    siteContent: content,
  });

  return (
    <PreviewClient
      initialContent={content}
      guest={guest}
      initialUnlocked={isUnlocked}
    />
  );
}
