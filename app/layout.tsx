import type { Metadata } from 'next';
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
  metadataBase: new URL('https://mi-diario-chino.lalo1883.chatgpt.site'),
  title: 'Mǐ diario · Aprende chino cada día',
  description: 'Flashcards de chino con pronunciación, frases y repaso inteligente.',
  openGraph: {
    title: 'Mǐ diario · Aprende chino cada día',
    description: 'Un poco de chino. Todos los días.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mǐ diario · Aprende chino cada día',
    description: 'Un poco de chino. Todos los días.',
    images: ['/og.png'],
  },
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
