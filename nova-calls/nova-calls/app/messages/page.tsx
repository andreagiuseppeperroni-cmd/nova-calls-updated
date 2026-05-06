import { Suspense } from 'react';
import MessagesClient from './MessagesClient';
import styles from './messages-contrast.module.css';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className={styles.messagesContrast}>
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center px-4 text-[#10213a]">
            <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/85 p-7 text-center shadow-[0_22px_70px_rgba(68,115,180,.18)] backdrop-blur-2xl">
              <p className="text-sm font-black uppercase tracking-[.24em] text-sky-700">
                NOVA
              </p>
              <h1 className="mt-3 text-3xl font-black text-[#10213a]">
                Carico messaggi…
              </h1>
              <p className="mt-3 font-semibold text-[#475569]">
                Sto preparando le tue chat private.
              </p>
            </div>
          </main>
        }
      >
        <MessagesClient />
      </Suspense>
    </div>
  );
}
