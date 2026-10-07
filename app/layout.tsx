import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

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
  title: 'Chino desde cero',
  description: 'Aprende chino simplificado con caracteres, pinyin, español, audio y repaso inteligente.',
  openGraph: {
    title: 'Chino desde cero',
    description: 'Caracteres, pinyin, español y audio para aprender chino simplificado.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chino desde cero',
    description: 'Caracteres, pinyin, español y audio para aprender chino simplificado.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6f3ed',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
