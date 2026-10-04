const DEFAULT_TIMEZONE = process.env.EVENT_TIMEZONE || 'Asia/Makassar';

export function getEventTimeZone(): string {
  return process.env.EVENT_TIMEZONE || DEFAULT_TIMEZONE;
}

/**
 * Format a date in the event timezone (e.g. "Sabtu, 12 Desember 2026")
 */
export function formatEventDate(date: Date | string | number, tz = getEventTimeZone()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format time in the event timezone (e.g. "11.00 WITA")
 */
export function formatEventTime(date: Date | string | number, tz = getEventTimeZone()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const timeStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d).replace(':', '.');

  const tzAbbr = tz === 'Asia/Makassar' ? 'WITA' : tz === 'Asia/Jakarta' ? 'WIB' : tz === 'Asia/Jayapura' ? 'WIT' : '';
  return tzAbbr ? `${timeStr} ${tzAbbr}` : timeStr;
}

/**
 * Format time range in event timezone (e.g. "11.00 – 14.00 WITA")
 */
export function formatEventTimeRange(
  start: Date | string | number,
  end?: Date | string | number | null,
  tz = getEventTimeZone()
): string {
  const startD = typeof start === 'string' || typeof start === 'number' ? new Date(start) : start;
  const startTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(startD).replace(':', '.');

  const tzAbbr = tz === 'Asia/Makassar' ? 'WITA' : tz === 'Asia/Jakarta' ? 'WIB' : tz === 'Asia/Jayapura' ? 'WIT' : '';

  if (!end) {
    return tzAbbr ? `${startTime} ${tzAbbr}` : startTime;
  }

  const endD = typeof end === 'string' || typeof end === 'number' ? new Date(end) : end;
  const endTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(endD).replace(':', '.');

  return tzAbbr ? `${startTime} – ${endTime} ${tzAbbr}` : `${startTime} – ${endTime}`;
}
