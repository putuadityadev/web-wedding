'use client';

import React, { useEffect, useState } from 'react';
import { GuestView } from '@/lib/guests/view';
import { SiteContent } from '@/lib/content/types';
import { Invitation } from '@/components/invitation/Invitation';

interface PreviewClientProps {
  initialContent: SiteContent;
  guest: GuestView;
  initialUnlocked?: boolean;
}

export function PreviewClient({
  initialContent,
  guest,
  initialUnlocked = true,
}: PreviewClientProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [isCoverForceOpened, setIsCoverForceOpened] = useState<boolean>(initialUnlocked);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: only accept same-origin messages
      if (typeof window !== 'undefined' && event.origin !== window.location.origin) {
        return;
      }

      const { data } = event;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SYNC_CONTENT' && data.content) {
        setContent(data.content);
      }

      if (data.type === 'TOGGLE_COVER') {
        setIsCoverForceOpened(Boolean(data.open));
      }

      if (data.type === 'SCROLL_TO' && data.section) {
        const sectionId = data.section;
        if (sectionId === 'cover') {
          setIsCoverForceOpened(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setIsCoverForceOpened(true);
          // Wait a tick for cover unmount / layout update, then scroll smoothly
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 120);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full min-h-screen">
      <Invitation
        guest={guest}
        siteContent={content}
        isPreview={true}
        isCoverForceOpened={isCoverForceOpened}
      />
    </div>
  );
}
