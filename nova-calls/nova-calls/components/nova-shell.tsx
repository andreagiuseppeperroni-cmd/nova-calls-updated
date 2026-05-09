'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { demoCalls, makeSlug, type NovaCall } from '@/lib/local-call';
import { ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const STORAGE_KEY = 'nova:calls';

const thoughtTypes = ['Decidere', 'Capire', 'Feedback', 'Trovare persone', 'Fare ora', 'Creare insieme'];

const navItems: Array<[string, string, string]> = [
  ['🏛️', 'Piazza', '/'],
  ['🚶', 'Passeggiata', '#passeggiata'],
  ['💡', 'Spunti', '/calls/new'],
  ['🧠', 'Echo', '/echo'],
  ['🏁', 'Outcome', '/outcome'],
  ['👥', 'Persone', '/people'],
  ['🌐', 'Spazi', '/spaces'],
  ['📰', 'News', '/world-news'],
  ['📍', 'Eventi', '/events'],
  ['🔔', 'Notifiche', '/notifications'],
  ['💬', 'Messaggi', '/messages'],
  ['👤', 'Profilo', '/profile'],
];

type LiveThought = {
  id?: string;
  slug: string;
  title: string;
  description: string | null;
  call_type: string | null;
  access_type: string;
  status: string;
  pulse_score: number;
  participants: number;
  host_id: string | null;
  host_name: string | null;
  host_avatar: string | null;
  created_at: string;
};

type TrendEcho = {
  title: string;
  text: string;
};

type HostMoment = {
  hostId: string;
  hostName: string;
  hostAvatar: string | null;
  hostedCount: number;
  totalParticipants: number;
  avgPulse: number;
  popularityScore: number;
};

type WorldNewsItem = {
  title: string;
  source: string;
  url: string;
  description?: string;
  category?: string;
};

type AiAnswerKey = 'situation' | 'block' | 'desiredOutcome';
type WalkMode = 'piazza' | 'people' | 'understand' | 'do';

const aiQuestions: Array<{
  key: AiAnswerKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'situation',
    label: 'Che cosa vuoi portare in piazza?',
    placeholder: 'Esempio: sto valutando se cambiare lavoro, città o progetto...',
  },
  {
    key: 'block',
    label: 'Qual è il nodo che vuoi sciogliere?',
    placeholder: 'Esempio: paura di sbagliare, soldi, tempo, relazione, scelta difficile...',
  },
  {
    key: 'desiredOutcome',
    label: 'Che tipo di risposta cerchi dagli altri?',
    placeholder: 'Esempio: opinioni sincere, esperienze simili, idee pratiche, una decisione...',
  },
];

function readStoredCalls() {
  if (typeof window === 'undefined') return [] as NovaCall[];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as NovaCall[];
  } catch {
    return [];
  }
}

function saveLocalThought(call: NovaCall) {
  const calls = readStoredCalls();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([call, ...calls].slice(0, 12)));
}

