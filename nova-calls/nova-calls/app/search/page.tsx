'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Navbar, Button, Card } from '@/components/ui';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type CallRow = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  call_type?: string | null;
  type?: string | null;
  access_type?: string | null;
  status?: string | null;
  pulse_score?: number | null;
  pulse?: number | null;
  participants?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  creator_id?: string | null;
  host_id?: string | null;
  created_by?: string | null;
  owner_id?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  nova_points: number | null;
};

type UserLink = {
  requester_id: string;
  receiver_id: string;
  status: string;
};

function getCallCreatorId(call: CallRow) {
  return call.user_id || call.creator_id || call.host_id || call.created_by || call.owner_id || null;
}

function getCallSlug(call: CallRow) {
  return call.slug || call.id || '';
}

function getCallType(call: CallRow) {
  return call.call_type || call.type || 'Call';
}

function getCallPulse(call: CallRow) {
  return call.pulse_score ?? call.pulse ?? 12;
}

function formatDate(value?: string | null) {
  if (!value) return 'Ora';
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

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);

  async function loadSearchData() {
    setLoading(true);
    setError(null);
    setSchemaWarning(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = user?.id || null;
    setUserId(uid);

    let nextLinkedIds: string[] = [];

    if (uid) {
      const { data: linksData, error: linksError } = await supabase
        .from('user_links')
        .select('requester_id, receiver_id, status')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);

      if (linksError) {
        setSchemaWarning(`Non riesco a leggere i legami: ${linksError.message}`);
      } else {
        nextLinkedIds = ((linksData || []) as UserLink[]).map((link) =>
          link.requester_id === uid ? link.receiver_id : link.requester_id
        );
        setLinkedUserIds(nextLinkedIds);
      }
    }

    const { data: callsData, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(120);

    if (callsError) {
      setError(`Non riesco a caricare le Call: ${callsError.message}`);
      setCalls([]);
      setLoading(false);
      return;
    }

    const nextCalls = (callsData || []) as CallRow[];
    setCalls(nextCalls);

    const creatorIds = Array.from(
      new Set(nextCalls.map(getCallCreatorId).filter((value): value is string => Boolean(value)))
    );

    if (nextCalls.length > 0 && creatorIds.length === 0) {
      setSchemaWarning(
        'Le Call non hanno ancora una colonna creator_id/user_id/host_id/created_by/owner_id valorizzata: la ricerca funziona, ma non può ancora dare priorità reale alle Call dei tuoi legami.'
      );
    }

    if (creatorIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, nova_points')
        .in('id', creatorIds);

      if (profilesError) {
        setSchemaWarning(`Call caricate, ma non riesco a leggere alcuni profili: ${profilesError.message}`);
      } else {
        const nextMap: Record<string, Profile> = {};
        ((profilesData || []) as Profile[]).forEach((profile) => {
          nextMap[profile.id] = profile;
        });
        setProfilesById(nextMap);
      }
    } else {
      setProfilesById({});
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSearchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const results = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const linkedSet = new Set(linkedUserIds);

    const filtered = calls.filter((call) => {
      const haystack = [
        call.title,
        call.description,
        call.call_type,
        call.type,
        call.access_type,
        call.status,
        profilesById[getCallCreatorId(call) || '']?.full_name,
        profilesById[getCallCreatorId(call) || '']?.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!cleanQuery) return true;
      return haystack.includes(cleanQuery);
    });

    return filtered.sort((a, b) => {
      const aCreator = getCallCreatorId(a);
      const bCreator = getCallCreatorId(b);

      const aLinked = aCreator ? linkedSet.has(aCreator) : false;
      const bLinked = bCreator ? linkedSet.has(bCreator) : false;

      if (aLinked !== bLinked) return aLinked ? -1 : 1;

      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();

      return bTime - aTime;
    });
  }, [calls, linkedUserIds, profilesById, query]);

  const linkedResults = useMemo(() => {
    const linkedSet = new Set(linkedUserIds);
    return results.filter((call) => {
      const creator = getCallCreatorId(call);
      return creator ? linkedSet.has(creator) : false;
    });
  }, [linkedUserIds, results]);

  const publicResults = useMemo(() => {
    const linkedSet = new Set(linkedUserIds);
    return results.filter((call) => {
      const creator = getCallCreatorId(call);
      return !creator || !linkedSet.has(creator);
    });
  }, [linkedUserIds, results]);

  function renderCallCard(call: CallRow, priority: boolean) {
    const creatorId = getCallCreatorId(call);
    const profile = creatorId ? profilesById[creatorId] : null;
    const creatorName = profile?.full_name || (creatorId ? 'Utente Nova' : 'Host non collegato');
    const slug = getCallSlug(call);

    return (
      <article key={call.id || slug || call.title || Math.random()} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  priority ? 'bg-lime-300 text-slate-950' : 'border border-white/10 bg-white/10 text-slate-200'
                }`}
              >
                {priority ? 'Legame' : 'Pubblica'}
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                {getCallType(call)}
              </span>
              <span className="text-xs font-bold text-slate-400">{formatDate(call.created_at)}</span>
            </div>

            <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-.03em]">
              {call.title || 'Call senza titolo'}
            </h3>

            <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-300">
              {call.description || 'Nessuna descrizione disponibile.'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Pulse</div>
            <div className="mt-1 text-2xl font-black text-cyan-300">{getCallPulse(call)}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-xs font-black text-white">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(creatorName)
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black">{creatorName}</div>
              <div className="text-xs font-bold text-slate-400">
                {profile?.city || 'NOVA'} · {profile?.nova_points || 0} punti
              </div>
            </div>
          </div>

          <Link
            href={slug ? `/c/${slug}` : '/calls/new'}
            className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-5 py-3 text-center text-sm font-black text-white"
          >
            Apri Call →
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">
              Trova Call dando priorità ai tuoi legami
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Cerca</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">
              Cerca tra le Call attive. In alto vedrai prima le Call create dai tuoi legami, poi quelle pubbliche degli altri.
            </p>
          </div>

          <Button href="/calls/new" variant="lime">
            Apri una Call
          </Button>
        </div>

        <Card className="mt-8 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca per tema, città, titolo, descrizione..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              onClick={loadSearchData}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white hover:bg-white/15"
            >
              Aggiorna
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Milano', 'cambio lavoro', 'startup', 'decisione', 'relazioni', 'budget'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        {schemaWarning && (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
            {schemaWarning}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.24em] text-lime-300/80">Priorità</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Call dei tuoi legami</h2>
                </div>
                <span className="rounded-full bg-lime-300/10 px-4 py-2 text-sm font-black text-lime-300">
                  {loading ? '…' : linkedResults.length}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {loading && (
                  <>
                    {[1, 2].map((item) => (
                      <div key={item} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
                    ))}
                  </>
                )}

                {!loading && linkedResults.length === 0 && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-7 text-center">
                    <h3 className="text-2xl font-black">Nessuna Call dai tuoi legami</h3>
                    <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                      Quando un tuo legame apre una Call, apparirà qui in priorità.
                    </p>
                  </div>
                )}

                {!loading && linkedResults.map((call) => renderCallCard(call, true))}
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Esplora</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Altre Call pubbliche</h2>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-slate-300">
                  {loading ? '…' : publicResults.length}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {loading && (
                  <>
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
                    ))}
                  </>
                )}

                {!loading && publicResults.length === 0 && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-7 text-center">
                    <h3 className="text-2xl font-black">Nessun risultato</h3>
                    <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                      Prova a cercare con una parola diversa o apri una nuova Call.
                    </p>
                  </div>
                )}

                {!loading && publicResults.map((call) => renderCallCard(call, false))}
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-6">
              <h2 className="text-2xl font-black">Come funziona</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                La ricerca dà priorità alle Call aperte dai tuoi legami accettati. Le altre Call pubbliche restano comunque visibili sotto.
              </p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4">
                  <b className="text-lime-300">1. Legami</b>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">Prima le Call delle persone con cui hai un legame reciproco.</p>
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <b className="text-cyan-200">2. Pubbliche</b>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">Poi le Call aperte dagli altri utenti della piattaforma.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-black">Legami attivi</h2>
              <p className="mt-3 text-4xl font-black text-lime-300">{linkedUserIds.length}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                Più legami utili crei, più la ricerca diventa personale.
              </p>
              <Button href="/profile" variant="ghost" className="mt-5 w-full">
                Vedi Legami
              </Button>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
