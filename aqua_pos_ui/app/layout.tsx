import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'AQUA_POS UI',
  description: 'Next.js + Notion API prototype for aquarium POS and inventory workflows.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell title="AQUA_POS control center" subtitle="POS, inventory, and tank visibility for the Notion-backed system">
          {children}
        </AppShell>
      </body>
    </html>
  );
}
