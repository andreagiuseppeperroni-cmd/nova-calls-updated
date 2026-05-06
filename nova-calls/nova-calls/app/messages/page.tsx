import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-4 text-white">
          <div className="nova-card rounded-[2rem] p-7 text-center">
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/70">NOVA</p>
            <h1 className="mt-3 text-3xl font-black">Carico messaggi…</h1>
            <p className="mt-3 font-semibold text-slate-300">Sto preparando le tue chat private.</p>
          </div>
        </main>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
