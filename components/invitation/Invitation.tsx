'use client';

import React, { useState } from 'react';
import { GuestView } from '@/lib/guests/view';
import { LenisProvider } from '@/lib/motion/lenis';
import { ASSETS } from '@/content/assets';
import { Cover } from './Cover';
import { PersistentBar } from './PersistentBar';
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
import { SplashCursor } from '@/components/ui/SplashCursor';
import { SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/content/types';

interface InvitationProps {
  guest: GuestView;
  siteContent?: SiteContent;
  isPreview?: boolean;
  isCoverForceOpened?: boolean;
}

export function Invitation({
  guest,
  siteContent,
  isPreview = false,
  isCoverForceOpened,
}: InvitationProps) {
  const content = siteContent || DEFAULT_SITE_CONTENT;
  const [isCoverOpened, setIsCoverOpened] = useState(isCoverForceOpened ?? false);

  React.useEffect(() => {
    if (isCoverForceOpened !== undefined) {
      setIsCoverOpened(isCoverForceOpened);
    }
  }, [isCoverForceOpened]);
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
          groomName={content.cover.groomName || guest.event.groomName}
          brideName={content.cover.brideName || guest.event.brideName}
          dateFormatted={content.cover.dateDisplay || guest.event.dateFormatted}
          onOpenInvitation={handleOpenInvitation}
          isForceOpened={isCoverForceOpened}
        />

        {/* Adaptive Luxury Fluid Cursor (Blue on White background, Pearl White on Blue/Dark backgrounds) */}
        <SplashCursor
          DENSITY_DISSIPATION={4.2}
          VELOCITY_DISSIPATION={2.2}
          SPLAT_RADIUS={0.16}
          SPLAT_FORCE={4200}
        />

        {/* Persistent Floating Controls (Menu, Audio, Scroll line, RSVP quick link) */}
        <PersistentBar
          audioSrc={content.audio.musicUrl || guest.event.musicUrl || ASSETS.audio.src}
          isUnlocked={isCoverOpened}
        />

        {/* 1. Hero with Real Editorial Portrait & 3D Typography */}
        <Hero
          groomName={content.hero.groomName || guest.event.groomName}
          brideName={content.hero.brideName || guest.event.brideName}
          dateShort={content.hero.dateShort}
          imageAvif={content.hero.portraitSrc || ASSETS.hero.avifSrc}
          imageWebp={content.hero.portraitSrc || ASSETS.hero.webpSrc}
          imageSrc={content.hero.portraitSrc || ASSETS.hero.fallbackSrc}
        />

        {/* 2. Quote */}
        <Quote text={content.quote.text || guest.copy.openingLine} />

        {/* 3. Couple */}
        <Couple
          groom={{
            ...ASSETS.couple.groom,
            name: content.couple.groom.name,
            childOf: content.couple.groom.childOf,
            bio: content.couple.groom.bio,
            photo: {
              ...ASSETS.couple.groom.photo,
              src: content.couple.groom.photoSrc || ASSETS.couple.groom.photo.src,
            },
            instagram: content.couple.groom.instagram,
          }}
          bride={{
            ...ASSETS.couple.bride,
            name: content.couple.bride.name,
            childOf: content.couple.bride.childOf,
            bio: content.couple.bride.bio,
            photo: {
              ...ASSETS.couple.bride.photo,
              src: content.couple.bride.photoSrc || ASSETS.couple.bride.photo.src,
            },
            instagram: content.couple.bride.instagram,
          }}
        />

        {/* 4. Story */}
        <Story
          moments={
            content.story.moments && content.story.moments.length > 0
              ? content.story.moments.map((m) => ({
                  numeral: m.numeral,
                  title: m.title,
                  date: m.date,
                  desc: m.desc,
                  photo: {
                    src: m.photoSrc,
                    alt: m.photoAlt,
                    aspectRatio: '4/5',
                    label: m.label,
                  },
                }))
              : ASSETS.story
          }
        />

        {/* 5. Event */}
        <Event
          dayFormatted={content.event.dayFormatted || guest.event.dayFormatted}
          dateNumeral={content.event.dateNumeral || guest.event.dateNumeral}
          monthYearFormatted={content.event.monthYearFormatted || guest.event.monthYearFormatted}
          dateFormatted={content.event.dateFormatted || guest.event.dateFormatted}
          timeFormatted={content.event.timeFormatted || guest.event.timeFormatted}
          venueName={content.event.venueName || guest.event.venueName}
          venueAddress={content.event.venueAddress || guest.event.venueAddress}
          mapsUrl={content.event.mapsUrl || guest.event.mapsUrl}
          guestArrivalTime={guest.event.guestArrivalTimeFormatted}
          inviteLine={guest.copy.inviteLine}
          startsAt={content.event.startsAt || guest.event.startsAt}
          endsAt={content.event.endsAt || guest.event.endsAt}
        />

        {/* 6. Gallery */}
        <Gallery
          items={
            content.gallery.items && content.gallery.items.length > 0
              ? content.gallery.items.map((g, i) => ({
                  id: typeof g.id === 'number' ? g.id : i + 1,
                  label: g.label || `0${i + 1} / 0${content.gallery.items.length}`,
                  type: g.type,
                  title: g.title,
                  aspectRatio: g.aspectRatio,
                  src: g.src,
                }))
              : ASSETS.gallery
          }
        />

        {/* 7. Gift */}
        <Gift
          accounts={
            content.gift.accounts && content.gift.accounts.length > 0
              ? content.gift.accounts
              : guest.event.bankAccounts
          }
        />

        {/* 8. RSVP */}
        <Rsvp guest={guest} onRsvpSubmitted={handleRsvpSubmitted} />

        {/* 9. Wishes */}
        <Wishes newWish={newWish} />

        {/* 10. Footer */}
        <Footer
          closingLine={content.footer.closingLine || guest.copy.closingLine}
          groomName={content.footer.groomName || guest.event.groomName}
          brideName={content.footer.brideName || guest.event.brideName}
        />
      </div>
    </LenisProvider>
  );
}
