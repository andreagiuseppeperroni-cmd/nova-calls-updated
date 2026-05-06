import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-4 text-[#10213a]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-7 text-center shadow-[0_22px_70px_rgba(68,115,180,.16)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(56,214,255,.18),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(143,124,255,.12),transparent_34%)]" />

            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-700/80">
                NOVA
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#10213a]">
                Carico messaggi…
              </h1>

              <p className="mt-3 font-semibold leading-7 text-[#475569]">
                Sto preparando le tue chat private.
              </p>

              <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-slate-200/80">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-lime-300" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