function localCallToThought(call: NovaCall): LiveThought {
  return {
    slug: call.slug,
    title: call.title,
    description: call.description,
    call_type: call.type,
    access_type: call.accessType || 'public',
    status: 'live',
    pulse_score: call.pulse || 12,
    participants: call.participants || 1,
    host_id: null,
    host_name: 'The Square',
    host_avatar: null,
    created_at: call.createdAt || new Date().toISOString(),
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();
}

function extractKeywords(thoughts: LiveThought[]) {
  const stopwords = new Set([
    'adesso',
    'alla',
    'allo',
    'anche',
    'avere',
    'capire',
    'cosa',
    'come',
    'con',
    'da',
    'dei',
    'del',
    'della',
    'delle',
    'dopo',
    'dove',
    'essere',
    'fare',
    'fra',
    'gli',
    'hai',
    'ho',
    'per',
    'piu',
    'prima',
    'quando',
    'sono',
    'tra',
    'una',
    'uno',
  ]);

  const map = new Map<string, number>();

  for (const thought of thoughts) {
    const raw = `${thought.title} ${thought.description || ''}`;
    const words = normalizeText(raw).split(/\s+/);

    for (const word of words) {
      if (!word || word.length < 4 || stopwords.has(word)) continue;
      map.set(word, (map.get(word) || 0) + 1);
    }
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function buildTrendEchoes(thoughts: LiveThought[]): TrendEcho[] {
  const keywords = extractKeywords(thoughts);
  const byType = thoughts.reduce<Record<string, number>>((acc, thought) => {
    const type = thought.call_type || 'Capire';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Capire';

  return [
    {
      title: 'Tema della piazza',
      text: keywords.length
        ? `In piazza si parla soprattutto di: ${keywords.slice(0, 3).join(', ')}.`
        : 'La piazza si sta accendendo: apri il primo Spunto per dare direzione alla conversazione.',
    },
    {
      title: 'Energia collettiva',
      text: `La zona più attiva ora è “${topType}”: le persone cercano confronto immediato.`,
    },
    {
      title: 'Spunto suggerito',
      text: keywords[0]
        ? `Porta “${keywords[0]}” al centro della piazza: è un segnale già presente nella community.`
        : 'Porta una decisione concreta in piazza: è il formato che genera più partecipazione.',
    },
  ];
}

function computeHostOfMoment(thoughts: LiveThought[]): HostMoment | null {
  const grouped = new Map<string, HostMoment>();

  for (const thought of thoughts) {
    if (!thought.host_id || !thought.host_name) continue;

    const current = grouped.get(thought.host_id) || {
      hostId: thought.host_id,
      hostName: thought.host_name,
      hostAvatar: thought.host_avatar || null,
      hostedCount: 0,
      totalParticipants: 0,
      avgPulse: 0,
      popularityScore: 0,
    };

    current.hostedCount += 1;
    current.totalParticipants += thought.participants || 0;
    current.avgPulse += thought.pulse_score || 0;

    grouped.set(thought.host_id, current);
  }

  const hosts = [...grouped.values()].map((host) => {
    const avgPulse = host.hostedCount ? Math.round(host.avgPulse / host.hostedCount) : 0;
    const popularityScore = host.hostedCount * 12 + host.totalParticipants * 2 + avgPulse * 3;

    return { ...host, avgPulse, popularityScore };
  });

  return hosts.sort((a, b) => b.popularityScore - a.popularityScore)[0] || null;
}

function avgPulseValue(thoughts: LiveThought[]) {
  if (!thoughts.length) return 0;
  const total = thoughts.reduce((sum, item) => sum + (item.pulse_score || 0), 0);
  return Math.round(total / thoughts.length);
}

function getThoughtTypeIcon(item: string) {
  return item === 'Decidere'
    ? '◈'
    : item === 'Capire'
      ? '⚭'
      : item === 'Feedback'
        ? '▱'
        : item === 'Trovare persone'
          ? '♙'
          : item === 'Fare ora'
            ? '☆'
            : '▣';
}

function inferThoughtType(value: string) {
  const normalized = normalizeText(value);

  if (
    normalized.includes('decid') ||
    normalized.includes('scelta') ||
    normalized.includes('scegliere') ||
    normalized.includes('dubbio')
  ) {
    return 'Decidere';
  }

  if (normalized.includes('feedback') || normalized.includes('opinione') || normalized.includes('parere')) {
    return 'Feedback';
  }

  if (
    normalized.includes('persone') ||
    normalized.includes('network') ||
    normalized.includes('contatti') ||
    normalized.includes('conoscere')
  ) {
    return 'Trovare persone';
  }

  if (
    normalized.includes('subito') ||
    normalized.includes('oggi') ||
    normalized.includes('urgente') ||
    normalized.includes('ora')
  ) {
    return 'Fare ora';
  }

  if (
    normalized.includes('creare') ||
    normalized.includes('costruire') ||
    normalized.includes('progetto') ||
    normalized.includes('idea')
  ) {
    return 'Creare insieme';
  }

  return 'Capire';
}

function buildSpuntoHref(title: string, type = 'Capire') {
  return `/calls/new?title=${encodeURIComponent(title)}&type=${encodeURIComponent(type)}`;
}

function buildWalkItems(thoughts: LiveThought[], news: WorldNewsItem[], mode: WalkMode) {
  const safeThoughts = thoughts.length ? thoughts : demoCalls.map(localCallToThought);
  const safeNews = news.length
    ? news
    : [
        {
          title: 'Roma, lavoro e relazioni stanno diventando i temi più caldi della piazza.',
          source: 'The Square Echo',
          url: '/world-news',
          description: 'Un segnale da trasformare in discussione.',
          category: 'Piazza',
        },
        {
          title: 'Le persone cercano gruppi piccoli prima degli eventi.',
          source: 'The Square Echo',
          url: '/world-news',
          description: 'The Square può far nascere incontri più naturali.',
          category: 'Eventi',
        },
      ];

  const peopleFirst = mode === 'people';
  const understandFirst = mode === 'understand';
  const doFirst = mode === 'do';

  return [
    {
      type: 'moment',
      title: safeThoughts[0]?.title || 'Sto cercando un confronto sincero',
      text: safeThoughts[0]?.description || 'Uno Spunto aperto nella piazza per ricevere esperienze, idee e punti di vista.',
      href: `/c/${safeThoughts[0]?.slug || 'demo'}`,
      meta: `Pulse ${safeThoughts[0]?.pulse_score || 42} · ${safeThoughts[0]?.participants || 8} persone`,
      badge: 'Momento caldo',
    },
    peopleFirst
      ? {
          type: 'person',
          title: 'Giulia può aiutarti',
          text: 'Ha risposto a Momenti simili e vive conversazioni su lavoro, città e cambiamento.',
          href: '/people',
          meta: 'Match 91%',
          badge: 'Persona affine',
        }
      : {
          type: 'event',
          title: 'Roma: gruppo in formazione',
          text: 'Persone che vogliono organizzarsi prima di un evento. Chat temporanea consigliata.',
          href: '/events',
          meta: '18 interessati',
          badge: 'Evento vicino',
        },
    {
      type: 'news',
      title: safeNews[0]?.title || 'Una notizia può diventare uno Spunto',
      text: safeNews[0]?.description || 'Porta questa notizia in piazza e chiedi cosa ne pensa la community.',
      href: safeNews[0]?.url || '/world-news',
      meta: safeNews[0]?.source || 'The Square',
      badge: safeNews[0]?.category || 'News',
    },
    {
      type: 'bivio',
      title: 'Dove vuoi andare ora?',
      text: 'Scegli una direzione: la Passeggiata cambia ritmo e ti mostra contenuti più utili.',
      href: '#passeggiata',
      meta: 'Bivio intelligente',
      badge: 'Social 5.0',
    },
    understandFirst
      ? {
          type: 'echo',
          title: 'Eco: il tema nascosto',
          text: 'La piazza sta collegando lavoro, paura di sbagliare e bisogno di esperienze reali.',
          href: '/echo',
          meta: 'Insight generato',
          badge: 'Echo',
        }
      : {
          type: 'bench',
          title: 'Panchina: fermati un secondo',
          text: 'Hai attraversato contenuti simili. Vuoi trasformare questo interesse in uno Spunto?',
          href: buildSpuntoHref('Voglio trasformare questo interesse in uno Spunto', 'Capire'),
          meta: 'Pausa utile',
          badge: 'Panchina',
        },
    doFirst
      ? {
          type: 'event',
          title: 'Fai qualcosa: evento consigliato',
          text: 'Un gruppo locale può nascere da qui. Entra, guarda chi c’è e proponi un momento.',
          href: '/events',
          meta: 'Centro Italia',
          badge: 'Azione',
        }
      : {
          type: 'person',
          title: 'Marco cerca persone per un’idea',
          text: 'Compatibile con chi vuole creare, discutere e trasformare un’intuizione in progetto.',
          href: '/people',
          meta: '5 compatibili',
          badge: 'Persone',
        },
    {
      type: 'mission',
      title: 'Missione di piazza',
      text: 'Aiuta una persona, accendi un Patto o porta uno Spunto verso un Outcome.',
      href: '/spaces',
      meta: '1 azione utile',
      badge: 'Missione',
    },
    {
      type: 'change_square',
      title: 'Cambio Piazza',
      text: 'Continua verso Roma, Firenze, Perugia o nella Piazza Anonima.',
      href: '/events',
      meta: 'Nuovo scenario',
      badge: 'Cambio scenario',
    },
  ];
}

export function NovaHome() {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [text, setText] = useState('');
  const [type, setType] = useState('Decidere');
  const [attachmentName, setAttachmentName] = useState('');
  const [aiStep, setAiStep] = useState(0);
  const [aiAnswers, setAiAnswers] = useState<Record<AiAnswerKey, string>>({
    situation: '',
    block: '',
    desiredOutcome: '',
  });

  const [liveThoughts, setLiveThoughts] = useState<LiveThought[]>([]);
  const [worldNews, setWorldNews] = useState<WorldNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [avgPulse, setAvgPulse] = useState(0);
  const [trendEchoes, setTrendEchoes] = useState<TrendEcho[]>([]);
  const [hostMoment, setHostMoment] = useState<HostMoment | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [closingSlug, setClosingSlug] = useState<string | null>(null);
  const [walkMode, setWalkMode] = useState<WalkMode>('piazza');

  useEffect(() => {
    loadDashboardData();
    loadWorldNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboardData() {
    const localThoughts = [...readStoredCalls(), ...demoCalls].map(localCallToThought);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      const { data: thoughts, error } = await supabase
        .from('calls')
        .select(
          'id, slug, title, description, call_type, access_type, status, pulse_score, participants, host_id, host_name, host_avatar, created_at'
        )
        .eq('access_type', 'public')
        .in('status', ['live', 'open'])
        .order('participants', { ascending: false })
        .order('pulse_score', { ascending: false })
        .limit(24);

      let pendingCount = 0;

      if (user) {
        const { count } = await supabase
          .from('user_links')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        pendingCount = count || 0;
      }

      const safeThoughts = error || !thoughts?.length ? localThoughts : (thoughts as LiveThought[]);

      setLiveThoughts(safeThoughts);
      setAvgPulse(avgPulseValue(safeThoughts));
      setTrendEchoes(buildTrendEchoes(safeThoughts));
      setHostMoment(computeHostOfMoment(safeThoughts));
      setNotificationCount(pendingCount);
    } catch {
      setLiveThoughts(localThoughts);
      setAvgPulse(avgPulseValue(localThoughts));
      setTrendEchoes(buildTrendEchoes(localThoughts));
      setHostMoment(computeHostOfMoment(localThoughts));
      setNotificationCount(0);
    }
  }

  async function loadWorldNews() {
    try {
      setNewsLoading(true);

      const response = await fetch('/api/world-news', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data?.items)) {
        setWorldNews([]);
        return;
      }

      setWorldNews(data.items);
    } catch {
      setWorldNews([]);
    } finally {
      setNewsLoading(false);
    }
  }

  async function closeThoughtEarly(slug: string) {
    try {
      setClosingSlug(slug);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('Devi essere loggato per chiudere lo Spunto.');
        return;
      }

      const response = await fetch(`/api/calls/${slug}/close`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.error || 'Non sono riuscito a chiudere lo Spunto.');
        return;
      }

      window.location.href = `/outcome?slug=${slug}`;
    } catch {
      alert('Errore durante la chiusura dello Spunto.');
    } finally {
      setClosingSlug(null);
    }
  }

  function updateAiAnswer(key: AiAnswerKey, value: string) {
    setAiAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function buildAiThought() {
    const situation = aiAnswers.situation.trim();
    const block = aiAnswers.block.trim();
    const desiredOutcome = aiAnswers.desiredOutcome.trim();

    const fullText = `${situation} ${block} ${desiredOutcome}`.trim();

    if (!situation || !block || !desiredOutcome) {
      alert('Rispondi alle tre domande per generare uno Spunto.');
      return;
    }

    const inferredType = inferThoughtType(fullText);
    const generatedTitle = situation.length > 82 ? `${situation.slice(0, 79).trim()}...` : situation;

    const generatedText = `${generatedTitle}

Nodo principale: ${block}

Aiuto che cerco dalla piazza: ${desiredOutcome}`;

    setText(generatedText);
    setType(inferredType);
  }

  function openThought() {
    const title = text.trim().split('\n')[0] || 'Nuovo Spunto The Square';

    const call: NovaCall = {
      title,
      description:
        text.trim() || 'Spunto aperto dalla piazza. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.',
      type,
      accessType: 'public',
      slug: makeSlug(title),
      pulse: 12,
      participants: 1,
      createdAt: new Date().toISOString(),
    };

    saveLocalThought(call);
    window.location.href = `/calls/new?title=${encodeURIComponent(title)}&type=${encodeURIComponent(type)}`;
  }

  const featured = liveThoughts[0] || null;
  const currentQuestion = aiQuestions[aiStep];

  return (
    <div className="square-preview">
      <TopChrome isLoggedIn={Boolean(currentUserId)} />

      <main className="square-app">
        <Sidebar notificationCount={notificationCount} />

        <section className="square-center">
          <section className="hero-refresh">
            <div>
              <p className="square-eyebrow">THE SQUARE</p>
              <h1>
                Entra nella <span className="gradient-text">piazza</span>
              </h1>
              <p className="subtitle">
                Una piazza digitale viva: non un feed infinito, ma una Passeggiata che ti porta da qualche parte.
              </p>
            </div>

            <div className="hero-mini-stats">
              <div>
                <b>{liveThoughts.length || demoCalls.length}</b>
                <span>Spunti attivi</span>
              </div>
              <div>
                <b>{avgPulse}</b>
                <span>Pulse medio</span>
              </div>
              <div>
                <b>{worldNews.length || 3}</b>
                <span>News utili</span>
              </div>
            </div>
          </section>

          <SquareMap />
          <InfiniteWalkSection thoughts={liveThoughts} worldNews={worldNews} walkMode={walkMode} setWalkMode={setWalkMode} />
          <NeedSomeoneSection />

          <div className="composer ai-composer">
            <div className="composer-content">
              <div className="ai-builder-head">
                <div>
                  <p className="square-eyebrow">AI Spunto Builder</p>
                  <h2>Ti aiuto a trasformare un pensiero in uno Spunto</h2>
                </div>

                <span className="ai-step-pill">
                  {aiStep + 1}/{aiQuestions.length}
                </span>
              </div>

              <div className="ai-question-box">
                <label className="ai-question-label">{currentQuestion.label}</label>

                <textarea
                  value={aiAnswers[currentQuestion.key]}
                  onChange={(event) => updateAiAnswer(currentQuestion.key, event.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={3}
                  className="composer-input ai-input"
                />
              </div>

              <div className="composer-actions ai-actions">
                <button
                  type="button"
                  onClick={() => setAiStep((value) => Math.max(0, value - 1))}
                  className="mini-pill"
                  disabled={aiStep === 0}
                >
                  ← Indietro
                </button>

                {aiStep < aiQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setAiStep((value) => Math.min(aiQuestions.length - 1, value + 1))}
                    className="mini-pill ai-primary-pill"
                  >
                    Continua →
                  </button>
                ) : (
                  <button type="button" onClick={buildAiThought} className="mini-pill ai-primary-pill">
                    Genera Spunto
                  </button>
                )}

                <label className="mini-pill attachment-pill">
                  ⌘ {attachmentName || 'Allega'}
                  <input
                    type="file"
                    className="hidden-file"
                    onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setType(type === 'Anonima' ? 'Decidere' : 'Anonima')}
                  className="mini-pill anon-pill"
                >
                  ◒ Anonima
                </button>
              </div>
            </div>

            <button type="button" onClick={openThought} className="mic ai-open-button">
              ✦
            </button>
          </div>

          {text && (
            <div className="ai-preview glass">
              <div>
                <p className="square-eyebrow">Spunto generato</p>
                <h3>{text.split('\n')[0]}</h3>
                <p>{text}</p>
              </div>

              <button type="button" onClick={openThought} className="ai-open-cta">
                Apri lo Spunto →
              </button>
            </div>
          )}

          <div className="chips">
            {thoughtTypes.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setType(item)}
                className={`chip ${type === item ? 'active' : ''}`}
              >
                {getThoughtTypeIcon(item)} {item}
              </button>
            ))}
          </div>

          {featured && (
            <FeaturedThought
              thought={featured}
              currentUserId={currentUserId}
              onCloseEarly={closeThoughtEarly}
              closingSlug={closingSlug}
            />
          )}

          <HomeSectionsPreview
            thoughts={liveThoughts}
            trendEchoes={trendEchoes}
            worldNews={worldNews}
            notificationCount={notificationCount}
            currentUserId={currentUserId}
          />

          <TrendEchoSection echoes={trendEchoes} />
          <WorldNewsSection items={worldNews} loading={newsLoading} />
          <HostOfMomentSection host={hostMoment} />
          <LiveStrip thoughts={liveThoughts} />
        </section>

        <RightPanels avgPulse={avgPulse} trendEchoes={trendEchoes} />
      </main>

      <style jsx global>{`
        :root {
          --sand: #f7efe3;
          --stone: #d9c7ae;
          --stone-dark: #4b3727;
          --night: #0b1120;
          --panel: rgba(255, 255, 255, 0.76);
          --line: rgba(120, 53, 15, 0.16);
          --text: #18212f;
          --muted: #5b6472;
          --cyan: #06b6d4;
          --blue: #2563eb;
          --violet: #7c3aed;
          --pink: #db2777;
          --coral: #fb7185;
          --lime: #a3e635;
          --green: #10b981;
        }

        .square-preview,
        .square-preview * {
          box-sizing: border-box;
        }

        .square-preview {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: var(--text);
          background:
            radial-gradient(circle at 12% 8%, rgba(251,146,60,.20), transparent 24%),
            radial-gradient(circle at 82% 12%, rgba(6,182,212,.20), transparent 24%),
            radial-gradient(circle at 72% 78%, rgba(219,39,119,.12), transparent 30%),
            linear-gradient(180deg, #f7efe3 0%, #f6ead8 36%, #e8d5bc 72%, #d8c4aa 100%);
          overflow-x: hidden;
          isolation: isolate;
        }

        .square-preview::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: .12;
          background-image:
            linear-gradient(rgba(75,55,39,.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75,55,39,.18) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to bottom, black, transparent 86%);
        }

        .glass {
          border: 1px solid rgba(255,255,255,.68);
          background:
            radial-gradient(circle at 82% 0%, rgba(251,146,60,.08), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,247,237,.72));
          box-shadow: 0 22px 74px rgba(92,64,42,.11), inset 0 1px 0 rgba(255,255,255,.96);
          backdrop-filter: blur(24px) saturate(1.18);
          color: #18212f;
        }

        .square-app {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 232px minmax(680px, 1fr) 460px;
          gap: 24px;
          width: 100%;
          min-height: 100vh;
          padding: 30px 26px 44px;
        }

        .brand {
          position: fixed;
          left: 30px;
          top: 24px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #18212f;
          text-decoration: none;
        }

        .brand-logo-box {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.38);
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,.9), transparent 34%),
            linear-gradient(135deg, #111827, #a16207 48%, #06b6d4);
          box-shadow: 0 0 24px rgba(161,98,7,.18), inset 0 1px 0 rgba(255,255,255,.28);
          flex-shrink: 0;
        }

        .square-logo-mark {
          color: white;
          font-size: 30px;
          font-weight: 950;
          line-height: 1;
          transform: rotate(45deg);
          text-shadow: 0 0 18px rgba(255,255,255,.45);
        }

        .brand-word {
          font-size: 18px;
          font-weight: 950;
          letter-spacing: .16em;
          color: #18212f;
        }

        .top-actions {
          position: fixed;
          z-index: 10;
          right: 33px;
          top: 27px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn,
        .profile-orb-wrap {
          width: 49px;
          height: 49px;
          border-radius: 18px;
          border: 1px solid rgba(24,33,47,.1);
          background: rgba(255,255,255,.70);
          color: #18212f;
          display: grid;
          place-items: center;
          font-size: 19px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
          text-decoration: none;
        }

        .profile-orb-wrap {
          border-radius: 999px;
          overflow: hidden;
          background: radial-gradient(circle at 30% 20%, #fde68a, #8f7cff 38%, #58c4ff 70%);
          box-shadow: 0 0 28px rgba(124,58,237,.22);
        }

        .auth-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auth-btn {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 14px;
          font-weight: 950;
          text-decoration: none;
          white-space: nowrap;
        }

        .auth-login {
          border: 1px solid rgba(24,33,47,.1);
          background: rgba(255,255,255,.72);
          color: #18212f;
        }

        .auth-register {
          background: linear-gradient(135deg, #facc15, #67e8f9);
          color: #18212f;
          box-shadow: 0 16px 32px rgba(6,182,212,.16);
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-radius: 22px;
          padding: 20px 16px;
          margin-top: 88px;
          position: sticky;
          top: 118px;
          height: calc(100vh - 142px);
          overflow: hidden;
        }

        .sidebar::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(130deg, rgba(251,146,60,.12), transparent 36%, rgba(6,182,212,.08));
          pointer-events: none;
        }

        .nav {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 9px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 15px;
          height: 52px;
          padding: 0 14px;
          border-radius: 16px;
          color: rgba(24,33,47,.72);
          font-size: 16px;
          font-weight: 850;
          text-decoration: none;
        }

        .nav-item:hover,
        .nav-item.active {
          color: #075985;
          background: linear-gradient(90deg, rgba(251,146,60,.17), rgba(6,182,212,.11));
          box-shadow: inset 0 0 0 1px rgba(251,146,60,.16), 0 12px 28px rgba(92,64,42,.08);
        }

        .nav-icon {
          width: 23px;
          text-align: center;
          font-size: 18px;
        }

        .nav-badge {
          margin-left: auto;
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          border-radius: 999px;
          background: #facc15;
          color: #422006;
          font-size: 12px;
          font-weight: 900;
        }

        .open-call {
          position: relative;
          z-index: 1;
          margin-top: auto;
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 17px;
          border-radius: 18px;
          color: #18212f;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 950;
          text-align: left;
          text-decoration: none;
          background: linear-gradient(135deg, #facc15, #67e8f9 72%);
          box-shadow: 0 18px 34px rgba(6,182,212,.18);
        }

        .online {
          position: relative;
          z-index: 1;
          margin-top: 20px;
          border-radius: 999px;
          padding: 10px 13px;
          color: #5b6472;
          background: rgba(255,255,255,.52);
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 12px;
          letter-spacing: .08em;
          font-weight: 850;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: var(--green);
          box-shadow: 0 0 12px rgba(16,185,129,.45);
        }

        .square-center {
          min-width: 0;
          padding-top: 78px;
        }

        .hero-refresh {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          align-items: end;
          margin-bottom: 18px;
        }

        .square-center h1 {
          margin: 0;
          font-size: clamp(52px, 5.2vw, 86px);
          line-height: .94;
          letter-spacing: -.075em;
          font-weight: 950;
        }

        .gradient-text {
          background: linear-gradient(92deg, #0891b2, #2563eb 28%, #7c3aed 64%, #db2777);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.45;
          font-weight: 780;
        }

        .square-eyebrow {
          margin: 0 0 6px;
          color: #a16207;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .hero-mini-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          border-radius: 24px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.66);
          background: rgba(255,255,255,.58);
          box-shadow: 0 16px 45px rgba(92,64,42,.08), inset 0 1px 0 rgba(255,255,255,.9);
          backdrop-filter: blur(22px);
        }

        .hero-mini-stats div {
          border-radius: 18px;
          padding: 12px 10px;
          text-align: center;
          background: rgba(255,255,255,.62);
          border: 1px solid rgba(24,33,47,.06);
        }

        .hero-mini-stats b {
          display: block;
          color: #18212f;
          font-size: 22px;
          line-height: 1;
          font-weight: 950;
        }

        .hero-mini-stats span {
          display: block;
          margin-top: 5px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.2;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .square-section {
          position: relative;
          min-height: 640px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 40px;
          padding: 30px;
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,.16);
          background:
            radial-gradient(circle at 18% 20%, rgba(14,165,233,.22), transparent 28%),
            radial-gradient(circle at 84% 18%, rgba(236,72,153,.18), transparent 28%),
            radial-gradient(circle at 50% 88%, rgba(251,146,60,.20), transparent 30%),
            linear-gradient(135deg, #15110d 0%, #1e293b 42%, #020617 100%);
          box-shadow: 0 32px 100px rgba(0, 0, 0, .34), inset 0 1px 0 rgba(255,255,255,.12);
        }

        .square-head {
          position: relative;
          z-index: 4;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .square-head h2 {
          margin: 0;
          max-width: 680px;
          color: white;
          font-size: clamp(38px, 4.3vw, 76px);
          line-height: .88;
          letter-spacing: -.075em;
          font-weight: 950;
        }

        .square-head p {
          max-width: 390px;
          margin: 0;
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 700;
        }

        .square-map {
          position: absolute;
          left: 30px;
          right: 30px;
          top: 150px;
          bottom: 92px;
          border-radius: 34px;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255,255,255,.05) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,.10), transparent 34%),
            linear-gradient(135deg, rgba(120,53,15,.32), rgba(15,23,42,.48));
          background-size: 54px 54px, 54px 54px, auto, auto;
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14);
        }

        .square-floor {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(14,165,233,.12), transparent 26%),
            linear-gradient(115deg, transparent 0 44%, rgba(255,255,255,.08) 45%, transparent 46% 100%);
          animation: squareGlow 8s ease-in-out infinite;
        }

        @keyframes squareGlow {
          50% {
            opacity: .62;
            filter: saturate(1.25);
          }
        }

        .square-zone {
          position: absolute;
          z-index: 3;
          min-width: 148px;
          min-height: 116px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          padding: 16px;
          border-radius: 26px;
          text-decoration: none;
          color: white;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(2,6,23,.52);
          backdrop-filter: blur(18px);
          box-shadow: 0 20px 50px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.12);
          transition: transform .22s ease, background .22s ease, border-color .22s ease;
        }

        .square-zone:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255,255,255,.12);
          border-color: rgba(125,227,255,.44);
        }

        .square-zone span {
          font-size: 30px;
        }

        .square-zone b {
          font-size: 20px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.03em;
        }

        .square-zone small {
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 800;
        }

        .square-fountain {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          align-items: center;
          text-align: center;
          width: 170px;
          height: 170px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 30% 25%, rgba(103,232,249,.96), transparent 28%),
            radial-gradient(circle at 65% 65%, rgba(59,130,246,.92), transparent 38%),
            rgba(2,6,23,.62);
          box-shadow: 0 0 70px rgba(34,211,238,.35), inset 0 1px 0 rgba(255,255,255,.18);
          animation: fountainPulse 3.4s ease-in-out infinite;
        }

        .square-fountain:hover {
          transform: translate(-50%, calc(-50% - 8px)) scale(1.03);
        }

        @keyframes fountainPulse {
          50% {
            box-shadow: 0 0 100px rgba(34,211,238,.48), inset 0 1px 0 rgba(255,255,255,.18);
          }
        }

        .square-cafe {
          left: 6%;
          top: 14%;
        }

        .square-stage {
          right: 7%;
          top: 12%;
        }

        .square-board {
          left: 8%;
          bottom: 14%;
        }

        .square-people {
          right: 9%;
          bottom: 16%;
        }

        .square-terrace {
          left: 39%;
          top: 7%;
        }

        .square-center-cta {
          position: absolute;
          z-index: 5;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          min-width: 280px;
          min-height: 62px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 999px;
          color: #08111f;
          text-decoration: none;
          background: linear-gradient(135deg, #bef264, #67e8f9);
          box-shadow: 0 20px 50px rgba(34,211,238,.24);
        }

        .square-center-cta strong {
          font-size: 17px;
          font-weight: 950;
        }

        .square-center-cta span {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 850;
          opacity: .78;
        }

        .square-bottom {
          position: absolute;
          z-index: 5;
          left: 30px;
          right: 30px;
          bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,.12);
        }

        .square-bottom p {
          margin: 0;
          color: #cbd5e1;
          font-weight: 700;
        }

        .square-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .square-cta {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 13px;
          font-weight: 950;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .square-cta.primary {
          background: linear-gradient(135deg, var(--lime), var(--cyan));
          color: #06111f;
          border: 0;
          box-shadow: 0 18px 42px rgba(34,211,238,.18);
        }

        .walk-section {
          position: relative;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 38px;
          padding: 26px;
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,.16);
          background:
            radial-gradient(circle at 12% 0%, rgba(250,204,21,.26), transparent 28%),
            radial-gradient(circle at 92% 18%, rgba(6,182,212,.24), transparent 30%),
            radial-gradient(circle at 68% 92%, rgba(219,39,119,.17), transparent 30%),
            linear-gradient(135deg, #17110d, #292524 48%, #0f172a);
          box-shadow: 0 32px 100px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.14);
        }

        .walk-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .walk-head h2 {
          margin: 0;
          max-width: 720px;
          color: white;
          font-size: clamp(38px, 4vw, 72px);
          line-height: .86;
          letter-spacing: -.075em;
          font-weight: 950;
        }

        .walk-head p {
          max-width: 420px;
          margin: 0;
          color: #cbd5e1;
          line-height: 1.55;
          font-weight: 720;
        }

        .walk-modebar {
          position: sticky;
          top: 90px;
          z-index: 6;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 10px;
          border-radius: 24px;
          background: rgba(2,6,23,.34);
          border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(18px);
          scrollbar-width: none;
        }

        .walk-modebar::-webkit-scrollbar {
          display: none;
        }

        .walk-mode {
          flex: 0 0 auto;
          min-height: 42px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          padding: 0 15px;
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.82);
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .walk-mode.active {
          background: linear-gradient(135deg, #bef264, #67e8f9);
          color: #08111f;
          border-color: transparent;
          box-shadow: 0 16px 34px rgba(34,211,238,.14);
        }

        .walk-path {
          position: relative;
          display: grid;
          gap: 14px;
          margin-top: 18px;
          padding-left: 28px;
        }

        .walk-path::before {
          content: "";
          position: absolute;
          left: 12px;
          top: 12px;
          bottom: 12px;
          width: 2px;
          background: linear-gradient(180deg, #bef264, #67e8f9, #db2777, transparent);
          opacity: .55;
        }

        .walk-card {
          position: relative;
          display: grid;
          grid-template-columns: 74px minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          min-height: 138px;
          border-radius: 30px;
          padding: 18px;
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.13);
          background:
            radial-gradient(circle at 98% 12%, rgba(255,255,255,.12), transparent 28%),
            rgba(255,255,255,.08);
          backdrop-filter: blur(16px);
          transition: transform .22s ease, background .22s ease, border-color .22s ease;
        }

        .walk-card::before {
          content: "";
          position: absolute;
          left: -23px;
          top: 50%;
          width: 13px;
          height: 13px;
          border-radius: 999px;
          background: #bef264;
          box-shadow: 0 0 18px rgba(190,242,100,.72);
          transform: translateY(-50%);
        }

        .walk-card:hover {
          transform: translateY(-5px) scale(1.008);
          background: rgba(255,255,255,.13);
          border-color: rgba(103,232,249,.32);
        }

        .walk-icon {
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          border-radius: 25px;
          background: rgba(255,255,255,.12);
          font-size: 31px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
        }

        .walk-badge {
          display: inline-flex;
          width: fit-content;
          min-height: 28px;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          color: #17110d;
          background: rgba(250,204,21,.92);
          font-size: 11px;
          font-weight: 950;
        }

        .walk-card h3 {
          margin: 10px 0 6px;
          font-size: 26px;
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .walk-card p {
          margin: 0;
          color: rgba(255,255,255,.76);
          font-size: 14px;
          line-height: 1.45;
          font-weight: 680;
        }

        .walk-meta {
          color: rgba(255,255,255,.70);
          font-size: 12px;
          font-weight: 950;
          text-align: right;
          white-space: nowrap;
        }

        .walk-enter {
          display: inline-flex;
          margin-top: 8px;
          min-height: 34px;
          align-items: center;
          border-radius: 999px;
          padding: 0 12px;
          color: #08111f;
          background: linear-gradient(135deg, #bef264, #67e8f9);
          font-size: 12px;
          font-weight: 950;
        }

        .walk-bivio,
        .walk-bench,
        .walk-mission,
        .walk-change_square {
          background:
            radial-gradient(circle at 16% 0%, rgba(250,204,21,.18), transparent 32%),
            radial-gradient(circle at 88% 20%, rgba(6,182,212,.18), transparent 34%),
            rgba(255,255,255,.10);
        }

        .walk-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .walk-action {
          min-height: 58px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .walk-action:hover,
        .walk-action.active {
          background: rgba(255,255,255,.16);
          border-color: rgba(190,242,100,.42);
        }

        .need-section {
          position: relative;
          overflow: hidden;
          margin-top: 18px;
          border-radius: 34px;
          padding: 26px;
          border: 1px solid rgba(255,255,255,.16);
          background:
            radial-gradient(circle at 8% 10%, rgba(251,146,60,.18), transparent 28%),
            radial-gradient(circle at 92% 22%, rgba(34,211,238,.18), transparent 28%),
            linear-gradient(135deg, rgba(30,41,59,.96), rgba(15,23,42,.92));
          box-shadow: 0 22px 74px rgba(92,64,42,.14), inset 0 1px 0 rgba(255,255,255,.16);
          color: #f8fafc;
        }

        .need-section::after {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          right: -60px;
          bottom: -80px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(190,242,100,.22), transparent 70%);
          filter: blur(8px);
        }

        .need-head {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-end;
          margin-bottom: 18px;
        }

        .need-head h2 {
          margin: 0;
          max-width: 620px;
          color: #ffffff;
          font-size: clamp(34px, 3.2vw, 56px);
          line-height: .94;
          letter-spacing: -.06em;
          font-weight: 950;
        }

        .need-head p {
          max-width: 390px;
          margin: 0;
          color: #cbd5e1;
          line-height: 1.55;
          font-weight: 650;
        }

        .need-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .need-card {
          min-height: 154px;
          border-radius: 24px;
          padding: 18px;
          border: 1px solid rgba(255,255,255,.13);
          background: rgba(2,6,23,.42);
          color: #ffffff;
          text-decoration: none;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }

        .need-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,.10);
          border-color: rgba(34,211,238,.30);
        }

        .need-icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.10);
          font-size: 22px;
        }

        .need-card b {
          display: block;
          margin: 12px 0 8px;
          color: #ffffff;
          font-size: 18px;
          line-height: 1.05;
          letter-spacing: -.02em;
        }

        .need-card span {
          display: block;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 650;
        }

        .composer {
          position: relative;
          border-radius: 30px;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(251,146,60,.26);
          background:
            radial-gradient(ellipse at 38% 6%, rgba(251,146,60,.20), transparent 28%),
            radial-gradient(ellipse at 74% 54%, rgba(6,182,212,.14), transparent 32%),
            rgba(255,255,255,.86);
          box-shadow: 0 0 28px rgba(251,146,60,.10), 0 18px 45px rgba(92,64,42,.08);
        }

        .ai-composer {
          min-height: 238px;
          padding: 24px;
          margin-top: 18px;
        }

        .composer-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .ai-builder-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .ai-builder-head h2 {
          margin: 0;
          max-width: 680px;
          color: #18212f;
          font-size: clamp(24px, 2.2vw, 38px);
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .ai-step-pill {
          display: grid;
          place-items: center;
          min-width: 56px;
          height: 38px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(251,146,60,.16), rgba(6,182,212,.12));
          color: #92400e;
          font-size: 13px;
          font-weight: 950;
          border: 1px solid rgba(251,146,60,.22);
        }

        .ai-question-box {
          margin-top: 22px;
          border-radius: 22px;
          border: 1px solid rgba(120,53,15,.14);
          background: rgba(255,255,255,.72);
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
        }

        .ai-question-label {
          display: block;
          margin-bottom: 10px;
          color: #18212f;
          font-size: 15px;
          font-weight: 950;
        }

        .composer-input {
          width: 100%;
          min-height: 68px;
          resize: none;
          border: 0;
          outline: none;
          background: transparent;
          color: #18212f;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
        }

        .ai-input {
          min-height: 82px;
          font-weight: 750;
        }

        .composer-input::placeholder {
          color: rgba(91,100,114,.78);
        }

        .composer-actions {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .ai-actions {
          margin-top: 18px;
          flex-wrap: wrap;
          padding-right: 86px;
        }

        .mini-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(24,33,47,.08);
          background: rgba(248,250,252,.82);
          padding: 0 16px;
          color: #5b6472;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          font-family: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.82);
        }

        .mini-pill:disabled {
          cursor: not-allowed;
          opacity: .45;
        }

        .ai-primary-pill,
        .ai-open-button,
        .ai-open-cta {
          background: linear-gradient(135deg, #facc15, #67e8f9) !important;
          color: #18212f !important;
          border-color: rgba(251,146,60,.18) !important;
        }

        .hidden-file {
          display: none;
        }

        .mic {
          position: absolute;
          right: 19px;
          bottom: 23px;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 26px;
          border: 1px solid rgba(24,33,47,.08);
          box-shadow: 0 16px 36px rgba(6,182,212,.14);
          cursor: pointer;
        }

        .ai-preview {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-radius: 24px;
          padding: 18px 20px;
        }

        .ai-preview h3 {
          margin: 0;
          color: #18212f;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.035em;
        }

        .ai-preview p {
          margin: 8px 0 0;
          color: #5b6472;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 700;
          white-space: pre-line;
        }

        .ai-open-cta {
          flex: 0 0 auto;
          min-height: 48px;
          border: 0;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(6,182,212,.16);
          cursor: pointer;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin: 26px 0 20px;
        }

        .chip {
          height: 39px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          border: 1px solid rgba(24,33,47,.08);
          background: rgba(255,255,255,.64);
          color: #5b6472;
          padding: 0 19px;
          font-size: 14px;
          font-weight: 850;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
          cursor: pointer;
          font-family: inherit;
        }

        .chip.active {
          border-color: rgba(251,146,60,.24);
          background: linear-gradient(135deg, rgba(251,146,60,.18), rgba(6,182,212,.12));
          color: #92400e;
          box-shadow: 0 14px 28px rgba(92,64,42,.10);
        }

        .featured {
          position: relative;
          min-height: 310px;
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.18);
          background:
            radial-gradient(circle at 80% 0%, rgba(251,146,60,.20), transparent 30%),
            linear-gradient(180deg, rgba(31,41,55,.94), rgba(15,23,42,.88));
          box-shadow: 0 24px 90px rgba(92,64,42,.12), inset 0 1px 0 rgba(255,255,255,.12);
          color: #eff6ff;
        }

        .featured::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 78% 36%, rgba(219,39,119,.26), transparent 14%),
            radial-gradient(ellipse at 82% 26%, rgba(6,182,212,.28), transparent 26%),
            linear-gradient(165deg, transparent 0 42%, rgba(250,204,21,.14), transparent 57%);
          opacity: .88;
        }

        .featured-content {
          position: relative;
          z-index: 1;
          min-height: 310px;
          padding: 27px 27px 28px;
          display: flex;
          flex-direction: column;
        }

        .badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          border-radius: 999px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.12);
          padding: 0 15px;
          color: rgba(255,255,255,.92);
          font-size: 13px;
          font-weight: 900;
        }

        .status {
          position: absolute;
          right: 24px;
          top: 22px;
        }

        .featured h2 {
          margin: 34px 0 9px;
          font-size: 40px;
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .featured p {
          margin: 0;
          color: #dbeafe;
          font-size: 17px;
          font-weight: 650;
        }

        .call-meta {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 24px;
        }

        .plus-count {
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          padding: 10px 14px;
          font-weight: 900;
          color: white;
        }

        .active-count {
          border-left: 1px solid rgba(255,255,255,.14);
          padding-left: 18px;
          font-size: 14px;
          color: rgba(255,255,255,.92);
          font-weight: 750;
        }

        .active-count b {
          font-size: 20px;
          color: white;
        }

        .speaking {
          color: #bfdbfe;
          display: block;
          font-weight: 650;
        }

        .call-actions {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .call-action {
          min-width: 140px;
          height: 52px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.92);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          padding: 0 18px;
          cursor: pointer;
        }

        .primary-cta {
          margin-left: auto;
          width: 300px;
          height: 58px;
          border-radius: 999px;
          border: 0;
          color: #18212f;
          font-size: 21px;
          font-weight: 950;
          background: linear-gradient(100deg, #facc15, #67e8f9);
          box-shadow: 0 18px 34px rgba(6,182,212,.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .home-preview {
          margin-top: 18px;
          border-radius: 28px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,.64);
          background:
            radial-gradient(circle at 8% 0%, rgba(251,146,60,.14), transparent 28%),
            radial-gradient(circle at 92% 20%, rgba(6,182,212,.12), transparent 30%),
            linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,247,237,.66));
          box-shadow: 0 22px 74px rgba(92,64,42,.10), inset 0 1px 0 rgba(255,255,255,.92);
          backdrop-filter: blur(24px) saturate(1.2);
        }

        .home-preview-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .home-preview-head h2 {
          margin: 0;
          color: #18212f;
          font-size: clamp(28px, 2.8vw, 46px);
          line-height: .95;
          letter-spacing: -.05em;
          font-weight: 950;
        }

        .home-preview-head p:last-child {
          max-width: 430px;
          margin: 0;
          color: #5b6472;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 750;
        }

        .home-preview-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .preview-card {
          position: relative;
          min-height: 210px;
          overflow: hidden;
          border-radius: 22px;
          padding: 16px;
          border: 1px solid rgba(24,33,47,.08);
          background:
            radial-gradient(circle at 12% 0%, rgba(255,255,255,.72), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,.76), rgba(255,247,237,.60));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.92), 0 16px 38px rgba(92,64,42,.08);
        }

        .preview-card::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .85;
          pointer-events: none;
        }

        .preview-cyan::before {
          background: radial-gradient(circle at 100% 0%, rgba(6,182,212,.18), transparent 42%);
        }

        .preview-violet::before {
          background: radial-gradient(circle at 100% 0%, rgba(124,58,237,.18), transparent 42%);
        }

        .preview-pink::before {
          background: radial-gradient(circle at 100% 0%, rgba(219,39,119,.16), transparent 42%);
        }

        .preview-blue::before {
          background: radial-gradient(circle at 100% 0%, rgba(37,99,235,.16), transparent 42%);
        }

        .preview-green::before {
          background: radial-gradient(circle at 100% 0%, rgba(163,230,53,.22), transparent 42%);
        }

        .preview-card-top,
        .preview-card-body {
          position: relative;
          z-index: 1;
        }

        .preview-card-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .preview-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          border-radius: 16px;
          background: rgba(255,255,255,.78);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 12px 28px rgba(92,64,42,.08);
          font-size: 21px;
        }

        .preview-card h3 {
          margin: 0 0 6px;
          color: #18212f;
          font-size: 18px;
          line-height: 1;
          letter-spacing: -.025em;
          font-weight: 950;
        }

        .preview-card a {
          color: #92400e;
          font-size: 12px;
          font-weight: 950;
          text-decoration: none;
        }

        .preview-card-body {
          display: grid;
          gap: 9px;
        }

        .mini-preview-line {
          border-radius: 15px;
          padding: 11px 12px;
          background: rgba(255,255,255,.64);
          border: 1px solid rgba(24,33,47,.06);
        }

        .mini-preview-line strong {
          display: block;
          color: #18212f;
          font-size: 13px;
          line-height: 1.25;
          font-weight: 950;
        }

        .mini-preview-line span {
          display: block;
          margin-top: 4px;
          color: #5b6472;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 700;
        }

        .host-card,
        .world-news-card {
          margin-top: 16px;
          border-radius: 24px;
          padding: 18px 22px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 18px;
          align-items: center;
        }

        .trend-grid {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
        }

        .trend-item {
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(24,33,47,.08);
          background: rgba(255,255,255,.58);
        }

        .trend-title {
          font-weight: 950;
          margin-bottom: 6px;
        }

        .trend-text {
          color: #5b6472;
          line-height: 1.5;
          font-weight: 700;
          font-size: 13px;
        }

        .world-news-card {
          display: block;
          border-radius: 26px;
          padding: 22px;
        }

        .world-news-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .world-news-head h2 {
          margin: 0;
          max-width: 720px;
          color: #18212f;
          font-size: clamp(25px, 2.3vw, 40px);
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .world-news-main-cta {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border-radius: 999px;
          padding: 0 18px;
          background: linear-gradient(135deg, #facc15, #67e8f9);
          color: #18212f;
          font-size: 13px;
          font-weight: 950;
          text-decoration: none;
        }

        .world-news-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .world-news-item {
          min-height: 190px;
          border-radius: 20px;
          border: 1px solid rgba(24,33,47,.08);
          background:
            radial-gradient(circle at 20% 0%, rgba(251,146,60,.13), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.78), rgba(255,247,237,.62));
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
        }

        .world-news-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .world-news-item h3 {
          margin: 13px 0 8px;
          color: #18212f;
          font-size: 18px;
          line-height: 1.15;
          letter-spacing: -.025em;
          font-weight: 950;
        }

        .world-news-item p {
          margin: 0;
          color: #5b6472;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
        }

        .world-news-actions {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .world-news-actions a {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          border-radius: 999px;
          padding: 0 12px;
          background: rgba(255,255,255,.72);
          color: #92400e;
          font-size: 12px;
          font-weight: 950;
          text-decoration: none;
          border: 1px solid rgba(251,146,60,.16);
        }

        .world-news-actions a:last-child {
          background: linear-gradient(135deg, rgba(250,204,21,.88), rgba(103,232,249,.88));
          color: #18212f;
        }

        .world-news-empty {
          grid-column: 1 / -1;
          border-radius: 20px;
          padding: 18px;
          background: rgba(255,255,255,.58);
          color: #5b6472;
          font-weight: 850;
        }

        .host-left {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .host-orb {
          width: 92px;
          height: 92px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #fff;
          font-size: 26px;
          font-weight: 950;
          background: radial-gradient(circle at 34% 25%, #facc15, #8f7cff 32%, #67e8f9 54%, #15314f 78%);
          box-shadow: 0 0 34px rgba(6,182,212,.18), inset 0 0 16px rgba(255,255,255,.16);
        }

        .host-orb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .host-name {
          font-size: 24px;
          font-weight: 950;
          margin-bottom: 2px;
        }

        .host-title,
        .host-bio {
          color: #5b6472;
          font-size: 14px;
          font-weight: 700;
        }

        .host-bio {
          font-size: 13px;
          line-height: 1.35;
          max-width: 300px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-left: 1px solid rgba(24,33,47,.08);
        }

        .metric {
          padding-left: 22px;
          border-right: 1px solid rgba(24,33,47,.08);
        }

        .metric:last-child {
          border-right: 0;
        }

        .metric span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .metric b {
          display: block;
          margin-top: 8px;
          font-size: 23px;
          color: #0891b2;
        }

        .metric:nth-child(2) b {
          color: #65a30d;
        }

        .metric:nth-child(3) b {
          color: #2563eb;
        }

        .live-strip {
          margin-top: 16px;
          border-radius: 24px;
          padding: 14px 16px;
          background: rgba(255,255,255,.58);
          border: 1px solid rgba(255,255,255,.64);
          box-shadow: 0 20px 50px rgba(92,64,42,.08);
        }

        .strip-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .strip-title {
          font-size: 19px;
          font-weight: 950;
        }

        .see-all {
          color: #5b6472;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }

        .call-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .mini-card {
          min-height: 84px;
          border-radius: 16px;
          padding: 10px;
          border: 1px solid rgba(24,33,47,.08);
          background: linear-gradient(135deg, rgba(251,146,60,.16), rgba(255,255,255,.70));
          overflow: hidden;
          position: relative;
          font-weight: 900;
          font-size: 13px;
          line-height: 1.15;
          color: #18212f;
          text-decoration: none;
        }

        .mini-status {
          font-size: 10px;
          color: #047857;
          display: block;
          margin-bottom: 8px;
        }

        .mini-score {
          position: absolute;
          left: 11px;
          bottom: 7px;
          color: #92400e;
          font-size: 11px;
        }

        .right {
          padding-top: 76px;
          display: grid;
          gap: 18px;
          align-content: start;
          min-height: 0;
        }

        .panel {
          border-radius: 24px;
          padding: 22px;
          overflow: hidden;
          position: relative;
          min-height: 250px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -.03em;
        }

        .panel-title small {
          font-size: 14px;
          color: #5b6472;
          font-weight: 850;
          letter-spacing: 0;
        }

        .echo-body {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 14px;
          height: auto;
        }

        .inner {
          border: 1px solid rgba(24,33,47,.08);
          background: rgba(255,255,255,.50);
          border-radius: 18px;
          padding: 16px;
        }

        .inner h4 {
          margin: 0 0 15px;
          color: #64748b;
          font-size: 14px;
          letter-spacing: .04em;
        }

        .insight {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 13px;
          align-items: start;
          margin-bottom: 18px;
          color: #18212f;
          font-size: 15px;
          line-height: 1.45;
          font-weight: 700;
        }

        .insight-icon {
          width: 31px;
          height: 31px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(251,146,60,.12);
          color: #92400e;
          border: 1px solid rgba(251,146,60,.18);
        }

        .mood-wrap {
          display: grid;
          place-items: center;
          height: 74%;
        }

        .mood-blob {
          width: 160px;
          height: 139px;
          display: grid;
          place-items: center;
          text-align: center;
          color: white;
          background:
            radial-gradient(circle at 28% 30%, rgba(251,146,60,.94), transparent 31%),
            radial-gradient(circle at 75% 35%, rgba(219,39,119,.76), transparent 32%),
            radial-gradient(circle at 60% 70%, rgba(6,182,212,.78), transparent 42%);
          filter: drop-shadow(0 0 18px rgba(219,39,119,.20));
          border-radius: 45% 55% 52% 48% / 46% 38% 62% 54%;
          animation: morph 7s ease-in-out infinite;
        }

        .mood-blob b {
          font-size: 21px;
        }

        .mood-blob span {
          display: block;
          margin-top: 9px;
          font-size: 13px;
          color: rgba(255,255,255,.82);
        }

        @keyframes morph {
          50% {
            border-radius: 56% 44% 44% 56% / 35% 57% 43% 65%;
            transform: rotate(2deg) scale(1.04);
          }
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 14px;
          font-size: 11px;
          color: #64748b;
        }

        .legend i {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 99px;
          margin-right: 5px;
          background: #facc15;
        }

        .legend span:nth-child(2) i {
          background: var(--coral);
        }

        .legend span:nth-child(3) i {
          background: var(--cyan);
        }

        .pulse {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: center;
          height: calc(100% - 42px);
        }

        .radial {
          width: 230px;
          height: 230px;
          border-radius: 999px;
          margin: auto;
          display: grid;
          place-items: center;
          position: relative;
          background:
            repeating-radial-gradient(circle, transparent 0 12px, rgba(251,146,60,.13) 13px 14px),
            conic-gradient(from -15deg, transparent 0 18deg, #facc15 38deg, var(--lime) 120deg, var(--cyan) 240deg, transparent 310deg),
            radial-gradient(circle, rgba(251,146,60,.16), transparent 52%);
          box-shadow: 0 0 36px rgba(251,146,60,.18);
        }

        .radial::before {
          content: "";
          position: absolute;
          inset: 42px;
          border-radius: inherit;
          background: rgba(255,255,255,.88);
          box-shadow: inset 0 0 20px rgba(24,33,47,.06);
        }

        .radial::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 126%;
          background: linear-gradient(transparent, rgba(251,146,60,.65), rgba(6,182,212,.52), transparent);
          filter: blur(2px);
        }

        .pulse-score {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 35px;
          font-weight: 950;
          color: #18212f;
        }

        .pulse-score span {
          display: block;
          font-size: 13px;
          color: #64748b;
          font-weight: 800;
        }

        .momentum h4 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 850;
        }

        .momentum p {
          margin: 0 0 28px;
          color: #5b6472;
          font-size: 13px;
          font-weight: 700;
        }

        .chart {
          width: 100%;
          height: 86px;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.60), rgba(255,255,255,.24));
        }

        .chart svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        @media (max-width: 1780px) {
          .square-app {
            grid-template-columns: 232px minmax(0, 1fr);
            gap: 26px;
            padding-right: 26px;
          }

          .right {
            grid-column: 2;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding-top: 0;
          }

          .panel {
            min-height: 280px;
          }

          .echo-body,
          .pulse {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .radial {
            width: 170px;
            height: 170px;
          }

          .radial::before {
            inset: 32px;
          }

          .chart {
            height: 76px;
          }

          .sidebar {
            height: auto;
            min-height: calc(100vh - 142px);
          }
        }

        @media (max-width: 1280px) {
          .square-app {
            grid-template-columns: 210px minmax(0, 1fr);
          }

          .right,
          .trend-grid,
          .world-news-grid {
            grid-template-columns: 1fr;
          }

          .hero-refresh {
            grid-template-columns: 1fr;
          }

          .home-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .need-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .walk-card {
            grid-template-columns: 60px minmax(0, 1fr);
          }

          .walk-meta {
            grid-column: 2;
            text-align: left;
          }
        }

        @media (max-width: 860px) {
          .brand {
            position: relative;
            left: auto;
            top: auto;
            width: calc(100% - 28px);
            margin: 18px auto 12px;
            justify-content: center;
            gap: 12px;
            transform: none;
          }

          .brand-logo-box {
            width: 46px;
            height: 46px;
            border-radius: 16px;
          }

          .brand-word {
            font-size: 15px;
            letter-spacing: .12em;
          }

          .top-actions {
            position: absolute;
            top: 20px;
            right: 14px;
            gap: 7px;
          }

          .top-actions .icon-btn {
            display: none;
          }

          .profile-orb-wrap {
            width: 38px;
            height: 38px;
          }

          .auth-actions {
            gap: 6px;
          }

          .auth-btn {
            min-height: 38px;
            padding: 0 12px;
            font-size: 12px;
          }

          .auth-register {
            display: none;
          }

          .square-app {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            padding: 0 14px 124px;
            gap: 16px;
          }

          .sidebar {
            order: 3;
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            top: auto;
            z-index: 50;
            margin: 0;
            min-height: 0;
            height: auto;
            max-width: calc(100vw - 24px);
            border-radius: 24px;
            padding: 9px;
            background: rgba(255,255,255,.90);
            backdrop-filter: blur(26px) saturate(1.4);
            box-shadow: 0 18px 60px rgba(92,64,42,.18), inset 0 1px 0 rgba(255,255,255,.9);
            overflow: hidden;
          }

          .sidebar::before,
          .online {
            display: none;
          }

          .nav {
            position: relative;
            z-index: 1;
            display: flex;
            grid-template-columns: none;
            gap: 8px;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0 2px 2px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .nav::-webkit-scrollbar {
            display: none;
          }

          .nav-item,
          .nav-item:nth-child(n+6) {
            position: relative;
            display: flex !important;
            flex: 0 0 76px;
            width: 76px;
            height: 58px;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 6px 4px;
            border-radius: 18px;
            font-size: 10px;
            line-height: 1;
            gap: 5px;
            text-align: center;
            scroll-snap-align: start;
          }

          .nav-icon {
            width: auto;
            font-size: 21px;
            line-height: 1;
            filter: none;
          }

          .nav-label {
            display: block;
            max-width: 68px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: rgba(24,33,47,.72);
            font-size: 10px;
            font-weight: 900;
          }

          .nav-item.active .nav-label,
          .nav-item:hover .nav-label {
            color: #92400e;
          }

          .nav-badge {
            position: absolute;
            right: 7px;
            top: 5px;
            width: 18px;
            height: 18px;
            min-width: 18px;
            font-size: 10px;
            margin-left: 0;
          }

          .open-call {
            position: fixed;
            right: 18px;
            bottom: 84px;
            width: 64px;
            min-height: 64px;
            height: 64px;
            border-radius: 24px;
            padding: 0;
            justify-content: center;
            text-align: center;
            font-size: 0;
          }

          .open-call::before {
            content: "+";
            font-size: 36px;
            line-height: 1;
          }

          .open-call span {
            display: none;
          }

          .square-center {
            order: 1;
            padding-top: 4px;
          }

          .hero-refresh {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-mini-stats {
            grid-template-columns: repeat(3, 1fr);
          }

          .square-center h1 {
            max-width: 360px;
            margin: 0 auto;
            text-align: center;
            font-size: clamp(42px, 13.6vw, 58px);
            line-height: .92;
            letter-spacing: -.07em;
          }

          .subtitle {
            max-width: 320px;
            margin: 12px auto 18px;
            text-align: center;
            font-size: 14px;
            line-height: 1.45;
          }

          .square-section {
            min-height: 720px;
            padding: 22px;
            border-radius: 30px;
          }

          .square-head {
            flex-direction: column;
          }

          .square-head h2 {
            font-size: 42px;
          }

          .square-map {
            top: 230px;
            left: 18px;
            right: 18px;
            bottom: 110px;
            border-radius: 26px;
          }

          .square-zone {
            min-width: 116px;
            min-height: 92px;
            padding: 12px;
            border-radius: 20px;
          }

          .square-zone span {
            font-size: 23px;
          }

          .square-zone b {
            font-size: 15px;
          }

          .square-zone small {
            font-size: 10px;
          }

          .square-fountain {
            width: 130px;
            height: 130px;
          }

          .square-cafe {
            left: 4%;
            top: 9%;
          }

          .square-stage {
            right: 4%;
            top: 9%;
          }

          .square-board {
            left: 4%;
            bottom: 23%;
          }

          .square-people {
            right: 4%;
            bottom: 23%;
          }

          .square-terrace {
            left: 50%;
            top: 34%;
            transform: translateX(-50%);
          }

          .square-center-cta {
            min-width: 230px;
            bottom: 16px;
          }

          .square-bottom {
            left: 22px;
            right: 22px;
            bottom: 18px;
            flex-direction: column;
            align-items: flex-start;
          }

          .walk-section {
            border-radius: 30px;
            padding: 20px;
          }

          .walk-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .walk-head h2 {
            font-size: 42px;
          }

          .walk-modebar {
            top: 12px;
          }

          .walk-path {
            padding-left: 20px;
          }

          .walk-path::before {
            left: 7px;
          }

          .walk-card {
            grid-template-columns: 1fr;
            min-height: 0;
            padding: 16px;
          }

          .walk-card::before {
            left: -19px;
          }

          .walk-icon {
            width: 56px;
            height: 56px;
            border-radius: 19px;
            font-size: 25px;
          }

          .walk-meta {
            grid-column: auto;
            text-align: left;
          }

          .walk-actions {
            grid-template-columns: 1fr;
          }

          .need-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .need-head h2 {
            font-size: 42px;
          }

          .need-grid {
            grid-template-columns: 1fr;
          }

          .ai-composer {
            min-height: 260px;
            padding: 18px;
          }

          .ai-builder-head,
          .world-news-head {
            flex-direction: column;
          }

          .ai-preview {
            flex-direction: column;
            align-items: stretch;
          }

          .ai-open-cta,
          .world-news-main-cta {
            width: 100%;
          }

          .ai-actions {
            gap: 8px;
            padding-right: 58px;
          }

          .mini-pill {
            height: 36px;
            padding: 0 12px;
            font-size: 12px;
          }

          .mic {
            width: 54px;
            height: 54px;
            right: 15px;
            bottom: 17px;
            font-size: 21px;
          }

          .chips {
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 9px;
            margin: 17px -14px 16px;
            padding: 0 14px 6px;
            scrollbar-width: none;
          }

          .chips::-webkit-scrollbar {
            display: none;
          }

          .chip {
            flex: 0 0 auto;
            height: 37px;
            padding: 0 15px;
            font-size: 12px;
            white-space: nowrap;
          }

          .featured {
            min-height: 360px;
            border-radius: 28px;
          }

          .featured-content {
            min-height: 360px;
            padding: 20px;
          }

          .status {
            right: 16px;
            top: 16px;
          }

          .featured h2 {
            margin-top: 48px;
            max-width: 270px;
            font-size: 34px;
            line-height: .98;
          }

          .featured p {
            max-width: 280px;
            font-size: 14px;
            line-height: 1.5;
          }

          .call-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 13px;
            margin-top: 20px;
          }

          .active-count {
            border-left: 0;
            padding-left: 0;
            font-size: 13px;
          }

          .active-count b {
            font-size: 18px;
          }

          .call-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            width: 100%;
          }

          .call-action {
            min-width: 0;
            height: 44px;
            font-size: 12px;
          }

          .primary-cta {
            grid-column: 1 / -1;
            width: 100%;
            height: 54px;
            margin-left: 0;
            font-size: 19px;
          }

          .home-preview {
            border-radius: 25px;
            padding: 18px;
          }

          .home-preview-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .home-preview-head p:last-child {
            max-width: none;
          }

          .home-preview-grid {
            grid-template-columns: 1fr;
          }

          .preview-card {
            min-height: auto;
          }

          .host-card {
            grid-template-columns: 1fr;
            gap: 17px;
            border-radius: 25px;
            padding: 18px;
          }

          .host-left {
            gap: 15px;
          }

          .host-orb {
            width: 74px;
            height: 74px;
            flex: 0 0 auto;
          }

          .host-name {
            font-size: 22px;
          }

          .host-bio {
            max-width: none;
          }

          .metrics {
            grid-template-columns: repeat(3, 1fr);
            border-left: 0;
            border-top: 1px solid rgba(24,33,47,.08);
            padding-top: 14px;
          }

          .metric {
            padding-left: 0;
            text-align: center;
          }

          .metric span {
            font-size: 10px;
            min-height: 28px;
          }

          .metric b {
            font-size: 20px;
          }

          .live-strip {
            border-radius: 25px;
            padding: 14px;
          }

          .call-grid {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .call-grid::-webkit-scrollbar {
            display: none;
          }

          .mini-card {
            flex: 0 0 148px;
          }

          .right {
            order: 2;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding-top: 0;
          }

          .panel {
            border-radius: 25px;
            padding: 18px;
          }

          .panel-title {
            font-size: 24px;
            margin-bottom: 14px;
          }

          .panel-title small {
            font-size: 12px;
          }

          .echo-body,
          .pulse {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .mood-wrap {
            height: auto;
            padding: 12px 0 16px;
          }

          .mood-blob {
            width: 142px;
            height: 122px;
          }

          .radial {
            width: 210px;
            height: 210px;
          }

          .momentum {
            width: 100%;
          }

          .chart {
            height: 82px;
          }
        }

        @media (max-width: 420px) {
          .anon-pill {
            display: none;
          }

          .hero-mini-stats {
            grid-template-columns: 1fr;
          }

          .featured h2 {
            font-size: 31px;
          }

          .call-action {
            font-size: 11px;
          }

          .metric span {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}

function TopChrome({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <>
      <Link href="/" className="brand" aria-label="The Square home">
        <span className="brand-logo-box">
          <span className="square-logo-mark">□</span>
        </span>
        <span className="brand-word">THE SQUARE</span>
      </Link>

      <div className="top-actions">
        <Link href="/search" className="icon-btn" aria-label="Cerca">
          🔎
        </Link>

        <Link href="/events" className="icon-btn" aria-label="Eventi">
          📍
        </Link>

        <Link href="/people" className="icon-btn" aria-label="Persone">
          👥
        </Link>

        {isLoggedIn ? (
          <Link href="/profile" className="profile-orb-wrap" aria-label="Profilo">
            <ProfileOrb className="h-full w-full" />
          </Link>
        ) : (
          <div className="auth-actions">
            <Link href="/login" className="auth-btn auth-login">
              Login
            </Link>
            <Link href="/login?mode=register" className="auth-btn auth-register">
              Entra in piazza
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function Sidebar({ notificationCount }: { notificationCount: number }) {
  return (
    <aside className="sidebar glass">
      <nav className="nav">
        {navItems
          .filter((item): item is [string, string, string] => Array.isArray(item) && item.length >= 3)
          .map(([icon, label, href], index) => (
            <Link key={label} href={href} className={`nav-item ${index === 0 ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {label === 'Notifiche' && notificationCount > 0 && <span className="nav-badge">{notificationCount}</span>}
            </Link>
          ))}
      </nav>

      <Link href="/calls/new" className="open-call">
        <span>
          Apri
          <br />
          uno Spunto
        </span>
        <span>✦</span>
      </Link>

      <div className="online">
        <span className="dot" />
        The Square aperta
      </div>
    </aside>
  );
}

