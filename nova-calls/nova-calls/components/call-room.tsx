'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { demoCalls, type NovaCall } from '@/lib/local-call';
import { addNovaContribution, ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const STORAGE_KEY = 'nova:calls';

type MessageKind = 'host' | 'guest' | 'ai' | 'system';

type Message = {
  id: string;
  author: string;
  text: string;
  kind: MessageKind;
  avatar?: string | null;
  createdAt?: string;
};

type DbMessage = {
  id: string;
  call_slug: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  body: string;
  created_at: string;
};

const starterMessages: Message[] = [
  {
    id: 'starter-host',
    author: 'Giulia · Host',
    text: 'Partiamo dal punto: che cosa renderebbe questa decisione davvero sicura?',
    kind: 'host',
  },
  {
    id: 'starter-marco',
    author: 'Marco',
    text: 'Io separerei desiderio, vincoli economici e rete locale. Sono tre decisioni diverse.',
    kind: 'guest',
  },
  {
    id: 'starter-ai',
    author: 'Nova Echo',
    text: 'Sto rilevando un tema dominante: stabilità prima, esplorazione subito dopo.',
    kind: 'ai',
  },
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

function getUserName(user: User | null) {
  if (!user) return 'Utente Nova';

  const metadata = user.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || metadata.display_name;

  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split('@')[0];

  return 'Utente Nova';
}

function getUserAvatar(user: User | null) {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const avatar = metadata.avatar_url || metadata.picture;

  return typeof avatar === 'string' && avatar.trim() ? avatar : null;
}

function mapDbMessage(message: DbMessage): Message {
  return {
    id: message.id,
    author: message.user_name || 'Utente Nova',
    text: message.body,
    kind: 'guest',
    avatar: message.user_avatar,
    createdAt: message.created_at,
  };
}

function uniqueMessages(messages: Message[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

export function CallRoom({ slug }: { slug: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [call, setCall] = useState<NovaCall | undefined>();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState('');
  const [reactions, setReactions] = useState(12);
  const [joined, setJoined] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [roomError, setRoomError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    setCall(readCall(slug) || demoCalls[0]);
  }, [slug]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace(`/login?next=${encodeURIComponent(`/c/${slug}`)}`);
        return;
      }

      setUser(data.user);
      setAuthReady(true);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent(`/c/${slug}`)}`);
        return;
      }

      setUser(session.user);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, slug, supabase]);

  useEffect(() => {
    if (!authReady || !user) return;

    let active = true;

    async function loadMessages() {
      setLoadingMessages(true);
      setRoomError(null);

      const { data, error } = await supabase
        .from('call_messages')
        .select('id, call_slug, user_id, user_name, user_avatar, body, created_at')
        .eq('call_slug', slug)
        .order('created_at', { ascending: true });

      if (!active) return;

      if (error) {
        setRoomError(
          `Non riesco a leggere i messaggi condivisi. Controlla che la tabella call_messages esista e che Realtime/RLS siano configurati. Dettaglio: ${error.message}`
        );
        setMessages(starterMessages);
      } else {
        setMessages(uniqueMessages([...starterMessages, ...(data || []).map(mapDbMessage)]));
      }

      setLoadingMessages(false);
    }

    loadMessages();

    const channel = supabase
      .channel(`call-messages:${slug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_messages',
          filter: `call_slug=eq.${slug}`,
        },
        (payload) => {
          const nextMessage = mapDbMessage(payload.new as DbMessage);

          setMessages((current) => uniqueMessages([...current, nextMessage]));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setRoomError('Realtime non è attivo per questa tabella. I messaggi potrebbero comparire solo dopo refresh.');
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [authReady, slug, supabase, user]);

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

  async function insertSharedMessage(body: string) {
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/c/${slug}`)}`);
      return false;
    }

    const { error } = await supabase.from('call_messages').insert({
      call_slug: slug,
      user_id: user.id,
      user_name: getUserName(user),
      user_avatar: getUserAvatar(user),
      body,
    });

    if (error) {
      setRoomError(`Messaggio non inviato: ${error.message}`);
      return false;
    }

    return true;
  }

  async function joinCall() {
    if (joined) return;

    const ok = await insertSharedMessage(`${getUserName(user)} è entrato/a nella Call.`);
    if (!ok) return;

    addNovaContribution(5, 'callsJoined');
    setJoined(true);
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();

    const text = input.trim();
    if (!text) return;

    const ok = await insertSharedMessage(text);
    if (!ok) return;

    addNovaContribution(10, 'contributions');
    setInput('');
  }

  function reactToCall() {
    setReactions((value) => value + 1);
    addNovaContribution(2);
  }

  function generateOutcome() {
    addNovaContribution(25, 'outcomesHelped');
    setOutcome(
      `Decisione proposta: ${
        call?.type === 'Decidere'
          ? 'scegli una prova reversibile entro 14 giorni'
          : 'trasforma la Call in tre prossime azioni'
      }. Step: 1) definisci il vincolo più forte, 2) chiedi feedback a due persone esperte, 3) fissa una scadenza chiara.`
    );
  }

  if (!call || !authReady) {
    return (
      <main className="grid min-h-screen place-items-center px-4 text-white">
        <div className="nova-glass rounded-[2rem] p-7 text-center">
          <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/70">NOVA</p>
          <h1 className="mt-3 text-3xl font-black">Accesso alla Call…</h1>
          <p className="mt-3 font-semibold text-slate-300">Se non sei loggato, ti porto alla pagina di login.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-white md:px-7">
      <div className="mx-auto flex w-[min(1180px,100%)] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-[.18em]">
          NOVA
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/calls/new" className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950">
            ＋ Apri Call
          </Link>
          <ProfileOrb className="h-11 w-11" />
        </div>
      </div>

      <section className="mx-auto mt-8 grid w-[min(1180px,100%)] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <header className="nova-glass overflow-hidden rounded-[2rem] p-6">
            <div className="mb-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-sm font-black text-slate-950">
              ● Call live
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.06em] md:text-7xl">
              {call.title}
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-300">{call.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={joinCall}
                className={`rounded-full px-5 py-3 text-sm font-black ${
                  joined ? 'bg-emerald-300 text-slate-950' : 'border border-white/15 bg-white/10'
                }`}
              >
                {joined ? 'Dentro la Call' : 'Entra nella Call'}
              </button>

              <button onClick={reactToCall} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black">
                ☆ Reagisci
              </button>

              <button onClick={generateOutcome} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 py-3 text-sm font-black">
                Genera Outcome
              </button>
            </div>
          </header>

          <section className="nova-glass rounded-[2rem] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">▱ Chat della Call</h2>
              <span className="text-sm font-bold text-slate-300">
                {loadingMessages ? 'Sincronizzo…' : `${messages.length} messaggi`}
              </span>
            </div>

            {roomError && (
              <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                {roomError}
              </div>
            )}

            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl border p-4 ${
                    message.kind === 'ai'
                      ? 'border-cyan-300/25 bg-cyan-300/10'
                      : message.kind === 'host'
                        ? 'border-violet-300/20 bg-violet-300/10'
                        : message.text.includes('è entrato/a nella Call.')
                          ? 'border-lime-300/20 bg-lime-300/10'
                          : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {message.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={message.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-black">
                        {message.author.slice(0, 2).toUpperCase()}
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-white/45">{message.author}</div>
                      {message.createdAt && (
                        <div className="text-[11px] font-bold text-white/30">
                          {new Date(message.createdAt).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 font-semibold leading-7 text-slate-100">{message.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="mt-4 flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Aggiungi un contributo..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold outline-none placeholder:text-white/35"
              />
              <button className="rounded-2xl bg-lime-300 px-5 py-4 font-black text-slate-950">Invia</button>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">〽 Pulse</h3>
            <div className="mt-5 grid place-items-center">
              <div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(from_-20deg,#22d3ee,#bef264,#ec4899,#22d3ee)] p-3">
                <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center text-4xl font-black">
                  {pulse}
                  <span className="block text-xs text-slate-300">
                    {pulse >= 85 ? 'Altissima' : pulse >= 65 ? 'Alta' : pulse >= 35 ? 'Media' : 'In partenza'}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
              Calcolato da messaggi, partecipazione e reazioni nella stanza.
            </p>
          </div>

          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">⌁ Echo</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{echo}</p>
          </div>

          <div className="nova-glass rounded-[2rem] p-5">
            <h3 className="text-xl font-black">◇ Outcome</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              {outcome || 'Quando la stanza è pronta, genera una sintesi con decisione, motivazione e prossime azioni.'}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
