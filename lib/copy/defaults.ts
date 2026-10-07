import { Tone } from '@/lib/guests/view';

export type CopyKey =
  | 'cover_greeting'
  | 'opening_line'
  | 'invite_line'
  | 'rsvp_prompt'
  | 'rsvp_thanks_attending'
  | 'rsvp_thanks_declining'
  | 'closing_line'
  | 'wa_invite';

export const DEFAULT_COPY_TEMPLATES: Record<CopyKey, Record<Tone, string>> = {
  cover_greeting: {
    formal: 'Kepada Yth.\n{{sapaan}} {{nama}}',
    warm: 'Untuk {{sapaan}} {{panggilan}},\nyang kehadirannya kami nantikan.',
    casual: 'Hai, {{panggilan}}!\nKamu ada di daftar orang yang paling ingin kami lihat hari itu.',
  },
  opening_line: {
    formal: 'Dengan segala kerendahan hati, kami mengundang Anda untuk menjadi saksi hari bahagia kami.',
    warm: 'Ada satu hari yang ingin kami bagi bersama orang-orang yang berarti. Salah satunya, Anda.',
    casual: 'Kami akhirnya menikah, dan acaranya nggak lengkap tanpa kamu.',
  },
  invite_line: {
    formal: 'Kami mengundang {{sapaan}} {{nama}} untuk hadir pada {{tanggal}}, pukul {{jam_hadir}}.',
    warm: 'Merupakan kehormatan dan kebahagiaan bagi kami atas kehadiran {{panggilan}} pada {{tanggal}}.',
    casual: 'Catat ya, {{panggilan}}: {{tanggal}}, jam {{jam_hadir}}. Sampai jumpa di hari bahagia kami!',
  },
  rsvp_prompt: {
    formal: 'Mohon konfirmasi kehadiran Anda.',
    warm: 'Kabari kami ya, apakah {{panggilan}} bisa hadir?',
    casual: 'Jadi, bisa datang nggak, {{panggilan}}?',
  },
  rsvp_thanks_attending: {
    formal: 'Terima kasih, {{sapaan}} {{nama}}. Konfirmasi kehadiran Anda telah kami terima.',
    warm: 'Terima kasih, {{panggilan}}. Sampai bertemu pada {{tanggal}}!',
    casual: 'Siap, {{panggilan}}! Kehadiranmu sudah kami catat.',
  },
  rsvp_thanks_declining: {
    formal: 'Terima kasih atas kabar dan doa baik {{sapaan}} {{nama}}.',
    warm: 'Terima kasih sudah memberi kabar, {{panggilan}}. Doa baikmu sudah sangat berarti.',
    casual: 'Tidak apa-apa, {{panggilan}}. Makasih sudah kasih kabar!',
  },
  closing_line: {
    formal: 'Atas kehadiran dan doa restu Anda, kami ucapkan terima kasih.',
    warm: 'Terima kasih sudah menjadi bagian dari cerita kami, {{panggilan}}.',
    casual: 'Makasih udah ada di sini, {{panggilan}}. Sampai ketemu!',
  },
  wa_invite: {
    formal: 'Yth. {{sapaan}} {{nama}}, dengan hormat kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran: {{link}}',
    warm: 'Halo {{sapaan}} {{panggilan}}, dengan bahagia kami mengundang Anda ke pernikahan {{mempelai}}. Detail dan konfirmasi kehadiran ada di sini: {{link}}',
    casual: 'Halo {{panggilan}}! Kami mau menikah dan kamu harus datang. Detail ada di sini: {{link}}',
  },
};
