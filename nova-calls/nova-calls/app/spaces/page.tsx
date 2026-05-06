'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type LiveCall = {
  id: string;
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

const typeLabels: Record<string, string> = {
  decidere: 'Decisioni',
  capire: 'Capire',
  feedback: 'Feedback',
  'trovare-persone': 'Persone',
  'fare-ora': 'Fare ora',
  'creare-insieme': 'Creare insieme',
};

function formatCallType(value: string | null) {
  if (!value) return 'Live';
  return typeLabels[value] || value;
}

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch {
    return 'Ora';
  }
}

function SpacesTopBar() {
  return (
    <header className="spaces-topbar">
      <Link href="/" className="spaces-brand" aria-label="NOVA home">
        <span className="spaces-logo-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nova-logo.png" alt="" className="spaces-logo-image" />
        </span>
        <span className="spaces-brand-word">NOVA</span>
      </Link>

      <nav className="spaces-nav" aria-label="Navigazione principale">
        <Link href="/" className="spaces-nav-link">
          <span>🏠</span>
          Home
        </Link>
        <Link href="/profile" className="spaces-nav-link">
          <span>👤</span>
          Profilo
        </Link>
        <Link href="/messages" className="spaces-nav-link">
          <span>💬</span>
          Messaggi
        </Link>
      </nav>

      <div className="spaces-actions">
        <Link href="/login" className="spaces-login">
          Login / Registrati
        </Link>

        <Link href="/calls/new" className="spaces-open-call">
          + Apri una Call
        </Link>

        <Link href="/profile" className="spaces-profile-orb" aria-label="Profilo">
          👤
        </Link>
      </div>
    </header>
  );
}

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tutte');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCalls() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent('/spaces')}`);
        return;
      }

      const { data, error: callsError } = await supabase
        .from('calls')
        .select(
          'id, slug, title, description, call_type, access_type, status, pulse_score, participants, host_id, host_name, host_avatar, created_at'
        )
        .eq('status', 'live')
        .eq('access_type', 'public')
        .order('created_at', { ascending: false });

      if (!active) return;

      if (callsError) {
        setError(`Non riesco a caricare le Live attive: ${callsError.message}`);
        setCalls([]);
      } else {
        setCalls(data || []);
      }

      setLoading(false);
    }

    loadCalls();

    const channel = supabase
      .channel('live-calls-spaces')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        (payload) => {
          const nextCall = payload.new as LiveCall | null;
          const oldCall = payload.old as Partial<LiveCall> | null;

          if (payload.eventType === 'INSERT' && nextCall?.status === 'live' && nextCall.access_type === 'public') {
            setCalls((current) => {
              if (current.some((call) => call.id === nextCall.id)) return current;
              return [nextCall, ...current];
            });
          }

          if (payload.eventType === 'UPDATE' && nextCall) {
            setCalls((current) => {
              const shouldShow = nextCall.status === 'live' && nextCall.access_type === 'public';
              if (!shouldShow) return current.filter((call) => call.id !== nextCall.id);

              if (current.some((call) => call.id === nextCall.id)) {
                return current.map((call) => (call.id === nextCall.id ? nextCall : call));
              }

              return [nextCall, ...current];
            });
          }

          if (payload.eventType === 'DELETE' && oldCall?.id) {
            setCalls((current) => current.filter((call) => call.id !== oldCall.id));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  const filters = useMemo(() => {
    const unique = Array.from(new Set(calls.map((call) => call.call_type).filter(Boolean))) as string[];
    return ['tutte', ...unique];
  }, [calls]);

  const filteredCalls = useMemo(() => {
    if (filter === 'tutte') return calls;
    return calls.filter((call) => call.call_type === filter);
  }, [calls, filter]);

  return (
    <div>
      <SpacesTopBar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10 pt-28 md:pt-32">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-700 md:text-cyan-200/90">
              Live attive sui tuoi interessi
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em] text-slate-950 md:text-white">Spazi</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-700 md:text-slate-200">
              Qui trovi le Call pubbliche attive create dalla community. Entra in una stanza, ascolta, contribuisci e
              aiuta a generare Echo e Outcome.
            </p>
          </div>

          <Button href="/calls/new" variant="lime">
            Apri una Call
          </Button>
        </div>

        <Card className="mt-8 p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">In diretta adesso</h2>
              <p className="mt-1 text-sm font-semibold text-slate-300">
                {loading ? 'Carico le Live…' : `${filteredCalls.length} Call visibili`}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition ${
                    filter === item
                      ? 'border-lime-300 bg-lime-300 text-slate-950'
                      : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {item === 'tutte' ? 'Tutte' : formatCallType(item)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
              ))}
            </div>
          )}

          {!loading && filteredCalls.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center">
              <h3 className="text-2xl font-black">Nessuna Live attiva per ora</h3>
              <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                Apri la prima Call pubblica: comparirà qui per tutti gli utenti loggati.
              </p>
              <div className="mt-6">
                <Button href="/calls/new" variant="lime">
                  Apri una Call
                </Button>
              </div>
            </div>
          )}

          {!loading && filteredCalls.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/c/${call.slug}`}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10 hover:shadow-[0_0_34px_rgba(34,211,238,.16)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_15%_85%,rgba(236,72,153,.14),transparent_30%)] opacity-80" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-200">
                        ● Live
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                        {formatCallType(call.call_type)}
                      </span>
                    </div>

                    <h3 className="mt-5 line-clamp-2 text-2xl font-black leading-tight tracking-[-.03em]">
                      {call.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 min-h-[72px] text-sm font-semibold leading-6 text-slate-300">
                      {call.description || 'Call live aperta su NOVA.'}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      {call.host_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={call.host_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-xs font-black text-white">
                          {(call.host_name || 'NOVA').slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-white/40">Host</div>
                        <div className="text-sm font-bold text-white">{call.host_name || 'Host Nova'}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-center">
                        <div className="text-xs font-bold text-white/45">Pulse</div>
                        <div className="mt-1 text-xl font-black text-cyan-300">{call.pulse_score || 12}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-center">
                        <div className="text-xs font-bold text-white/45">Persone</div>
                        <div className="mt-1 text-xl font-black text-lime-300">{call.participants || 1}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-center">
                        <div className="text-xs font-bold text-white/45">Creata</div>
                        <div className="mt-1 text-xs font-black text-slate-200">{formatTime(call.created_at)}</div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 py-3 text-center text-sm font-black text-white transition group-hover:shadow-[0_0_24px_rgba(34,211,238,.28)]">
                      Entra nella Call →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>

      <style jsx global>{`
        .spaces-topbar {
          position: fixed;
          inset: 0 0 auto 0;
          z-index: 100;
          min-height: 78px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 22px;
          padding: 12px clamp(18px, 4vw, 42px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          background:
            radial-gradient(circle at 18% 0%, rgba(6, 182, 212, 0.2), transparent 30%),
            linear-gradient(90deg, rgba(11, 25, 45, 0.96), rgba(32, 44, 75, 0.96));
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.24);
          backdrop-filter: blur(22px) saturate(1.3);
        }

        .spaces-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          color: #ffffff;
          text-decoration: none;
        }

        .spaces-logo-box {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(125, 227, 255, 0.32);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 28px rgba(6, 182, 212, 0.22);
          flex: 0 0 auto;
        }

        .spaces-logo-image {
          width: 38px;
          height: 38px;
          object-fit: contain;
          display: block;
        }

        .spaces-brand-word {
          color: #ffffff;
          font-size: 19px;
          font-weight: 950;
          letter-spacing: 0.34em;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.32);
        }

        .spaces-nav {
          justify-self: center;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }

        .spaces-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: none;
          font-size: 13px;
          font-weight: 950;
          text-shadow: 0 1px 10px rgba(0, 0, 0, 0.28);
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .spaces-nav-link:hover {
          transform: translateY(-1px);
          color: #10213a;
          background: linear-gradient(135deg, #a3e635, #7de3ff);
          text-shadow: none;
        }

        .spaces-actions {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .spaces-login {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 16px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          text-decoration: none;
          font-size: 13px;
          font-weight: 950;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .spaces-login:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .spaces-open-call {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 22px;
          color: #10220a;
          background: linear-gradient(135deg, #a3e635, #7de3ff);
          text-decoration: none;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 14px 30px rgba(6, 182, 212, 0.22);
          white-space: nowrap;
        }

        .spaces-profile-orb {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #ffffff;
          background:
            radial-gradient(circle at 30% 20%, #fbcfe8, #8f7cff 38%, #58c4ff 70%),
            #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.24);
          text-decoration: none;
          box-shadow: 0 0 26px rgba(124, 58, 237, 0.26);
          flex: 0 0 auto;
        }

        @media (max-width: 920px) {
          .spaces-topbar {
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding: 10px 14px;
          }

          .spaces-nav {
            grid-column: 1 / -1;
            grid-row: 2;
            justify-self: stretch;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-radius: 22px;
          }

          .spaces-nav-link {
            justify-content: center;
            min-height: 42px;
            padding: 0 10px;
            font-size: 12px;
          }

          .spaces-actions {
            gap: 8px;
          }

          .spaces-login {
            display: none;
          }

          .spaces-open-call {
            min-height: 42px;
            padding: 0 15px;
            font-size: 12px;
          }

          .spaces-profile-orb {
            width: 42px;
            height: 42px;
          }

          .spaces-brand-word {
            font-size: 16px;
            letter-spacing: 0.24em;
          }

          .spaces-logo-box {
            width: 42px;
            height: 42px;
          }

          .spaces-logo-image {
            width: 34px;
            height: 34px;
          }
        }

        @media (max-width: 520px) {
          .spaces-brand-word {
            display: none;
          }

          .spaces-open-call {
            font-size: 0;
            width: 44px;
            padding: 0;
          }

          .spaces-open-call::before {
            content: '+';
            font-size: 26px;
            line-height: 1;
          }

          .spaces-nav-link {
            gap: 5px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
