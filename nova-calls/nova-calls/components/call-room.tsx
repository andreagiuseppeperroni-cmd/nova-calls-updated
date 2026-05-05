'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { demoCalls, type NovaCall } from '@/lib/local-call';

const STORAGE_KEY = 'nova:calls';

type Message = { author: string; text: string; kind: 'host' | 'guest' | 'ai' };

const starterMessages: Message[] = [
  { author: 'Giulia · Host', text: 'Partiamo dal punto: che cosa renderebbe questa decisione davvero sicura?', kind: 'host' },
  { author: 'Marco', text: 'Io separerei desiderio, vincoli economici e rete locale. Sono tre decisioni diverse.', kind: 'guest' },
  { author: 'Nova Echo', text: 'Sto rilevando un tema dominante: stabilità prima, esplorazione subito dopo.', kind: 'ai' },
];

function readCall(slug: string) {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as NovaCall[];
    return [...stored, ...demoCalls].find((call) => call.slug === slug);
  } catch {
    return demoCalls.find((call) => call.slug === slug);
  }
}

export function CallRoom({ slug }: { slug: string }) {
  const [call, setCall] = useState<NovaCall | undefined>();
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState('');
  const [reactions, setReactions] = useState(12);
  const [joined, setJoined] = useState(false);
  const [outcome, setOutcome] = useState('');

  useEffect(() => {
    setCall(readCall(slug) || demoCalls[0]);
  }, [slug]);

  const pulse = useMemo(() => {
    const base = call?.pulse || 0;
    const score = base + messages.length * 4 + reactions + (joined ? 8 : 0);
    return Math.max(0, Math.min(100, score));
  }, [call?.pulse, joined, messages.length, reactions]);

  const echo = useMemo(() => {
    const allText = messages.map((message) => message.text).join(' ').toLowerCase();
    if (allText.includes('sold') || allText.includes('econom') || allText.includes('costo')) {
      return 'Echo: il nodo principale sembra economico. Prima azione consigliata: scenario a 90 giorni con budget minimo, medio e ideale.';
    }
    if (allText.includes('paura') || allText.includes('sicura')) {
      return 'Echo: la stanza distingue paura e segnale reale. Serve una prova piccola prima della decisione grande.';
    }
    return 'Echo: stanno emergendo chiarezza, bisogno di rete e una prossima azione concreta da testare subito.';
  }, [messages]);

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [...current, { author: 'Tu', text, kind: 'guest' }]);
    setInput('');
  }

  function generateOutcome() {
    setOutcome(`Decisione proposta: ${call?.type === 'Decidere' ? 'scegli una prova reversibile entro 14 giorni' : 'trasforma la Call in tre prossime azioni'}. Step: 1) definisci il vincolo più forte, 2) chiedi feedback a due persone esperte, 3) fissa una scadenza chiara.`);
  }

  if (!call) return null;

  return (
    <main className="min-h-screen px-4 py-6 text-white md:px-7">
      <div className="mx-auto flex w-[min(1180px,100%)] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-[.18em]">NOVA</Link>
        <Link href="/calls/new" className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950">＋ Apri Call</Link>
      </div>

      <section className="mx-auto mt-8 grid w-[min(1180px,100%)] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <header className="nova-glass overflow-hidden rounded-[2rem] p-6">
            <div className="mb-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-sm font-black text-slate-950">● Call live</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.06em] md:text-7xl">{call.title}</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-300">{call.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setJoined(true)} className={`rounded-full px-5 py-3 text-sm font-black ${joined ? 'bg-emerald-300 text-slate-950' : 'border border-white/15 bg-white/10'}`}>{joined ? 'Dentro la Call' : 'Entra nella Call'}</button>
              <button onClick={() => setReactions((value) => value + 1)} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black">☆ Reagisci</button>
              <button onClick={generateOutcome} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 py-3 text-sm font-black">Genera Outcome</button>
            </div>
          </header>

          <section className="nova-glass rounded-[2rem] p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black">▱ Chat della Call</h2><span className="text-sm font-bold text-slate-300">{messages.length} messaggi</span></div>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={`${message.author}-${index}`} className={`rounded-2xl border p-4 ${message.kind === 'ai' ? 'border-cyan-300/25 bg-cyan-300/10' : message.kind === 'host' ? 'border-violet-300/20 bg-violet-300/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="text-xs font-black uppercase tracking-wide text-white/45">{message.author}</div>
                  <p className="mt-1 font-semibold leading-7 text-slate-100">{message.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-3">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Aggiungi un contributo..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold outline-none placeholder:text-white/35" />
              <button className="rounded-2xl bg-lime-300 px-5 py-4 font-black text-slate-950">Invia</button>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">〽 Pulse</h3>
            <div className="mt-5 grid place-items-center"><div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(from_-20deg,#22d3ee,#bef264,#ec4899,#22d3ee)] p-3"><div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center text-4xl font-black">{pulse}<span className="block text-xs text-slate-300">{pulse >= 85 ? 'Altissima' : pulse >= 65 ? 'Alta' : pulse >= 35 ? 'Media' : 'In partenza'}</span></div></div></div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">Calcolato da messaggi, partecipazione e reazioni nella stanza.</p>
          </div>

          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">⌁ Echo</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{echo}</p>
          </div>

          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">◇ Outcome</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{outcome || 'Quando la stanza è pronta, genera una sintesi con decisione, motivazione e prossime azioni.'}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
