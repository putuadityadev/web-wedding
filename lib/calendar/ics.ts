/**
 * Generate and trigger download of an .ics calendar file for the wedding event
 */
export function downloadCalendarEvent(eventData: {
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO
  endDate?: string | null; // ISO
}) {
  const formatICSDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startStr = formatICSDate(eventData.startDate);
  const endStr = eventData.endDate
    ? formatICSDate(eventData.endDate)
    : formatICSDate(new Date(new Date(eventData.startDate).getTime() + 3 * 3600 * 1000).toISOString());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aditya & Clarissa//Wedding Invitation//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:wedding-${Date.now()}@adityaclarissa.wedding`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${eventData.title}`,
    `DESCRIPTION:${eventData.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${eventData.location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Pernikahan-Aditya-Clarissa.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
