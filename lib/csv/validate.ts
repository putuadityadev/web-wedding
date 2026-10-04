import { normalizePhoneNumber } from '../guests/phone';
import { RawCsvRow } from './parse';
import { Tone } from '../guests/view';

export interface ValidatedGuestRow {
  name: string;
  phone: string | null;
  nickname: string | null;
  salutation: string | null;
  groupLabel: string | null;
  maxPax: number;
  arrivalAt: string | null; // ISO
  arrivalUntil: string | null; // ISO
  tone: Tone;
  customMessage: string | null;
  internalNote: string | null;
}

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  data?: ValidatedGuestRow;
  warnings: string[];
  errors: string[];
}

function getField(row: RawCsvRow, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') {
      return row[alias];
    }
  }
  return undefined;
}

export function validateCsvRows(
  rows: RawCsvRow[],
  eventDateIso = '2026-12-12'
): {
  validCount: number;
  warningCount: number;
  errorCount: number;
  results: RowValidationResult[];
} {
  const results: RowValidationResult[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-indexed, header is line 1
    const errors: string[] = [];
    const warnings: string[] = [];

    const name = getField(row, ['nama', 'name']);
    if (!name) {
      errors.push('Kolom nama wajib diisi');
    }

    const rawPhone = getField(row, [
      'no_hp',
      'nohp',
      'hp',
      'phone',
      'wa',
      'whatsapp',
      'nomor',
    ]);
    let normalizedPhone: string | null = null;
    if (rawPhone) {
      normalizedPhone = normalizePhoneNumber(rawPhone);
      if (!normalizedPhone) {
        errors.push(`Nomor HP "${rawPhone}" tidak valid`);
      }
    } else {
      warnings.push('Tamu belum memiliki nomor HP');
    }

    const nickname = getField(row, ['panggilan', 'nickname']) || null;
    const salutation = getField(row, ['sapaan', 'salutation']) || null;
    const groupLabel = getField(row, ['grup', 'group', 'kategori']) || null;

    const rawPax = getField(row, ['maks_tamu', 'makstamu', 'pax', 'max_pax', 'maxpax']);
    let maxPax = 2;
    if (rawPax) {
      const parsedPax = parseInt(rawPax, 10);
      if (isNaN(parsedPax) || parsedPax < 1 || parsedPax > 20) {
        warnings.push(`Maks tamu "${rawPax}" di luar batas (1-20), memakai default 2`);
      } else {
        maxPax = parsedPax;
      }
    }

    const rawTone = getField(row, ['nada', 'tone'])?.toLowerCase();
    let tone: Tone = 'warm';
    if (rawTone === 'formal' || rawTone === 'casual' || rawTone === 'warm') {
      tone = rawTone;
    } else if (rawTone) {
      warnings.push(`Nada "${rawTone}" tidak dikenali, memakai default 'warm'`);
    }

    const customMessage = getField(row, ['pesan_khusus', 'pesan', 'custom_message']) || null;
    const internalNote = getField(row, ['catatan', 'note', 'notes']) || null;

    // Time parsing: jam_hadir
    const rawJamHadir = getField(row, ['jam_hadir', 'jam']);
    const rawJamSelesai = getField(row, ['jam_selesai']);
    let arrivalAt: string | null = null;
    let arrivalUntil: string | null = null;

    if (rawJamHadir) {
      const cleanJamHadir = rawJamHadir.replace('.', ':');
      arrivalAt = `${eventDateIso}T${cleanJamHadir}:00+08:00`;

      if (rawJamSelesai) {
        const cleanJamSelesai = rawJamSelesai.replace('.', ':');
        arrivalUntil = `${eventDateIso}T${cleanJamSelesai}:00+08:00`;
      }
    }

    const isValid = errors.length === 0;

    if (isValid && name) {
      validCount++;
      if (warnings.length > 0) warningCount++;
      results.push({
        rowNumber,
        isValid: true,
        data: {
          name,
          phone: normalizedPhone,
          nickname,
          salutation,
          groupLabel,
          maxPax,
          arrivalAt,
          arrivalUntil,
          tone,
          customMessage,
          internalNote,
        },
        warnings,
        errors,
      });
    } else {
      errorCount++;
      results.push({
        rowNumber,
        isValid: false,
        warnings,
        errors,
      });
    }
  });

  return {
    validCount,
    warningCount,
    errorCount,
    results,
  };
}
