'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type FeedKind = 'text' | 'photo' | 'audio' | 'video' | 'news';

type FeedPost = {
  id: string;
  author: string;
  initials: string;
  city: string;
  citySlug: string;
  topic: string;
  topicSlug: string;
  time: string;
  wall: string;
  kind: FeedKind;
  title: string;
  text: string;
  likes: number;
  comments: number;
  audioReplies: number;
  rooms: number;
  accent?: 'yellow' | 'cyan' | 'pink' | 'green' | 'blue';
};

type PrivateMessageRow = {
  id: string;
  link_id: string | null;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type ChatProfile = {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  city?: string | null;
  nova_points?: number | null;
};

type UserLinkRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string | null;
  updated_at?: string | null;
};

type ChatPreview = {
  otherUserId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  linkId: string | null;
  body: string;
  time: string;
  unread: number;
  accent: 'yellow' | 'cyan' | 'pink' | 'green' | 'blue';
};

const cityTabs = [
  { label: 'Per te', slug: 'for-you', icon: '✨' },
  { label: 'Roma', slug: 'roma', icon: '📍' },
  { label: 'Milano', slug: 'milano', icon: '🏙️' },
  { label: 'Napoli', slug: 'napoli', icon: '🌊' },
  { label: 'Vicino a me', slug: 'nearby', icon: '🧭' },
  { label: 'Seguiti', slug: 'following', icon: '👥' },
];

const topics = [
  { label: 'Tutto', slug: 'all' },
  { label: 'Eventi', slug: 'eventi', icon: '🎟️' },
  { label: 'News', slug: 'news', icon: '📰' },
  { label: 'Mobilità', slug: 'mobilita', icon: '🚇' },
  { label: 'Food', slug: 'food', icon: '🍝' },
  { label: 'Lavoro', slug: 'lavoro', icon: '💼' },
  { label: 'Audio', slug: 'audio', icon: '🎙️' },
  { label: 'Video', slug: 'video', icon: '🎬' },
  { label: 'Socialità', slug: 'socialita', icon: '🤝' },
];

const feedPosts: FeedPost[] = [
  {
    id: 'roma-mobilita-1',
    author: 'Andrea Perroni',
    initials: 'A',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Mobilità',
    topicSlug: 'mobilita',
    time: '12 minuti fa',
    wall: 'Wall Roma',
    kind: 'photo',
    title: 'La nuova viabilità a Prati funziona davvero o sta solo spostando il traffico?',
    text: 'Mi piacerebbe sentire chi vive lì tutti i giorni. Io ho visto più caos nelle vie laterali, ma magari è solo questione di abitudine.',
    likes: 128,
    comments: 42,
    audioReplies: 9,
    rooms: 3,
    accent: 'yellow',
  },
  {
    id: 'roma-eventi-audio-1',
    author: 'Giulia Romano',
    initials: 'G',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Eventi',
    topicSlug: 'audio',
    time: '35 minuti fa',
    wall: 'Voice Wall',
    kind: 'audio',
    title: 'Andare agli eventi da soli è ancora un tabù?',
    text: 'Ho lasciato un audio perché secondo me il vero problema non è trovare eventi, ma andarci senza sentirsi fuori posto.',
    likes: 84,
    comments: 18,
    audioReplies: 21,
    rooms: 1,
    accent: 'cyan',
  },
  {
    id: 'milano-food-1',
    author: 'Marco B.',
    initials: 'M',
    city: 'Milano',
    citySlug: 'milano',
    topic: 'Food',
    topicSlug: 'food',
    time: '1 ora fa',
    wall: 'Wall Milano',
    kind: 'text',
    title: 'Il miglior posto per cena economica ma bella in zona Isola?',
    text: 'Budget 25/30 euro, atmosfera tranquilla, magari con tavoli esterni. Vale anche qualcosa di poco conosciuto.',
    likes: 51,
    comments: 33,
    audioReplies: 4,
    rooms: 0,
    accent: 'pink',
  },
  {
    id: 'napoli-news-video-1',
    author: 'Square News',
    initials: 'S',
    city: 'Napoli',
    citySlug: 'napoli',
    topic: 'News',
    topicSlug: 'video',
    time: '1 ora fa',
    wall: 'News locale',
    kind: 'video',
    title: 'Nuovo evento musicale sul lungomare: il Wall sta già organizzando gruppi',
    text: 'Da questa notizia sono nate due stanze: una per chi cerca compagnia e una per chi vuole arrivare prima e organizzarsi.',
    likes: 211,
    comments: 76,
    audioReplies: 15,
    rooms: 2,
    accent: 'green',
  },
  {
    id: 'roma-lavoro-1',
    author: 'Sara N.',
    initials: 'S',
    city: 'Roma',
    citySlug: 'roma',
    topic: 'Lavoro',
    topicSlug: 'lavoro',
    time: '2 ore fa',
    wall: 'Wall Roma',
    kind: 'text',
    title: 'Cerco un coworking non freddo e non troppo “startup finta” a Roma Est',
    text: 'Mi serve un posto umano, dove lavorare ma anche conoscere qualcuno. Avete esperienze dirette?',
    likes: 67,
    comments: 29,
    audioReplies: 6,
    rooms: 1,
    accent: 'blue',
  },
  {
    id: 'milano-socialita-audio-1',
    author: 'Luca V.',
    initials: 'L',
    city: 'Milano',
    citySlug: 'milano',
    topic: 'Socialità',
    topicSlug: 'audio',
    time: '3 ore fa',
    wall: 'Voice Wall',
    kind: 'audio',
    title: 'A Milano è facile conoscere persone o siamo tutti troppo di corsa?',
    text: 'Una riflessione vocale sul fatto che la città offre tantissimo, ma spesso manca il contesto giusto per iniziare una conversazione.',
    likes: 142,
    comments: 58,
    audioReplies: 24,
    rooms: 4,
    accent: 'cyan',
  },
];

