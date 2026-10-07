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
import { SiteContent, DEFAULT_SITE_CONTENT, GalleryItem } from '@/lib/content/types';
import { useLenisContext } from '@/lib/motion/lenis';

interface InvitationProps {
  guest: GuestView;
  siteContent?: SiteContent;
  isPreview?: boolean;
  isCoverForceOpened?: boolean;
}

function InvitationContent({
  guest,
  content,
  isPreview,
  isCoverForceOpened,
}: {
  guest: GuestView;
  content: SiteContent;
  isPreview: boolean;
  isCoverForceOpened?: boolean;
}) {
  const { unlockScroll } = useLenisContext();
  const [isCoverOpened, setIsCoverOpened] = useState(Boolean(isCoverForceOpened || isPreview));

  React.useEffect(() => {
    if (isCoverForceOpened !== undefined) {
      setIsCoverOpened(isCoverForceOpened);
      if (isCoverForceOpened) {
        unlockScroll();
      }
    }
  }, [isCoverForceOpened, unlockScroll]);

  React.useEffect(() => {
    if (isPreview) {
      unlockScroll();
    }
  }, [isPreview, unlockScroll]);

  const [newWish, setNewWish] = useState<{ name: string; wish: string } | null>(null);

  const handleOpenInvitation = async () => {
    setIsCoverOpened(true);
    unlockScroll();

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
    <div className="relative min-h-screen bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--baby-blue)] selection:text-[var(--ink)]">
      {/* Cover Screen */}
      <Cover
        headline={content.cover.headline || content.cover.badge}
        groomName={content.cover.groomName || guest.event.groomName}
        brideName={content.cover.brideName || guest.event.brideName}
        dateFormatted={content.cover.dateDisplay || guest.event.dateFormatted}
        guestGreetingLabel={content.cover.guestGreetingLabel}
        openButtonLabel={content.cover.openButtonLabel}
        guestName={guest.name}
        salutation={guest.salutation}
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
        dateFormatted={content.event.dateFormatted || guest.event.dateFormatted}
        coupleNames={`${content.hero.groomName || guest.event.groomName} & ${content.hero.brideName || guest.event.brideName}`}
      />

      {/* 1. Hero with Real Editorial Portrait & 3D Typography */}
      <Hero
        badge={content.hero.badge}
        groomName={content.hero.groomName || guest.event.groomName}
        brideName={content.hero.brideName || guest.event.brideName}
        subtitle={content.hero.subtitle}
        dateShort={content.hero.dateShort}
        portraitSrc={content.hero.portraitSrc}
        videoSrc={content.hero.videoSrc || (content.hero.portraitSrc?.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? content.hero.portraitSrc : undefined)}
        portraitAlt={content.hero.portraitAlt}
        scrollHint={content.hero.scrollHint}
        imageAvif={content.hero.portraitSrc || ASSETS.hero.avifSrc}
        imageWebp={content.hero.portraitSrc || ASSETS.hero.webpSrc}
        imageSrc={content.hero.portraitSrc || ASSETS.hero.fallbackSrc}
        bgMode={content.hero.bgMode}
        slideshowSource={content.hero.slideshowSource}
        slideshowImages={content.hero.slideshowImages}
        slideshowDuration={content.hero.slideshowDuration}
        galleryItems={content.gallery?.items}
      />

      {/* 2. Quote / Salam & Doa Pembuka */}
      <Quote
        label={content.quote.label}
        text={content.quote.text || guest.copy.openingLine}
        citation={content.quote.citation}
        bgMode={content.quote.bgMode}
        bgImage={content.quote.bgImage}
      />

      {/* 3. Couple */}
      <Couple
        sectionLabel={content.couple.sectionLabel}
        sectionTitle={content.couple.sectionTitle}
        sectionDesc={content.couple.sectionDesc}
        bgMode={content.couple.bgMode || 'image'}
        groom={{
          ...ASSETS.couple.groom,
          name: content.couple.groom.name,
          childOf: content.couple.groom.childOf,
          bio: content.couple.groom.bio,
          fatherName: content.couple.groom.fatherName,
          motherName: content.couple.groom.motherName,
          parentsTitle: content.couple.groom.parentsTitle,
          parentsAvatarSrc: content.couple.groom.parentsAvatarSrc,
          photo: {
            ...ASSETS.couple.groom.photo,
            src: content.couple.groom.photoSrc || ASSETS.couple.groom.photo.src,
            alt: content.couple.groom.photoAlt || content.couple.groom.name,
            label: content.couple.groom.photoLabel,
          },
          instagram: content.couple.groom.instagram,
        }}
        bride={{
          ...ASSETS.couple.bride,
          name: content.couple.bride.name,
          childOf: content.couple.bride.childOf,
          bio: content.couple.bride.bio,
          fatherName: content.couple.bride.fatherName,
          motherName: content.couple.bride.motherName,
          parentsTitle: content.couple.bride.parentsTitle,
          parentsAvatarSrc: content.couple.bride.parentsAvatarSrc,
          photo: {
            ...ASSETS.couple.bride.photo,
            src: content.couple.bride.photoSrc || ASSETS.couple.bride.photo.src,
            alt: content.couple.bride.photoAlt || content.couple.bride.name,
            label: content.couple.bride.photoLabel,
          },
          instagram: content.couple.bride.instagram,
        }}
      />

        {/* 4. Story */}
        <Story
          sectionLabel={content.story.sectionLabel}
          sectionTitle={content.story.sectionTitle}
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
          sectionLabel={content.event.sectionLabel}
          sectionTitle={content.event.sectionTitle}
          dayFormatted={content.event.dayFormatted || 'SENIN'}
          dateNumeral={content.event.dateNumeral || '12'}
          monthYearFormatted={content.event.monthYearFormatted || 'OKTOBER 2026'}
          dateFormatted={content.event.dateFormatted || 'Senin, 12 Oktober 2026'}
          timeFormatted={content.event.timeFormatted || '11.00 – 14.00 WITA'}
          venueName={content.event.venueName}
          venueAddress={content.event.venueAddress}
          mapsUrl={content.event.mapsUrl}
          lat={content.event.lat}
          lng={content.event.lng}
          countdownLabel={content.event.countdownLabel}
          guestArrivalTime={guest.event.guestArrivalTimeFormatted}
          startsAt={content.event.startsAt}
          endsAt={content.event.endsAt}
        />

        {/* 6. Gallery */}
        <Gallery
          sectionLabel={content.gallery.sectionLabel}
          sectionTitle={content.gallery.sectionTitle}
          sectionDesc={content.gallery.sectionDesc}
          groomName={content.hero.groomName || guest.event.groomName}
          brideName={content.hero.brideName || guest.event.brideName}
          items={
            content.gallery.items && content.gallery.items.length > 0
              ? content.gallery.items.map((g, i) => ({
                  id: g.id || i + 1,
                  label: g.label || `0${i + 1} / 0${content.gallery.items.length}`,
                  type: g.type || 'portrait',
                  title: g.title || `Momen ${i + 1}`,
                  aspectRatio: g.aspectRatio || '4/5',
                  src: g.src,
                  mediaType: g.mediaType || (g.videoSrc ? 'video' : 'photo'),
                  videoSrc: g.videoSrc,
                  posterSrc: g.posterSrc,
                  isPrimary: g.isPrimary ?? (i < 8),
                  category: g.category,
                }))
              : (ASSETS.gallery as unknown as GalleryItem[])
          }
        />

        {/* 7. Gift */}
        <Gift
          sectionLabel={content.gift.sectionLabel}
          sectionTitle={content.gift.sectionTitle}
          sectionDesc={content.gift.sectionDesc}
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
          copyright={content.footer.copyright}
        />
      </div>
  );
}

export function Invitation({
  guest,
  siteContent,
  isPreview = false,
  isCoverForceOpened,
}: InvitationProps) {
  const content = siteContent || DEFAULT_SITE_CONTENT;

  return (
    <LenisProvider initiallyLocked={!isCoverForceOpened && !isPreview}>
      <InvitationContent
        guest={guest}
        content={content}
        isPreview={isPreview}
        isCoverForceOpened={isCoverForceOpened}
      />
    </LenisProvider>
  );
}
