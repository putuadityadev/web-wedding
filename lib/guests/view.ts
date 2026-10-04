export type Tone = 'formal' | 'warm' | 'casual';
export type RSVPStatus = 'attending' | 'not_attending';

export interface BankAccount {
  bank: string;
  accountName: string;
  accountNumber: string;
}

export interface GuestView {
  token: string;
  name: string;
  nickname: string;
  salutation: string;
  phone: string | null;
  groupLabel: string | null;
  tone: Tone;
  maxPax: number;
  arrivalAt: string | null; // ISO string
  arrivalUntil: string | null; // ISO string
  customMessage: string | null;
  hasOpened: boolean;
  rsvp: {
    status: RSVPStatus;
    pax: number;
    wish: string | null;
    updatedAt: string;
  } | null;
  event: {
    groomName: string;
    brideName: string;
    dateFormatted: string; // e.g. "Sabtu, 12 Desember 2026"
    dayFormatted: string; // e.g. "SABTU"
    dateNumeral: string; // e.g. "12"
    monthYearFormatted: string; // e.g. "DESEMBER 2026"
    timeFormatted: string; // e.g. "11.00 – 14.00 WITA"
    guestArrivalTimeFormatted: string | null; // e.g. "11.00 WITA" or "11.00 – 12.00 WITA"
    startsAt: string; // ISO
    endsAt: string | null; // ISO
    venueName: string;
    venueAddress: string;
    mapsUrl: string;
    rsvpDeadline: string | null; // ISO
    bankAccounts: BankAccount[];
    musicUrl: string | null;
  };
  copy: {
    coverGreeting: string;
    openingLine: string;
    inviteLine: string;
    rsvpPrompt: string;
    rsvpThanksAttending: string;
    rsvpThanksDeclining: string;
    closingLine: string;
  };
}
