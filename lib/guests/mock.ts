import { GuestView, Tone } from './view';
import { resolveCopy } from '../copy/render';
import { formatEventDate, formatEventTimeRange } from '../time/tz';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../content/types';

export function getMockGuestView(overrides?: {
  name?: string | null;
  tone?: Tone;
  arrivalAt?: string | null;
  salutation?: string | null;
  siteContent?: SiteContent;
}): GuestView {
  const name = overrides?.name || 'Bapak Budi & Keluarga';
  const tone: Tone = overrides?.tone || 'warm';
  const salutation =
    overrides?.salutation ||
    (name.toLowerCase().startsWith('bapak') || name.toLowerCase().startsWith('ibu')
      ? ''
      : 'Bapak / Ibu');
  const nickname = name.split(/\s+/)[0] || name;

  const content = overrides?.siteContent || DEFAULT_SITE_CONTENT;
  const eventContent = content.event;

  const startsAt = eventContent.startsAt || '2026-10-17T11:00:00+08:00';
  const endsAt = eventContent.endsAt || '2026-10-17T22:00:00+08:00';
  const arrivalAt = overrides?.arrivalAt !== undefined ? overrides?.arrivalAt : startsAt;
  const arrivalUntil = endsAt;

  const dateFormatted = eventContent.dateFormatted || formatEventDate(startsAt);
  const timeFormatted = eventContent.timeFormatted || formatEventTimeRange(startsAt, endsAt);
  const guestArrivalTimeFormatted = eventContent.timeFormatted || timeFormatted;

  const groomName = content.hero?.groomName || content.cover?.groomName || 'Dharma';
  const brideName = content.hero?.brideName || content.cover?.brideName || 'Luthfi';

  const copyCtx = {
    sapaan: salutation,
    nama: name,
    panggilan: nickname,
    tanggal: eventContent.dateFormatted || 'Sabtu, 17 Oktober 2026',
    jam_hadir: guestArrivalTimeFormatted,
    lokasi: eventContent.venueName || 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
    link: 'https://dharmalutfhi.archantara.id',
    mempelai: `${groomName} & ${brideName}`,
  };

  return {
    token: 'mock-sample-token',
    name,
    nickname,
    salutation,
    phone: '+6281234567890',
    groupLabel: 'Keluarga & Kerabat',
    tone,
    maxPax: 2,
    arrivalAt,
    arrivalUntil,
    customMessage: null,
    hasOpened: false,
    rsvp: null,
    event: {
      groomName,
      brideName,
      dateFormatted,
      dayFormatted: eventContent.dayFormatted || 'SENIN',
      dateNumeral: eventContent.dateNumeral || '12',
      monthYearFormatted: eventContent.monthYearFormatted || 'OKTOBER 2026',
      timeFormatted,
      guestArrivalTimeFormatted,
      startsAt,
      endsAt,
      venueName: eventContent.venueName || 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
      venueAddress:
        eventContent.venueAddress ||
        'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
      mapsUrl:
        eventContent.mapsUrl ||
        'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
      rsvpDeadline: '2026-11-28T23:59:59+08:00',
      bankAccounts: content.gift?.accounts || [
        {
          bank: 'BCA',
          accountName: 'I Wayan Dharma Wirahadi',
          accountNumber: '7820192831',
        },
      ],
      musicUrl: content.audio?.musicUrl || null,
    },
    copy: {
      coverGreeting: resolveCopy('cover_greeting', tone, copyCtx),
      openingLine: resolveCopy('opening_line', tone, copyCtx),
      inviteLine: resolveCopy('invite_line', tone, copyCtx),
      rsvpPrompt: resolveCopy('rsvp_prompt', tone, copyCtx),
      rsvpThanksAttending: resolveCopy('rsvp_thanks_attending', tone, copyCtx),
      rsvpThanksDeclining: resolveCopy('rsvp_thanks_declining', tone, copyCtx),
      closingLine: resolveCopy('closing_line', tone, copyCtx),
    },
  };
}
