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
type LinkStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';

type Message = {
  id: string;
  userId?: string | null;
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

type PublicProfile = {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  bio: string | null;
  passions: string[] | null;
  city: string | null;
  role?: string | null;
  nova_points: number | null;
  contributions: number | null;
  calls_joined: number | null;
  outcomes_helped: number | null;
};

type UserLinkRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
};

const starterMessages: Message[] = [
  {
    id: 'starter-host',
    userId: null,
    author: 'Giulia · Host',
    text: 'Partiamo dal punto: che cosa renderebbe questa decisione davvero sicura?',
    kind: 'host',
  },
  {
    id: 'starter-marco',
    userId: null,
    author: 'Marco',
    text: 'Io separerei desiderio, vincoli economici e rete locale. Sono tre decisioni diverse.',
    kind: 'guest',
  },
  {
    id: 'starter-ai',
    userId: null,
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
    userId: message.user_id,
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

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'ME'
  );
}

function splitProfileTags(profile: PublicProfile | null) {
  if (!profile) return [];

  const passions = Array.isArray(profile.passions) ? profile.passions : [];
  const roleTags = profile.role
    ? profile.role
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return [...passions, ...roleTags].slice(0, 8);
}

function getRelationshipStatus(link: UserLinkRow | null, currentUserId: string | undefined): LinkStatus {
  if (!link || !currentUserId) return 'none';

  if (link.status === 'accepted') return 'accepted';
  if (link.status === 'rejected') return 'rejected';

  if (link.requester_id === currentUserId) return 'pending_sent';
  return 'pending_received';
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

  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileFallback, setProfileFallback] = useState<Message | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [linkRow, setLinkRow] = useState<UserLinkRow | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [selectedProfileLinksCount, setSelectedProfileLinksCount] = useState(0);

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

  async function loadSelectedProfileLinksCount(profileId: string) {
    const { count, error } = await supabase
      .from('user_links')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profileId},receiver_id.eq.${profileId}`);

    if (!error) setSelectedProfileLinksCount(count || 0);
  }

  async function loadLinkWithProfile(profileId: string) {
    if (!user || user.id === profileId) {
      setLinkRow(null);
      return;
    }

    const { data, error } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${profileId}),and(requester_id.eq.${profileId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (error) {
      setLinkMessage(`Non riesco a verificare il legame: ${error.message}`);
      setLinkRow(null);
      return;
    }

    setLinkRow((data as UserLinkRow | null) || null);
  }

  async function openProfileFromMessage(message: Message) {
    setLinkRow(null);
    setLinkMessage(null);
    setSelectedProfileLinksCount(0);

    if (!message.userId) {
      setSelectedProfile(null);
      setProfileFallback(message);
      setProfileError('Questo messaggio demo non è collegato a un profilo reale.');
      return;
    }

    setProfileFallback(message);
    setSelectedProfile(null);
    setProfileError(null);
    setProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, username, avatar_url, bio, passions, city, role, nova_points, contributions, calls_joined, outcomes_helped'
      )
      .eq('id', message.userId)
      .maybeSingle();

    if (error) {
      setProfileError(error.message);
      setProfileLoading(false);
      return;
    }

    if (!data) {
      setProfileError('Profilo non ancora completato.');
      setProfileLoading(false);
      return;
    }

    setSelectedProfile(data as PublicProfile);
    setProfileLoading(false);
    await loadSelectedProfileLinksCount(message.userId);
    await loadLinkWithProfile(message.userId);
  }

  async function requestLink() {
    if (!user || !selectedProfile || selectedProfile.id === user.id) return;

    setLinkLoading(true);
    setLinkMessage(null);

    const { data: existing, error: existingError } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status')
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${selectedProfile.id}),and(requester_id.eq.${selectedProfile.id},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existingError) {
      setLinkMessage(`Non riesco a verificare il legame: ${existingError.message}`);
      setLinkLoading(false);
      return;
    }

    if (existing) {
      setLinkRow(existing as UserLinkRow);
      const status = getRelationshipStatus(existing as UserLinkRow, user.id);
      setLinkMessage(
        status === 'accepted'
          ? 'Il legame è già attivo. Potete aprire una chat privata dalla sezione Messaggi.'
          : status === 'pending_sent'
            ? 'Hai già inviato una richiesta di legame.'
            : status === 'pending_received'
              ? 'Questa persona ti ha già inviato una richiesta: la trovi nelle Notifiche.'
              : 'Il legame era stato rifiutato.'
      );
      setLinkLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_links')
      .insert({
        requester_id: user.id,
        receiver_id: selectedProfile.id,
        status: 'pending',
      })
      .select('id, requester_id, receiver_id, status')
      .single();

    if (error) {
      setLinkMessage(`Richiesta non inviata: ${error.message}`);
      setLinkLoading(false);
      return;
    }

    setLinkRow(data as UserLinkRow);
    setLinkMessage('Richiesta di legame inviata. La persona la vedrà nella sezione Notifiche.');
    setLinkLoading(false);
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

  const profileName = selectedProfile?.full_name || profileFallback?.author || 'Profilo Nova';
  const profileAvatar = selectedProfile?.avatar_url || profileFallback?.avatar || '';
  const profileTags = splitProfileTags(selectedProfile);
  const linkStatus = getRelationshipStatus(linkRow, user?.id);
  const canRequestLink = Boolean(selectedProfile && user && selectedProfile.id !== user.id && linkStatus === 'none');

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
                    <button
                      type="button"
                      onClick={() => openProfileFromMessage(message)}
                      className="group relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs font-black outline-none ring-0 transition hover:scale-105 hover:ring-4 hover:ring-cyan-300/20"
                      title={`Vedi profilo di ${message.author}`}
                    >
                      {message.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{initials(message.author)}</span>
                      )}
                    </button>

                    <button type="button" onClick={() => openProfileFromMessage(message)} className="text-left">
                      <div className="text-xs font-black uppercase tracking-wide text-white/45 hover:text-cyan-200">
                        {message.author}
                      </div>
                      {message.createdAt && (
                        <div className="text-[11px] font-bold text-white/30">
                          {new Date(message.createdAt).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </button>
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

      {(profileFallback || profileLoading) && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 px-4 backdrop-blur-xl">
          <div className="relative w-[min(580px,100%)] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-[0_0_60px_rgba(34,211,238,.22)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(34,211,238,.2),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(236,72,153,.16),transparent_30%)]" />

            <div className="relative z-10">
              <button
                type="button"
                onClick={() => {
                  setProfileFallback(null);
                  setSelectedProfile(null);
                  setProfileError(null);
                  setProfileLoading(false);
                  setLinkRow(null);
                  setLinkMessage(null);
                  setSelectedProfileLinksCount(0);
                }}
                className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-xl font-black hover:bg-white/15"
                aria-label="Chiudi profilo"
              >
                ×
              </button>

              {profileLoading ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Profilo Nova</p>
                  <h3 className="mt-3 text-3xl font-black">Carico profilo…</h3>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-5 pr-12">
                    <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_20%,#f8b4ff,#7c3aed_38%,#0f172a_70%)] text-xl font-black">
                      {profileAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(profileName)
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.24em] text-cyan-200/75">Profilo pubblico</p>
                      <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-.04em]">{profileName}</h3>
                      <p className="mt-1 text-sm font-bold text-cyan-200">
                        {selectedProfile?.city || 'NOVA'} · {selectedProfile?.nova_points || 0} punti Nova · {selectedProfileLinksCount} legami
                      </p>
                    </div>
                  </div>

                  {profileError && (
                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                      {profileError}
                    </div>
                  )}

                  <p className="mt-5 font-semibold leading-7 text-slate-300">
                    {selectedProfile?.bio || 'Questo utente non ha ancora completato la biografia del profilo.'}
                  </p>

                  {profileTags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {profileTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <b className="text-2xl text-cyan-300">{selectedProfile?.contributions || 0}</b>
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">Messaggi utili</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <b className="text-2xl text-lime-300">{selectedProfile?.calls_joined || 0}</b>
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">Call entrate</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <b className="text-2xl text-pink-300">{selectedProfile?.outcomes_helped || 0}</b>
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">Outcome</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <b className="text-2xl text-violet-300">{selectedProfileLinksCount}</b>
                      <span className="mt-1 block text-[11px] font-bold text-slate-400">Legami</span>
                    </div>
                  </div>

                  {selectedProfile && user?.id !== selectedProfile.id && (
                    <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Legame personale</p>

                      {canRequestLink && (
                        <button
                          type="button"
                          onClick={requestLink}
                          disabled={linkLoading}
                          className="mt-3 w-full rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                        >
                          {linkLoading ? 'Invio richiesta…' : 'Richiedi legame'}
                        </button>
                      )}

                      {linkStatus === 'pending_sent' && (
                        <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100">
                          Richiesta inviata. Quando l&apos;altra persona accetta, si sbloccherà la chat privata.
                        </div>
                      )}

                      {linkStatus === 'pending_received' && (
                        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                          Questa persona ti ha già inviato una richiesta. Vai in Notifiche per accettarla o rifiutarla.
                        </div>
                      )}

                      {linkStatus === 'accepted' && (
                        <Link
                          href="/messages"
                          className="mt-3 block rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 py-3 text-center text-sm font-black text-white"
                        >
                          Legame attivo · Apri Messaggi
                        </Link>
                      )}

                      {linkStatus === 'rejected' && (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
                          Questo legame non è attivo.
                        </div>
                      )}

                      {linkMessage && (
                        <p className="mt-3 text-sm font-bold text-slate-300">{linkMessage}</p>
                      )}
                    </div>
                  )}

                  <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-slate-500">
                    Solo legami reciproci · nessun follow pubblico · chat privata solo dopo accettazione
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
