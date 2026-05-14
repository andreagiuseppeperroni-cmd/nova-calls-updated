'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ChatLink = {
  linkId: string | null;
  otherUserId: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  points?: number | null;
};

type MessageRow = {
  id: string;
  link_id?: string | null;
  sender_id?: string | null;
  receiver_id?: string | null;
  body?: string | null;
  content?: string | null;
  message?: string | null;
  created_at?: string | null;
  read_at?: string | null;
};

type ChatPreview = ChatLink & {
  lastBody: string;
  lastAt: string;
  unread: number;
};

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'TS'
  );
}

function messageText(message: MessageRow) {
  return message.body || message.content || message.message || '';
}

function formatTime(value?: string | null) {
  if (!value) return '';

  try {
    const date = new Date(value);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();

    return new Intl.DateTimeFormat('it-IT', {
      day: sameDay ? undefined : '2-digit',
      month: sameDay ? undefined : 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export default function MessagesPage() {
  const [requestedLinkId, setRequestedLinkId] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any | null>(null);

  const [currentUserId, setCurrentUserId] = useState('');
  const [links, setLinks] = useState<ChatLink[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequestedLinkId(params.get('link'));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Configurazione Supabase mancante: verifica NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY su Netlify.');
      setLoading(false);
      return;
    }

    async function initSupabase() {
      try {
        const { createBrowserSupabase } = await import('@/lib/supabase-browser');
        setSupabase(createBrowserSupabase());
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Impossibile inizializzare Supabase.');
        setLoading(false);
      }
    }

    initSupabase();
  }, []);

  const selectedChat = useMemo(() => {
    return links.find((link) => link.linkId === selectedId || link.otherUserId === selectedId) || links[0] || null;
  }, [links, selectedId]);

  const selectedMessages = useMemo(() => {
    if (!selectedChat || !currentUserId) return [];

    return messages
      .filter((message) => {
        const byLink = selectedChat.linkId && message.link_id === selectedChat.linkId;
        const byUsers =
          (message.sender_id === currentUserId && message.receiver_id === selectedChat.otherUserId) ||
          (message.receiver_id === currentUserId && message.sender_id === selectedChat.otherUserId);

        return byLink || byUsers;
      })
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }, [messages, selectedChat, currentUserId]);

  const previews = useMemo<ChatPreview[]>(() => {
    return links.map((link) => {
      const chatMessages = messages
        .filter((message) => {
          const byLink = link.linkId && message.link_id === link.linkId;
          const byUsers =
            (message.sender_id === currentUserId && message.receiver_id === link.otherUserId) ||
            (message.receiver_id === currentUserId && message.sender_id === link.otherUserId);

          return byLink || byUsers;
        })
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const last = chatMessages[0];

      return {
        ...link,
        lastBody: last ? messageText(last) : `${link.city || 'Italia'} · Legame attivo`,
        lastAt: last?.created_at || '',
        unread: chatMessages.filter((message) => message.receiver_id === currentUserId && !message.read_at).length,
      };
    });
  }, [links, messages, currentUserId]);

  const filteredPreviews = useMemo(() => {
    const value = normalize(query.trim());

    if (!value) return previews;

    return previews.filter((preview) =>
      normalize(`${preview.name} ${preview.username || ''} ${preview.city || ''} ${preview.lastBody}`).includes(value)
    );
  }, [previews, query]);

  async function loadMessagesPage() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrentUserId('');
      setLinks([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    let loadedLinks: ChatLink[] = [];

    const { data: rpcRows } = await supabase.rpc('get_my_active_links');

    if (Array.isArray(rpcRows) && rpcRows.length > 0) {
      loadedLinks = rpcRows.map((row: any) => ({
        linkId: row.link_id || null,
        otherUserId: row.other_user_id,
        name: row.full_name || row.username || 'Utente The Square',
        username: row.username || null,
        avatarUrl: row.avatar_url || null,
        city: row.city || 'Italia',
        points: typeof row.nova_points === 'number' ? row.nova_points : 0,
      }));
    } else {
      const { data: linkRows } = await supabase
        .from('user_links')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const acceptedLinks = ((linkRows || []) as any[]).filter((link) => {
        const status = String(link.status || 'accepted').toLowerCase();
        return !['rejected', 'blocked', 'declined', 'cancelled'].includes(status);
      });

      const otherIds = Array.from(
        new Set(acceptedLinks.map((link) => (link.requester_id === user.id ? link.receiver_id : link.requester_id)))
      );

      let profileRows: any[] = [];

      if (otherIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherIds);

        profileRows = data || [];
      }

      const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

      loadedLinks = acceptedLinks.map((link) => {
        const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;
        const profile = profileMap.get(otherUserId);

        return {
          linkId: link.id || null,
          otherUserId,
          name: profile?.full_name || profile?.display_name || profile?.username || 'Utente The Square',
          username: profile?.username || null,
          avatarUrl: profile?.avatar_url || null,
          city: profile?.city || 'Italia',
          points: profile?.nova_points || 0,
        };
      });
    }

    const otherIds = loadedLinks.map((link) => link.otherUserId);

    let messageRows: MessageRow[] = [];

    if (loadedLinks.length > 0) {
      const linkIds = loadedLinks.map((link) => link.linkId).filter(Boolean);

      const queries: PromiseLike<any>[] = [];

      if (linkIds.length > 0) {
        queries.push(
          supabase
            .from('private_messages')
            .select('*')
            .in('link_id', linkIds)
            .order('created_at', { ascending: true })
        );
      }

      if (otherIds.length > 0) {
        queries.push(
          supabase
            .from('private_messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: true })
        );
      }

      const results = await Promise.all(queries);
      const merged = new Map<string, MessageRow>();

      for (const result of results) {
        for (const message of (result.data || []) as MessageRow[]) {
          const involvesKnownUser =
            !message.sender_id ||
            !message.receiver_id ||
            message.sender_id === user.id ||
            message.receiver_id === user.id ||
            otherIds.includes(message.sender_id) ||
            otherIds.includes(message.receiver_id);

          if (involvesKnownUser) {
            merged.set(message.id, message);
          }
        }
      }

      messageRows = Array.from(merged.values());
    }

    setLinks(loadedLinks);
    setMessages(messageRows);

    const requested =
      (requestedLinkId
        ? loadedLinks.find((link) => link.linkId === requestedLinkId || link.otherUserId === requestedLinkId)
        : null);

    const requestedSelection =
      requested?.linkId ||
      requested?.otherUserId ||
      loadedLinks[0]?.linkId ||
      loadedLinks[0]?.otherUserId ||
      '';

    setSelectedId((current) => current || requestedSelection);
    setLoading(false);
  }

  async function sendMessage() {
    const body = reply.trim();

    if (!supabase || !body || !selectedChat || !currentUserId) return;

    setSending(true);
    setError(null);

    const payload: Record<string, string> = {
      sender_id: currentUserId,
      receiver_id: selectedChat.otherUserId,
      body,
    };

    if (selectedChat.linkId) {
      payload.link_id = selectedChat.linkId;
    }

    const { data, error: insertError } = await supabase
      .from('private_messages')
      .insert(payload)
      .select('*')
      .single();

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((items) => [...items, data as MessageRow]);
    }

    setReply('');
    setSending(false);
  }

  useEffect(() => {
    if (!supabase) return;

    loadMessagesPage();

    const channel = supabase
      .channel('the-square-private-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
        },
        async () => {
          await loadMessagesPage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, requestedLinkId]);

  return (
    <main className="ts-messages-page">
      <header className="ts-topbar">
        <Link href="/" className="ts-brand">
          <img src="/icon-192.png" alt="The Square" />
          <span>
            <b>The Square</b>
            <small>City Wall Network</small>
          </span>
        </Link>

        <nav className="ts-top-actions">
          <Link href="/">Home</Link>
          <Link href="/profile">Profilo</Link>
          <Link href="/calls/new" className="primary">+ Apri una Call</Link>
        </nav>
      </header>

      <section className="ts-hero">
        <div>
          <p className="ts-eyebrow">Chat private sbloccate dai legami</p>
          <h1>Messaggi</h1>
          <p>Qui trovi le conversazioni nate da un legame reciproco. Stessa identità, stesso stile The Square.</p>
        </div>

        <Link href="/profile">Vai al profilo</Link>
      </section>

      {error && <section className="ts-error">{error}</section>}

      <section className="ts-chat-layout">
        <aside className="ts-chat-list">
          <div className="ts-list-head">
            <div>
              <h2>Legami attivi</h2>
              <span>{loading ? 'Caricamento…' : `${previews.length} chat`}</span>
            </div>
            <Link href="/notifications">Notifiche</Link>
          </div>

          <label className="ts-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca tra i tuoi legami..."
            />
          </label>

          <div className="ts-list-items">
            {loading && (
              <div className="ts-empty">
                <b>Carico le chat…</b>
                <span>Sto leggendo legami e messaggi privati.</span>
              </div>
            )}

            {!loading && filteredPreviews.length === 0 && (
              <div className="ts-empty">
                <b>Nessuna chat trovata</b>
                <span>Prova con un altro nome oppure torna nei legami.</span>
              </div>
            )}

            {!loading &&
              filteredPreviews.map((chat) => {
                const active = selectedChat?.otherUserId === chat.otherUserId;

                return (
                  <button
                    type="button"
                    key={chat.linkId || chat.otherUserId}
                    className={active ? 'active' : ''}
                    onClick={() => setSelectedId(chat.linkId || chat.otherUserId)}
                  >
                    <span className="ts-avatar">
                      {chat.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={chat.avatarUrl} alt="" />
                      ) : (
                        initials(chat.name)
                      )}
                    </span>

                    <span className="ts-chat-copy">
                      <b>{chat.name}</b>
                      <small>{chat.city || 'Italia'} · {chat.points || 0} punti</small>
                      <em>{chat.lastBody}</em>
                    </span>

                    <span className="ts-chat-time">
                      {chat.unread > 0 && <strong>{chat.unread}</strong>}
                      <small>{formatTime(chat.lastAt)}</small>
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        <section className="ts-thread">
          {selectedChat ? (
            <>
              <header className="ts-thread-head">
                <span className="ts-avatar large">
                  {selectedChat.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedChat.avatarUrl} alt="" />
                  ) : (
                    initials(selectedChat.name)
                  )}
                </span>

                <div>
                  <h2>{selectedChat.name}</h2>
                  <p>Chat privata sbloccata da legame reciproco</p>
                </div>
              </header>

              <div className="ts-thread-body">
                {selectedMessages.length === 0 && (
                  <div className="ts-empty">
                    <b>Chat pronta</b>
                    <span>Scrivi qui sotto per iniziare la conversazione.</span>
                  </div>
                )}

                {selectedMessages.map((message) => {
                  const mine = message.sender_id === currentUserId;

                  return (
                    <article className={mine ? 'ts-bubble mine' : 'ts-bubble'} key={message.id}>
                      <p>{messageText(message)}</p>
                      <span>{formatTime(message.created_at)}</span>
                    </article>
                  );
                })}
              </div>

              <footer className="ts-reply">
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Scrivi un messaggio..."
                />
                <button type="button" onClick={sendMessage} disabled={sending || !reply.trim()}>
                  {sending ? '...' : '➤'}
                </button>
              </footer>
            </>
          ) : (
            <div className="ts-empty centered">
              <b>Nessuna conversazione</b>
              <span>Quando avrai un legame attivo, la chat apparirà qui.</span>
            </div>
          )}
        </section>
      </section>

      <nav className="ts-mobile-nav">
        <Link href="/">⌂<span>Home</span></Link>
        <Link href="/cities">⌖<span>Città</span></Link>
        <Link href="/#composer" className="publish">+<span>Pubblica</span></Link>
        <Link href="/messages" className="active">💬<span>Chat</span></Link>
        <Link href="/profile">♙<span>Profilo</span></Link>
      </nav>

      <style jsx global>{`
        :root {
          --ts-bg: #fff7ec;
          --ts-ink: #17120d;
          --ts-muted: #7a6c5d;
          --ts-line: rgba(120, 78, 35, .16);
          --ts-yellow: #ffc93d;
          --ts-orange: #ff7a2f;
          --ts-blue: #44bfff;
          --ts-card: rgba(255,255,255,.84);
          --ts-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }

        html,
        body {
          background: #fff7ec !important;
        }

        .ts-messages-page,
        .ts-messages-page * {
          box-sizing: border-box;
        }

        .ts-messages-page {
          min-height: 100vh;
          padding: 18px 18px 110px;
          color: var(--ts-ink);
          font-family: var(--ts-font);
          background:
            radial-gradient(circle at 0% 0%, rgba(255,201,61,.42), transparent 28%),
            radial-gradient(circle at 100% 6%, rgba(68,191,255,.24), transparent 28%),
            radial-gradient(circle at 84% 40%, rgba(255,111,97,.16), transparent 30%),
            linear-gradient(180deg,#fffaf2 0%,#fff3e1 44%,#fff8f0 100%);
          position: relative;
          overflow-x: hidden;
        }

        .ts-messages-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .34;
          background:
            linear-gradient(90deg, rgba(120,78,35,.08) 1px, transparent 1px),
            linear-gradient(0deg, rgba(120,78,35,.08) 1px, transparent 1px);
          background-size: 34px 34px;
        }

        .ts-topbar,
        .ts-hero,
        .ts-chat-layout,
        .ts-error {
          position: relative;
          z-index: 1;
          width: min(1180px, 100%);
          margin-left: auto;
          margin-right: auto;
        }

        .ts-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .ts-brand {
          display: grid;
          grid-template-columns: 54px 1fr;
          align-items: center;
          gap: 12px;
          color: var(--ts-ink);
          text-decoration: none;
        }

        .ts-brand img {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          border: 2px solid rgba(255,167,38,.75);
          box-shadow: 0 0 0 6px rgba(255,201,61,.18), 0 16px 34px rgba(255,122,47,.20);
        }

        .ts-brand b {
          display: block;
          font-size: 28px;
          line-height: .96;
          letter-spacing: -.02em;
          font-weight: 800;
        }

        .ts-brand small {
          display: block;
          margin-top: 4px;
          color: #8a745f;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .ts-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ts-top-actions a,
        .ts-hero > a,
        .ts-list-head a {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          border-radius: 14px;
          padding: 0 14px;
          color: #332319;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ts-line);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .ts-top-actions a.primary,
        .ts-hero > a {
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          border: 0;
        }

        .ts-hero,
        .ts-chat-list,
        .ts-thread,
        .ts-error {
          background:
            radial-gradient(circle at 100% 0%, rgba(68,191,255,.12), transparent 28%),
            radial-gradient(circle at 0% 100%, rgba(255,201,61,.12), transparent 30%),
            var(--ts-card);
          border: 1px solid var(--ts-line);
          box-shadow: 0 14px 34px rgba(120,78,35,.10);
        }

        .ts-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 18px;
        }

        .ts-eyebrow {
          margin: 0 0 10px;
          color: #d97016;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .ts-hero h1 {
          margin: 0;
          color: var(--ts-ink);
          font-size: clamp(36px, 6vw, 68px);
          line-height: .95;
          letter-spacing: -.04em;
          font-weight: 800;
        }

        .ts-hero p {
          max-width: 720px;
          margin: 14px 0 0;
          color: var(--ts-muted);
          font-size: 17px;
          line-height: 1.55;
          font-weight: 500;
        }

        .ts-error {
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 18px;
          color: #9f1239;
          font-weight: 700;
        }

        .ts-chat-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 18px;
          min-height: min(650px, calc(100vh - 260px));
        }

        .ts-chat-list,
        .ts-thread {
          border-radius: 28px;
          overflow: hidden;
        }

        .ts-chat-list {
          display: grid;
          grid-template-rows: auto auto 1fr;
        }

        .ts-list-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 22px;
        }

        .ts-list-head h2,
        .ts-thread-head h2 {
          margin: 0;
          color: var(--ts-ink);
          font-size: 26px;
          line-height: 1;
          letter-spacing: -.02em;
          font-weight: 800;
        }

        .ts-list-head span {
          display: block;
          margin-top: 8px;
          color: var(--ts-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .ts-search {
          height: 48px;
          display: grid;
          grid-template-columns: 24px 1fr;
          align-items: center;
          gap: 8px;
          margin: 0 22px 14px;
          border-radius: 16px;
          background: #fffaf2;
          border: 1px solid rgba(120,78,35,.16);
          padding: 0 14px;
          color: #6e6258;
        }

        .ts-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #201610;
          font: 600 14px var(--ts-font);
        }

        .ts-list-items {
          display: grid;
          align-content: start;
          gap: 10px;
          overflow: auto;
          padding: 0 14px 18px;
        }

        .ts-list-items button {
          width: 100%;
          display: grid;
          grid-template-columns: 56px 1fr auto;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(120,78,35,.16);
          border-radius: 20px;
          padding: 12px;
          background: rgba(255,250,242,.76);
          color: var(--ts-ink);
          text-align: left;
          cursor: pointer;
        }

        .ts-list-items button.active {
          background: linear-gradient(135deg, rgba(255,201,61,.22), rgba(68,191,255,.16)), #fffaf2;
          border-color: rgba(68,191,255,.55);
        }

        .ts-avatar {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 17px;
          background: linear-gradient(135deg,#ffc93d,#ff7a2f 52%,#44bfff);
          color: #201610;
          font-weight: 900;
        }

        .ts-avatar.large {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          font-size: 20px;
        }

        .ts-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ts-chat-copy {
          min-width: 0;
        }

        .ts-chat-copy b {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 16px;
          font-weight: 800;
        }

        .ts-chat-copy small {
          display: block;
          margin-top: 4px;
          color: #11834f;
          font-size: 12px;
          font-weight: 800;
        }

        .ts-chat-copy em {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 5px;
          color: var(--ts-muted);
          font-size: 13px;
          font-style: normal;
          font-weight: 600;
        }

        .ts-chat-time {
          display: grid;
          justify-items: end;
          gap: 5px;
        }

        .ts-chat-time strong {
          min-width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #44bfff;
          color: #09202d;
          font-size: 11px;
          font-weight: 900;
        }

        .ts-chat-time small {
          color: var(--ts-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .ts-thread {
          display: grid;
          grid-template-rows: auto 1fr auto;
          min-width: 0;
        }

        .ts-thread-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px;
          background: linear-gradient(135deg, rgba(255,201,61,.20), rgba(68,191,255,.16));
          border-bottom: 1px solid var(--ts-line);
        }

        .ts-thread-head p {
          margin: 6px 0 0;
          color: #147db2;
          font-weight: 800;
        }

        .ts-thread-body {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: auto;
          padding: 22px;
        }

        .ts-bubble {
          max-width: min(70%, 520px);
          align-self: flex-start;
          border-radius: 20px 20px 20px 6px;
          padding: 12px 14px;
          background: #fff4e6;
          border: 1px solid rgba(120,78,35,.12);
          color: #201610;
        }

        .ts-bubble.mine {
          align-self: flex-end;
          border-radius: 20px 20px 6px 20px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
        }

        .ts-bubble p {
          margin: 0;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 600;
        }

        .ts-bubble span {
          display: block;
          margin-top: 8px;
          color: rgba(32,22,16,.70);
          font-size: 11px;
          font-weight: 800;
        }

        .ts-reply {
          display: grid;
          grid-template-columns: 1fr 52px;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid var(--ts-line);
          background: rgba(255,250,242,.70);
        }

        .ts-reply input {
          width: 100%;
          border: 1px solid rgba(120,78,35,.16);
          outline: 0;
          border-radius: 16px;
          background: #fffaf2;
          color: #201610;
          padding: 0 14px;
          font: 700 15px var(--ts-font);
        }

        .ts-reply button {
          border: 0;
          border-radius: 16px;
          background: linear-gradient(135deg,#ffc93d,#ff9f35 52%,#ff7a2f);
          color: #201610;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
        }

        .ts-reply button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .ts-empty {
          display: grid;
          gap: 6px;
          border-radius: 20px;
          padding: 18px;
          background: rgba(255,250,242,.78);
          border: 1px solid var(--ts-line);
        }

        .ts-empty.centered {
          align-self: center;
          justify-self: center;
          max-width: 360px;
          text-align: center;
        }

        .ts-empty b {
          font-size: 18px;
          font-weight: 800;
        }

        .ts-empty span {
          color: var(--ts-muted);
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
        }

        .ts-mobile-nav {
          display: none;
        }

        @media (max-width: 820px) {
          .ts-messages-page {
            padding-left: 0;
            padding-right: 0;
          }

          .ts-topbar,
          .ts-hero,
          .ts-chat-layout,
          .ts-error {
            width: 100%;
          }

          .ts-topbar {
            padding: 0 12px;
          }

          .ts-top-actions {
            display: none;
          }

          .ts-hero {
            align-items: flex-start;
            flex-direction: column;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
            padding: 20px 12px;
          }

          .ts-hero h1 {
            font-size: 42px;
          }

          .ts-chat-layout {
            grid-template-columns: 1fr;
            gap: 12px;
            min-height: auto;
          }

          .ts-chat-list,
          .ts-thread {
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }

          .ts-thread-body {
            min-height: 430px;
            padding: 14px 12px;
          }

          .ts-bubble {
            max-width: 84%;
          }

          .ts-list-head {
            padding: 18px 12px;
          }

          .ts-search {
            margin-left: 12px;
            margin-right: 12px;
          }

          .ts-list-items {
            display: flex;
            overflow-x: auto;
            padding: 0 12px 16px;
          }

          .ts-list-items button {
            min-width: 280px;
          }

          .ts-thread-head {
            padding: 18px 12px;
          }

          .ts-reply {
            padding: 12px;
          }

          .ts-mobile-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: max(0px, env(safe-area-inset-bottom));
            z-index: 80;
            height: 78px;
            display: grid;
            grid-template-columns: repeat(5,1fr);
            align-items: center;
            padding: 8px 8px max(8px, env(safe-area-inset-bottom));
            border-top: 1px solid rgba(120,78,35,.14);
            border-radius: 22px 22px 0 0;
            background: rgba(255,255,255,.92);
            box-shadow: 0 -14px 36px rgba(120,78,35,.14);
          }

          .ts-mobile-nav a {
            display: grid;
            place-items: center;
            gap: 5px;
            color: #6d5e50;
            text-decoration: none;
            font-size: 22px;
            font-weight: 700;
          }

          .ts-mobile-nav span {
            font-size: 12px;
            font-weight: 600;
          }

          .ts-mobile-nav .active {
            color: #d97016;
          }

          .ts-mobile-nav .publish {
            width: 62px;
            height: 62px;
            margin: -24px auto 0;
            border-radius: 50%;
            color: #201610;
            background: linear-gradient(135deg,#ffc93d,#ff9f35 48%,#ff7a2f);
            box-shadow: 0 0 0 8px rgba(255,201,61,.18), 0 18px 38px rgba(255,122,47,.24);
            font-size: 34px;
          }

          .ts-mobile-nav .publish span {
            position: absolute;
            margin-top: 78px;
            color: #5d4d3f;
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  );
}
