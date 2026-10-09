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
  themeColor: '#f3f6f4',
  interactiveWidget: 'resizes-content',
};

// Aplica la versión elegida antes de pintar para evitar un destello de color.
const themeScript = `try{if(localStorage.getItem('chino-theme')==='bw'){document.documentElement.dataset.theme='bw';var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute('content','#ffffff')}}catch(e){}`;

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
        {children}
      </body>
    </html>
  );
}
