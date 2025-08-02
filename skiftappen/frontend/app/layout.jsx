import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Skiftappen - Svenska Skiftscheman',
  description: 'Visa och hantera svenska skiftscheman med månads- och årsvy. Färgkodade skiftlag för enkel översikt.',
  keywords: 'skift, schema, sverige, kalender, skiftarbete, månadsvy, årsvy',
  authors: [{ name: 'Skiftappen Team' }],
  creator: 'Skiftappen',
  publisher: 'Skiftappen',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://skiftappen.se'),
  openGraph: {
    title: 'Skiftappen - Svenska Skiftscheman',
    description: 'Visa och hantera svenska skiftscheman med månads- och årsvy',
    url: 'https://skiftappen.se',
    siteName: 'Skiftappen',
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skiftappen - Svenska Skiftscheman',
    description: 'Visa och hantera svenska skiftscheman med månads- och årsvy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token_here', // Lägg till Google Search Console verification
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}