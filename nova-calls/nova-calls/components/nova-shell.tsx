'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { demoCalls, makeSlug, type NovaCall } from '@/lib/local-call';
import { ProfileOrb } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const STORAGE_KEY = 'nova:calls';

const thoughtTypes = ['Decidere', 'Capire', 'Feedback', 'Trovare persone', 'Fare ora', 'Creare insieme'];

const navItems = [
  ['🏠', 'Home', '/'],
  ['💡', 'Spunti', '/calls/new'],
  ['🧠', 'Echo', '/echo'],
  ['🏁', 'Outcome', '/outcome'],
  ['👥', 'Persone', '/people'],
  ['🌐', 'Spazi', '/spaces'],
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

const aiQuestions: Array<{
  key: AiAnswerKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'situation',
    label: 'Che cosa sta succedendo?',
    placeholder: 'Esempio: sto valutando se cambiare lavoro, città o progetto...',
  },
  {
    key: 'block',
    label: 'Qual è il nodo che ti blocca di più?',
    placeholder: 'Esempio: paura di sbagliare, soldi, tempo, relazione, scelta difficile...',
  },
  {
    key: 'desiredOutcome',
    label: 'Che tipo di aiuto vorresti ricevere dalla rete?',
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
    host_name: 'NOVA',
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
      title: 'Tema dominante',
      text: keywords.length
        ? `Negli Spunti recenti emergono soprattutto: ${keywords.slice(0, 3).join(', ')}.`
        : 'Stanno emergendo nuovi temi, ma servono più Spunti reali per leggere la tendenza.',
    },
    {
      title: 'Energia della rete',
      text: `La categoria più attiva ora è “${topType}”: la community sta cercando confronto immediato.`,
    },
    {
      title: 'Nuovo Spunto suggerito',
      text: keywords[0]
        ? `Apri uno Spunto su “${keywords[0]}” per intercettare un bisogno già presente nella rete.`
        : 'Apri uno Spunto su una decisione concreta: è il formato che genera più partecipazione.',
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

Aiuto che cerco dalla rete: ${desiredOutcome}`;

    setText(generatedText);
    setType(inferredType);
  }

  function openThought() {
    const title = text.trim().split('\n')[0] || 'Nuovo Spunto Nova';

    const call: NovaCall = {
      title,
      description:
        text.trim() || 'Spunto aperto dalla homepage. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.',
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
    <div className="nova-preview">
      <TopChrome isLoggedIn={Boolean(currentUserId)} />

      <main className="nova-app">
        <Sidebar notificationCount={notificationCount} />

        <section className="nova-center">
          <h1>
            Di cosa hai bisogno <span className="gradient-text">adesso?</span>
          </h1>
          <p className="subtitle">Apri uno Spunto. La risposta è già nella tua rete.</p>

          <div className="composer ai-composer">
            <div className="composer-content">
              <div className="ai-builder-head">
                <div>
                  <p className="ai-eyebrow">AI Spunto Builder</p>
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
                <p className="ai-eyebrow">Spunto generato</p>
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

          <TrendEchoSection echoes={trendEchoes} />
          <WorldNewsSection items={worldNews} loading={newsLoading} />
          <HostOfMomentSection host={hostMoment} />
          <LiveStrip thoughts={liveThoughts} />
        </section>

        <RightPanels avgPulse={avgPulse} trendEchoes={trendEchoes} />
      </main>

      <style jsx global>{`
        :root {
          --bg: #e7f8ff;
          --panel: rgba(255, 255, 255, 0.74);
          --panel-2: rgba(217, 242, 255, 0.72);
          --deep-panel: rgba(27, 68, 105, 0.9);
          --line: rgba(148, 163, 184, 0.2);
          --text: #0f172a;
          --muted: #475569;
          --soft: #64748b;
          --cyan: #06b6d4;
          --blue: #2563eb;
          --violet: #7c3aed;
          --pink: #db2777;
          --coral: #fb7185;
          --lime: #a3e635;
          --green: #10b981;
          --radius-xl: 30px;
        }

        .nova-preview,
        .nova-preview * {
          box-sizing: border-box;
        }

        .nova-preview {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: var(--text);
          background:
            radial-gradient(circle at 12% 8%, rgba(6, 182, 212, .24), transparent 22%),
            radial-gradient(circle at 84% 10%, rgba(124, 58, 237, .16), transparent 24%),
            radial-gradient(circle at 72% 76%, rgba(219, 39, 119, .10), transparent 28%),
            linear-gradient(180deg, #e7f8ff 0%, #f3fbff 30%, #d9f2ff 62%, #c6eaff 84%, #b8e4ff 100%);
          overflow-x: hidden;
          isolation: isolate;
        }

        .glass {
          border: 1px solid rgba(255,255,255,.68);
          background:
            radial-gradient(circle at 82% 0%, rgba(6,182,212,.08), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,.82), rgba(223,246,255,.68));
          box-shadow: 0 22px 74px rgba(37,99,235,.11), inset 0 1px 0 rgba(255,255,255,.96);
          backdrop-filter: blur(24px) saturate(1.22);
          color: #0f172a;
        }

        .nova-app {
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
          color: #0f172a;
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
          border: 1px solid rgba(6,182,212,.22);
          background: rgba(255,255,255,.72);
          box-shadow: 0 0 24px rgba(6,182,212,.15), inset 0 1px 0 rgba(255,255,255,.9);
          flex-shrink: 0;
        }

        .brand-logo-image {
          width: 44px;
          height: 44px;
          object-fit: contain;
          display: block;
        }

        .brand-word {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: .28em;
          color: #0f172a;
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
          border: 1px solid rgba(15,23,42,.1);
          background: rgba(255,255,255,.68);
          color: #0f172a;
          display: grid;
          place-items: center;
          font-size: 19px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
          text-decoration: none;
        }

        .profile-orb-wrap {
          border-radius: 999px;
          overflow: hidden;
          background: radial-gradient(circle at 30% 20%, #fbcfe8, #8f7cff 38%, #58c4ff 70%);
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
          border: 1px solid rgba(15, 23, 42, .1);
          background: rgba(255, 255, 255, .72);
          color: #0f172a;
        }

        .auth-register {
          background: linear-gradient(135deg, #a3e635, #7de3ff);
          color: #0f172a;
          box-shadow: 0 16px 32px rgba(6, 182, 212, .16);
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
          background: linear-gradient(130deg, rgba(6,182,212,.10), transparent 36%, rgba(124,58,237,.08));
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
          color: rgba(15,23,42,.72);
          font-size: 16px;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-item:hover,
        .nav-item.active {
          color: #075985;
          background: linear-gradient(90deg, rgba(6,182,212,.16), rgba(124,58,237,.08));
          box-shadow: inset 0 0 0 1px rgba(6,182,212,.16), 0 12px 28px rgba(37,99,235,.08);
        }

        .nav-icon {
          width: 23px;
          text-align: center;
          font-size: 18px;
          filter: drop-shadow(0 0 8px rgba(6,182,212,.24));
        }

        .nav-label {
          display: inline;
        }

        .nav-badge {
          margin-left: auto;
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          border-radius: 999px;
          background: #a3e635;
          color: #10220a;
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
          color: #0f172a;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 900;
          text-align: left;
          text-decoration: none;
          background: linear-gradient(135deg, #a3e635, #7de3ff 72%);
          box-shadow: 0 18px 34px rgba(6,182,212,.18);
        }

        .online {
          position: relative;
          z-index: 1;
          margin-top: 20px;
          border-radius: 999px;
          padding: 10px 13px;
          color: #475569;
          background: rgba(255,255,255,.52);
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 12px;
          letter-spacing: .08em;
          font-weight: 800;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: var(--green);
          box-shadow: 0 0 12px rgba(16,185,129,.45);
        }

        .nova-center {
          min-width: 0;
          padding-top: 78px;
        }

        .nova-center h1 {
          margin: 0;
          font-size: clamp(52px, 5.2vw, 83px);
          line-height: .98;
          letter-spacing: -.065em;
          font-weight: 900;
        }

        .gradient-text {
          background: linear-gradient(92deg, var(--cyan), var(--blue) 26%, var(--violet) 64%, var(--pink));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          margin: 8px 0 18px;
          color: var(--muted);
          font-size: 16px;
          font-weight: 750;
        }

        .composer {
          position: relative;
          border-radius: 30px;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(6,182,212,.26);
          background:
            radial-gradient(ellipse at 38% 6%, rgba(6,182,212,.22), transparent 28%),
            radial-gradient(ellipse at 74% 54%, rgba(219,39,119,.14), transparent 32%),
            rgba(255,255,255,.84);
          box-shadow: 0 0 28px rgba(6,182,212,.10), 0 18px 45px rgba(37,99,235,.08);
        }

        .ai-composer {
          min-height: 238px;
          padding: 24px;
          background:
            radial-gradient(circle at 18% 8%, rgba(56,214,255,.26), transparent 28%),
            radial-gradient(circle at 78% 38%, rgba(219,39,119,.12), transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,.94), rgba(237,249,255,.84));
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

        .ai-eyebrow {
          margin: 0 0 6px;
          color: #0284c7;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .ai-builder-head h2 {
          margin: 0;
          max-width: 680px;
          color: #10213a;
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
          background: linear-gradient(135deg, rgba(6,182,212,.16), rgba(124,58,237,.12));
          color: #075985;
          font-size: 13px;
          font-weight: 950;
          border: 1px solid rgba(6,182,212,.22);
        }

        .ai-question-box {
          margin-top: 22px;
          border-radius: 22px;
          border: 1px solid rgba(90,132,185,.18);
          background: rgba(255,255,255,.72);
          padding: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
        }

        .ai-question-label {
          display: block;
          margin-bottom: 10px;
          color: #10213a;
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
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
        }

        .ai-input {
          min-height: 82px;
          color: #10213a;
          font-weight: 750;
        }

        .composer-input::placeholder {
          color: rgba(100,116,139,.82);
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
          border: 1px solid rgba(15,23,42,.08);
          background: rgba(248,250,252,.82);
          padding: 0 16px;
          color: #475569;
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
          background: linear-gradient(135deg, #a3e635, #7de3ff) !important;
          color: #10213a !important;
          border-color: rgba(6,182,212,.18) !important;
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
          border: 1px solid rgba(15,23,42,.08);
          box-shadow: 0 16px 36px rgba(124,58,237,.14);
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
          color: #10213a;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.035em;
        }

        .ai-preview p {
          margin: 8px 0 0;
          color: #475569;
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
          border: 1px solid rgba(15,23,42,.08);
          background: rgba(255,255,255,.64);
          color: #475569;
          padding: 0 19px;
          font-size: 14px;
          font-weight: 850;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
          cursor: pointer;
          font-family: inherit;
        }

        .chip.active {
          border-color: rgba(6,182,212,.24);
          background: linear-gradient(135deg, rgba(6,182,212,.18), rgba(124,58,237,.12));
          color: #075985;
          box-shadow: 0 14px 28px rgba(37,99,235,.10);
        }

        .featured {
          position: relative;
          min-height: 310px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.18);
          background:
            radial-gradient(circle at 80% 0%, rgba(6,182,212,.20), transparent 30%),
            linear-gradient(180deg, rgba(27,68,105,.90), rgba(21,49,79,.88));
          box-shadow: 0 24px 90px rgba(37,99,235,.12), inset 0 1px 0 rgba(255,255,255,.12);
          color: #eff6ff;
        }

        .featured::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 78% 36%, rgba(219,39,119,.34), transparent 14%),
            radial-gradient(ellipse at 82% 26%, rgba(6,182,212,.34), transparent 26%),
            linear-gradient(165deg, transparent 0 42%, rgba(125,227,255,.14), transparent 57%);
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
          color: #0f172a;
          font-size: 21px;
          font-weight: 950;
          background: linear-gradient(100deg, #a3e635, #7de3ff);
          box-shadow: 0 18px 34px rgba(6,182,212,.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
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
          border: 1px solid rgba(15,23,42,.08);
          background: rgba(255,255,255,.58);
        }

        .trend-title {
          font-weight: 950;
          margin-bottom: 6px;
        }

        .trend-text {
          color: #475569;
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
          color: #10213a;
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
          background: linear-gradient(135deg, #a3e635, #7de3ff);
          color: #10213a;
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
          border: 1px solid rgba(15, 23, 42, .08);
          background:
            radial-gradient(circle at 20% 0%, rgba(6, 182, 212, .13), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.78), rgba(239,249,255,.62));
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
          color: #10213a;
          font-size: 18px;
          line-height: 1.15;
          letter-spacing: -.025em;
          font-weight: 950;
        }

        .world-news-item p {
          margin: 0;
          color: #475569;
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
          color: #075985;
          font-size: 12px;
          font-weight: 950;
          text-decoration: none;
          border: 1px solid rgba(6,182,212,.16);
        }

        .world-news-actions a:last-child {
          background: linear-gradient(135deg, rgba(163,230,53,.88), rgba(125,227,255,.88));
          color: #10213a;
        }

        .world-news-empty {
          grid-column: 1 / -1;
          border-radius: 20px;
          padding: 18px;
          background: rgba(255,255,255,.58);
          color: #475569;
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
          background: radial-gradient(circle at 34% 25%, #7de3ff, #8f7cff 32%, #e77bcf 54%, #15314f 78%);
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
          color: #475569;
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
          border-left: 1px solid rgba(15,23,42,.08);
        }

        .metric {
          padding-left: 22px;
          border-right: 1px solid rgba(15,23,42,.08);
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
          color: var(--cyan);
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
          box-shadow: 0 20px 50px rgba(37,99,235,.08);
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
          color: #475569;
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
          border: 1px solid rgba(15,23,42,.08);
          background: linear-gradient(135deg, rgba(6,182,212,.16), rgba(255,255,255,.70));
          overflow: hidden;
          position: relative;
          font-weight: 900;
          font-size: 13px;
          line-height: 1.15;
          color: #0f172a;
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
          color: #0369a1;
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
          color: #475569;
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
          border: 1px solid rgba(15,23,42,.08);
          background: rgba(255,255,255,.48);
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
          color: #0f172a;
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
          background: rgba(6,182,212,.12);
          color: var(--cyan);
          border: 1px solid rgba(6,182,212,.18);
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
            radial-gradient(circle at 28% 30%, rgba(6,182,212,.94), transparent 31%),
            radial-gradient(circle at 75% 35%, rgba(219,39,119,.76), transparent 32%),
            radial-gradient(circle at 60% 70%, rgba(124,58,237,.78), transparent 42%);
          filter: drop-shadow(0 0 18px rgba(219,39,119,.24));
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
          background: var(--cyan);
        }

        .legend span:nth-child(2) i {
          background: var(--coral);
        }

        .legend span:nth-child(3) i {
          background: var(--pink);
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
            repeating-radial-gradient(circle, transparent 0 12px, rgba(6,182,212,.13) 13px 14px),
            conic-gradient(from -15deg, transparent 0 18deg, var(--cyan) 38deg, var(--lime) 120deg, var(--pink) 240deg, transparent 310deg),
            radial-gradient(circle, rgba(6,182,212,.16), transparent 52%);
          box-shadow: 0 0 36px rgba(6,182,212,.18);
        }

        .radial::before {
          content: "";
          position: absolute;
          inset: 42px;
          border-radius: inherit;
          background: rgba(255,255,255,.88);
          box-shadow: inset 0 0 20px rgba(15,23,42,.06);
        }

        .radial::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 126%;
          background: linear-gradient(transparent, rgba(6,182,212,.65), rgba(124,58,237,.52), transparent);
          filter: blur(2px);
        }

        .pulse-score {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 35px;
          font-weight: 950;
          color: #0f172a;
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
          color: #475569;
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
          .nova-app {
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
          .nova-app {
            grid-template-columns: 210px minmax(0, 1fr);
          }

          .right,
          .trend-grid,
          .world-news-grid {
            grid-template-columns: 1fr;
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

          .brand-logo-image {
            width: 36px;
            height: 36px;
          }

          .brand-word {
            font-size: 18px;
            letter-spacing: .22em;
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

          .nova-app {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            padding: 0 14px 92px;
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
            border-radius: 24px;
            padding: 9px;
            background: rgba(255,255,255,.80);
            backdrop-filter: blur(26px) saturate(1.4);
            box-shadow: 0 18px 60px rgba(37,99,235,.18), inset 0 1px 0 rgba(255,255,255,.9);
          }

          .sidebar::before,
          .online {
            display: none;
          }

          .nav {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
          }

          .nav-item {
            position: relative;
            height: 58px;
            justify-content: center;
            flex-direction: column;
            padding: 6px 4px;
            border-radius: 18px;
            font-size: 10px;
            line-height: 1;
            gap: 5px;
            text-align: center;
          }

          .nav-item:nth-child(n+6) {
            display: none;
          }

          .nav-icon {
            width: auto;
            font-size: 21px;
            line-height: 1;
            filter: none;
          }

          .nav-label {
            display: block;
            max-width: 64px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: rgba(15, 23, 42, .72);
            font-size: 10px;
            font-weight: 900;
          }

          .nav-item.active .nav-label,
          .nav-item:hover .nav-label {
            color: #075985;
          }

          .nav-badge {
            position: absolute;
            right: 7px;
            top: 5px;
            width: 18px;
            height: 18px;
            min-width: 18px;
            font-size: 10px;
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

          .nova-center {
            order: 1;
            padding-top: 4px;
          }

          .nova-center h1 {
            max-width: 360px;
            margin: 0 auto;
            text-align: center;
            font-size: clamp(42px, 13.6vw, 58px);
            line-height: .92;
            letter-spacing: -.07em;
          }

          .subtitle {
            max-width: 310px;
            margin: 12px auto 18px;
            text-align: center;
            font-size: 14px;
            line-height: 1.45;
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
            border-top: 1px solid rgba(15,23,42,.08);
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
      <Link href="/" className="brand" aria-label="NOVA home">
        <span className="brand-logo-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nova-logo.png" alt="" className="brand-logo-image" />
        </span>
        <span className="brand-word">NOVA</span>
      </Link>

      <div className="top-actions">
        <Link href="/search" className="icon-btn" aria-label="Cerca">
          🔎
        </Link>

        <Link href="/saved" className="icon-btn" aria-label="Salvati">
          ⭐
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
              Registrati
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
        {navItems.map(([icon, label, href], index) => (
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
        NOVA Online
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
        <span className="badge">★ Spunto in evidenza</span>
        <span className="badge status">
          <span className="dot" /> In corso
        </span>

        <h2>{thought.title}</h2>
        <p>{thought.description || 'Spunto aperto su NOVA.'}</p>

        <div className="call-meta">
          <div className="avatars">
            <span className="plus-count">↯ Pulse {thought.pulse_score || 0}</span>
          </div>

          <div className="active-count">
            <span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />
            <b>{thought.participants || 0}</b> partecipanti attivi
            <span className="speaking">Host: {thought.host_name || 'Utente Nova'}</span>
          </div>
        </div>

        <div className="call-actions">
          <Link href={`/c/${thought.slug}?mode=chat`} className="call-action">
            ▱ Chat
          </Link>

          <Link href={`/c/${thought.slug}`} className="primary-cta">
            Apri lo Spunto →
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
      source: 'NOVA Echo',
      url: '/calls/new',
      description: 'Uno spunto utile per aprire conversazioni su futuro, scelte personali e nuove priorità.',
      category: 'Società',
    },
    {
      title: 'Sempre più persone cercano comunità piccole, fidate e orientate a decisioni concrete.',
      source: 'NOVA Echo',
      url: '/calls/new',
      description: 'Può diventare uno Spunto su amicizie, lavoro, fiducia o appartenenza.',
      category: 'Community',
    },
    {
      title: 'Il tema del cambiamento personale resta centrale: città, lavoro, coppia, famiglia, denaro.',
      source: 'NOVA Echo',
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
          <p className="ai-eyebrow">News dal mondo</p>
          <h2>Notizie dal mondo per dare spunto… a un nuovo Spunto</h2>
        </div>

        <Link href="/calls/new" className="world-news-main-cta">
          Apri uno Spunto →
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
          <div className="host-orb">N</div>
          <div>
            <div className="badge" style={{ marginBottom: 10, color: '#0f172a' }}>
              ✦ Host del momento
            </div>
            <div className="host-name">In raccolta dati</div>
            <div className="host-title">Servono più Spunti reali per calcolare il miglior Host.</div>
            <div className="host-bio">
              NOVA userà partecipazione, Pulse medio e numero di Spunti aperti per aggiornare questa sezione.
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
          <div className="badge" style={{ marginBottom: 10, color: '#0f172a' }}>
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
        <div className="strip-title">⌁ Spunti attivi</div>
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
          ✣ Echo <small>In tempo reale</small>
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
            <h4>Clima della rete</h4>
            <div className="mood-wrap">
              <div className="mood-blob">
                <div>
                  <b>Attivo</b>
                  <span>
                    Conversazioni vive e
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
          〽 Pulse <small>Media reale delle stanze</small>
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
                    <stop stopColor="#8f7cff" />
                    <stop offset=".55" stopColor="#58c4ff" />
                    <stop offset="1" stopColor="#c8f36b" />
                  </linearGradient>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#58c4ff" stopOpacity=".22" />
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