const followedCities = [
  ['RM', 'Roma', '128 post oggi · 43 audio'],
  ['MI', 'Milano', '96 post oggi · 21 video'],
  ['NA', 'Napoli', '88 post oggi · 18 eventi'],
];

const fallbackChats: ChatPreview[] = [
  {
    otherUserId: 'demo-giulia',
    name: 'Giulia Romano',
    initials: 'G',
    avatarUrl: null,
    linkId: null,
    body: 'Ti ho mandato l’audio dell’evento di venerdì.',
    time: 'demo',
    unread: 0,
    accent: 'cyan',
  },
  {
    otherUserId: 'demo-marco',
    name: 'Marco B.',
    initials: 'M',
    avatarUrl: null,
    linkId: null,
    body: 'Ho creato una stanza su Isola, entra quando vuoi.',
    time: 'demo',
    unread: 0,
    accent: 'pink',
  },
  {
    otherUserId: 'demo-sara',
    name: 'Sara N.',
    initials: 'S',
    avatarUrl: null,
    linkId: null,
    body: 'Mi consigli quel coworking zona Roma Est?',
    time: 'demo',
    unread: 0,
    accent: 'green',
  },
];

function getInitials(name: string) {
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

function timeLabel(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));

  if (Number.isNaN(date.getTime())) return '';
  if (minutes < 1) return 'ora';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} g`;
}

export function NovaHome() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [activeCity, setActiveCity] = useState('for-you');
  const [activeTopic, setActiveTopic] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<PrivateMessageRow[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const visiblePosts = useMemo(() => {
    return feedPosts.filter((post) => {
      const cityMatch = activeCity === 'for-you' || activeCity === 'nearby' || activeCity === 'following' || post.citySlug === activeCity;
      const topicMatch =
        activeTopic === 'all' ||
        post.topicSlug === activeTopic ||
        (activeTopic === 'eventi' && post.topicSlug === 'audio' && post.topic === 'Eventi') ||
        (activeTopic === 'news' && (post.kind === 'news' || post.topic === 'News')) ||
        (activeTopic === 'audio' && post.kind === 'audio') ||
        (activeTopic === 'video' && post.kind === 'video');

      return cityMatch && topicMatch;
    });
  }, [activeCity, activeTopic]);

  const selectedChat = useMemo(() => {
    return chatPreviews.find((chat) => chat.otherUserId === selectedChatId) || chatPreviews[0] || fallbackChats[0];
  }, [chatPreviews, selectedChatId]);

  async function loadUnreadCounts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      setChatPreviews([]);
      return;
    }

    const [messagesResult, notificationsResult] = await Promise.all([
      supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    ]);

    setUnreadMessagesCount(messagesResult.count || 0);
    setUnreadNotificationsCount(notificationsResult.count || 0);
  }

  async function loadChatPreviews() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChatPreviews([]);
      return;
    }

    const [{ data: messageRows }, { data: linkRows }] = await Promise.all([
      supabase
        .from('private_messages')
        .select('id, link_id, sender_id, receiver_id, body, read_at, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('user_links')
        .select('id, requester_id, receiver_id, status, created_at, updated_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false }),
    ]);

    const messages = (messageRows || []) as PrivateMessageRow[];
    const links = (linkRows || []) as UserLinkRow[];

    const messageOtherIds = messages.map((message) =>
      message.sender_id === user.id ? message.receiver_id : message.sender_id
    );

    const linkOtherIds = links.map((link) =>
      link.requester_id === user.id ? link.receiver_id : link.requester_id
    );

    const otherIds = Array.from(new Set([...messageOtherIds, ...linkOtherIds]));

    let profiles: ChatProfile[] = [];

    if (otherIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, city, nova_points')
        .in('id', otherIds);

      profiles = (profileRows || []) as ChatProfile[];
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const linkMap = new Map<string, UserLinkRow>();

    for (const link of links) {
      const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;
      linkMap.set(otherUserId, link);
    }

    const grouped = new Map<string, ChatPreview>();
    const unreadMap = new Map<string, number>();

    for (const message of messages) {
      const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;

      if (message.receiver_id === user.id && !message.read_at) {
        unreadMap.set(otherUserId, (unreadMap.get(otherUserId) || 0) + 1);
      }

      if (!grouped.has(otherUserId)) {
        const profile = profileMap.get(otherUserId);
        const link = linkMap.get(otherUserId);
        const name = profile?.full_name || profile?.username || 'Utente The Square';

        grouped.set(otherUserId, {
          otherUserId,
          name,
          initials: getInitials(name),
          avatarUrl: profile?.avatar_url || null,
          linkId: message.link_id || link?.id || null,
          body: message.body || 'Messaggio',
          time: timeLabel(message.created_at),
          unread: 0,
          accent: ['cyan', 'pink', 'green', 'blue', 'yellow'][grouped.size % 5] as ChatPreview['accent'],
        });
      }
    }

    for (const link of links) {
      const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;

      if (!grouped.has(otherUserId)) {
        const profile = profileMap.get(otherUserId);
        const name = profile?.full_name || profile?.username || 'Utente The Square';
        const city = profile?.city || 'Italia';
        const points = typeof profile?.nova_points === 'number' ? ` · ${profile.nova_points} punti` : '';

        grouped.set(otherUserId, {
          otherUserId,
          name,
          initials: getInitials(name),
          avatarUrl: profile?.avatar_url || null,
          linkId: link.id,
          body: `${city}${points} · Legame attivo`,
          time: link.updated_at ? timeLabel(link.updated_at) : '',
          unread: 0,
          accent: ['cyan', 'pink', 'green', 'blue', 'yellow'][grouped.size % 5] as ChatPreview['accent'],
        });
      }
    }

    const previews = Array.from(grouped.values()).map((preview) => ({
      ...preview,
      unread: unreadMap.get(preview.otherUserId) || 0,
    }));

    setChatPreviews(previews);
    setSelectedChatId((current) => current || previews[0]?.otherUserId || null);
  }

  async function loadActiveThread(otherUserId?: string | null) {
    const selectedOtherUserId = otherUserId || selectedChatId || chatPreviews[0]?.otherUserId;

    if (!selectedOtherUserId || selectedOtherUserId.startsWith('demo-')) {
      setActiveMessages([]);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActiveMessages([]);
      return;
    }

    const { data } = await supabase
      .from('private_messages')
      .select('id, link_id, sender_id, receiver_id, body, read_at, created_at')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedOtherUserId}),and(sender_id.eq.${selectedOtherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })
      .limit(80);

    setActiveMessages((data || []) as PrivateMessageRow[]);
  }

  async function markSelectedChatAsRead(otherUserId?: string | null) {
    const selectedOtherUserId = otherUserId || selectedChatId || chatPreviews[0]?.otherUserId;

    if (!selectedOtherUserId || selectedOtherUserId.startsWith('demo-')) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('private_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', selectedOtherUserId)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    await loadUnreadCounts();
    await loadChatPreviews();
  }

  async function openChatThread(otherUserId: string) {
    setSelectedChatId(otherUserId);
    setChatOpen(true);
    await loadActiveThread(otherUserId);
    await markSelectedChatAsRead(otherUserId);
  }

  async function sendPrivateReply() {
    const content = replyBody.trim();
    const receiverId = selectedChat?.otherUserId;

    if (!content || !receiverId || receiverId.startsWith('demo-') || sendingMessage) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSendingMessage(true);

    try {
      await supabase.from('private_messages').insert({
        link_id: selectedChat?.linkId || null,
        sender_id: user.id,
        receiver_id: receiverId,
        body: content,
      });

      setReplyBody('');
      await loadActiveThread(receiverId);
      await loadChatPreviews();
    } finally {
      setSendingMessage(false);
    }
  }


  useEffect(() => {
    let mounted = true;

    async function start() {
      if (!mounted) return;
      await loadUnreadCounts();
      await loadChatPreviews();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel(`home-badges-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            await loadUnreadCounts();
            await loadChatPreviews();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'private_messages',
            filter: `sender_id=eq.${user.id}`,
          },
          async () => {
            await loadChatPreviews();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await loadUnreadCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanupPromise = start();

    return () => {
      mounted = false;
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);


  useEffect(() => {
    if (!chatOpen) return;
    loadActiveThread(selectedChatId || chatPreviews[0]?.otherUserId);
    markSelectedChatAsRead(selectedChatId || chatPreviews[0]?.otherUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, selectedChatId]);

  const chatsToShow = chatPreviews.length ? chatPreviews : fallbackChats;

  return (
    <div className="feed-shell">
      <div className="app">
        <aside className="rail">
          <Link href="/" className="brand">
            <img src="/icon-192.png" alt="The Square" className="brand-icon" />
            <div>
              <b>The Square</b>
              <span>City Wall Network</span>
            </div>
          </Link>

          <nav className="side-nav">
            <Link href="/" className="active"><span>⌂</span><b>Home</b></Link>
            <Link href="/cities"><span>📍</span><b>Città</b></Link>
            <Link href="#feed"><span>🧱</span><b>Wall</b></Link>
            <Link href="#audio"><span>🎙️</span><b>Audio</b></Link>
            <button type="button" onClick={() => openChatThread(selectedChat?.otherUserId || chatsToShow[0]?.otherUserId)}><span>💬</span><b>Chat</b></button>
            <Link href="/notifications"><span>🔔</span><b>Notifiche</b></Link>
            <Link href="/profile"><span>👤</span><b>Profilo</b></Link>
          </nav>

          <Link href="#composer" className="side-post">＋ Pubblica</Link>

          <section className="now-box">
            <h3>Live ora</h3>
            <div className="trend-line"><span>Roma</span><small>128 post</small></div>
            <div className="trend-line"><span>Eventi</span><small>43 audio</small></div>
            <div className="trend-line"><span>Mobilità</span><small>hot</small></div>
            <div className="trend-line"><span>Chat attive</span><small>{unreadMessagesCount} nuove</small></div>
          </section>
        </aside>

        <main className="center">
          <header className="topbar">
            <div className="search-row">
              <div className="search">⌕ Cerca città, wall, creator, eventi locali...</div>

              <button
                type="button"
                className={`icon-btn ${chatOpen ? 'active' : ''}`}
                onClick={() => setChatOpen(true)}
                aria-label="Apri chat"
              >
                💬
                {unreadMessagesCount > 0 && <span className="badge">{unreadMessagesCount}</span>}
              </button>

              <Link className="icon-btn" href="/notifications" aria-label="Notifiche">
                🔔
                {unreadNotificationsCount > 0 && <span className="badge">{unreadNotificationsCount}</span>}
              </Link>

              <Link className="icon-btn profile-button" href="/profile" aria-label="Profilo">
                <ProfileOrb className="h-full w-full" />
              </Link>
            </div>

            <nav className="wall-tabs" aria-label="Filtro città">
              {cityTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.slug}
                  className={`wall-tab ${activeCity === tab.slug ? 'active' : ''}`}
                  onClick={() => setActiveCity(tab.slug)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
              <Link className="wall-tab" href="/cities">＋ Cambia città</Link>
            </nav>

            <nav className="topic-tabs" aria-label="Filtro argomenti">
              {topics.map((topic) => (
                <button
                  type="button"
                  key={topic.slug}
                  className={`topic ${activeTopic === topic.slug ? 'active' : ''}`}
                  onClick={() => setActiveTopic(topic.slug)}
                >
                  {topic.icon ? `${topic.icon} ` : ''}{topic.label}
                </button>
              ))}
            </nav>
          </header>

          <section className="composer" id="composer">
            <div className="composer-top">
              <div className="avatar">A</div>
              <button type="button" className="composer-placeholder">Cosa vuoi dire al Wall di Roma?</button>
            </div>
            <div className="composer-actions">
              <button type="button">🖼️ Foto</button>
              <button type="button">🎙️ Audio</button>
              <button type="button">🎬 Video</button>
              <button type="button">🧩 Stanza 24h</button>
            </div>
          </section>

          <section className="feed" id="feed">
            {visiblePosts.length ? (
              visiblePosts.map((post) => <FeedPostCard key={post.id} post={post} />)
            ) : (
              <section className="empty-feed">
                <h2>Nessun post con questi filtri</h2>
                <p>Cambia città o argomento, oppure pubblica tu il primo contenuto su questo Wall.</p>
              </section>
            )}
          </section>
        </main>

        <aside className="right">
          <section className="right-panel">
            <h3>Chat personali</h3>
            {chatsToShow.slice(0, 3).map((chat) => (
              <div className="city-card" key={chat.otherUserId}>
                <AvatarBox chat={chat} />
                <div><b>{chat.name}</b><span>{chat.body}</span></div>
                <button type="button" className="follow" onClick={() => openChatThread(chat.otherUserId)}>
                  Apri
                </button>
              </div>
            ))}
          </section>

          <section className="right-panel">
            <h3>Wall che segui</h3>
            {followedCities.map(([code, city, meta]) => (
              <div className="city-card" key={city}>
                <div className="city-avatar">{code}</div>
                <div><b>{city}</b><span>{meta}</span></div>
                <button type="button" className="follow">Segui</button>
              </div>
            ))}
          </section>

          <section className="right-panel">
            <h3>Argomenti caldi</h3>
            <div className="topic-grid">
              <span>🚇 Mobilità</span>
              <span>🎟️ Eventi</span>
              <span>🍝 Food</span>
              <span>💼 Lavoro</span>
              <span>🏠 Casa</span>
              <span>🤝 Socialità</span>
              <span>🎙️ Audio</span>
              <span>📰 News</span>
            </div>
          </section>
        </aside>
      </div>

      <div className={`chat-backdrop ${chatOpen ? 'open' : ''}`} onClick={() => setChatOpen(false)} />

      <aside className={`chat-drawer ${chatOpen ? 'open' : ''}`} aria-label="Chat personali">
        <header className="chat-head">
          <div>
            <h2>Chat personali</h2>
            <p>Qui trovi tutti i legami attivi; i messaggi compaiono appena la conversazione inizia.</p>
          </div>
          <button type="button" className="close-chat" onClick={() => setChatOpen(false)} aria-label="Chiudi chat">×</button>
        </header>

        <div className="chat-search">
          <input placeholder="Cerca una conversazione..." />
        </div>

        <div className="chat-list">
          {chatsToShow.map((chat) => (
            <button
              type="button"
              className={`chat-item ${selectedChat?.otherUserId === chat.otherUserId ? 'active' : ''}`}
              key={chat.otherUserId}
              onClick={() => openChatThread(chat.otherUserId)}
            >
              <AvatarBox chat={chat} large />
              <div className="chat-copy">
                <b>{chat.name}</b>
                <span>{chat.body}</span>
              </div>
              <div className="chat-meta">
                {chat.time}
                {chat.unread > 0 && <div className="unread">{chat.unread}</div>}
              </div>
            </button>
          ))}
        </div>

        <section className="mini-thread">
          <div className="mini-thread-title">
            <span>Conversazione · {selectedChat?.name || 'Chat'}</span>
            <span>{activeMessages.length || selectedChat?.body ? 'Chat integrata' : 'Nessun messaggio'}</span>
          </div>

          <div className="thread-messages">
            {activeMessages.length > 0 ? (
              activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bubble ${message.sender_id === selectedChat?.otherUserId ? '' : 'me'}`}
                >
                  {message.body || 'Messaggio'}
                </div>
              ))
            ) : (
              <>
                <div className="bubble">{selectedChat?.body || 'Nessun messaggio recente.'}</div>
                <div className="bubble me">Questa chat è pronta: scrivi qui sotto per iniziare la conversazione.</div>
              </>
            )}
          </div>

          <div className="reply-row">
            <input
              placeholder={
                selectedChat?.otherUserId?.startsWith('demo-')
                  ? 'Chat demo: crea una conversazione reale per rispondere'
                  : 'Scrivi un messaggio...'
              }
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendPrivateReply();
                }
              }}
              disabled={selectedChat?.otherUserId?.startsWith('demo-') || sendingMessage}
            />
            <button
              type="button"
              onClick={sendPrivateReply}
              disabled={selectedChat?.otherUserId?.startsWith('demo-') || sendingMessage || !replyBody.trim()}
            >
              ➤
            </button>
          </div>
        </section>
      </aside>

      <nav className="mobile-nav">
        <Link href="/" className="active">⌂</Link>
        <Link href="/cities">📍</Link>
        <Link href="#composer">＋</Link>
        <button type="button" onClick={() => openChatThread(selectedChat?.otherUserId || chatsToShow[0]?.otherUserId)}>
          💬
          {unreadMessagesCount > 0 && <span className="mobile-badge">{unreadMessagesCount}</span>}
        </button>
        <Link href="/profile">👤</Link>
      </nav>

      <style jsx global>{styles}</style>
    </div>
  );
}

function AvatarBox({ chat, large }: { chat: ChatPreview; large?: boolean }) {
  return (
    <div className={`chat-avatar ${large ? 'large' : ''} ${chat.accent}`}>
      {chat.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={chat.avatarUrl} alt="" />
      ) : (
        chat.initials
      )}
    </div>
  );
}

function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <article className="post">
      <div className="post-head">
        <div className={`post-avatar avatar-${post.accent || 'yellow'}`}>{post.initials}</div>
        <div className="post-meta">
          <b>{post.author}</b>
          <span>{post.city} · {post.topic} · {post.time}</span>
        </div>
        <div className="wall-pill">{post.wall}</div>
      </div>

      <div className="post-body">
        <h2>{post.title}</h2>
        <p>{post.text}</p>
        {post.kind === 'photo' && <PhotoMedia />}
        {post.kind === 'audio' && <AudioMedia />}
        {post.kind === 'video' && <VideoMedia />}
      </div>

      <div className="post-actions">
        <button type="button">❤️ {post.likes}</button>
        <button type="button">💬 {post.comments}</button>
        <button type="button">🎙️ {post.audioReplies}</button>
        <button type="button">↗</button>
        <button type="button" className="primary">🧩 Stanza</button>
      </div>

      <div className="post-comments">
        {post.rooms > 0
          ? `Vedi ${post.comments} commenti · ${post.audioReplies} risposte audio · ${post.rooms} stanze nate da questo post`
          : `Vedi ${post.comments} commenti · ${post.audioReplies} risposte audio · Segui ${post.city} + ${post.topic}`}
      </div>
    </article>
  );
}

function PhotoMedia() {
  return (
    <div className="media photo-media">
      <div className="photo-shape" />
      <div className="media-label">Foto · caricata sul Wall locale</div>
    </div>
  );
}

function AudioMedia() {
  return (
    <div className="media audio-media" id="audio">
      <div className="audio-play">▶</div>
      <div className="wave">
        {Array.from({ length: 14 }).map((_, index) => <i key={index} />)}
      </div>
      <span className="duration">0:42</span>
    </div>
  );
}

function VideoMedia() {
  return (
    <div className="media video-media" id="video">
      <div className="play-big">▶</div>
    </div>
  );
}

const styles = `
:root {
  --bg: #080a0f;
  --panel: #101620;
  --panel-2: #151d2a;
  --ink: #f8fafc;
  --muted: #8c98aa;
  --line: rgba(255,255,255,.11);
  --line-2: rgba(255,255,255,.18);
  --yellow: #ffd21f;
  --orange: #ff9d2e;
  --cyan: #24e0d2;
  --blue: #2f8dff;
  --pink: #ff3d6e;
  --green: #a6ff4d;
  --font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --title: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
}

.feed-shell,
.feed-shell * {
  box-sizing: border-box;
}

.feed-shell {
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font);
  background:
    radial-gradient(circle at 10% 0%, rgba(255,210,31,.18), transparent 30%),
    radial-gradient(circle at 92% 7%, rgba(36,224,210,.15), transparent 32%),
    radial-gradient(circle at 70% 100%, rgba(255,61,110,.10), transparent 30%),
    linear-gradient(180deg, #0b1018 0%, #080a0f 100%);
  overflow-x: hidden;
}

.feed-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(to bottom, black, transparent 90%);
}

.feed-shell a {
  color: inherit;
  text-decoration: none;
}

.app {
  position: relative;
  z-index: 1;
  width: min(1540px, calc(100% - 28px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 238px minmax(0, 720px) 360px;
  gap: 22px;
  padding: 18px 0 40px;
}

.rail,
.right {
  position: sticky;
  top: 18px;
  height: calc(100vh - 36px);
  overflow: hidden;
}

.brand {
  height: 74px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line-2);
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.brand-icon {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(255,210,31,.35);
  box-shadow: 0 0 0 4px rgba(255,210,31,.08), 0 18px 38px rgba(255,157,46,.18);
}

.brand b {
  display: block;
  font-family: var(--title);
  font-size: 28px;
  line-height: .9;
  letter-spacing: -.075em;
}

.brand span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.side-nav {
  margin-top: 14px;
  padding: 10px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.78);
  box-shadow: 0 22px 60px rgba(0,0,0,.28);
}

.side-nav a,
.side-nav button {
  width: 100%;
  min-height: 48px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 11px;
  align-items: center;
  border: 1px solid transparent;
  padding: 0 10px;
  color: #cbd5e1;
  background: transparent;
  font-size: 13px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}

.side-nav a span,
.side-nav button span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 7px;
}

.side-nav a.active,
.side-nav a:hover,
.side-nav button:hover {
  color: var(--yellow);
  background: rgba(255,210,31,.10);
  border-color: rgba(255,210,31,.22);
}

.side-post {
  margin-top: 14px;
  min-height: 76px;
  display: grid;
  place-items: center;
  padding: 0 18px;
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-size: 14px;
  font-weight: 1000;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
  box-shadow: 0 18px 38px rgba(255,157,46,.18);
}

.now-box,
.right-panel {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.72);
  box-shadow: 0 22px 60px rgba(0,0,0,.28);
}

.now-box h3,
.right-panel h3 {
  margin: 0 0 12px;
  font-family: var(--title);
  font-size: 20px;
  letter-spacing: -.045em;
}

.now-box h3 {
  font-size: 18px;
}

.trend-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid rgba(255,255,255,.08);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 800;
}

.trend-line:first-of-type {
  border-top: 0;
}

.trend-line small {
  color: var(--muted);
  font-weight: 900;
}

.center {
  min-width: 0;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  margin: -18px 0 0;
  padding: 18px 0 12px;
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(8,10,15,.96), rgba(8,10,15,.76), transparent);
}

.search-row {
  min-height: 58px;
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px;
  align-items: center;
}

.search {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  color: var(--muted);
  border: 1px solid var(--line);
  background: rgba(16,22,32,.80);
  font-size: 13px;
  font-weight: 800;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
}

.icon-btn {
  position: relative;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.80);
  color: var(--ink);
  font-size: 20px;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.icon-btn.active {
  border-color: rgba(255,210,31,.42);
  background: rgba(255,210,31,.12);
}

.badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: var(--pink);
  color: white;
  border: 1px solid rgba(255,255,255,.28);
  font-size: 10px;
  font-weight: 1000;
}

.wall-tabs,
.topic-tabs {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.wall-tabs {
  margin-top: 12px;
}

.topic-tabs {
  margin-top: 9px;
  gap: 8px;
}

.wall-tabs::-webkit-scrollbar,
.topic-tabs::-webkit-scrollbar {
  display: none;
}

.wall-tab,
.topic {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.78);
  color: #cbd5e1;
  cursor: pointer;
  font-family: inherit;
}

.wall-tab {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
}

.wall-tab.active {
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  border-color: rgba(255,210,31,.38);
}

.topic {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 900;
}

.topic.active {
  color: var(--cyan);
  border-color: rgba(36,224,210,.28);
  background: rgba(36,224,210,.10);
}

.composer {
  margin: 12px 0 16px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background:
    linear-gradient(90deg, rgba(255,210,31,.10), transparent 48%),
    rgba(16,22,32,.86);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
}

.composer-top {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.16);
  background: linear-gradient(135deg, var(--yellow), var(--pink) 52%, var(--blue));
  color: #07110f;
  font-weight: 1000;
}

