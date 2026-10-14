import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { themeScript } from '@/lib/theme';
import { CommunityProvider } from '@/components/community-provider';
import { LanguageProvider } from '@/components/language-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chino-xi.vercel.app'),
  title: 'Chino · Desde cero',
  applicationName: 'Chino',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/brand/apple-touch-icon.png' },
  description: 'Aprende chino simplificado con caracteres, pinyin, español, audio y repaso inteligente.',
  openGraph: {
    title: 'Chino · Desde cero',
    description: 'Caracteres, pinyin, español y audio para aprender chino simplificado.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Chino · Desde cero. Un carácter a la vez.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chino · Desde cero',
    description: 'Caracteres, pinyin, español y audio para aprender chino simplificado.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Chino · Desde cero. Un carácter a la vez.' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f4ee',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider><CommunityProvider>{children}</CommunityProvider></LanguageProvider>
      </body>
    </html>
  );
}
