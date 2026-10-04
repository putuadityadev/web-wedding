import { GuestView, Tone } from './view';
import { resolveCopy } from '../copy/render';
import { formatEventDate, formatEventTimeRange } from '../time/tz';

export function getMockGuestView(overrides?: {
  name?: string | null;
  tone?: Tone;
  arrivalAt?: string | null;
  salutation?: string | null;
}): GuestView {
  const name = overrides?.name || 'Bapak Budi & Keluarga';
  const tone: Tone = overrides?.tone || 'warm';
  const salutation = overrides?.salutation || (name.toLowerCase().startsWith('bapak') || name.toLowerCase().startsWith('ibu') ? '' : 'Bapak / Ibu');
  const nickname = name.split(/\s+/)[0] || name;

  const startsAt = '2026-12-12T11:00:00+08:00';
  const endsAt = '2026-12-12T14:00:00+08:00';
  const arrivalAt = overrides?.arrivalAt !== undefined ? overrides?.arrivalAt : '2026-12-12T11:00:00+08:00';
  const arrivalUntil = '2026-12-12T12:30:00+08:00';

  const dateFormatted = formatEventDate(startsAt);
  const timeFormatted = formatEventTimeRange(startsAt, endsAt);
  const guestArrivalTimeFormatted = arrivalAt ? formatEventTimeRange(arrivalAt, arrivalUntil) : null;

  const copyCtx = {
    sapaan: salutation,
    nama: name,
    panggilan: nickname,
    tanggal: '12 Desember 2026',
    jam_hadir: guestArrivalTimeFormatted || '11.00 WITA',
    lokasi: 'The Glasshouse Ballroom, Makassar',
    link: 'https://adityaclarissa.wedding',
    mempelai: 'Aditya & Clarissa',
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
      groomName: 'Aditya',
      brideName: 'Clarissa',
      dateFormatted,
      dayFormatted: 'SABTU',
      dateNumeral: '12',
      monthYearFormatted: 'DESEMBER 2026',
      timeFormatted,
      guestArrivalTimeFormatted,
      startsAt,
      endsAt,
      venueName: 'The Glasshouse Ballroom',
      venueAddress: 'Jl. Metro Tanjung Bunga No. 88, Makassar, Sulawesi Selatan',
      mapsUrl: 'https://maps.google.com/?q=The+Glasshouse+Makassar',
      rsvpDeadline: '2026-11-28T23:59:59+08:00',
      bankAccounts: [
        {
          bank: 'BCA',
          accountName: 'Aditya Pratama',
          accountNumber: '7820192831',
        },
        {
          bank: 'Bank Mandiri',
          accountName: 'Clarissa Maharani',
          accountNumber: '1420019283741',
        },
      ],
      musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3',
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
