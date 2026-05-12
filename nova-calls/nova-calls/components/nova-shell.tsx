'use client';

import Link from 'next/link';
import { useMemo, useState, type ChangeEvent } from 'react';
import { officialItalianCities } from '@/lib/italian-cities';
import type { WallPost } from '@/lib/city-wall-types';
import { ProfileOrb } from '@/components/profile-store';

const WALL_STORAGE_KEY = 'the-square:wall-posts';

const navItems = [
  ['🏠', 'Home', '/'],
  ['🧱', 'The Wall', '#wall'],
  ['🎙️', 'Voice Wall', '#voice-wall'],
  ['📍', 'Città', '/cities'],
  ['📰', 'News', '/world-news'],
  ['🎟️', 'Eventi', '/events'],
  ['👥', 'Persone', '/people'],
  ['👤', 'Profilo', '/profile'],
];

const defaultPosts: WallPost[] = [
  {
    id: 'demo-roma-1',
    citySlug: 'roma',
    cityName: 'Roma',
    authorName: 'Andrea',
    authorInitials: 'A',
    neighborhood: 'Roma Nord',
    targetType: 'city_wall',
    postType: 'text',
    title: 'Qualcuno conosce un posto tranquillo per lavorare al pc zona Prati?',
    content:
      'Mi servirebbe un locale luminoso, non troppo rumoroso e con prese comode. Meglio se aperto anche nel pomeriggio.',
    reactions: ['💬 Rispondi', '🎙️ Lascia audio', '🔖 Salva', '↗ Porta nella mia Piazza'],
    createdAtLabel: '12 minuti fa',
  },
  {
    id: 'demo-roma-2',
    citySlug: 'roma',
    cityName: 'Roma',
    authorName: 'Giulia',
    authorInitials: 'G',
    neighborhood: 'Trastevere',
    targetType: 'city_wall',
    postType: 'audio',
    title: 'Ho lasciato un pensiero vocale sugli eventi del weekend.',
    content:
      'Secondo me il vero problema non è trovare eventi, ma andarci con qualcuno senza sentirsi fuori posto.',
    audioDuration: '0:42',
    reactions: ['💬 8 risposte', '👥 12 interessati', '🎟️ Collega evento'],
    createdAtLabel: '35 minuti fa',
  },
  {
    id: 'demo-roma-3',
    citySlug: 'roma',
    cityName: 'Roma',
    authorName: 'Marco',
    authorInitials: 'M',
    neighborhood: 'San Lorenzo',
    targetType: 'city_wall',
    postType: 'event',
    title: 'Stasera qualcuno va al live in zona San Lorenzo?',
    content: 'Io ci sto pensando, ma vorrei capire se c’è qualcuno interessato a fare gruppo prima.',
    reactions: ['📍 Ci vado', '👥 Cerco compagnia', '💬 Ne parliamo'],
    createdAtLabel: '1 ora fa',
  },
];

function readLocalPosts() {
  if (typeof window === 'undefined') return [] as WallPost[];

  try {
    return JSON.parse(window.localStorage.getItem(WALL_STORAGE_KEY) || '[]') as WallPost[];
  } catch {
    return [] as WallPost[];
  }
}