.composer-placeholder {
  min-height: 42px;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 13px;
  color: #68768a;
  background: rgba(8,10,15,.68);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 7px;
  font-size: 14px;
  font-weight: 800;
  text-align: left;
  font-family: inherit;
}

.composer-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.composer-actions button {
  height: 38px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.64);
  color: #cbd5e1;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
}

.feed {
  display: grid;
  gap: 18px;
}

.empty-feed,
.post {
  overflow: hidden;
  border: 1px solid var(--line-2);
  background:
    linear-gradient(135deg, rgba(255,255,255,.06), transparent 28%),
    rgba(16,22,32,.86);
  box-shadow: 0 22px 62px rgba(0,0,0,.30);
}

.empty-feed {
  padding: 28px;
}

.empty-feed h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 28px;
  letter-spacing: -.05em;
}

.empty-feed p {
  color: var(--muted);
  font-weight: 800;
}

.post-head {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
}

.post-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-weight: 1000;
}

.avatar-cyan,
.chat-avatar.cyan {
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  color: white;
}

.avatar-pink,
.chat-avatar.pink {
  background: linear-gradient(135deg, var(--pink), var(--orange));
  color: white;
}

.avatar-green,
.chat-avatar.green {
  background: linear-gradient(135deg, var(--green), var(--cyan));
  color: #06110f;
}

