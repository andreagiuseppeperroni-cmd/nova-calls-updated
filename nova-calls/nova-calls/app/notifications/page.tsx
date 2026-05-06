'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

function formatDate(value: string) {
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

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [received, setReceived] = useState<UserLink[]>([]);
  const [sent, setSent] = useState<UserLink[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

    if (uniqueIds.length === 0) {
      setProfilesById({});
      return;
    }

    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, bio, nova_points')
      .in('id', uniqueIds);

    if (profilesError) {
      setError(`Legami caricati, ma non riesco a leggere alcuni profili: ${profilesError.message}`);
      setProfilesById({});
      return;
    }

    const nextMap: Record<string, Profile> = {};
    ((data || []) as Profile[]).forEach((profile) => {
      nextMap[profile.id] = profile;
    });

    setProfilesById(nextMap);
  }

  async function loadNotifications(currentUserId?: string) {
    const uid = currentUserId || userId;
    if (!uid) return;

    setLoading(true);
    setError(null);

    const { data: receivedData, error: receivedError } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status, created_at, updated_at')
      .eq('receiver_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const { data: sentData, error: sentError } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status, created_at, updated_at')
      .eq('requester_id', uid)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(8);

    if (receivedError || sentError) {
      setError(receivedError?.message || sentError?.message || 'Impossibile caricare le notifiche.');
      setReceived([]);
      setSent([]);
      setProfilesById({});
      setLoading(false);
      return;
    }

    const nextReceived = (receivedData || []) as UserLink[];
    const nextSent = (sentData || []) as UserLink[];

    setReceived(nextReceived);
    setSent(nextSent);

    await loadProfiles([
      ...nextReceived.map((link) => link.requester_id),
      ...nextSent.map((link) => link.receiver_id),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.replace(`/login?next=${encodeURIComponent('/notifications')}`);
        return;
      }

      setUserId(user.id);
      await loadNotifications(user.id);
    }

    init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-links:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
          filter: `receiver_id=eq.${userId}`,
        },
        () => loadNotifications(userId)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_links',
          filter: `requester_id=eq.${userId}`,
        },
        () => loadNotifications(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  async function respondToRequest(id: string, status: 'accepted' | 'rejected') {
    setBusyId(id);
    setError(null);

    const { error: updateError } = await supabase
      .from('user_links')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setBusyId(null);
      return;
    }

    await loadNotifications();
    setBusyId(null);
  }

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">
              Richieste e aggiornamenti
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Notifiche</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">
              Qui arrivano le richieste di legame personale. Solo dopo l’accettazione si sblocca la chat privata tra due persone.
            </p>
          </div>

          <Button href="/calls/new" variant="lime">
            Apri una Call
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Richieste di legame ricevute</h2>
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  {loading ? 'Carico…' : `${received.length} richiesta/e in attesa`}
                </p>
              </div>
            </div>

            {loading && (
              <div className="mt-6 grid gap-4">
                {[1, 2].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
                ))}
              </div>
            )}

            {!loading && received.length === 0 && (
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center">
                <h3 className="text-2xl font-black">Nessuna richiesta in attesa</h3>
                <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                  Quando qualcuno chiederà un legame dal tuo profilo in una Call, lo vedrai qui.
                </p>
              </div>
            )}

            {!loading && received.length > 0 && (
              <div className="mt-6 grid gap-4">
                {received.map((request) => {
                  const profile = profilesById[request.requester_id];
                  const name = profile?.full_name || 'Utente Nova';
                  const avatar = profile?.avatar_url || '';

                  return (
                    <div key={request.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black text-white">
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-black uppercase tracking-[.2em] text-cyan-200/70">
                              Richiesta ricevuta · {formatDate(request.created_at)}
                            </div>
                            <h3 className="mt-2 text-2xl font-black">{name}</h3>
                            <p className="mt-1 text-sm font-bold text-cyan-200">
                              {profile?.city || 'NOVA'} · {profile?.nova_points || 0} punti Nova
                            </p>
                            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                              {profile?.bio || 'Questo utente vuole creare un legame personale con te dopo un’interazione in Call.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2 md:flex-col">
                          <button
                            type="button"
                            onClick={() => respondToRequest(request.id, 'accepted')}
                            disabled={busyId === request.id}
                            className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                          >
                            Accetta
                          </button>

                          <button
                            type="button"
                            onClick={() => respondToRequest(request.id, 'rejected')}
                            disabled={busyId === request.id}
                            className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15 disabled:opacity-60"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-black">I tuoi legami</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
              Le richieste accettate sbloccano una chat privata nella sezione Messaggi.
            </p>

            <div className="mt-5 grid gap-3">
              {sent.length === 0 && !loading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-300">
                  Non hai ancora richieste inviate o legami attivi.
                </div>
              )}

              {sent.map((link) => {
                const profile = profilesById[link.receiver_id];
                const name = profile?.full_name || 'Utente Nova';

                return (
                  <div key={link.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-cyan-300 text-xs font-black">
                        {profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials(name)
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{name}</div>
                        <div className="text-xs font-bold text-slate-400">
                          {link.status === 'accepted' ? 'Legame attivo' : 'Richiesta inviata'}
                        </div>
                      </div>
                    </div>

                    {link.status === 'accepted' && (
                      <Link
                        href="/messages"
                        className="mt-3 block rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-4 py-2 text-center text-xs font-black text-white"
                      >
                        Apri Messaggi
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
