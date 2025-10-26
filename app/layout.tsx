import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Providers from '@/components/layout/providers';
import { SiteHeader } from '@/components/layout/site-header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'MVP self-reporting and rewards experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
