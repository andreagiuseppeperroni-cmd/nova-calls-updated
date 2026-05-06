import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="messages-contrast">
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

      <style jsx global>{`
        .messages-contrast {
          min-height: 100vh;
          color: #10213a;
          background:
            radial-gradient(circle at 12% 8%, rgba(56, 214, 255, 0.24), transparent 24%),
            radial-gradient(circle at 82% 14%, rgba(143, 124, 255, 0.16), transparent 26%),
            radial-gradient(circle at 58% 95%, rgba(56, 214, 255, 0.22), transparent 34%),
            linear-gradient(180deg, #eefbff 0%, #f7fbff 38%, #d9f2ff 100%);
        }

        .messages-contrast,
        .messages-contrast * {
          text-shadow: none !important;
        }

        .messages-contrast h1,
        .messages-contrast h2,
        .messages-contrast h3,
        .messages-contrast h4,
        .messages-contrast b,
        .messages-contrast strong {
          color: #10213a !important;
        }

        .messages-contrast p,
        .messages-contrast span,
        .messages-contrast div,
        .messages-contrast label {
          color: #31435f;
        }

        .messages-contrast [class*="text-white"],
        .messages-contrast [class*="text-slate-100"],
        .messages-contrast [class*="text-slate-200"],
        .messages-contrast [class*="text-slate-300"],
        .messages-contrast [class*="text-slate-400"],
        .messages-contrast [class*="text-white/"] {
          color: #31435f !important;
        }

        .messages-contrast [class*="text-cyan"],
        .messages-contrast [class*="text-sky"] {
          color: #0284c7 !important;
        }

        .messages-contrast [class*="text-lime"] {
          color: #4d7c0f !important;
        }

        .messages-contrast [class*="text-pink"] {
          color: #be185d !important;
        }

        .messages-contrast .nova-card,
        .messages-contrast [class*="bg-white/5"],
        .messages-contrast [class*="bg-white/10"],
        .messages-contrast [class*="bg-white/15"],
        .messages-contrast [class*="bg-white/20"],
        .messages-contrast [class*="bg-slate"],
        .messages-contrast [class*="bg-[#"],
        .messages-contrast [class*="bg-["] {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(244, 251, 255, 0.78)) !important;
          border-color: rgba(90, 132, 185, 0.24) !important;
          box-shadow:
            0 22px 70px rgba(68, 115, 180, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.88) !important;
          backdrop-filter: blur(22px) saturate(1.12);
        }

        .messages-contrast aside,
        .messages-contrast section,
        .messages-contrast article {
          border-color: rgba(90, 132, 185, 0.22) !important;
        }

        .messages-contrast button,
        .messages-contrast a {
          color: inherit;
        }

        .messages-contrast button[class*="bg-lime"],
        .messages-contrast a[class*="bg-lime"],
        .messages-contrast [class*="bg-nova-lime"] {
          background: linear-gradient(180deg, #c9f45a, #a3e635) !important;
          color: #1f2d05 !important;
          border-color: rgba(101, 163, 13, 0.24) !important;
          box-shadow:
            0 14px 30px rgba(132, 204, 22, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.55) !important;
        }

        .messages-contrast input,
        .messages-contrast textarea {
          background: rgba(255, 255, 255, 0.82) !important;
          color: #10213a !important;
          border: 1px solid rgba(90, 132, 185, 0.26) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
        }

        .messages-contrast input::placeholder,
        .messages-contrast textarea::placeholder {
          color: #74849d !important;
        }

        .messages-contrast input:focus,
        .messages-contrast textarea:focus {
          outline: none !important;
          border-color: rgba(56, 214, 255, 0.58) !important;
          box-shadow:
            0 0 0 4px rgba(56, 214, 255, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
        }

        /* Bolle messaggi ricevuti */
        .messages-contrast [class*="self-start"],
        .messages-contrast [class*="mr-auto"] {
          background: rgba(255, 255, 255, 0.94) !important;
          color: #10213a !important;
          border: 1px solid rgba(90, 132, 185, 0.24) !important;
          box-shadow: 0 10px 28px rgba(68, 115, 180, 0.1) !important;
        }

        /* Bolle messaggi inviati */
        .messages-contrast [class*="self-end"],
        .messages-contrast [class*="ml-auto"] {
          background: linear-gradient(180deg, #eefac7, #def48b) !important;
          color: #243306 !important;
          border: 1px solid rgba(132, 204, 22, 0.24) !important;
          box-shadow: 0 12px 30px rgba(132, 204, 22, 0.14) !important;
        }

        .messages-contrast [class*="self-start"] *,
        .messages-contrast [class*="mr-auto"] *,
        .messages-contrast [class*="self-end"] *,
        .messages-contrast [class*="ml-auto"] * {
          color: inherit !important;
        }

        /* Card legame selezionato */
        .messages-contrast [class*="border-cyan"],
        .messages-contrast [class*="border-sky"] {
          border-color: rgba(14, 165, 233, 0.42) !important;
          background:
            linear-gradient(180deg, rgba(231, 248, 255, 0.95), rgba(245, 252, 255, 0.88)) !important;
          box-shadow:
            0 0 0 1px rgba(56, 214, 255, 0.18),
            0 16px 36px rgba(56, 214, 255, 0.12) !important;
        }

        /* Header alto più leggibile */
        .messages-contrast header {
          background: rgba(24, 35, 56, 0.76) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 10px 30px rgba(8, 19, 44, 0.14) !important;
          backdrop-filter: blur(18px) saturate(1.1);
        }

        .messages-contrast header a,
        .messages-contrast header span,
        .messages-contrast header div {
          color: rgba(255, 255, 255, 0.86) !important;
        }

        .messages-contrast header h1,
        .messages-contrast header b,
        .messages-contrast header strong {
          color: white !important;
        }

        /* Area centrale della chat */
        .messages-contrast main {
          color: #10213a;
        }

        .messages-contrast img {
          color: transparent !important;
        }
      `}</style>
    </div>
  );
}
