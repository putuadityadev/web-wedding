import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Invitation } from '@/components/invitation/Invitation';
import { getSiteContent } from '@/lib/content/service';
import { getGuestByToken, mapRowToGuestView } from '@/lib/guests/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMetadataBase, getBaseUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { token } = await params;
    const siteContent = await getSiteContent();
    const branding = siteContent.branding;
    const groomName = siteContent.hero?.groomName || 'Dharma';
    const brideName = siteContent.hero?.brideName || 'Luthfi';
    const guestRow = await getGuestByToken(token);

    const guestSalutation = guestRow?.salutation ? `${guestRow.salutation.trim()} ` : '';
    const guestName = guestRow?.name ? `${guestSalutation}${guestRow.name.trim()}` : '';

    // Strictly prioritize Admin CMS Branding siteTitle & siteDescription
    const rawTitle = branding?.siteTitle?.trim() || 'The Wedding of Dharma & Luthfi';
    const title = guestName && (rawTitle.includes('{nama_tamu}') || rawTitle.includes('{{nama_tamu}}'))
      ? rawTitle.replace(/\{\{nama_tamu\}\}|\{nama_tamu\}/g, guestName)
      : rawTitle;

    const rawDesc = branding?.siteDescription?.trim() || `Undangan pernikahan digital ${groomName} & ${brideName}.`;
    const description = guestName && (rawDesc.includes('{nama_tamu}') || rawDesc.includes('{{nama_tamu}}'))
      ? rawDesc.replace(/\{\{nama_tamu\}\}|\{nama_tamu\}/g, guestName)
      : rawDesc;

    const imageUrl = branding?.ogImage || '/apple-icon.png';
    const pageUrl = `${getBaseUrl()}/u/${token}`;

    return {
      metadataBase: getMetadataBase(),
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: title,
        url: pageUrl,
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
  } catch {
    const siteContent = await getSiteContent().catch(() => null);
    const branding = siteContent?.branding;
    const groomName = siteContent?.hero?.groomName || 'Dharma';
    const brideName = siteContent?.hero?.brideName || 'Lutfhy';
    const fallbackTitle = branding?.siteTitle || 'The Wedding of Dharma & Luthfi';
    const fallbackDesc = branding?.siteDescription || `Undangan pernikahan digital ${groomName} & ${brideName}.`;
    const fallbackImage = branding?.ogImage || '/apple-icon.png';

    return {
      metadataBase: getMetadataBase(),
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        siteName: fallbackTitle,
        type: 'website',
        images: [{ url: fallbackImage, width: 1200, height: 630, alt: fallbackTitle }],
      },
    };
  }
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