.avatar-blue,
.chat-avatar.blue {
  background: linear-gradient(135deg, var(--blue), #7c3aed);
  color: white;
}

.post-meta b {
  display: block;
  font-family: var(--title);
  font-size: 16px;
  line-height: 1;
  letter-spacing: -.03em;
}

.post-meta span {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.wall-pill {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: var(--cyan);
  background: rgba(36,224,210,.10);
  border: 1px solid rgba(36,224,210,.24);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 1000;
  text-transform: uppercase;
  letter-spacing: .06em;
  white-space: nowrap;
}

.post-body {
  padding: 0 14px 14px;
}

.post-body h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 26px;
  line-height: 1.02;
  letter-spacing: -.055em;
}

.post-body p {
  margin: 10px 0 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 670;
}

.media {
  margin-top: 14px;
  min-height: 430px;
  position: relative;
  overflow: hidden;
  background: #0b1119;
  border-top: 1px solid rgba(255,255,255,.10);
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.photo-media {
  display: grid;
  place-items: end start;
  padding: 18px;
  background:
    linear-gradient(0deg, rgba(0,0,0,.62), transparent 55%),
    radial-gradient(circle at 26% 24%, rgba(255,210,31,.62), transparent 18%),
    radial-gradient(circle at 70% 34%, rgba(36,224,210,.34), transparent 24%),
    linear-gradient(135deg, #243044, #0e1622 58%, #111827);
}

.photo-shape {
  position: absolute;
  inset: 42px 54px 70px 54px;
  background:
    linear-gradient(135deg, rgba(255,255,255,.16), transparent 28%),
    linear-gradient(135deg, rgba(255,210,31,.72), rgba(255,157,46,.45) 42%, rgba(36,224,210,.34));
  clip-path: polygon(0 18%, 75% 0, 100% 28%, 82% 100%, 14% 88%);
  opacity: .72;
}

.video-media {
  display: grid;
  place-items: center;
  min-height: 520px;
  background:
    radial-gradient(circle at center, rgba(255,61,110,.36), transparent 28%),
    linear-gradient(160deg, #1c2433, #0a1018 66%);
}

.play-big {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  border-radius: 50%;
  font-size: 34px;
  box-shadow: 0 0 0 18px rgba(255,210,31,.08), 0 30px 70px rgba(0,0,0,.34);
}

.audio-media {
  min-height: 220px;
  display: grid;
  grid-template-columns: 74px 1fr 52px;
  gap: 16px;
  align-items: center;
  padding: 18px;
  background:
    radial-gradient(circle at 92% 20%, rgba(36,224,210,.18), transparent 26%),
    linear-gradient(135deg, rgba(36,224,210,.08), rgba(8,10,15,.85));
}

.audio-play {
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  color: #06110f;
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  border-radius: 10px;
  font-size: 28px;
  font-weight: 1000;
}

.wave {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 80px;
}

.wave i {
  width: 6px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--cyan), var(--blue));
  opacity: .9;
}

.wave i:nth-child(1){height:20px}
.wave i:nth-child(2){height:42px}
.wave i:nth-child(3){height:30px}
.wave i:nth-child(4){height:66px}
.wave i:nth-child(5){height:54px}
.wave i:nth-child(6){height:72px}
.wave i:nth-child(7){height:44px}
.wave i:nth-child(8){height:60px}
.wave i:nth-child(9){height:24px}
.wave i:nth-child(10){height:48px}
.wave i:nth-child(11){height:35px}
.wave i:nth-child(12){height:66px}
.wave i:nth-child(13){height:28px}
.wave i:nth-child(14){height:58px}

.media-label {
  position: relative;
  z-index: 2;
  max-width: 420px;
  padding: 12px;
  background: rgba(8,10,15,.72);
  border: 1px solid rgba(255,255,255,.12);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 850;
}

.post-actions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(255,255,255,.10);
}

.post-actions button {
  min-height: 52px;
  border: 0;
  border-right: 1px solid rgba(255,255,255,.08);
  background: rgba(8,10,15,.34);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 950;
  cursor: pointer;
  font-family: inherit;
}

.post-actions button:last-child {
  border-right: 0;
}

.post-actions button.primary {
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.post-comments {
  padding: 12px 14px 14px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.right-panel {
  margin-top: 0;
  margin-bottom: 14px;
}

.city-card {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,.08);
}

.city-card:first-of-type {
  border-top: 0;
}

.city-avatar,
.chat-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255,210,31,.12);
  color: var(--yellow);
  font-weight: 1000;
}

