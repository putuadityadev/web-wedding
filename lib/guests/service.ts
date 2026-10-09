import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { GuestView, Tone, BankAccount } from './view';
import { SiteContent } from '@/lib/content/types';
import { resolveCopy } from '../copy/render';
import { formatEventDate, formatEventTimeRange } from '../time/tz';

export function mapRowToGuestView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  siteContent: SiteContent,
  origin: string = ''
): GuestView {
  const name: string = row.name || 'Tamu Undangan';
  const tone: Tone = (row.tone as Tone) || 'warm';
  const salutation: string =
    row.salutation ||
    (name.toLowerCase().startsWith('bapak') || name.toLowerCase().startsWith('ibu')
      ? ''
      : 'Bapak / Ibu');
  const nickname: string = row.nickname || name.split(/\s+/)[0] || name;

  const eventContent = siteContent.event;
  const startsAt = eventContent.startsAt || '2026-10-17T11:00:00+08:00';
  const endsAt = eventContent.endsAt || '2026-10-17T22:00:00+08:00';
  const arrivalAt = row.arrival_at || startsAt;
  const arrivalUntil = row.arrival_until || endsAt;

  const dateFormatted = formatEventDate(startsAt);
  const timeFormatted = formatEventTimeRange(startsAt, endsAt);
  const guestArrivalTimeFormatted = row.arrival_at
    ? formatEventTimeRange(arrivalAt, arrivalUntil)
    : eventContent.timeFormatted || timeFormatted;

  const link = origin ? `${origin}/u/${row.token}` : `/u/${row.token}`;

  const copyCtx = {
    sapaan: salutation,
    nama: name,
    panggilan: nickname,
    tanggal: eventContent.dateFormatted || 'Sabtu, 17 Oktober 2026',
    jam_hadir: guestArrivalTimeFormatted,
    lokasi: eventContent.venueName || 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
    link,
    mempelai: `${siteContent.hero.groomName} & ${siteContent.hero.brideName}`,
  };

  const rsvpRaw = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
  const rsvp = rsvpRaw
    ? {
        status: rsvpRaw.status as 'attending' | 'not_attending',
        pax: rsvpRaw.pax !== undefined ? rsvpRaw.pax : 1,
        wish: rsvpRaw.wish || null,
        updatedAt: rsvpRaw.updated_at || rsvpRaw.created_at || new Date().toISOString(),
      }
    : null;

  // Map bank accounts from CMS gift section
  const bankAccounts: BankAccount[] = (siteContent.gift.accounts || []).map((acc) => ({
    bank: acc.bank,
    accountName: acc.accountName,
    accountNumber: acc.accountNumber,
  }));

  return {
    token: row.token,
    name,
    nickname,
    salutation,
    phone: row.phone || null,
    groupLabel: row.group_label || null,
    tone,
    maxPax: row.max_pax || 2,
    arrivalAt,
    arrivalUntil,
    customMessage: row.custom_message || null,
    hasOpened: (row.open_count || 0) > 0,
    rsvp,
    event: {
      groomName: siteContent.hero.groomName || 'Dharma',
      brideName: siteContent.hero.brideName || 'Luthfi',
      dateFormatted,
      dayFormatted: eventContent.dayFormatted || 'SABTU',
      dateNumeral: eventContent.dateNumeral || '17',
      monthYearFormatted: eventContent.monthYearFormatted || 'OKTOBER 2026',
      timeFormatted: eventContent.timeFormatted || timeFormatted,
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
      bankAccounts,
      musicUrl: siteContent.audio.musicUrl || null,
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

export async function getGuestByToken(token: string): Promise<any | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('guests')
      .select('*, rsvps(*)')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
