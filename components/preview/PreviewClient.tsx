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
  const [guestState, setGuestState] = useState<GuestView>(guest);
  const [isCoverForceOpened, setIsCoverForceOpened] = useState<boolean>(initialUnlocked);

  useEffect(() => {
    // Ensure iframe body is always naturally scrollable and responsive to wheel & touch
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';

    const handleMessage = (event: MessageEvent) => {
      // Security check: only accept same-origin messages
      if (typeof window !== 'undefined' && event.origin !== window.location.origin) {
        return;
      }

      const { data } = event;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SYNC_CONTENT' && data.content) {
        setContent(data.content);
        if (data.content.event) {
          const ev = data.content.event;
          setGuestState((prev) => ({
            ...prev,
            event: {
              ...prev.event,
              dateFormatted: ev.dateFormatted || prev.event.dateFormatted,
              dayFormatted: ev.dayFormatted || prev.event.dayFormatted,
              dateNumeral: ev.dateNumeral || prev.event.dateNumeral,
              monthYearFormatted: ev.monthYearFormatted || prev.event.monthYearFormatted,
              timeFormatted: ev.timeFormatted || prev.event.timeFormatted,
              guestArrivalTimeFormatted: ev.timeFormatted || prev.event.guestArrivalTimeFormatted,
              venueName: ev.venueName || prev.event.venueName,
              venueAddress: ev.venueAddress || prev.event.venueAddress,
              mapsUrl: ev.mapsUrl || prev.event.mapsUrl,
              startsAt: ev.startsAt || prev.event.startsAt,
              endsAt: ev.endsAt || prev.event.endsAt,
            },
          }));
        }
      }

      if (data.type === 'TOGGLE_COVER') {
        const nextOpen = Boolean(data.open);
        setIsCoverForceOpened(nextOpen);
        if (nextOpen) {
          document.body.style.overflowY = 'auto';
        }
      }

      if (data.type === 'SCROLL_TO' && data.section) {
        const sectionId = data.section;
        if (sectionId === 'cover') {
          setIsCoverForceOpened(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setIsCoverForceOpened(true);
          document.body.style.overflowY = 'auto';
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
        guest={guestState}
        siteContent={content}
        isPreview={true}
        isCoverForceOpened={isCoverForceOpened}
      />
    </div>
  );
}
