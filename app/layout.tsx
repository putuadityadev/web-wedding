import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Hanken_Grotesk } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

import { getSiteContent } from '@/lib/content/service';
import { getMetadataBase } from '@/lib/url';

export const metadataBase = getMetadataBase();

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const branding = content.branding;

  const title = branding?.siteTitle || 'The Wedding of Dharma & Luthfi';
  const description =
    branding?.siteDescription ||
    'Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.';
  const ogImageUrl = branding?.ogImage || '/apple-icon.png';

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: title,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
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
      images: [ogImageUrl],
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${instrumentSerif.variable} ${hankenGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)] font-sans selection:bg-[var(--baby-blue)] selection:text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
