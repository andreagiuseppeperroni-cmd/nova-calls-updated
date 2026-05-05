import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nova — Il social che risolve momenti',
  description: 'Apri una Call, entra nel momento, genera un Outcome.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
