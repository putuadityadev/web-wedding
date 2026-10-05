import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalize Indonesian or international phone numbers to E.164 standard (+62812...)
 * Handles Excel stripped zeros (e.g. "81234567890" -> "+6281234567890")
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');

  if (!cleaned) return null;

  // Handle Excel zero-drop e.g. "8123456789"
  if (/^8\d{8,12}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }

  // Handle leading 62 without plus
  if (/^62\d{8,13}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, 'ID');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format: +628...
    }
  } catch {
    // Fallback below
  }

  // Graceful fallback for Indonesian numbers that might be valid locally:
  // e.g. 08..., +628..., 628... with 9 to 15 digits
  if (/^08\d{7,12}$/.test(cleaned)) {
    return '+628' + cleaned.slice(2);
  }
  if (/^\+628\d{7,12}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^628\d{7,12}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  return null;
}