function FeaturedThought({
  thought,
  currentUserId,
  onCloseEarly,
  closingSlug,
}: {
  thought: LiveThought;
  currentUserId: string | null;
  onCloseEarly: (slug: string) => void;
  closingSlug: string | null;
}) {
  const canClose = Boolean(currentUserId && thought.host_id === currentUserId);

  return (
    <article className="featured">
      <div className="featured-content">
        <span className="badge">★ Spunto in piazza</span>
        <span className="badge status">
          <span className="dot" /> In corso
        </span>

        <h2>{thought.title}</h2>
        <p>{thought.description || 'Spunto aperto su The Square.'}</p>

        <div className="call-meta">
          <div className="avatars">
            <span className="plus-count">↯ Pulse {thought.pulse_score || 0}</span>
          </div>

          <div className="active-count">
            <span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />
            <b>{thought.participants || 0}</b> partecipanti attivi
            <span className="speaking">Host: {thought.host_name || 'Utente Square'}</span>
          </div>
        </div>

        <div className="call-actions">
          <Link href={`/c/${thought.slug}?mode=chat`} className="call-action">
            ▱ Chat
          </Link>

          <Link href={`/c/${thought.slug}`} className="primary-cta">
            Entra nello Spunto →
          </Link>

          {canClose && (
            <button type="button" onClick={() => onCloseEarly(thought.slug)} className="call-action">
              {closingSlug === thought.slug ? 'Chiusura…' : 'Chiudi → Outcome'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SquareMap() {
  return (
    <section className="square-section">
      <div className="square-head">
        <div>
          <p className="square-eyebrow">Piazza live</p>
          <h2>La piazza si muove intorno a te</h2>
        </div>

        <p>
          Ogni area è un punto vivo della community: entra in una conversazione, trova persone,
          scopri eventi o trasforma una notizia in uno Spunto.
        </p>
      </div>

      <div className="square-map">
        <div className="square-floor" />

        <Link href="/spaces" className="square-zone square-fountain">
          <span>⛲</span>
          <b>Fontana</b>
          <small>Spunti caldi</small>
        </Link>

        <Link href="/messages" className="square-zone square-cafe">
          <span>☕</span>
          <b>Caffè</b>
          <small>Chat e messaggi</small>
        </Link>

        <Link href="/events" className="square-zone square-stage">
          <span>🎤</span>
          <b>Palco</b>
          <small>Eventi live</small>
        </Link>

        <Link href="/world-news" className="square-zone square-board">
          <span>📰</span>
          <b>Bacheca</b>
          <small>News dal mondo</small>
        </Link>

        <Link href="/people" className="square-zone square-people">
          <span>👥</span>
          <b>Panchine</b>
          <small>Persone affini</small>
        </Link>

        <Link href="/echo" className="square-zone square-terrace">
          <span>🧠</span>
          <b>Terrazza</b>
          <small>Echo e trend</small>
        </Link>

        <Link href="/calls/new" className="square-center-cta">
          <strong>Apri uno Spunto</strong>
          <span>Porta qualcosa in piazza →</span>
        </Link>
      </div>

      <div className="square-bottom">
        <p>
          <strong>La piazza è aperta</strong> · conversazioni, eventi e segnali aggiornati in tempo reale
        </p>

        <div className="square-actions">
          <Link href="/spaces" className="square-cta primary">
            Esplora la piazza →
          </Link>

          <Link href="/calls/new" className="square-cta">
            Crea uno Spunto
          </Link>
        </div>
      </div>
    </section>
  );
}

function InfiniteWalkSection({
  thoughts,
  worldNews,
  walkMode,
  setWalkMode,
}: {
  thoughts: LiveThought[];
  worldNews: WorldNewsItem[];
  walkMode: WalkMode;
  setWalkMode: (mode: WalkMode) => void;
}) {
  const items = buildWalkItems(thoughts, worldNews, walkMode);

  const iconMap: Record<string, string> = {
    moment: '⚡',
    person: '👥',
    event: '📍',
    news: '📰',
    bivio: '🧭',
    echo: '🧠',
    bench: '🪑',
    mission: '🏁',
    change_square: '🏛️',
  };

  return (
    <section className="walk-section" id="passeggiata">
      <div className="walk-head">
        <div>
          <p className="square-eyebrow">Passeggiata infinita</p>
          <h2>Non scrollare. Passeggia.</h2>
        </div>
        <p>
          Il feed non è una lista casuale: è un percorso con Momenti, persone, eventi, Bivi,
          Panchine e Missioni. Ogni scroll deve portarti da qualche parte.
        </p>
      </div>

      <div className="walk-modebar" aria-label="Scegli la direzione della Passeggiata">
        <button type="button" onClick={() => setWalkMode('piazza')} className={`walk-mode ${walkMode === 'piazza' ? 'active' : ''}`}>
          🏛️ Piazza
        </button>
        <button type="button" onClick={() => setWalkMode('people')} className={`walk-mode ${walkMode === 'people' ? 'active' : ''}`}>
          👥 Persone
        </button>
        <button type="button" onClick={() => setWalkMode('understand')} className={`walk-mode ${walkMode === 'understand' ? 'active' : ''}`}>
          🧠 Capire
        </button>
        <button type="button" onClick={() => setWalkMode('do')} className={`walk-mode ${walkMode === 'do' ? 'active' : ''}`}>
          📍 Fare
        </button>
      </div>

      <div className="walk-path">
        {items.map((item, index) => (
          <Link href={item.href} key={`${item.type}-${item.title}-${index}`} className={`walk-card walk-${item.type}`}>
            <div className="walk-icon">{iconMap[item.type] || '□'}</div>
            <div>
              <span className="walk-badge">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>

              {item.type === 'bivio' && (
                <div className="walk-actions" onClick={(event) => event.preventDefault()}>
                  <button type="button" className={`walk-action ${walkMode === 'people' ? 'active' : ''}`} onClick={() => setWalkMode('people')}>
                    👥 Persone
                  </button>
                  <button type="button" className={`walk-action ${walkMode === 'understand' ? 'active' : ''}`} onClick={() => setWalkMode('understand')}>
                    🧠 Capire
                  </button>
                  <button type="button" className={`walk-action ${walkMode === 'do' ? 'active' : ''}`} onClick={() => setWalkMode('do')}>
                    📍 Fare
                  </button>
                </div>
              )}
            </div>
            <div className="walk-meta">
              <span>{item.meta}</span>
              <span className="walk-enter">Entra →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NeedSomeoneSection() {
  return (
    <section className="need-section">
      <div className="need-head">
        <div>
          <p className="square-eyebrow">Cosa vuoi fare in piazza?</p>
          <h2>Scegli un punto di partenza</h2>
        </div>

        <p>
          The Square non ti chiede di pubblicare per forza. Ti aiuta a partire da un bisogno reale.
        </p>
      </div>

      <div className="need-grid">
        <Link href={buildSpuntoHref('Ho bisogno di un consiglio', 'Capire')} className="need-card">
          <div className="need-icon">🧭</div>
          <b>Chiedi consiglio</b>
          <span>Porta un dubbio in piazza e ricevi punti di vista utili.</span>
        </Link>

        <Link href={buildSpuntoHref('Voglio confrontarmi con esperienze simili', 'Feedback')} className="need-card">
          <div className="need-icon">🪞</div>
          <b>Trova esperienze simili</b>
          <span>Incontra chi ha vissuto qualcosa di vicino al tuo momento.</span>
        </Link>

        <Link href="/events" className="need-card">
          <div className="need-icon">📍</div>
          <b>Scopri eventi</b>
          <span>Dal Centro Italia alla tua community: eventi che diventano conversazioni.</span>
        </Link>

        <Link href="/world-news" className="need-card">
          <div className="need-icon">📰</div>
          <b>Parti da una notizia</b>
          <span>Trasforma una news in uno Spunto da discutere con gli altri.</span>
        </Link>
      </div>
    </section>
  );
}

function HomeSectionsPreview({
  thoughts,
  trendEchoes,
  worldNews,
  notificationCount,
  currentUserId,
}: {
  thoughts: LiveThought[];
  trendEchoes: TrendEcho[];
  worldNews: WorldNewsItem[];
  notificationCount: number;
  currentUserId: string | null;
}) {
  const firstThought = thoughts[0];
  const secondThought = thoughts[1];
  const firstNews = worldNews[0];
  const secondNews = worldNews[1];

  return (
    <section className="home-preview">
      <div className="home-preview-head">
        <div>
          <p className="square-eyebrow">Esplora The Square</p>
          <h2>La tua piazza viva</h2>
        </div>

        <p>Tutte le aree principali in anteprima: entra, scopri cosa sta succedendo e apri nuovi Spunti.</p>
      </div>

      <div className="home-preview-grid">
        <PreviewCard icon="⛲" title="Fontana" href="/spaces" cta="Vedi Spunti" accent="cyan">
          {firstThought ? (
            <>
              <MiniPreviewLine
                title={firstThought.title}
                text={`Pulse ${firstThought.pulse_score || 0} · ${firstThought.participants || 0} partecipanti`}
              />
              {secondThought && (
                <MiniPreviewLine title={secondThought.title} text={`Host: ${secondThought.host_name || 'Utente Square'}`} />
              )}
            </>
          ) : (
            <MiniPreviewLine title="Nessuno Spunto attivo" text="Apri il primo Spunto e avvia la conversazione." />
          )}
        </PreviewCard>

        <PreviewCard icon="🧠" title="Terrazza Echo" href="/echo" cta="Apri Echo" accent="violet">
          {trendEchoes.slice(0, 2).map((echo) => (
            <MiniPreviewLine key={echo.title} title={echo.title} text={echo.text} />
          ))}
        </PreviewCard>

        <PreviewCard icon="🏁" title="Outcome" href="/outcome" cta="Vedi Outcome" accent="green">
          <MiniPreviewLine title="Decisioni finali" text="Qui trovi sintesi, direzioni e risultati generati dagli Spunti." />
          <MiniPreviewLine title="Azioni concrete" text="Trasforma le conversazioni in prossimi passi." />
        </PreviewCard>

        <PreviewCard icon="📰" title="Bacheca News" href="/world-news" cta="Apri News" accent="pink">
          {firstNews ? (
            <>
              <MiniPreviewLine title={firstNews.title} text={firstNews.source || 'Fonte news'} />
              {secondNews && <MiniPreviewLine title={secondNews.title} text={secondNews.source || 'Fonte news'} />}
            </>
          ) : (
            <MiniPreviewLine title="News in arrivo" text="Le notizie diventano Spunti per la community." />
          )}
        </PreviewCard>

        <PreviewCard icon="🎤" title="Palco Eventi" href="/events" cta="Scopri Eventi" accent="blue">
          <MiniPreviewLine title="Centro Italia" text="Roma, Firenze, Perugia, Ancona, Pescara e altre città." />
          <MiniPreviewLine title="Organizziamoci" text="Ogni evento può diventare uno Spunto condiviso." />
        </PreviewCard>

        <PreviewCard icon="👥" title="Panchine" href="/people" cta="Vedi Persone" accent="cyan">
          <MiniPreviewLine title="Interazioni reali" text="Scopri le persone con cui hai condiviso Spunti." />
          <MiniPreviewLine title="Nessun follow" text="Profili visibili, ma niente logiche da social classico." />
        </PreviewCard>

        <PreviewCard icon="🌐" title="Spazi" href="/spaces" cta="Apri Spazi" accent="violet">
          <MiniPreviewLine title="Stanze attive" text="Trova Spunti collegati ai tuoi interessi." />
          <MiniPreviewLine title="Community locali" text="Luoghi digitali dove organizzarsi e confrontarsi." />
        </PreviewCard>

        <PreviewCard icon="☕" title="Caffè" href="/messages" cta="Apri Messaggi" accent="blue">
          <MiniPreviewLine title="Conversazioni private" text="Rimani in contatto con chi hai incontrato negli Spunti." />
          <MiniPreviewLine title="Chat dirette" text="Messaggi più leggibili, ordinati e personali." />
        </PreviewCard>

        <PreviewCard icon="🔔" title="Notifiche" href="/notifications" cta="Vedi Notifiche" accent="pink">
          <MiniPreviewLine
            title={notificationCount > 0 ? `${notificationCount} notifiche attive` : 'Tutto tranquillo'}
            text={notificationCount > 0 ? 'Hai nuove attività da controllare.' : 'Qui appariranno inviti, risposte e aggiornamenti.'}
          />
        </PreviewCard>

        <PreviewCard icon="👤" title="Profilo" href={currentUserId ? '/profile' : '/login'} cta={currentUserId ? 'Vai al Profilo' : 'Accedi'} accent="green">
          <MiniPreviewLine title="Identità Square" text="Bio, passioni, contributi e punteggio personale." />
          <MiniPreviewLine title="Livello personale" text="Il livello resta solo nella tua pagina personale." />
        </PreviewCard>
      </div>
    </section>
  );
}

function PreviewCard({
  icon,
  title,
  href,
  cta,
  accent,
  children,
}: {
  icon: string;
  title: string;
  href: string;
  cta: string;
  accent: 'cyan' | 'violet' | 'pink' | 'blue' | 'green';
  children: React.ReactNode;
}) {
  return (
    <article className={`preview-card preview-${accent}`}>
      <div className="preview-card-top">
        <div className="preview-icon">{icon}</div>

        <div>
          <h3>{title}</h3>
          <Link href={href}>{cta} →</Link>
        </div>
      </div>

      <div className="preview-card-body">{children}</div>
    </article>
  );
}

function MiniPreviewLine({ title, text }: { title: string; text: string }) {
  return (
    <div className="mini-preview-line">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function TrendEchoSection({ echoes }: { echoes: TrendEcho[] }) {
  return (
    <section className="host-card glass">
      <div className="trend-grid">
        {echoes.map((echo) => (
          <div className="trend-item" key={echo.title}>
            <div className="trend-title">✦ {echo.title}</div>
            <div className="trend-text">{echo.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorldNewsSection({ items, loading }: { items: WorldNewsItem[]; loading: boolean }) {
  const fallbackItems: WorldNewsItem[] = [
    {
      title: 'Tecnologia, lavoro e relazioni stanno cambiando più velocemente delle abitudini sociali.',
      source: 'The Square Echo',
      url: '/calls/new',
      description: 'Uno spunto utile per aprire conversazioni su futuro, scelte personali e nuove priorità.',
      category: 'Società',
    },
    {
      title: 'Sempre più persone cercano comunità piccole, fidate e orientate a decisioni concrete.',
      source: 'The Square Echo',
      url: '/calls/new',
      description: 'Può diventare uno Spunto su amicizie, lavoro, fiducia o appartenenza.',
      category: 'Community',
    },
    {
      title: 'Il tema del cambiamento personale resta centrale: città, lavoro, coppia, famiglia, denaro.',
      source: 'The Square Echo',
      url: '/calls/new',
      description: 'Perfetto per generare Spunti dove la rete può portare esperienze reali.',
      category: 'Vita',
    },
  ];

  const visibleItems = items.length ? items : fallbackItems;

  return (
    <section className="world-news-card glass">
      <div className="world-news-head">
        <div>
          <p className="square-eyebrow">Bacheca News</p>
          <h2>Notizie dal mondo per dare spunto… a un nuovo Spunto</h2>
        </div>

        <Link href="/world-news" className="world-news-main-cta">
          Apri News →
        </Link>
      </div>

      <div className="world-news-grid">
        {loading ? (
          <div className="world-news-empty">Carico notizie e segnali dal mondo…</div>
        ) : (
          visibleItems.slice(0, 6).map((item) => (
            <article className="world-news-item" key={`${item.title}-${item.source}`}>
              <div className="world-news-meta">
                <span>{item.category || 'Mondo'}</span>
                <span>{item.source}</span>
              </div>

              <h3>{item.title}</h3>

              {item.description && <p>{item.description}</p>}

              <div className="world-news-actions">
                <a href={item.url} target="_blank" rel="noreferrer">
                  Leggi
                </a>

                <Link href={`/calls/new?title=${encodeURIComponent(item.title)}&type=${encodeURIComponent('Capire')}`}>
                  Usa come Spunto
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function HostOfMomentSection({ host }: { host: HostMoment | null }) {
  if (!host) {
    return (
      <section className="host-card glass">
        <div className="host-left">
          <div className="host-orb">S</div>
          <div>
            <div className="badge" style={{ marginBottom: 10, color: '#18212f' }}>
              ✦ Host del momento
            </div>
            <div className="host-name">In raccolta dati</div>
            <div className="host-title">Servono più Spunti reali per calcolare il miglior Host.</div>
            <div className="host-bio">
              The Square userà partecipazione, Pulse medio e numero di Spunti aperti per aggiornare questa sezione.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="host-card glass">
      <div className="host-left">
        <div className="host-orb">
          {host.hostAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={host.hostAvatar} alt="" />
          ) : (
            host.hostName.slice(0, 1).toUpperCase()
          )}
        </div>

        <div>
          <div className="badge" style={{ marginBottom: 10, color: '#18212f' }}>
            ✦ Host del momento
          </div>

          <div className="host-name">{host.hostName}</div>
          <div className="host-title">Riconosciuto automaticamente dai dati della community</div>
          <div className="host-bio">Selezionato in base a partecipazione, Pulse medio e numero di Spunti aperti.</div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Spunti aperti</span>
          <b>{host.hostedCount}</b>
        </div>
        <div className="metric">
          <span>Partecipanti totali</span>
          <b>{host.totalParticipants}</b>
        </div>
        <div className="metric">
          <span>Pulse medio</span>
          <b>{host.avgPulse}</b>
        </div>
      </div>
    </section>
  );
}

function LiveStrip({ thoughts }: { thoughts: LiveThought[] }) {
  return (
    <section className="live-strip">
      <div className="strip-head">
        <div className="strip-title">⌁ Spunti attivi in piazza</div>
        <Link href="/spaces" className="see-all">
          Vedi tutti →
        </Link>
      </div>

      <div className="call-grid">
        {thoughts.slice(0, 6).map((thought, index) => (
          <Link href={`/c/${thought.slug}`} key={`${thought.slug}-${index}`} className="mini-card">
            <span className="mini-status">● In corso</span>
            {thought.title}
            <span className="mini-score">↯ {thought.pulse_score}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RightPanels({ avgPulse, trendEchoes }: { avgPulse: number; trendEchoes: TrendEcho[] }) {
  return (
    <aside className="right">
      <section className="panel glass">
        <div className="panel-title">
          ✣ Echo <small>Voci dalla piazza</small>
        </div>

        <div className="echo-body">
          <div className="inner">
            <h4>Insight del momento</h4>

            {trendEchoes.map((item, index) => (
              <div className="insight" key={item.title}>
                <span className="insight-icon">{index === 0 ? '◎' : index === 1 ? '♙' : '◉'}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="inner">
            <h4>Clima della piazza</h4>
            <div className="mood-wrap">
              <div className="mood-blob">
                <div>
                  <b>Viva</b>
                  <span>
                    Conversazioni attive e
                    <br />
                    segnali in crescita.
                  </span>
                </div>
              </div>
            </div>

            <div className="legend">
              <span>
                <i />
                Ascolto
              </span>
              <span>
                <i />
                Curiosità
              </span>
              <span>
                <i />
                Decisione
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-title">
          〽 Pulse <small>Energia della piazza</small>
        </div>

        <div className="pulse">
          <div className="radial">
            <div className="pulse-score">
              {avgPulse}
              <span>{avgPulse >= 75 ? 'Alta' : avgPulse >= 45 ? 'Media' : 'In crescita'}</span>
            </div>
          </div>

          <div className="momentum">
            <h4>Media Pulse attuale</h4>
            <p>Dato calcolato sugli Spunti pubblici attivi.</p>

            <div className="chart">
              <svg viewBox="0 0 280 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="line" x1="0" x2="1">
                    <stop stopColor="#facc15" />
                    <stop offset=".55" stopColor="#58c4ff" />
                    <stop offset="1" stopColor="#c8f36b" />
                  </linearGradient>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#facc15" stopOpacity=".22" />
                    <stop offset="1" stopColor="#58c4ff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0 74 L34 66 L66 60 L96 58 L130 48 L162 42 L195 38 L225 28 L280 24 L280 100 L0 100 Z"
                  fill="url(#area)"
                />
                <path
                  d="M0 74 L34 66 L66 60 L96 58 L130 48 L162 42 L195 38 L225 28 L280 24"
                  fill="none"
                  stroke="url(#line)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
