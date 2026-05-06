'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Button, Card } from '@/components/ui';
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
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">
              Live attive sui tuoi interessi
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Spazi</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">
              Qui trovi le Call pubbliche attive create dalla community. Entra in una stanza, ascolta, contribuisci e aiuta a generare Echo e Outcome.
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
    </div>
  );
}
