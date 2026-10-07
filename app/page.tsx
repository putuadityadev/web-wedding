import type { Metadata } from 'next';
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

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const branding = content.branding;

  const title = branding?.siteTitle || 'Dharma & Lutfhy — Pernikahan Suci';
  const description =
    branding?.siteDescription ||
    'Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.';
  const imageUrl = branding?.ogImage || '/apple-icon.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: branding?.ogImageAlt || title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
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
