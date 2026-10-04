import Papa from 'papaparse';

/**
 * Escape cells starting with formula trigger characters (=, +, -, @) with single quote prefix
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=\+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function generateCsvTemplate(): string {
  const headers = [
    'nama',
    'no_hp',
    'panggilan',
    'sapaan',
    'grup',
    'maks_tamu',
    'jam_hadir',
    'jam_selesai',
    'nada',
    'pesan_khusus',
    'catatan',
  ];

  const sampleRows = [
    [
      'Bapak Budi Santoso',
      '081234567890',
      'Budi',
      'Bapak',
      'Keluarga',
      '2',
      '11:00',
      '12:30',
      'formal',
      '',
      'Keluarga dari pihak ayah',
    ],
    [
      'Sarah Maharani',
      '081987654321',
      'Sarah',
      'Kak',
      'Teman Kuliah',
      '1',
      '12:00',
      '14:00',
      'casual',
      'Khusus buat kamu sahabatku!',
      '',
    ],
    [
      'Dr. Hendra Gunawan',
      '',
      'Hendra',
      'Bapak',
      'Kolega',
      '2',
      '11:00',
      '13:00',
      'warm',
      '',
      'Nomor HP belum ada',
    ],
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleRows,
  });
}
