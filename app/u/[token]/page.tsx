import { notFound } from 'next/navigation';
import { Invitation } from '@/components/invitation/Invitation';
import { getSiteContent } from '@/lib/content/service';
import { getGuestByToken, mapRowToGuestView } from '@/lib/guests/service';
import { createAdminClient } from '@/lib/supabase/admin';

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

  if (!token || token.length < 5) {
    notFound();
  }

  // Fetch real guest by token from Supabase
  const guestRow = await getGuestByToken(token);
  if (!guestRow) {
    notFound();
  }

  // Update open count and timestamp in background if not admin preview
  if (!isPreview) {
    try {
      const admin = createAdminClient();
      const now = new Date().toISOString();
      await admin
        .from('guests')
        .update({
          open_count: (guestRow.open_count || 0) + 1,
          last_opened_at: now,
          first_opened_at: guestRow.first_opened_at || now,
          updated_at: now,
        })
        .eq('id', guestRow.id);
    } catch (err) {
      console.warn('[Invitation] Could not update open tracking:', err);
    }
  }

  const siteContent = await getSiteContent();
  const guest = mapRowToGuestView(guestRow, siteContent);

  return <Invitation guest={guest} siteContent={siteContent} isPreview={isPreview} />;
}
