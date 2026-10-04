import Papa from 'papaparse';

export interface RawCsvRow {
  [key: string]: string | undefined;
}

export function parseCsvString(csvContent: string): RawCsvRow[] {
  // Strip BOM if present
  let cleanContent = csvContent;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    cleanContent = cleanContent.slice(1);
  }

  const result = Papa.parse<RawCsvRow>(cleanContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
    transform: (value) => value.trim(),
  });

  return result.data;
}
