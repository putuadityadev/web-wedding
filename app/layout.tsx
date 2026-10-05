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

export const metadata: Metadata = {
  title: 'Dharma & Lutfhy — Pernikahan Suci',
  description: 'Undangan pernikahan digital I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo.',
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
