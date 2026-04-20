import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/shell/Nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HarleeQs Forecaster',
  description: 'HaaS revenue forecasting for HarleeQs venues',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <Nav />
        <main className="mx-auto max-w-screen-xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
