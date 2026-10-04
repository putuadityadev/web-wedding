import { getMockGuestView } from '@/lib/guests/mock';
import { Invitation } from '@/components/invitation/Invitation';
import { Tone } from '@/lib/guests/view';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{
    to?: string;
    tone?: string;
    preview?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawTo = sp?.to?.trim();
  const rawTone = sp?.tone?.toLowerCase();

  const tone: Tone =
    rawTone === 'formal' || rawTone === 'casual' || rawTone === 'warm'
      ? rawTone
      : 'warm';

  // Support dev personalization query: ?to=Bapak+Budi+%26+Keluarga
  const guest = getMockGuestView({
    name: rawTo || 'Tamu Undangan',
    tone,
  });

  return (
    <main>
      <Invitation guest={guest} isPreview={Boolean(sp?.preview)} />
    </main>
  );
}
