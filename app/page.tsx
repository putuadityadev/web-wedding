import { getMockGuestView } from '@/lib/guests/mock';
import { Invitation } from '@/components/invitation/Invitation';
import { Tone } from '@/lib/guests/view';
import { getSiteContent } from '@/lib/content/service';

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

  const siteContent = await getSiteContent();

  // Support dev personalization query: ?to=Bapak+Budi+%26+Keluarga
  const guest = getMockGuestView({
    name: rawTo || 'Tamu Undangan',
    tone,
    siteContent,
  });

  return (
    <main>
      <Invitation guest={guest} siteContent={siteContent} isPreview={Boolean(sp?.preview)} />
    </main>
  );
}
