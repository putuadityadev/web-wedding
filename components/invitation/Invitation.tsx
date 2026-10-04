'use client';

import React, { useState } from 'react';
import { GuestView } from '@/lib/guests/view';
import { LenisProvider } from '@/lib/motion/lenis';
import { ASSETS } from '@/content/assets';
import { Cover } from './Cover';
import { PersistentBar } from './PersistentBar';
import { ThreadSvg } from './ThreadSvg';
import { Hero } from './Hero';
import { Quote } from './Quote';
import { Couple } from './Couple';
import { Story } from './Story';
import { Event } from './Event';
import { Gallery } from './Gallery';
import { Gift } from './Gift';
import { Rsvp } from './Rsvp';
import { Wishes } from './Wishes';
import { Footer } from './Footer';

interface InvitationProps {
  guest: GuestView;
  isPreview?: boolean;
}

export function Invitation({ guest, isPreview = false }: InvitationProps) {
  const [isCoverOpened, setIsCoverOpened] = useState(false);
  const [newWish, setNewWish] = useState<{ name: string; wish: string } | null>(null);

  const handleOpenInvitation = async () => {
    setIsCoverOpened(true);

    // Call POST /api/public/open only once per guest session, ignore preview
    if (!isPreview && guest.token && guest.token !== 'mock-sample-token') {
      try {
        await fetch('/api/public/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: guest.token }),
        });
      } catch (err) {
        console.warn('Failed to record open count:', err);
      }
    }
  };

  const handleRsvpSubmitted = (data: { wish: string | null }) => {
    if (data.wish) {
      setNewWish({
        name: guest.nickname || guest.name,
        wish: data.wish,
      });
    }
  };

  return (
    <LenisProvider initiallyLocked={true}>
      <div className="relative min-h-screen bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--baby-blue)] selection:text-[var(--ink)]">
        {/* Cover Screen */}
        <Cover
          guestName={guest.name}
          salutation={guest.salutation}
          groomName={guest.event.groomName}
          brideName={guest.event.brideName}
          dateFormatted={guest.event.dateFormatted}
          onOpenInvitation={handleOpenInvitation}
        />

        {/* Persistent Floating Controls (Menu, Audio, Scroll line, RSVP quick link) */}
        <PersistentBar
          audioSrc={guest.event.musicUrl || ASSETS.audio.src}
          isUnlocked={isCoverOpened}
        />

        {/* Signature Motif: Converging Thread Lines */}
        <ThreadSvg />

        {/* 1. Hero with Cinematic Background Video & 3D Typography */}
        <Hero
          groomName={guest.event.groomName}
          brideName={guest.event.brideName}
          dateShort="12 · 12 · 2026"
          city="MAKASSAR, SULAWESI SELATAN"
          videoSrc={ASSETS.hero.videoSrc}
          posterSrc={ASSETS.hero.posterSrc}
        />

        {/* 2. Quote */}
        <Quote text={guest.copy.openingLine} />

        {/* 3. Couple */}
        <Couple
          groom={ASSETS.couple.groom}
          bride={ASSETS.couple.bride}
        />

        {/* 4. Story */}
        <Story moments={ASSETS.story} />

        {/* 5. Event */}
        <Event
          dayFormatted={guest.event.dayFormatted}
          dateNumeral={guest.event.dateNumeral}
          monthYearFormatted={guest.event.monthYearFormatted}
          dateFormatted={guest.event.dateFormatted}
          timeFormatted={guest.event.timeFormatted}
          venueName={guest.event.venueName}
          venueAddress={guest.event.venueAddress}
          mapsUrl={guest.event.mapsUrl}
          guestArrivalTime={guest.event.guestArrivalTimeFormatted}
          inviteLine={guest.copy.inviteLine}
          startsAt={guest.event.startsAt}
          endsAt={guest.event.endsAt}
        />

        {/* 6. Gallery */}
        <Gallery items={ASSETS.gallery} />

        {/* 7. Gift */}
        <Gift accounts={guest.event.bankAccounts} />

        {/* 8. RSVP */}
        <Rsvp guest={guest} onRsvpSubmitted={handleRsvpSubmitted} />

        {/* 9. Wishes */}
        <Wishes newWish={newWish} />

        {/* 10. Footer */}
        <Footer
          closingLine={guest.copy.closingLine}
          groomName={guest.event.groomName}
          brideName={guest.event.brideName}
        />
      </div>
    </LenisProvider>
  );
}
