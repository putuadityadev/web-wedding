import { notFound } from 'next/navigation';
import { getMockGuestView } from '@/lib/guests/mock';
import { Invitation } from '@/components/invitation/Invitation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export default async function PersonalInvitationPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const isPreview = Boolean(sp?.preview);

  // Validate token length / format (12 characters nanoid)
  if (!token || token.length < 5) {
    notFound();
  }

  // Phase 1: Mock data with realistic personalization
  const guest = getMockGuestView({
    name: 'Bapak Budi & Rekan',
    tone: 'warm',
  });

  // Assign the URL token
  guest.token = token;

  return <Invitation guest={guest} isPreview={isPreview} />;
}
