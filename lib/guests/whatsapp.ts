import { SiteContent } from '@/lib/content/types';

export interface WhatsAppGuestContext {
  name: string;
  nickname?: string | null;
  salutation?: string | null;
  phone?: string | null;
  token: string;
}

/**
 * Format personal WhatsApp invitation message using customized branding template
 * or dynamic default fallback. Supports both {var} and {{var}} placeholders.
 */
export function formatWhatsAppMessage(
  guest: WhatsAppGuestContext,
  siteContent?: SiteContent | null,
  origin: string = ''
): string {
  const groomName = siteContent?.hero?.groomName || 'Dharma';
  const brideName = siteContent?.hero?.brideName || 'Lutfhy';
  const mempelai = `${groomName} & ${brideName}`;

  const salutation = guest.salutation ? guest.salutation.trim() : '';
  const namaLengkap = guest.name ? guest.name.trim() : 'Tamu Undangan';
  const panggilan = (guest.nickname || guest.name?.split(/\s+/)[0] || 'Teman').trim();
  const namaSapaan = salutation ? `${salutation} ${namaLengkap}` : namaLengkap;

  const baseOrigin = origin ? origin.replace(/\/+$/, '') : '';
  const link = baseOrigin ? `${baseOrigin}/u/${guest.token}` : `/u/${guest.token}`;

  const defaultTemplate =
    `Halo {nama_tamu}, dengan sukacita dan penuh syukur kami mengundang Anda ke pernikahan {mempelai}.\n\n` +
    `Detail acara, denah lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan personal Anda:\n` +
    `{link_undangan}\n\n` +
    `Salam hangat,\n` +
    `{mempelai}`;

  const template = siteContent?.branding?.whatsappShareText?.trim() || defaultTemplate;

  // Replace variable placeholders (tolerant to both single {var} and double {{var}})
  const text = template
    // Nama Tamu / Sapaan
    .replace(/\{\{nama_tamu\}\}|\{nama_tamu\}/g, namaSapaan)
    .replace(/\{\{nama\}\}|\{nama\}/g, namaLengkap)
    .replace(/\{\{panggilan\}\}|\{panggilan\}/g, panggilan)
    .replace(/\{\{sapaan\}\}|\{sapaan\}/g, salutation || 'Bapak / Ibu')
    // Mempelai
    .replace(/\{\{mempelai\}\}|\{mempelai\}/g, mempelai)
    // Link Undangan
    .replace(/\{\{link_undangan\}\}|\{link_undangan\}/g, link)
    .replace(/\{\{link\}\}|\{link\}/g, link)
    // Info Acara
    .replace(/\{\{tanggal\}\}|\{tanggal\}/g, siteContent?.event?.dateFormatted || '12 Oktober 2026')
    .replace(/\{\{lokasi\}\}|\{lokasi\}/g, siteContent?.event?.venueName || 'Kediaman Mempelai Pria');

  return text;
}

/**
 * Normalize phone number for wa.me / WhatsApp API link.
 * Ensures Indonesian numbers starting with '0' become '62'.
 */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

/**
 * Constructs a safe direct WhatsApp link avoiding the `wa.me` 302 redirect bug.
 * Using `https://api.whatsapp.com/send` avoids wa.me edge redirector from corrupting 
 * 4-byte UTF-8 emojis into %EF%BF%BD (Unicode Replacement Character ).
 */
export function buildWhatsAppUrl(phone: string | null | undefined, text: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