.chat-avatar {
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.chat-avatar.large {
  width: 46px;
  height: 46px;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-card b {
  display: block;
  font-size: 13px;
  font-weight: 1000;
}

.city-card span {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  max-width: 190px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.follow {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255,210,31,.26);
  background: rgba(255,210,31,.10);
  color: var(--yellow);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}

.topic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-grid span {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: #cbd5e1;
  background: rgba(8,10,15,.62);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 900;
}

.chat-drawer {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 100;
  width: min(430px, calc(100vw - 24px));
  height: calc(100vh - 36px);
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  border: 1px solid rgba(255,255,255,.18);
  background:
    radial-gradient(circle at 100% 0%, rgba(36,224,210,.14), transparent 32%),
    linear-gradient(180deg, rgba(18,26,38,.98), rgba(8,10,15,.98));
  box-shadow: -28px 0 90px rgba(0,0,0,.52);
  transform: translateX(calc(100% + 30px));
  transition: transform .28s ease;
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
}

.chat-drawer.open {
  transform: translateX(0);
}

.chat-head {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.chat-head h2 {
  margin: 0;
  font-family: var(--title);
  font-size: 26px;
  line-height: 1;
  letter-spacing: -.055em;
}

.chat-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
}

.close-chat {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(8,10,15,.62);
  color: white;
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
}

.chat-search {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.chat-search input {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.64);
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0 13px;
  outline: none;
  font-weight: 800;
}

.chat-list {
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  width: 100%;
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 11px;
  align-items: center;
  padding: 11px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
}

.chat-item:hover,
.chat-item.active {
  background: rgba(255,255,255,.055);
  border-color: rgba(255,255,255,.10);
}

.chat-copy b {
  display: block;
  font-size: 14px;
  font-weight: 1000;
}

.chat-copy span {
  display: block;
  max-width: 230px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  text-align: right;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.unread {
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  margin: 6px 0 0 auto;
  border-radius: 6px;
  background: var(--yellow);
  color: #06110f;
  font-size: 10px;
  font-weight: 1000;
}

.mini-thread {
  border-top: 1px solid rgba(255,255,255,.10);
  padding: 12px;
  background: rgba(8,10,15,.36);
}

.mini-thread-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.mini-thread-title a {
  color: var(--yellow);
}

.bubble {
  width: fit-content;
  max-width: 82%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,255,255,.07);
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
}

.bubble.me {
  margin-left: auto;
  color: #07110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
}

.thread-messages {
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.reply-row {
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 8px;
  margin-top: 12px;
}

.reply-row input {
  min-height: 42px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(8,10,15,.65);
  color: #e2e8f0;
  border-radius: 9px;
  padding: 0 12px;
  outline: none;
  font-weight: 800;
}

.reply-row button {
  min-height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: #06110f;
  background: linear-gradient(135deg, var(--yellow), var(--orange));
  font-size: 18px;
  font-weight: 1000;
  cursor: pointer;
}

.reply-row button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.chat-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0,0,0,.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity .24s ease;
}

.chat-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

.mobile-nav {
  display: none;
}

@media (max-width: 1220px) {
  .app {
    grid-template-columns: 88px minmax(0, 720px) 320px;
  }

  .brand {
    grid-template-columns: 1fr;
    justify-items: center;
    height: auto;
  }

  .brand b,
  .brand span {
    display: none;
  }

  .side-nav a,
  .side-nav button {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 0;
  }

  .side-nav a b,
  .side-nav button b,
  .now-box,
  .side-post {
    display: none;
  }
}

@media (max-width: 980px) {
  .app {
    width: min(720px, calc(100% - 20px));
    display: block;
    padding-bottom: 96px;
  }

  .rail,
  .right {
    display: none;
  }

  .topbar {
    margin-top: 0;
  }

  .search-row {
    grid-template-columns: 1fr 48px 48px;
  }

  .search-row .icon-btn.profile-button {
    display: none;
  }

  .composer-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .post-head {
    grid-template-columns: 44px 1fr;
  }

  .post-avatar {
    width: 44px;
    height: 44px;
  }

  .wall-pill {
    grid-column: 1 / -1;
    width: fit-content;
    margin-left: 56px;
  }

  .media {
    min-height: 350px;
  }

  .video-media {
    min-height: 520px;
  }

  .audio-media {
    grid-template-columns: 60px 1fr;
  }

  .audio-play {
    width: 60px;
    height: 60px;
  }

  .audio-media .duration {
    grid-column: 1 / -1;
  }

  .post-actions {
    grid-template-columns: repeat(5, minmax(0,1fr));
  }

  .post-actions button {
    min-height: 48px;
    font-size: 0;
  }

  .post-actions button::first-letter {
    font-size: 18px;
  }

  .chat-drawer {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(86vh, 760px);
    transform: translateY(calc(100% + 30px));
    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
    border-radius: 18px 18px 0 0;
  }

  .chat-drawer.open {
    transform: translateY(0);
  }

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 80;
    height: 64px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 7px;
    border: 1px solid var(--line-2);
    background: rgba(10,16,24,.88);
    backdrop-filter: blur(18px);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,.42);
  }

  .mobile-nav a,
  .mobile-nav button {
    position: relative;
    display: grid;
    place-items: center;
    color: #cbd5e1;
    background: transparent;
    border: 0;
    border-radius: 10px;
    font-size: 20px;
  }

  .mobile-nav a.active {
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    color: #06110f;
  }

  .mobile-badge {
    position: absolute;
    right: 16px;
    top: 5px;
    min-width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: var(--pink);
    color: white;
    font-size: 10px;
    font-weight: 1000;
  }
}

@media (max-width: 520px) {
  .post-body h2 {
    font-size: 23px;
  }

  .photo-media {
    min-height: 390px;
  }

  .video-media {
    min-height: 560px;
  }
}
`;
