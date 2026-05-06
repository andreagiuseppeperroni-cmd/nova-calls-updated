'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar, Button, Card } from '@/components/ui';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type UserLink = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  nova_points: number | null;
};

type ChatMessage = {
  id: string;
  link_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Conversation = {
  link: UserLink;
  otherUserId: string;
  profile: Profile | null;
};

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'NV'
  );
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Ora';
  }
}

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLinkId = searchParams.get('link');
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(requestedLinkId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversation = conversations.find((item) => item.link.id === activeLinkId) || null;

  async function loadConversations(currentUserId?: string) {
    const uid = currentUserId || userId;
    if (!uid) return;

    setLoadingConversations(true);
    setError(null);

    const { data: links, error: linksError } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status, created_at, updated_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('updated_at', { ascending: false });

    if (linksError) {
      setError(`Non riesco a caricare i legami attivi: ${linksError.message}`);
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const acceptedLinks = (links || []) as UserLink[];
    const otherIds = Array.from(
      new Set(acceptedLinks.map((link) => (link.requester_id === uid ? link.receiver_id : link.requester_id)))
    );

    let profiles: Profile[] = [];

    if (otherIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, bio, nova_points')
        .in('id', otherIds);

      if (profilesError) {
        setError(`Legami caricati, ma non riesco a leggere alcuni profili: ${profilesError.message}`);
      } else {
        profiles = (profilesData || []) as Profile[];
      }
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const nextConversations = acceptedLinks.map((link) => {
      const otherUserId = link.requester_id === uid ? link.receiver_id : link.requester_id;

      return {
        link,
        otherUserId,
        profile: profileMap.get(otherUserId) || null,
      };
    });

    setConversations(nextConversations);

    if (requestedLinkId && nextConversations.some((item) => item.link.id === requestedLinkId)) {
      setActiveLinkId(requestedLinkId);
    } else if (!activeLinkId && nextConversations.length > 0) {
      setActiveLinkId(nextConversations[0].link.id);
    } else if (activeLinkId && !nextConversations.some((item) => item.link.id === activeLinkId)) {
      setActiveLinkId(nextConversations[0]?.link.id || null);
    }

    setLoadingConversations(false);
  }

  async function loadMessages(linkId: string) {
    setLoadingMessages(true);
    setError(null);

    const { data, error: messagesError } = await supabase
      .from('private_messages')
      .select('id, link_id, sender_id, body, created_at')
      .eq('link_id', linkId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      setError(`Non riesco a caricare la chat privata: ${messagesError.message}`);
      setMessages([]);
    } else {
      setMessages((data || []) as ChatMessage[]);
    }

    setLoadingMessages(false);
  }

  useEffect(() => {
    let active = true;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent('/messages')}`);
        return;
      }

      setUserId(user.id);
      await loadConversations(user.id);
    }

    init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  useEffect(() => {
    if (requestedLinkId) {
      setActiveLinkId(requestedLinkId);
    }
  }, [requestedLinkId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-links:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
          filter: `requester_id=eq.${userId}`,
        },
        () => loadConversations(userId)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
          filter: `receiver_id=eq.${userId}`,
        },
        () => loadConversations(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  useEffect(() => {
    if (!activeLinkId) {
      setMessages([]);
      return;
    }

    loadMessages(activeLinkId);

    const channel = supabase
      .channel(`private-messages:${activeLinkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `link_id=eq.${activeLinkId}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === next.id)) return current;
            return [...current, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLinkId, supabase]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();

    const body = input.trim();

    if (!body || !userId || !activeLinkId) return;

    setSending(true);
    setError(null);

    const { error: insertError } = await supabase.from('private_messages').insert({
      link_id: activeLinkId,
      sender_id: userId,
      body,
    });

    if (insertError) {
      setError(`Messaggio non inviato: ${insertError.message}`);
      setSending(false);
      return;
    }

    setInput('');
    setSending(false);
  }

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">
              Chat private sbloccate dai legami
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Messaggi</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">
              Qui trovi solo le chat private nate da un legame personale accettato da entrambe le persone.
            </p>
          </div>

          <Button href="/profile" variant="lime">
            Vai ai Legami
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {error}
          </div>
        )}

        <Card className="mt-8 overflow-hidden p-0">
          <div className="grid min-h-[680px] lg:grid-cols-[360px_1fr]">
            <aside className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">Legami attivi</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    {loadingConversations ? 'Carico…' : `${conversations.length} chat`}
                  </p>
                </div>

                <Button href="/notifications" variant="ghost">
                  Notifiche
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {loadingConversations && (
                  <>
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                    ))}
                  </>
                )}

                {!loadingConversations && conversations.length === 0 && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center">
                    <h3 className="text-xl font-black">Nessuna chat privata</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      Apri una Call, contribuisci e crea un legame reciproco con una persona per sbloccare la chat.
                    </p>
                  </div>
                )}

                {!loadingConversations &&
                  conversations.map((conversation) => {
                    const publicProfile = conversation.profile;
                    const name = publicProfile?.full_name || 'Utente Nova';
                    const active = conversation.link.id === activeLinkId;

                    return (
                      <button
                        key={conversation.link.id}
                        type="button"
                        onClick={() => setActiveLinkId(conversation.link.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-cyan-300/30 bg-cyan-300/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black">
                            {publicProfile?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={publicProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-white">{name}</div>
                            <div className="text-xs font-bold text-slate-400">
                              {publicProfile?.city || 'NOVA'} · {publicProfile?.nova_points || 0} punti
                            </div>
                            <div className="mt-1 text-[11px] font-black uppercase tracking-[.16em] text-lime-300">
                              Legame attivo
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </aside>

            <section className="flex min-h-[680px] flex-col">
              {!activeConversation ? (
                <div className="grid flex-1 place-items-center p-8 text-center">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">NOVA</p>
                    <h2 className="mt-3 text-3xl font-black">Seleziona una conversazione</h2>
                    <p className="mx-auto mt-3 max-w-md font-semibold leading-7 text-slate-300">
                      Le conversazioni private compaiono solo quando una richiesta di legame viene accettata.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <header className="border-b border-white/10 p-5">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-cyan-300 text-sm font-black">
                        {activeConversation.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={activeConversation.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials(activeConversation.profile?.full_name || 'Utente Nova')
                        )}
                      </div>

                      <div>
                        <h2 className="text-2xl font-black">
                          {activeConversation.profile?.full_name || 'Utente Nova'}
                        </h2>
                        <p className="text-sm font-bold text-cyan-200">
                          Chat privata sbloccata da legame reciproco
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {loadingMessages && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-300">
                        Carico messaggi…
                      </div>
                    )}

                    {!loadingMessages && messages.length === 0 && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-center">
                        <h3 className="text-xl font-black">Inizia la conversazione</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                          Questo spazio è privato tra voi due perché avete accettato il legame.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => {
                      const mine = message.sender_id === userId;

                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-[1.35rem] border px-4 py-3 ${
                              mine
                                ? 'border-lime-300/20 bg-lime-300/15'
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <p className="font-semibold leading-7 text-slate-100">{message.body}</p>
                            <p className="mt-1 text-[11px] font-bold text-white/35">{formatTime(message.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={sendMessage} className="border-t border-white/10 p-5">
                    <div className="flex gap-3">
                      <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Scrivi un messaggio privato..."
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35"
                      />
                      <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="rounded-2xl bg-lime-300 px-5 py-4 font-black text-slate-950 disabled:opacity-60"
                      >
                        {sending ? 'Invio…' : 'Invia'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        </Card>
      </main>
    </div>
  );
}
