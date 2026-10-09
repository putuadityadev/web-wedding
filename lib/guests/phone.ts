import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalize Indonesian or international phone numbers to E.164 standard (+62812...)
 * Handles Excel stripped zeros (e.g. "81234567890" -> "+6281234567890")
 */
/**
 * Normalize Indonesian or international phone numbers to E.164 standard (+62812...)
 * Handles Excel stripped zeros (e.g. "81234567890" -> "+6281234567890"),
 * Excel scientific notation (e.g. "8.123456789E+10"), decimal artifacts (".00"),
 * multiple numbers in a single cell ("0812... / 0819..."), notes, and various prefix formats.
 */
export function normalizePhoneNumber(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  let cleaned = String(raw).trim();
  if (!cleaned) return null;

  // 1. If multiple numbers exist (e.g. "081234567890 / 081987654321", "0812..., 0819..."), extract first valid
  const multiSplit = cleaned.split(/[/,&|\n\r]+|\s+atau\s+|\s+dan\s+/i);
  if (multiSplit.length > 1) {
    for (const part of multiSplit) {
      const normalized = normalizePhoneNumber(part);
      if (normalized) return normalized;
    }
  }

  // 2. Handle Excel scientific notation (e.g. "8.123456789E+10", "6.28123E+12")
  if (/^[\d.]+[eE]\+?\d+$/.test(cleaned)) {
    try {
      const num = Number(cleaned);
      if (!isNaN(num) && isFinite(num)) {
        cleaned = BigInt(Math.round(num)).toString();
      }
    } catch {
      // Fallback if BigInt fails
    }
  }

  // 3. Strip Excel decimal formatting (e.g. "81234567890.0", "81234567890,00")
  cleaned = cleaned.replace(/[\.,]0+$/, '');

  // 4. Strip web & messaging prefixes (wa.me, http, tel, p:)
  cleaned = cleaned
    .replace(/^https?:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?/i, '')
    .replace(/^wa\.me\//i, '')
    .replace(/^(?:tel|phone|p):/i, '');

  // 5. Clean common formatting noise, quotes, and punctuation
  // Remove non-breaking spaces, zero-width spaces, BOM
  cleaned = cleaned.replace(/[\u00A0\u200B\uFEFF]/g, '');
  // Remove quotes, brackets, parens, hyphens, dots, underscores, spaces, slashes
  cleaned = cleaned.replace(/['"`‘’“”\(\)\[\]\{\}\-\.\_\s\\]/g, '');

  if (!cleaned) return null;

  // 6. Handle common Indonesian prefix mistakes:
  // e.g. "+6208..." -> "+628..."
  if (/^\+620\d+$/.test(cleaned)) {
    cleaned = '+62' + cleaned.slice(4);
  }
  // e.g. "6208..." -> "+628..."
  if (/^620\d+$/.test(cleaned)) {
    cleaned = '+62' + cleaned.slice(3);
  }
  // e.g. "+08..." -> "08..."
  if (/^\+0\d+$/.test(cleaned)) {
    cleaned = cleaned.slice(1);
  }
  // e.g. "0062..." (international dialing format from Indonesia) -> "+62..."
  if (/^0062\d+$/.test(cleaned)) {
    cleaned = '+' + cleaned.slice(2);
  }

  // 7. Handle Excel dropped zero (e.g. starts with "8" and 7-12 digits follow -> total 8 to 13 digits)
  if (/^8\d{7,12}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }

  // 8. Handle leading "62" without plus (e.g. "6281234567890")
  if (/^62\d{7,13}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  // 9. Try libphonenumber parsing with default ID
  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, 'ID');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format: +628...
    }
  } catch {
    // Fallback below
  }

  // 10. Robust regex fallback for Indonesian numbers
  // Mobile format starting with 08: (08 followed by 6 to 12 digits)
  if (/^08\d{6,12}$/.test(cleaned)) {
    return '+628' + cleaned.slice(2);
  }
  // International format starting with +628
  if (/^\+628\d{6,12}$/.test(cleaned)) {
    return cleaned;
  }
  // Starting with 628
  if (/^628\d{6,12}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  // Bali / local Indonesian landlines (0361... / 021... / 031...)
  if (/^0(36\d|2\d|3\d)\d{5,8}$/.test(cleaned)) {
    return '+62' + cleaned.slice(1);
  }
  // Landline without zero (361... / 21... / 31...)
  if (/^(36\d|2\d|3\d)\d{5,8}$/.test(cleaned)) {
    return '+62' + cleaned;
  }

  // 11. If clean candidate has text or comments around it (e.g. "081234567890ibu"), extract digits
  const embeddedMatch = cleaned.match(/(?:\+?62|0?8)\d{6,12}/);
  if (embeddedMatch && embeddedMatch[0] !== cleaned) {
    return normalizePhoneNumber(embeddedMatch[0]);
  }

  return null;
}
