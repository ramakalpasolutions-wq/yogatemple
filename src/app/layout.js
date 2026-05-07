// src/app/layout.js
import './globals.css';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import SessionProvider from '@/components/SessionProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingBooking from '@/components/FloatingBooking';
import { Toaster } from 'react-hot-toast';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata = {
  title: 'Yoga Temple — Find Your Inner Peace',
  description: 'Online yoga classes, live sessions, and personal coaching.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <SessionProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingBooking />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}