function saveLocalPosts(posts: WallPost[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WALL_STORAGE_KEY, JSON.stringify(posts.slice(0, 40)));
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatPostType(type: WallPost['postType']) {
  const labels: Record<WallPost['postType'], string> = {
    text: 'Pensiero',
    image: 'Immagine',
    audio: 'Audio',
    mixed: 'Post multimediale',
    news: 'Notizia',
    event: 'Evento',
  };

  return labels[type];
}

export function NovaHome() {
  const [selectedCitySlug, setSelectedCitySlug] = useState('roma');
  const [targetType, setTargetType] = useState<'city_wall' | 'personal_square'>('city_wall');
  const [wallText, setWallText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageName, setImageName] = useState('');
  const [audioName, setAudioName] = useState('');
  const [localPosts, setLocalPosts] = useState<WallPost[]>([]);

  const selectedCity = useMemo(() => {
    return officialItalianCities.find((city) => city.slug === selectedCitySlug) || officialItalianCities[0];
  }, [selectedCitySlug]);

  const posts = useMemo(() => {
    const storedPosts = localPosts.length ? localPosts : [];
    return [...storedPosts, ...defaultPosts].filter(
      (post) => post.citySlug === selectedCity.slug || post.targetType === 'personal_square'
    );
  }, [localPosts, selectedCity.slug]);

  function loadLocalPostsOnce() {
    if (!localPosts.length) setLocalPosts(readLocalPosts());
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAudioName(file.name);
  }

  function publishPost() {
    const content = wallText.trim();

    if (!content && !imageName && !audioName) {
      alert('Scrivi qualcosa oppure carica un’immagine/audio prima di pubblicare.');
      return;
    }

    const title = content ? content.split('\n')[0].slice(0, 96) : imageName ? 'Nuovo post con immagine' : 'Nuovo audio sul Voice Wall';
    const postType: WallPost['postType'] = imageName && audioName ? 'mixed' : imageName ? 'image' : audioName ? 'audio' : 'text';

    const newPost: WallPost = {
      id: `local-${Date.now()}`,
      citySlug: selectedCity.slug,
      cityName: selectedCity.name,
      authorName: isAnonymous ? 'Anonimo' : 'Tu',
      authorInitials: isAnonymous ? 'AN' : 'TU',
      neighborhood: selectedCity.name,
      targetType,
      postType,
      title,
      content: content || (imageName ? `Immagine caricata: ${imageName}` : `Audio caricato: ${audioName}`),
      imageUrl: imagePreview || undefined,
      imageName: imageName || undefined,
      audioName: audioName || undefined,
      audioDuration: audioName ? '0:59' : undefined,
      isAnonymous,
      reactions: ['💬 Rispondi', '🎙️ Lascia audio', '🔖 Salva'],
      createdAtLabel: 'adesso',
    };

    const updated = [newPost, ...readLocalPosts()];
    saveLocalPosts(updated);
    setLocalPosts(updated);
    setWallText('');
    setImageName('');
    setImagePreview('');
    setAudioName('');
  }

  return (
    <div className="square-shell" onMouseEnter={loadLocalPostsOnce}>
      <Topbar />

      <main className="square-layout">
        <aside className="square-sidebar">
          <nav>
            {navItems.map(([icon, label, href]) => (
              <Link href={href} key={label} className={label === 'Home' ? 'active' : ''}>
                <span>{icon}</span>
                <b>{label}</b>
              </Link>
            ))}
          </nav>

          <Link href="#composer" className="side-cta">
            <span>⊕</span>
            Scrivi sul Wall
          </Link>
        </aside>

        <section className="square-main">
          <Hero city={selectedCity.name} />

          <section className="wall-composer" id="composer">
            <div className="composer-head">
              <div>
                <p className="eyebrow">The Wall</p>
                <h2>Cosa vuoi dire alla tua città oggi?</h2>
              </div>

              <div className="composer-tabs">
                <button type="button" className={targetType === 'city_wall' ? 'active' : ''} onClick={() => setTargetType('city_wall')}>
                  Wall locale · {selectedCity.name}
                </button>
                <button
                  type="button"
                  className={targetType === 'personal_square' ? 'active' : ''}
                  onClick={() => setTargetType('personal_square')}
                >
                  La mia Piazza
                </button>
                <button type="button" className={audioName ? 'active' : ''}>Voice Wall</button>
              </div>
            </div>

            <textarea
              value={wallText}
              onChange={(event) => setWallText(event.target.value)}
              placeholder="Scrivi una domanda, una segnalazione, un pensiero, una richiesta locale..."
            />

            {imagePreview && (
              <div className="upload-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Anteprima immagine caricata" />
                <span>{imageName}</span>
              </div>
            )}

            {audioName && (
              <div className="audio-preview">
                <span className="play">▶</span>
                <Wave />
                <b>{audioName}</b>
              </div>
            )}

            <div className="composer-bottom">
              <div className="tools">
                <label>
                  🖼️ Immagine
                  <input type="file" accept="image/*" onChange={handleImage} />
                </label>
                <label>
                  🎙️ Audio
                  <input type="file" accept="audio/*" onChange={handleAudio} />
                </label>
                <button type="button">📍 {selectedCity.name}</button>
                <button type="button">📰 Notizia</button>
                <button type="button">🎟️ Evento</button>
                <button type="button" className={isAnonymous ? 'active' : ''} onClick={() => setIsAnonymous((value) => !value)}>
                  ◒ Anonimo
                </button>
              </div>

              <button type="button" onClick={publishPost} className="publish-btn">
                Pubblica sul Wall →
              </button>
            </div>
          </section>

          <CitySelector selectedCitySlug={selectedCitySlug} onSelectCity={setSelectedCitySlug} />

          <div className="section-title" id="wall">
            <div>
              <h2>🧱 The Wall — {selectedCity.name}</h2>
              <p>Messaggi, audio, immagini, domande, eventi e notizie pubblicati dalla città.</p>
            </div>
            <Link href={`/cities/${selectedCity.slug}`}>Apri città →</Link>
          </div>

          <section className="content-grid">
            <div className="wall-feed">
              {posts.map((post, index) => (
                <WallPostCard key={post.id} post={post} featured={index === 0} />
              ))}
            </div>

            <CityRail city={selectedCity} />
          </section>
        </section>

        <aside className="right-rail">
          <MySquare />
          <EchoPanel city={selectedCity.name} stats={selectedCity.wallStats} />
          <ActiveCities />
          <VoiceWall />
        </aside>
      </main>

      <style jsx global>{styles}</style>
    </div>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <img src="/icon-192.png" alt="The Square" className="brand-app-icon" />

        <span>
          <span className="brand-word">The Square</span>
          <span className="brand-sub">City Wall Network</span>
        </span>
      </Link>

      <div className="top-search">
        <span>Cerca città, Wall, creator, eventi locali...</span>
        <b>⌕</b>
      </div>

      <nav className="top-actions">
        <Link href="/cities" className="top-icon">🌇</Link>
        <Link href="/world-news" className="top-icon">🗞️</Link>
        <Link href="/notifications" className="top-icon badge">📢</Link>
        <Link href="/profile" className="profile-orb-wrap" aria-label="Profilo">
          <ProfileOrb className="h-full w-full" />
        </Link>
        <Link href="#composer" className="top-cta">⊕ Scrivi sul Wall</Link>
      </nav>
    </header>
  );
}

function Hero({ city }: { city: string }) {
  return (
    <section className="hero">
      <div className="city-silhouette">
        <div className="tower" />
        <div className="dome" />
        <div className="block b-a" />
        <div className="block b-b" />
        <div className="arch" />
        <div className="plaza-line" />
      </div>

      <div className="hero-content">
        <p className="eyebrow">Ogni città ha un Wall</p>
        <h1>
          La città parla. Lascia il tuo <span>segno.</span>
        </h1>
        <p>
          The Square trasforma ogni città in un Wall vivo: pensieri, audio, immagini, notizie locali,
          eventi e Piazze personali. Niente feed generico: solo ciò che succede davvero intorno a te.
        </p>

        <div className="hero-actions">
          <Link href="/cities" className="hero-btn yellow">Esplora città</Link>
          <Link href="#composer" className="hero-btn green">Pubblica sul Wall di {city}</Link>
          <Link href="/my-square" className="hero-btn blue">Apri la mia Piazza</Link>
        </div>
      </div>
    </section>
  );
}

function CitySelector({ selectedCitySlug, onSelectCity }: { selectedCitySlug: string; onSelectCity: (slug: string) => void }) {
  const [query, setQuery] = useState('');

  const visibleCities = officialItalianCities
    .filter((city) => `${city.name} ${city.region} ${city.province}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, query ? 50 : 14);

  return (
    <section className="city-search">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca città, quartiere o provincia..." />
      <Link href="/cities" className="hero-btn blue">Tutte le città</Link>

      <div className="city-chips">
        {visibleCities.map((city) => (
          <button
            type="button"
            key={city.slug}
            onClick={() => onSelectCity(city.slug)}
            className={selectedCitySlug === city.slug ? 'active' : ''}
          >
            {city.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function WallPostCard({ post, featured }: { post: WallPost; featured?: boolean }) {
  return (
    <article className={`wall-post ${featured ? 'featured' : ''}`}>
      <div className="post-top">
        <div className="post-user">
          <span className={`avatar ${post.authorInitials === 'A' ? 'andrea' : post.authorInitials === 'G' ? 'giulia' : 'marco'}`}>
            {post.authorInitials || getInitials(post.authorName)}
          </span>
          <div>
            <b>{post.authorName}{post.neighborhood ? ` · ${post.neighborhood}` : ''}</b>
            <span>{post.createdAtLabel} · {post.targetType === 'personal_square' ? 'La mia Piazza' : `Wall di ${post.cityName}`}</span>
          </div>
        </div>
        <span className={`post-type ${post.postType === 'audio' ? 'blue' : post.postType === 'event' ? 'pink' : ''}`}>
          {formatPostType(post.postType)}
        </span>
      </div>

      <h3>{post.title}</h3>
      <p>{post.content}</p>

      {post.imageUrl && (
        <div className="image-post">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.imageName || post.title} />
        </div>
      )}

      {(post.postType === 'audio' || post.audioName || post.audioDuration) && (
        <div className="voice-card" id="voice-wall">
          <span className="play">▶</span>
          <Wave />
          <span className="duration">{post.audioDuration || '0:59'}</span>
        </div>
      )}

      <div className="post-actions">
        {post.reactions.map((reaction, index) => (
          <a key={reaction} className={index === 0 ? 'highlight' : ''}>{reaction}</a>
        ))}
      </div>
    </article>
  );
}

function Wave() {
  return (
    <div className="wave">
      {Array.from({ length: 10 }).map((_, index) => <i key={index} />)}
    </div>
  );
}

function CityRail({ city }: { city: typeof officialItalianCities[number] }) {
  return (
    <aside className="city-rail">
      <section className="side-card">
        <div className="mini-title"><h3>📰 News locali</h3><Link href="/world-news">Vedi tutte</Link></div>
        <NewsLine title={`${city.name}, nuova viabilità in centro: cosa cambia da questo weekend`} source="Fonte locale · 2 ore fa" />
        <NewsLine title="Eventi culturali gratuiti in programma nei municipi" source="Comune e territorio · oggi" />
      </section>

      <section className="side-card">
        <div className="mini-title"><h3>🎟️ Eventi a {city.name}</h3><Link href="/events">Calendario</Link></div>
        <EventMini title="Aperitivo networking" text="24 interessati · 8 cercano compagnia · venerdì 19:30" />
        <EventMini title="Live music night" text="17 interessati · 5 persone compatibili · stasera" pink />
      </section>
    </aside>
  );
}

function NewsLine({ title, source }: { title: string; source: string }) {
  return (
    <div className="news-line">
      <b>{title}</b>
      <span>{source}</span>
      <div className="news-actions"><a>Discuti sul Wall</a><a>Lascia audio</a></div>
    </div>
  );
}

function EventMini({ title, text, pink }: { title: string; text: string; pink?: boolean }) {
  return (
    <div className={`event-mini ${pink ? 'pink' : ''}`}>
      <h4>{title}</h4>
      <p>{text}</p>
      <div><a>Ci vado</a><a>Cerco compagnia</a></div>
    </div>
  );
}

function MySquare() {
  return (
    <section className="personal-square">
      <div className="personal-head">
        <span className="avatar andrea">A</span>
        <div><b>Andrea’s Square</b><span>La tua Piazza personale</span></div>
      </div>
      <div className="personal-stats">
        <div><b>128</b><span>persone</span></div>
        <div><b>14</b><span>post</span></div>
        <div><b>6</b><span>audio</span></div>
      </div>
      <div className="post-actions"><Link href="/my-square" className="highlight">Apri Piazza</Link><a>Pubblica qui</a></div>
    </section>
  );
}

function EchoPanel({ city, stats }: { city: string; stats: typeof officialItalianCities[number]['wallStats'] }) {
  return (
    <section className="echo-card">
      <h3>🧠 Echo locale — {city}</h3>
      <p>Oggi il Wall parla soprattutto di eventi, mobilità, posti per lavorare, nuove conoscenze e vita di quartiere.</p>
      <div className="topic-list"><span>eventi</span><span>mobilità</span><span>lavoro</span><span>amicizie</span><span>quartieri</span></div>
      <div className="live-strip">
        <div><b>{stats.postsToday}</b><span>post oggi</span></div>
        <div><b>{stats.audioToday}</b><span>audio</span></div>
        <div><b>{stats.localEvents}</b><span>eventi</span></div>
      </div>
    </section>
  );
}

function ActiveCities() {
  return (
    <section className="side-card">
      <div className="mini-title"><h3>🔥 Città attive</h3><Link href="/cities">Tutte</Link></div>
      {officialItalianCities.slice(0, 5).map((city) => (
        <div className="news-line" key={city.slug}>
          <b>{city.name}</b>
          <span>{city.wallStats.postsToday} post oggi · {city.wallStats.audioToday} audio · {city.wallStats.localEvents} eventi</span>
        </div>
      ))}
    </section>
  );
}

function VoiceWall() {
  return (
    <section className="side-card">
      <div className="mini-title"><h3>🎙️ Voice Wall</h3><a>Ascolta</a></div>
      <div className="voice-card"><span className="play">▶</span><Wave /><span className="duration">1:08</span></div>
      <p className="side-copy">“Cosa manca davvero alla vita sociale di Roma?”</p>
    </section>
  );
}

const styles = `
:root {
  --bg: #0d1117;
  --panel: #121824;
  --panel-2: #171f2e;
  --ink: #f8fafc;
  --muted: #94a3b8;
  --line: rgba(255,255,255,.10);
  --yellow: #facc15;
  --orange: #fb923c;
  --cyan: #22d3ee;
  --blue: #3b82f6;
  --pink: #f43f5e;
  --lime: #a3e635;
  --title-font: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
}
.square-shell, .square-shell * { box-sizing: border-box; }
.square-shell { min-height: 100vh; color: var(--ink); background: radial-gradient(circle at 10% 0%, rgba(250,204,21,.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(34,211,238,.16), transparent 30%), radial-gradient(circle at 74% 90%, rgba(244,63,94,.13), transparent 26%), linear-gradient(180deg, #0d1117 0%, #111827 48%, #10141d 100%); padding: 18px 20px 52px; position: relative; overflow-x: hidden; }
.square-shell:before { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .28; background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px); background-size: 42px 42px; mask-image: linear-gradient(to bottom, black, transparent 88%); }
.topbar { position: relative; z-index: 2; max-width: 1540px; min-height: 68px; display: grid; grid-template-columns: 250px minmax(320px, 1fr) auto; gap: 16px; align-items: center; margin: 0 auto 18px; padding: 10px; border: 1px solid var(--line); background: rgba(18,24,36,.74); backdrop-filter: blur(22px) saturate(1.15); box-shadow: 0 18px 44px rgba(0,0,0,.22); border-radius: 18px; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; text-decoration: none; color: var(--ink); }
.brand-app-icon { width: 52px; height: 52px; min-width: 52px; max-width: 52px; border-radius: 14px; object-fit: cover; display: block; box-shadow: 0 12px 28px rgba(250,204,21,.18); }
.brand-word { display: block; font-family: var(--title-font); font-size: 28px; font-weight: 1000; letter-spacing: -.075em; white-space: nowrap; }
.brand-sub { display: block; margin-top: -2px; color: var(--muted); font-size: 10px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
.top-search { height: 47px; display: flex; align-items: center; gap: 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,.10); background: rgba(15,23,42,.76); padding: 0 15px; color: var(--muted); font-size: 13px; font-weight: 700; }
.top-search b { margin-left: auto; color: var(--yellow); font-size: 18px; }
.top-actions { display: flex; align-items: center; gap: 10px; }
.top-icon, .profile-orb-wrap { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; border: 1px solid rgba(255,255,255,.10); background: rgba(15,23,42,.78); color: #e2e8f0; font-size: 19px; text-decoration: none; overflow: hidden; }
.top-icon.badge:after { content: "3"; position: absolute; right: -5px; top: -7px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 999px; background: var(--pink); color: white; font-size: 11px; font-weight: 1000; }
.top-cta { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 13px; padding: 0 18px; color: #111827; background: linear-gradient(135deg, var(--yellow), var(--orange)); box-shadow: 0 18px 34px rgba(250,204,21,.18); font-size: 13px; font-weight: 1000; text-decoration: none; }
.square-layout { position: relative; z-index: 1; max-width: 1540px; margin: 0 auto; display: grid; grid-template-columns: 210px minmax(0, 1fr) 345px; gap: 18px; align-items: start; }
.square-sidebar { position: sticky; top: 18px; display: grid; gap: 14px; }
.square-sidebar nav { display: grid; gap: 8px; padding: 12px; border-radius: 18px; background: rgba(18,24,36,.82); border: 1px solid var(--line); box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.square-sidebar a { min-height: 45px; display: flex; align-items: center; gap: 11px; padding: 0 12px; border-radius: 13px; color: #cbd5e1; text-decoration: none; font-size: 13px; font-weight: 900; }
.square-sidebar a.active, .square-sidebar a:hover { color: var(--yellow); background: rgba(250,204,21,.10); }
.side-cta { min-height: 68px !important; justify-content: center; background: linear-gradient(135deg, var(--yellow), var(--orange)) !important; color: #111827 !important; }
.square-main, .right-rail { min-width: 0; }
.right-rail { position: sticky; top: 18px; display: grid; gap: 14px; }
.hero { position: relative; min-height: 430px; border-radius: 24px; overflow: hidden; background: linear-gradient(90deg, rgba(13,17,23,.96), rgba(13,17,23,.64) 47%, rgba(13,17,23,.18)), radial-gradient(circle at 76% 44%, rgba(250,204,21,.26), transparent 24%), linear-gradient(135deg, #172033, #0f172a 64%, #111827); box-shadow: 0 26px 90px rgba(0,0,0,.34); border: 1px solid rgba(255,255,255,.10); isolation: isolate; }
.hero:before { content: ""; position: absolute; inset: 0; opacity: .42; background: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px); background-size: 44px 44px; transform: perspective(900px) rotateX(58deg) scale(1.4) translateY(120px); transform-origin: bottom; }
.city-silhouette { position: absolute; right: 0; bottom: 0; width: 58%; height: 70%; opacity: .82; }
.tower, .block, .dome, .arch { position: absolute; bottom: 64px; background: linear-gradient(180deg, rgba(250,204,21,.48), rgba(251,146,60,.16)); border: 1px solid rgba(250,204,21,.16); }
.tower { right: 52%; width: 48px; height: 172px; clip-path: polygon(42% 0,58% 0,58% 20%,70% 20%,70% 100%,30% 100%,30% 20%,42% 20%); }
.dome { right: 35%; width: 150px; height: 98px; border-radius: 95px 95px 8px 8px; }
.block.b-a { right: 12%; width: 160px; height: 130px; border-radius: 12px 12px 0 0; }
.block.b-b { right: 0; width: 120px; height: 100px; border-radius: 12px 0 0 0; }
.arch { right: 27%; width: 88px; height: 74px; border-radius: 44px 44px 0 0; background: linear-gradient(180deg, rgba(34,211,238,.40), rgba(59,130,246,.16)); }
.plaza-line { position: absolute; right: 0; bottom: 60px; width: 62%; height: 3px; background: linear-gradient(90deg, transparent, rgba(250,204,21,.72), transparent); box-shadow: 0 0 24px rgba(250,204,21,.42); }
.hero-content { position: relative; z-index: 2; padding: 62px 0 56px 56px; max-width: 650px; }
.eyebrow { width: fit-content; display: inline-flex; align-items: center; gap: 7px; min-height: 28px; border-radius: 999px; padding: 0 11px; background: rgba(250,204,21,.12); border: 1px solid rgba(250,204,21,.20); color: var(--yellow); font-size: 10px; font-weight: 1000; letter-spacing: .12em; text-transform: uppercase; }
.hero h1 { margin: 12px 0 16px; color: #f8fafc; font-family: var(--title-font); font-size: clamp(50px,5.6vw,84px); line-height: .88; letter-spacing: -.075em; font-weight: 1000; }
.hero h1 span { background: linear-gradient(92deg, var(--yellow), var(--orange), var(--cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p { max-width: 560px; margin: 0; color: #cbd5e1; font-size: 16px; line-height: 1.55; font-weight: 680; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.hero-btn { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(255,255,255,.10); border-radius: 13px; padding: 0 20px; color: #e2e8f0; background: rgba(15,23,42,.80); box-shadow: 0 18px 44px rgba(0,0,0,.22); font-size: 13px; font-weight: 900; text-decoration: none; }
.hero-btn.yellow { color: #111827; background: linear-gradient(135deg, var(--yellow), var(--orange)); border-color: rgba(250,204,21,.25); }
.hero-btn.green { color: #13210a; background: linear-gradient(135deg, var(--lime), #65a30d); border-color: rgba(163,230,53,.25); }
.hero-btn.blue { color: white; background: linear-gradient(135deg, var(--cyan), var(--blue)); border-color: rgba(34,211,238,.25); }
.wall-composer { position: relative; z-index: 5; margin: -58px 28px 0; padding: 18px; border-radius: 20px; background: radial-gradient(circle at 92% 0%, rgba(34,211,238,.10), transparent 30%), rgba(18,24,36,.94); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 26px 90px rgba(0,0,0,.34); backdrop-filter: blur(22px) saturate(1.15); }
.composer-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 13px; }
.composer-head h2 { margin: 0; color: #f8fafc; font-family: var(--title-font); font-size: 22px; letter-spacing: -.055em; font-weight: 1000; }
.composer-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.composer-tabs button { height: 32px; display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid rgba(255,255,255,.10); padding: 0 12px; background: rgba(15,23,42,.80); color: var(--muted); font-size: 11px; font-weight: 900; cursor: pointer; }
.composer-tabs button.active { background: rgba(250,204,21,.14); color: var(--yellow); border-color: rgba(250,204,21,.22); }
.wall-composer textarea { min-height: 116px; width: 100%; resize: none; border: 1px solid rgba(255,255,255,.10); outline: 0; border-radius: 16px; background: rgba(15,23,42,.74); padding: 16px; color: #e2e8f0; font-size: 15px; font-weight: 650; }
.wall-composer textarea::placeholder { color: #64748b; }
.upload-preview { margin-top: 12px; border: 1px solid rgba(255,255,255,.10); background: rgba(15,23,42,.72); border-radius: 16px; overflow: hidden; }
.upload-preview img { width: 100%; max-height: 260px; object-fit: cover; display: block; }
.upload-preview span { display: block; padding: 10px 12px; color: #cbd5e1; font-size: 12px; font-weight: 800; }
.audio-preview { margin-top: 12px; min-height: 58px; display: grid; grid-template-columns: 42px 1fr auto; gap: 12px; align-items: center; border-radius: 15px; background: linear-gradient(135deg, rgba(34,211,238,.12), rgba(15,23,42,.58)); border: 1px solid rgba(34,211,238,.20); padding: 10px 12px; color: #cbd5e1; font-size: 12px; }
.composer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tools label, .tools button { min-height: 36px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(255,255,255,.10); border-radius: 11px; background: rgba(15,23,42,.72); padding: 0 12px; color: #cbd5e1; font-size: 12px; font-weight: 850; cursor: pointer; }
.tools label input { display: none; }
.tools button.active { color: var(--yellow); border-color: rgba(250,204,21,.28); background: rgba(250,204,21,.12); }
.publish-btn { min-height: 46px; border: 0; border-radius: 13px; padding: 0 20px; color: #111827; background: linear-gradient(135deg, var(--yellow), var(--orange)); font-size: 13px; font-weight: 1000; cursor: pointer; }
.city-search { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 16px; margin-top: 16px; border-radius: 18px; background: rgba(18,24,36,.82); border: 1px solid var(--line); box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.city-search input { min-height: 48px; border: 1px solid rgba(255,255,255,.10); border-radius: 13px; outline: 0; background: rgba(15,23,42,.76); padding: 0 16px; color: #e2e8f0; font-weight: 750; }
.city-search input::placeholder { color: #64748b; }
.city-chips { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 12px; grid-column: 1 / -1; }
.city-chips button { min-height: 34px; display: inline-flex; align-items: center; border-radius: 999px; padding: 0 12px; background: rgba(15,23,42,.72); border: 1px solid rgba(255,255,255,.10); color: #cbd5e1; font-size: 12px; font-weight: 900; cursor: pointer; }
.city-chips button.active { background: rgba(250,204,21,.14); color: var(--yellow); border-color: rgba(250,204,21,.24); }
.section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 24px 4px 12px; }
.section-title h2 { margin: 0; color: #f8fafc; font-family: var(--title-font); font-size: 23px; letter-spacing: -.055em; font-weight: 1000; }
.section-title p { margin: 4px 0 0; color: var(--muted); font-size: 12px; font-weight: 700; }
.section-title a { color: var(--cyan); font-size: 12px; font-weight: 900; text-decoration: none; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px,.75fr); gap: 14px; }
.wall-feed, .city-rail { display: grid; gap: 12px; align-content: start; }
.wall-post, .side-card, .echo-card, .personal-square { border-radius: 18px; background: rgba(18,24,36,.82); border: 1px solid var(--line); box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.wall-post { padding: 17px; }
.wall-post.featured { border-color: rgba(250,204,21,.24); background: radial-gradient(circle at 94% 0%, rgba(250,204,21,.12), transparent 28%), rgba(18,24,36,.88); }
.post-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.post-user { display: flex; align-items: center; gap: 10px; }
.avatar { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; overflow: hidden; color: white; font-weight: 1000; border: 1px solid rgba(255,255,255,.14); flex: 0 0 auto; }
.avatar.andrea { background: linear-gradient(135deg, #facc15, #fb7185 48%, #6366f1); color: #0f172a; }
.avatar.giulia { background: linear-gradient(135deg, #f43f5e, #fda4af); }
.avatar.marco { background: linear-gradient(135deg, #0ea5e9, #67e8f9); color: #082f49; }
.post-user b { display: block; color: #f8fafc; font-size: 13px; font-weight: 1000; }
.post-user span { display: block; margin-top: 3px; color: var(--muted); font-size: 11px; font-weight: 700; }
.post-type { min-height: 28px; display: inline-flex; align-items: center; border-radius: 999px; padding: 0 10px; background: rgba(250,204,21,.13); border: 1px solid rgba(250,204,21,.20); color: var(--yellow); font-size: 10px; font-weight: 1000; white-space: nowrap; }
.post-type.blue { color: var(--cyan); background: rgba(34,211,238,.10); border-color: rgba(34,211,238,.20); }
.post-type.pink { color: #fb7185; background: rgba(244,63,94,.10); border-color: rgba(244,63,94,.20); }
.wall-post h3 { margin: 0 0 8px; color: #f8fafc; font-family: var(--title-font); font-size: 19px; line-height: 1.18; letter-spacing: -.045em; font-weight: 1000; }
.wall-post p { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.5; font-weight: 650; }
.image-post { margin-top: 13px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,.10); }
.image-post img { display: block; width: 100%; max-height: 360px; object-fit: cover; }
.voice-card { margin-top: 13px; min-height: 62px; display: grid; grid-template-columns: 42px 1fr auto; gap: 12px; align-items: center; border-radius: 15px; background: linear-gradient(135deg, rgba(34,211,238,.12), rgba(15,23,42,.58)); border: 1px solid rgba(34,211,238,.20); padding: 10px 12px; }
.play { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; background: linear-gradient(135deg, var(--cyan), var(--blue)); color: white; }
.wave { height: 28px; display: flex; align-items: center; gap: 4px; }
.wave i { width: 4px; border-radius: 999px; background: var(--cyan); opacity: .78; }
.wave i:nth-child(1){height:12px}.wave i:nth-child(2){height:22px}.wave i:nth-child(3){height:16px}.wave i:nth-child(4){height:27px}.wave i:nth-child(5){height:19px}.wave i:nth-child(6){height:24px}.wave i:nth-child(7){height:13px}.wave i:nth-child(8){height:20px}.wave i:nth-child(9){height:15px}.wave i:nth-child(10){height:25px}
.duration { color: #cbd5e1; font-size: 11px; font-weight: 900; }
.post-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.post-actions a { min-height: 31px; display: inline-flex; align-items: center; border-radius: 999px; padding: 0 11px; background: rgba(15,23,42,.74); border: 1px solid rgba(255,255,255,.09); color: #cbd5e1; font-size: 11px; font-weight: 850; text-decoration: none; }
.post-actions a.highlight, .post-actions .highlight { color: #111827; background: linear-gradient(135deg, var(--yellow), var(--orange)); border: 0; }
.side-card, .echo-card, .personal-square { padding: 17px; }
.mini-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.mini-title h3, .echo-card h3, .personal-head b { margin: 0; color: #f8fafc; font-family: var(--title-font); font-size: 17px; font-weight: 1000; letter-spacing: -.035em; }
.mini-title a { color: var(--cyan); font-size: 11px; font-weight: 900; text-decoration: none; }
.news-line { padding: 12px 0; border-top: 1px solid var(--line); }
.news-line:first-of-type { border-top: 0; padding-top: 0; }
.news-line b { display: block; color: #e2e8f0; font-family: var(--title-font); font-size: 13px; line-height: 1.25; font-weight: 950; }
.news-line span, .side-copy { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; line-height: 1.35; font-weight: 700; }
.news-actions { display: flex; gap: 7px; margin-top: 9px; flex-wrap: wrap; }
.news-actions a { min-height: 28px; display: inline-flex; align-items: center; border-radius: 999px; padding: 0 10px; background: rgba(15,23,42,.74); border: 1px solid rgba(255,255,255,.08); color: #cbd5e1; font-size: 10px; font-weight: 850; }
.event-mini { position: relative; min-height: 118px; overflow: hidden; border-radius: 16px; padding: 15px; margin-top: 9px; color: white; background: linear-gradient(90deg, rgba(15,23,42,.90), rgba(15,23,42,.35)), linear-gradient(135deg, var(--yellow), var(--cyan)); border: 1px solid rgba(255,255,255,.10); }
.event-mini.pink { background: linear-gradient(90deg, rgba(15,23,42,.90), rgba(15,23,42,.35)), linear-gradient(135deg, var(--pink), var(--yellow)); }
.event-mini h4 { margin: 0; max-width: 225px; font-family: var(--title-font); font-size: 18px; line-height: 1.06; letter-spacing: -.035em; font-weight: 1000; }
.event-mini p { max-width: 230px; margin: 8px 0 0; color: rgba(255,255,255,.82); font-size: 11px; line-height: 1.38; font-weight: 700; }
.event-mini div { display: flex; gap: 7px; margin-top: 12px; flex-wrap: wrap; }
.event-mini a { min-height: 28px; display: inline-flex; align-items: center; border-radius: 999px; padding: 0 10px; background: rgba(255,255,255,.90); color: #111827; font-size: 10px; font-weight: 950; }
.personal-head { display: flex; align-items: center; gap: 12px; }
.personal-head .avatar { width: 58px; height: 58px; border-radius: 17px; font-size: 22px; }
.personal-head span { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; font-weight: 750; }
.personal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
.personal-stats div, .live-strip div { min-height: 52px; border-radius: 13px; background: rgba(15,23,42,.70); display: grid; place-items: center; text-align: center; border: 1px solid rgba(255,255,255,.08); }
.personal-stats b, .live-strip b { display: block; color: #f8fafc; font-size: 16px; line-height: 1; }
.personal-stats span, .live-strip span { display: block; margin-top: 4px; color: var(--muted); font-size: 9px; font-weight: 750; text-transform: uppercase; }
.echo-card p { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.5; font-weight: 650; }
.topic-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }
.topic-list span { min-height: 28px; display: inline-flex; align-items: center; border-radius: 999px; background: rgba(15,23,42,.74); border: 1px solid rgba(255,255,255,.08); padding: 0 10px; color: #cbd5e1; font-size: 10px; font-weight: 850; }
.live-strip { display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; margin-top: 15px; }
@media (max-width: 1360px) { .square-layout { grid-template-columns: 190px minmax(0,1fr); } .right-rail { grid-column: 2; position: relative; top: auto; grid-template-columns: repeat(2, minmax(0, 1fr)); } .content-grid { grid-template-columns: 1fr; } }
@media (max-width: 980px) { .square-shell { padding: 12px 11px 110px; } .topbar { grid-template-columns: 1fr; } .brand { justify-content: center; } .brand-app-icon { width: 46px; height: 46px; min-width: 46px; max-width: 46px; border-radius: 13px; } .top-search { order: 3; width: 100%; } .top-actions { justify-content: center; flex-wrap: wrap; } .top-icon:nth-child(n+4), .profile-orb-wrap { display: none; } .top-cta { width: 100%; } .square-layout { display: block; } .square-sidebar { position: fixed; left: 10px; right: 10px; bottom: 10px; top: auto; z-index: 80; } .square-sidebar nav { display: flex; overflow-x: auto; scrollbar-width: none; padding: 8px; border-radius: 18px; } .square-sidebar nav::-webkit-scrollbar { display: none; } .square-sidebar nav a { flex: 0 0 74px; min-height: 56px; flex-direction: column; justify-content: center; gap: 4px; padding: 5px; font-size: 10px; text-align: center; } .side-cta { display: none !important; } .hero { min-height: auto; border-radius: 20px; } .hero-content { padding: 42px 22px 92px; max-width: none; } .hero h1 { font-size: clamp(43px,13vw,64px); } .city-silhouette { width: 100%; opacity: .30; } .wall-composer { margin: -58px 12px 0; } .composer-head, .composer-bottom, .section-title { align-items: flex-start; flex-direction: column; } .tools, .publish-btn, .hero-btn { width: 100%; } .tools label, .tools button, .publish-btn { width: 100%; justify-content: center; } .city-search { grid-template-columns: 1fr; } .right-rail { grid-template-columns: 1fr; margin-top: 14px; } .post-top { align-items: flex-start; flex-direction: column; } .live-strip { grid-template-columns: 1fr; } }
`;
