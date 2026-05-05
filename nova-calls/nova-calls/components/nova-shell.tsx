'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { demoCalls, makeSlug, type NovaCall } from '@/lib/local-call';
import { ProfileOrb } from '@/components/profile-store';

const STORAGE_KEY = 'nova:calls';

const callTypes = ['Decidere', 'Capire', 'Feedback', 'Trovare persone', 'Fare ora', 'Creare insieme'];

const navItems = [
  ['⌂', 'Home', '/'],
  ['◷', 'Call', '/calls/new'],
  ['⌁', 'Echo', '/echo'],
  ['◇', 'Outcome', '/outcome'],
  ['♙', 'Persone', '/people'],
  ['⬡', 'Spazi', '/spaces'],
  ['♧', 'Notifiche', '/notifications'],
  ['▱', 'Messaggi', '/messages'],
  ['◎', 'Profilo', '/profile'],
];

function readStoredCalls() {
  if (typeof window === 'undefined') return [] as NovaCall[];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as NovaCall[];
  } catch {
    return [];
  }
}

function saveCall(call: NovaCall) {
  const calls = readStoredCalls();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([call, ...calls].slice(0, 12)));
}

export function NovaHome() {
  const [text, setText] = useState('');
  const [type, setType] = useState('Decidere');
  const [attachmentName, setAttachmentName] = useState('');
  const [calls, setCalls] = useState<NovaCall[]>(demoCalls);

  useEffect(() => {
    setCalls([...readStoredCalls(), ...demoCalls]);
  }, []);

  const featured = calls[0] || demoCalls[0];

  function openCall() {
    const title = text.trim() || 'Nuova Call Nova';

    const call: NovaCall = {
      title,
      description: 'Call aperta dalla homepage. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.',
      type,
      accessType: 'public',
      slug: makeSlug(title),
      pulse: 12,
      participants: 1,
      createdAt: new Date().toISOString(),
    };

    saveCall(call);
    window.location.href = `/c/${call.slug}`;
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-28 text-white lg:pb-10">
      <TopChrome />

      <main className="relative z-10 grid min-h-screen w-full gap-5 px-4 pb-8 pt-0 lg:grid-cols-[200px_minmax(0,1fr)_420px] lg:px-5 lg:pt-6 2xl:grid-cols-[220px_minmax(0,1fr)_500px]">
        <Sidebar />

        <section className="min-w-0 pt-4 lg:pt-16">
          <h1 className="mx-auto max-w-[720px] text-center text-[clamp(40px,6vw,66px)] font-black leading-[.92] tracking-[-.075em] lg:text-left">
            Di cosa hai bisogno <span className="nova-text">adesso?</span>
          </h1>

          <p className="mx-auto mt-3 max-w-md text-center text-sm font-bold text-slate-300 lg:mx-0 lg:text-left lg:text-base">
            Apri una Call. La risposta è già nella tua rete.
          </p>

          <section className="nova-glass relative mt-5 overflow-hidden rounded-[24px] border-cyan-200/40 p-5 shadow-[0_0_28px_rgba(34,211,238,.25)]">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-28 rotate-6 bg-gradient-to-r from-transparent via-cyan-300/60 to-pink-400/50 blur-2xl" />

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Racconta la tua Call..."
              rows={3}
              className="relative z-10 min-h-[70px] w-full resize-none bg-transparent text-base font-bold text-white outline-none placeholder:text-slate-300/70"
            />

            <div className="relative z-10 mt-3 flex items-center gap-3 pr-20">
              <button
                onClick={openCall}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-2xl font-bold"
              >
                +
              </button>

              <label className="cursor-pointer rounded-full border border-white/15 bg-slate-950/40 px-4 py-2 text-sm font-black hover:bg-white/10">
                ⌘ {attachmentName || 'Allega'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
                />
              </label>

              <button
                onClick={() => setType(type === 'Anonima' ? 'Decidere' : 'Anonima')}
                className="rounded-full border border-white/15 bg-slate-950/40 px-4 py-2 text-sm font-black"
              >
                ◒ Anonima
              </button>
            </div>

            <button
              onClick={openCall}
              className="absolute bottom-4 right-4 grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-slate-950/55 text-2xl shadow-[0_0_28px_rgba(139,92,246,.38)]"
            >
              🎙
            </button>
          </section>

          <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2">
            {callTypes.map((item) => (
              <button
                key={item}
                onClick={() => setType(item)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-black ${
                  type === item
                    ? 'border-indigo-300/50 bg-gradient-to-r from-blue-500/70 to-violet-500/70'
                    : 'border-white/10 bg-white/10'
                }`}
              >
                {item === 'Decidere'
                  ? '◈'
                  : item === 'Capire'
                    ? '⚭'
                    : item === 'Feedback'
                      ? '▱'
                      : item === 'Trovare persone'
                        ? '♙'
                        : item === 'Fare ora'
                          ? '☆'
                          : '▣'}{' '}
                {item}
              </button>
            ))}
          </div>

          <FeaturedCall call={featured} />
          <HostCard />
          <LiveStrip calls={calls} />
        </section>

        <RightPanels />
      </main>
    </div>
  );
}

function TopChrome() {
  return (
    <>
      <Link
        href="/"
        className="relative z-20 mx-auto mt-5 flex w-fit items-center gap-4 text-3xl font-normal tracking-[.52em] text-slate-50 drop-shadow-[0_0_20px_rgba(34,211,238,.45)] lg:fixed lg:left-8 lg:top-7 lg:mx-0 lg:mt-0"
      >
        N
        <span className="-ml-3 h-6 w-6 rounded-full border-[5px] border-transparent bg-[linear-gradient(#020617,#020617)_padding-box,conic-gradient(from_0deg,#22d3ee,#8b5cf6,#ec4899,#22d3ee)_border-box] shadow-[0_0_22px_rgba(34,211,238,.62)]" />
        VA
      </Link>

      <div className="absolute right-4 top-5 z-30 flex items-center gap-2 lg:fixed lg:right-6 lg:top-6">
        {[
          ['⌕', '/search'],
          ['☆', '/saved'],
          ['♙', '/people'],
        ].map(([icon, href]) => (
          <Link
            key={icon}
            href={href}
            className="hidden h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-slate-950/60 text-lg hover:bg-white/10 lg:grid 2xl:h-12 2xl:w-12"
          >
            {icon}
          </Link>
        ))}

        <ProfileOrb className="h-10 w-10 lg:h-11 lg:w-11 2xl:h-12 2xl:w-12" />
      </div>
    </>
  );
}

function Sidebar() {
  return (
    <aside className="nova-glass fixed bottom-3 left-3 right-3 z-50 rounded-3xl p-2 lg:static lg:mt-[82px] lg:flex lg:min-h-0 lg:flex-col lg:rounded-[18px] lg:p-3 2xl:p-4">
      <nav className="grid grid-cols-5 gap-1.5 lg:grid-cols-1 lg:gap-2">
        {navItems.map(([icon, label, href], index) => (
          <Link
            key={label}
            href={href}
            className={`relative flex h-12 items-center justify-center gap-3 rounded-2xl text-sm font-black lg:justify-start lg:px-3 ${
              index === 0
                ? 'bg-cyan-300/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,.18)]'
                : 'text-white/80 hover:bg-white/10'
            } ${index > 4 ? 'hidden lg:flex' : ''}`}
          >
            <span className="text-xl drop-shadow-[0_0_8px_rgba(34,211,238,.5)]">{icon}</span>
            <span className="hidden lg:inline">{label}</span>

            {label === 'Notifiche' && (
              <span className="ml-auto hidden rounded-full bg-white/15 px-2 py-1 text-xs lg:inline">3</span>
            )}
          </Link>
        ))}
      </nav>

      <Link
        href="/calls/new"
        className="fixed bottom-[84px] right-5 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-400 via-violet-500 to-cyan-300 text-4xl font-bold shadow-[0_0_36px_rgba(34,211,238,.48)] lg:static lg:mt-auto lg:flex lg:h-[66px] lg:w-auto lg:justify-between lg:px-4 lg:text-left lg:text-lg 2xl:h-[74px] 2xl:px-5 2xl:text-xl"
      >
        <span className="lg:hidden">+</span>
        <span className="hidden lg:block">
          Apri
          <br />
          una Call
        </span>
        <span className="hidden lg:block">✦</span>
      </Link>

      <div className="mt-4 hidden items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-bold tracking-widest text-white/60 lg:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
        NOVA Online
      </div>
    </aside>
  );
}

function FeaturedCall({ call }: { call: NovaCall }) {
  return (
    <article className="relative mt-4 min-h-[270px] overflow-hidden rounded-[26px] border border-violet-400/40 bg-[radial-gradient(circle_at_76%_45%,rgba(139,92,246,.42),transparent_22%),linear-gradient(135deg,#071027,#11114a_47%,#080b1c)] p-5 shadow-[0_0_42px_rgba(139,92,246,.35)] 2xl:min-h-[310px] 2xl:rounded-[30px] 2xl:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_36%,rgba(236,72,153,.55),transparent_13%),radial-gradient(ellipse_at_82%_26%,rgba(34,211,238,.45),transparent_22%)]" />

      <div className="relative z-10 flex min-h-[230px] flex-col 2xl:min-h-[260px]">
        <div className="flex justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black 2xl:text-sm">
            ★ Call in evidenza
          </span>

          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black 2xl:text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            In corso
          </span>
        </div>

        <h2 className="mt-7 max-w-lg text-3xl font-black leading-none tracking-[-.045em] 2xl:mt-9 2xl:text-4xl">
          {call.title}
        </h2>

        <p className="mt-3 max-w-xl text-sm font-semibold text-slate-300 2xl:text-base">
          {call.description}
        </p>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center">
            <span className="h-8 w-8 rounded-full border-2 border-slate-950 bg-gradient-to-br from-cyan-300 to-pink-400" />
            <span className="-ml-2 h-8 w-8 rounded-full border-2 border-slate-950 bg-gradient-to-br from-pink-400 to-violet-500" />
            <span className="-ml-2 h-8 w-8 rounded-full border-2 border-slate-950 bg-gradient-to-br from-emerald-400 to-cyan-400" />
            <span className="ml-3 rounded-full bg-white/10 px-3 py-2 text-xs font-black 2xl:text-sm">
              +{Math.max(call.participants - 4, 12)}
            </span>
          </div>

          <div className="text-sm font-bold text-white/90">
            <b className="text-lg 2xl:text-xl">{call.participants}</b> partecipanti attivi
            <span className="block text-slate-300">24 stanno parlando</span>
          </div>
        </div>

        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-4">
          <Link
            href={`/c/${call.slug}?mode=audio`}
            className="rounded-full border border-white/10 bg-slate-950/45 py-3 text-center text-sm font-black"
          >
            ▥ Audio
          </Link>

          <Link
            href={`/c/${call.slug}?mode=video`}
            className="rounded-full border border-white/10 bg-slate-950/45 py-3 text-center text-sm font-black"
          >
            ▣ Video
          </Link>

          <Link
            href={`/c/${call.slug}?mode=chat`}
            className="rounded-full border border-white/10 bg-slate-950/45 py-3 text-center text-sm font-black"
          >
            ▱ Chat
          </Link>

          <Link
            href={`/c/${call.slug}`}
            className="rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-300 py-3 text-center text-base font-black 2xl:text-lg"
          >
            Apri la Call →
          </Link>
        </div>
      </div>
    </article>
  );
}

function HostCard() {
  return (
    <section className="nova-glass mt-4 grid gap-5 rounded-[20px] bg-gradient-to-r from-slate-950/80 to-violet-950/60 p-4 md:grid-cols-[1fr_1.2fr] md:items-center 2xl:rounded-[22px] 2xl:p-5">
      <div className="flex items-center gap-4 2xl:gap-5">
        <div className="h-16 w-16 shrink-0 rounded-full bg-[radial-gradient(circle_at_34%_25%,#a5f3fc,#a855f7_32%,#db2777_54%,#020617_78%)] 2xl:h-20 2xl:w-20" />

        <div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black">
            ✦ Host
          </span>

          <div className="mt-2 text-xl font-black 2xl:text-2xl">
            Giulia R. <span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">Host</span>
          </div>

          <div className="text-sm font-bold text-slate-300">Designer • Milano</div>

          <p className="mt-1 max-w-xs text-xs font-semibold text-white/65">
            Creator di spazi che aiutano le persone a prendere decisioni migliori.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-white/10 pt-4 text-center md:border-l md:border-t-0 md:pt-0">
        <Metric label="Call ospitate" value="47" />
        <Metric label="Outcome generati" value="23" />
        <Metric label="Persone aiutate" value="1.2K" />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-bold text-white/50 2xl:text-xs">{label}</span>
      <b className="mt-1 block text-xl text-cyan-300 2xl:mt-2 2xl:text-2xl">{value}</b>
    </div>
  );
}

function LiveStrip({ calls }: { calls: NovaCall[] }) {
  return (
    <section className="mt-4 rounded-[20px] border border-violet-400/20 bg-slate-950/45 p-4 2xl:rounded-[22px]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black 2xl:text-xl">⌁ Live adesso</h3>
        <span className="text-xs font-black text-slate-300">Vedi tutte →</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {calls.slice(0, 6).map((call, index) => (
          <Link
            href={`/c/${call.slug}`}
            key={`${call.slug}-${index}`}
            className="relative min-h-[82px] w-[142px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/20 to-slate-950/70 p-3 text-sm font-black 2xl:w-[150px]"
          >
            <span className="mb-2 block text-[10px] text-lime-300">● In corso</span>
            {call.title}
            <span className="absolute bottom-2 left-3 text-[11px] text-lime-300">↯ {call.pulse}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RightPanels() {
  return (
    <aside className="grid min-h-0 gap-4 pt-0 lg:pt-16">
      <section id="echo" className="nova-glass rounded-[20px] p-4">
        <div className="mb-3 flex items-center justify-between text-xl font-black 2xl:text-2xl">
          ✣ Echo <small className="text-xs text-slate-300 2xl:text-sm">● In tempo reale</small>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <h4 className="mb-3 text-xs font-black text-white/45 2xl:mb-4 2xl:text-sm">
              Insight dell&apos;AI
            </h4>

            {[
              'Hai bisogno di stabilità finanziaria nei primi mesi.',
              'Il tuo network a Milano potrebbe accelerare tutto.',
              'Il 68% vede in te il profilo giusto per il cambio.',
            ].map((item, i) => (
              <p key={item} className="mb-3 grid grid-cols-[30px_1fr] gap-3 text-xs font-semibold 2xl:mb-4 2xl:grid-cols-[34px_1fr] 2xl:text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                  {i === 0 ? '◎' : i === 1 ? '♙' : '◉'}
                </span>
                {item}
              </p>
            ))}

            <Link href="/echo" className="text-xs font-black text-slate-300 hover:text-white 2xl:text-sm">
              Analisi completa →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <h4 className="mb-3 text-xs font-black text-white/45 2xl:mb-4 2xl:text-sm">
              Clima della stanza
            </h4>

            <div className="grid place-items-center py-4 2xl:py-5">
              <div className="grid h-[118px] w-[136px] place-items-center rounded-[45%_55%_52%_48%/46%_38%_62%_54%] bg-[radial-gradient(circle_at_28%_30%,rgba(34,211,238,.95),transparent_31%),radial-gradient(circle_at_75%_35%,rgba(236,72,153,.9),transparent_32%),radial-gradient(circle_at_60%_70%,rgba(139,92,246,.92),transparent_42%)] text-center 2xl:h-[139px] 2xl:w-[160px]">
                <div>
                  <b className="text-lg 2xl:text-xl">Fiducioso</b>
                  <span className="block text-xs text-white/70">Energia positiva</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="outcome"
        className="nova-glass grid gap-4 rounded-[20px] p-4 md:grid-cols-[1fr_150px] md:items-center"
      >
        <div>
          <div className="mb-3 flex items-center gap-3 text-xl font-black 2xl:text-2xl">
            🏆 Outcome
            <small className="rounded-full bg-lime-300/10 px-3 py-1 text-xs text-lime-300">
              Completata
            </small>
          </div>

          <div className="text-sm font-semibold text-white/45">Decisione della stanza</div>

          <div className="mt-2 text-lg font-black 2xl:mt-3 2xl:text-xl">
            <span className="mr-2 text-lime-300">✓</span>
            Vai. È il momento.
          </div>

          <p className="mt-1 text-sm font-bold text-white/45">Approvato dal 76% dei partecipanti</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3 2xl:mt-4">
            {[
              'Piano finanziario 90 giorni',
              'Visita esplorativa 2 settimane',
              'Costruisci rete locale subito',
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-white/10 bg-cyan-300/5 p-3 text-xs text-white/70"
              >
                <b className="mr-1 text-base text-cyan-300">{index + 1}</b>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[radial-gradient(circle_at_65%_55%,rgba(139,92,246,.75),transparent_38%),radial-gradient(circle_at_40%_60%,rgba(34,211,238,.85),transparent_40%)] text-5xl text-blue-500 2xl:h-32 2xl:w-32">
          ✓
        </div>
      </section>

      <section className="nova-glass rounded-[20px] p-4">
        <div className="mb-3 flex items-center justify-between text-xl font-black 2xl:text-2xl">
          〽 Pulse <small className="text-xs text-slate-300 2xl:text-sm">Energia della stanza</small>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:items-center lg:grid-cols-1 2xl:grid-cols-2">
          <div className="mx-auto grid h-[160px] w-[160px] place-items-center rounded-full bg-[repeating-radial-gradient(circle,transparent_0_12px,rgba(34,211,238,.16)_13px_14px),conic-gradient(from_-15deg,transparent_0_18deg,#22d3ee_38deg,#bef264_120deg,#ec4899_240deg,transparent_310deg)] 2xl:h-[190px] 2xl:w-[190px]">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-950/85 text-center text-3xl font-black 2xl:h-28 2xl:w-28">
              92
              <span className="block text-sm text-slate-300">Alta</span>
            </div>
          </div>

          <div>
            <h4 className="font-black">Momentum in crescita</h4>
            <p className="mb-4 text-sm font-semibold text-slate-300">+28% negli ultimi 10 minuti</p>

            <div className="h-20 rounded-xl bg-white/5 2xl:h-24">
              <svg viewBox="0 0 280 100" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0 79 L34 53 L66 72 L96 49 L130 52 L162 29 L195 36 L225 15 L280 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-cyan-300"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
