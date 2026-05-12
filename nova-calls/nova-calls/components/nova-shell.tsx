'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ProfileOrb } from '@/components/profile-store';

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

const hotRooms = [
  ['🧩', 'Viabilità Prati', '24h · 32 persone dentro'],
  ['🧩', 'Eventi da soli', '18h · 18 persone dentro'],
];

export function NovaHome() {
  const [activeCity, setActiveCity] = useState('for-you');
  const [activeTopic, setActiveTopic] = useState('all');

  const visiblePosts = useMemo(() => {
    return feedPosts.filter((post) => {
      const cityMatch = activeCity === 'for-you' || activeCity === 'nearby' || activeCity === 'following' || post.citySlug === activeCity;
      const topicMatch =
        activeTopic === 'all' ||
        post.topicSlug === activeTopic ||
        (activeTopic === 'eventi' && post.topicSlug === 'audio' && post.topic === 'Eventi') ||
        (activeTopic === 'news' && post.kind === 'news') ||
        (activeTopic === 'audio' && post.kind === 'audio') ||
        (activeTopic === 'video' && post.kind === 'video');

      return cityMatch && topicMatch;
    });
  }, [activeCity, activeTopic]);

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
            <Link href="#video"><span>🎬</span><b>Video</b></Link>
            <Link href="/notifications"><span>🔔</span><b>Notifiche</b></Link>
            <Link href="/profile"><span>👤</span><b>Profilo</b></Link>
          </nav>

          <Link href="#composer" className="side-post">＋ Pubblica</Link>

          <section className="now-box">
            <h3>Live ora</h3>
            <div className="trend-line"><span>Roma</span><small>128 post</small></div>
            <div className="trend-line"><span>Eventi</span><small>43 audio</small></div>
            <div className="trend-line"><span>Mobilità</span><small>hot</small></div>
            <div className="trend-line"><span>Milano</span><small>96 post</small></div>
          </section>
        </aside>

        <main className="center">
          <header className="topbar">
            <div className="search-row">
              <div className="search">⌕ Cerca città, wall, creator, eventi locali...</div>
              <Link className="icon-btn" href="/notifications">🔔</Link>
              <Link className="icon-btn profile-mini" href="/profile"><ProfileOrb className="h-full w-full" /></Link>
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

          <section className="right-panel">
            <h3>Stanze nate dai post</h3>
            {hotRooms.map(([icon, title, meta]) => (
              <div className="city-card" key={title}>
                <div className="city-avatar">{icon}</div>
                <div><b>{title}</b><span>{meta}</span></div>
                <button type="button" className="follow">Entra</button>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <nav className="mobile-nav">
        <Link href="/" className="active">⌂</Link>
        <Link href="/cities">📍</Link>
        <Link href="#composer">＋</Link>
        <Link href="#feed">🧩</Link>
        <Link href="/profile">👤</Link>
      </nav>

      <style jsx global>{styles}</style>
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
  --panel-3: #0c1119;
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

.side-nav a {
  min-height: 48px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 11px;
  align-items: center;
  border: 1px solid transparent;
  padding: 0 10px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 900;
}

.side-nav a span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 7px;
}

.side-nav a.active,
.side-nav a:hover {
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

.now-box {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.72);
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
  grid-template-columns: 1fr auto auto;
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
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.80);
  font-size: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.profile-mini {
  padding: 3px;
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

.avatar-cyan { background: linear-gradient(135deg, var(--cyan), var(--blue)); color: white; }
.avatar-pink { background: linear-gradient(135deg, var(--pink), var(--orange)); color: white; }
.avatar-green { background: linear-gradient(135deg, var(--green), var(--cyan)); color: #06110f; }
.avatar-blue { background: linear-gradient(135deg, var(--blue), #7c3aed); color: white; }

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
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(16,22,32,.78);
  box-shadow: 0 22px 60px rgba(0,0,0,.28);
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

.city-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255,210,31,.12);
  color: var(--yellow);
  font-weight: 1000;
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

  .side-nav a {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 0;
  }

  .side-nav a b,
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
    grid-template-columns: 1fr 48px;
  }

  .search-row .icon-btn:nth-child(3) {
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

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 90;
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

  .mobile-nav a {
    display: grid;
    place-items: center;
    color: #cbd5e1;
    border-radius: 10px;
    font-size: 20px;
  }

  .mobile-nav a.active {
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    color: #06110f;
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
