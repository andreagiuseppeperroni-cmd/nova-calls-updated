'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Navbar, Button, Card } from '@/components/ui';
import { NovaScoreCard, ProfileOrb, useNovaProfile } from '@/components/profile-store';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type UserLink = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string | null;
};

type PublicProfile = {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  bio: string | null;
  passions: string[] | null;
  city: string | null;
  role?: string | null;
  nova_points: number | null;
  contributions: number | null;
  calls_joined: number | null;
  outcomes_helped: number | null;
};

type LinkItem = {
  link: UserLink;
  otherUserId: string;
  profile: PublicProfile | null;
};

function splitTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileTags(profile: PublicProfile | null) {
  if (!profile) return [];
  const passions = Array.isArray(profile.passions) ? profile.passions : [];
  const roleTags = profile.role
    ? profile.role
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return [...passions, ...roleTags].slice(0, 8);
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

export default function ProfilePage() {
  const { profile, save, uploadAvatar, loading, syncError } = useNovaProfile();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicProfile | null>(null);

  const linksCount = links.length;

  async function loadLinks() {
    setLinksLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLinks([]);
      setLinksLoading(false);
      return;
    }

    const { data: linkRows, error: linksError } = await supabase
      .from('user_links')
      .select('id, requester_id, receiver_id, status, created_at, updated_at')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (linksError) {
      setLocalError(linksError.message);
      setLinks([]);
      setLinksLoading(false);
      return;
    }

    const acceptedLinks = (linkRows || []) as UserLink[];
    const otherIds = Array.from(
      new Set(acceptedLinks.map((link) => (link.requester_id === user.id ? link.receiver_id : link.requester_id)))
    );

    let profiles: PublicProfile[] = [];

    if (otherIds.length > 0) {
      const { data: profileRows, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, full_name, username, avatar_url, bio, passions, city, role, nova_points, contributions, calls_joined, outcomes_helped'
        )
        .in('id', otherIds);

      if (profilesError) {
        setLocalError(profilesError.message);
      } else {
        profiles = (profileRows || []) as PublicProfile[];
      }
    }

    const profileMap = new Map(profiles.map((item) => [item.id, item]));

    setLinks(
      acceptedLinks.map((link) => {
        const otherUserId = link.requester_id === user.id ? link.receiver_id : link.requester_id;
        return {
          link,
          otherUserId,
          profile: profileMap.get(otherUserId) || null,
        };
      })
    );

    setLinksLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function start() {
      if (!active) return;
      await loadLinks();
    }

    start();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function update(field: keyof typeof profile, value: string) {
    save({ [field]: value });
    setSaved(false);
    setLocalError(null);
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setLocalError(null);
    setSaved(false);

    try {
      await uploadAvatar(file);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Impossibile caricare l’immagine profilo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function onSave() {
    save(profile);
    setSaved(true);
    setLocalError(null);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Pagina personale</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Il tuo profilo Nova</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">
              Qui vivi il tuo punteggio Nova, i contributi, le informazioni pubbliche e i legami reciproci nati nelle Call.
            </p>

            {loading && <p className="mt-3 text-sm font-black text-cyan-200/80">Sincronizzo il profilo reale…</p>}
          </div>

          <Button href="/calls/new" variant="lime">
            Apri una Call
          </Button>
        </div>

        {(syncError || localError) && (
          <div className="mb-6 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {localError || syncError}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="space-y-5">
            <Card className="p-6 text-center">
              <div className="mx-auto h-36 w-36">
                <ProfileOrb className="h-36 w-36" />
              </div>

              <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/15">
                {uploading ? 'Carico immagine…' : 'Carica immagine profilo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <p className="mt-3 text-xs font-semibold text-slate-400">
                L&apos;immagine viene caricata su Supabase Storage e usata nella sfera profilo.
              </p>
            </Card>

            <NovaScoreCard />

            <Card className="p-6">
              <h2 className="text-2xl font-black">Contributi</h2>

              <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <b className="text-3xl text-cyan-300">{profile.contributions}</b>
                  <span className="mt-1 block text-xs font-bold text-slate-400">Messaggi utili</span>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <b className="text-3xl text-lime-300">{profile.callsJoined}</b>
                  <span className="mt-1 block text-xs font-bold text-slate-400">Call entrate</span>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <b className="text-3xl text-pink-300">{profile.outcomesHelped}</b>
                  <span className="mt-1 block text-xs font-bold text-slate-400">Outcome</span>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <b className="text-3xl text-violet-300">{linksLoading ? '…' : linksCount}</b>
                  <span className="mt-1 block text-xs font-bold text-slate-400">Legami</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-slate-400">Nome visualizzato</span>
                  <input
                    value={profile.displayName}
                    onChange={(event) => update('displayName', event.target.value)}
                    autoComplete="name"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-400">Città / area</span>
                  <input
                    value={profile.city}
                    onChange={(event) => update('city', event.target.value)}
                    autoComplete="address-level2"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-black text-slate-400">Biografia</span>
                  <textarea
                    value={profile.bio}
                    onChange={(event) => update('bio', event.target.value)}
                    rows={5}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold leading-7 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-400">Passioni</span>
                  <textarea
                    value={profile.passions}
                    onChange={(event) => update('passions', event.target.value)}
                    rows={4}
                    placeholder="Decisioni, crescita personale, idee, community"
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold leading-7 outline-none"
                  />
                  <span className="mt-2 block text-xs font-semibold text-slate-500">Separale con una virgola.</span>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-400">Interessi per le Call</span>
                  <textarea
                    value={profile.interests}
                    onChange={(event) => update('interests', event.target.value)}
                    rows={4}
                    placeholder="Milano, lavoro, startup, relazioni, creatività"
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold leading-7 outline-none"
                  />
                  <span className="mt-2 block text-xs font-semibold text-slate-500">Questi interessi aiuteranno a suggerire Spazi e Call.</span>
                </label>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onSave}
                  className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-slate-950"
                >
                  Salva profilo
                </button>

                {saved && <span className="text-sm font-black text-lime-300">Profilo aggiornato</span>}

                <Link href="/people" className="text-sm font-black text-slate-300 hover:text-white">
                  Vedi persone con cui hai interagito →
                </Link>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xl font-black">Anteprima pubblica</h3>

                <div className="mt-4 rounded-[2rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-4">
                    <ProfileOrb className="h-16 w-16 shrink-0" />

                    <div>
                      <h4 className="text-2xl font-black">{profile.displayName}</h4>
                      <p className="text-sm font-bold text-cyan-200">
                        {profile.city} · {profile.score} punti Nova · {linksLoading ? '…' : linksCount} legami
                      </p>
                      <p className="mt-2 font-semibold leading-7 text-slate-300">{profile.bio}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[...splitTags(profile.passions), ...splitTags(profile.interests)].slice(0, 8).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-xs font-black uppercase tracking-[.2em] text-slate-500">
                        Solo legami reciproci · chat privata solo dopo accettazione
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Relazioni reciproche</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Legami</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                    Qui trovi solo i legami accettati da entrambe le persone. Da ogni legame puoi aprire il profilo pubblico o la chat privata.
                  </p>
                </div>

                <Button href="/notifications" variant="ghost">
                  Richieste
                </Button>
              </div>

              {linksLoading && (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
                  ))}
                </div>
              )}

              {!linksLoading && links.length === 0 && (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-7 text-center">
                  <h3 className="text-2xl font-black">Nessun legame attivo</h3>
                  <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                    Entra nelle Call, contribuisci e crea legami reciproci con le persone con cui nasce uno scambio utile.
                  </p>
                </div>
              )}

              {!linksLoading && links.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {links.map((item) => {
                    const publicProfile = item.profile;
                    const name = publicProfile?.full_name || 'Utente Nova';
                    const avatar = publicProfile?.avatar_url || '';

                    return (
                      <article key={item.link.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start gap-4">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black text-white">
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black">{name}</h3>
                            <p className="text-sm font-bold text-cyan-200">
                              {publicProfile?.city || 'NOVA'} · {publicProfile?.nova_points || 0} punti Nova
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-300">
                              {publicProfile?.bio || 'Profilo non ancora completato.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPublicProfile(publicProfile)}
                            className="rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
                          >
                            Visualizza profilo
                          </button>

                          <Link
                            href={`/messages?link=${item.link.id}`}
                            className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 px-4 py-3 text-center text-sm font-black text-white"
                          >
                            Apri chat
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {selectedPublicProfile && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 px-4 backdrop-blur-xl">
          <div className="relative w-[min(560px,100%)] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-[0_0_60px_rgba(34,211,238,.22)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(34,211,238,.2),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(236,72,153,.16),transparent_30%)]" />

            <div className="relative z-10">
              <button
                type="button"
                onClick={() => setSelectedPublicProfile(null)}
                className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-xl font-black hover:bg-white/15"
                aria-label="Chiudi profilo"
              >
                ×
              </button>

              <div className="flex items-start gap-5 pr-12">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_20%,#f8b4ff,#7c3aed_38%,#0f172a_70%)] text-xl font-black">
                  {selectedPublicProfile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPublicProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(selectedPublicProfile.full_name || 'Utente Nova')
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[.24em] text-cyan-200/75">Profilo pubblico</p>
                  <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-.04em]">
                    {selectedPublicProfile.full_name || 'Utente Nova'}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-cyan-200">
                    {selectedPublicProfile.city || 'NOVA'} · {selectedPublicProfile.nova_points || 0} punti Nova
                  </p>
                </div>
              </div>

              <p className="mt-5 font-semibold leading-7 text-slate-300">
                {selectedPublicProfile.bio || 'Questo utente non ha ancora completato la biografia del profilo.'}
              </p>

              {profileTags(selectedPublicProfile).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profileTags(selectedPublicProfile).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <b className="text-2xl text-cyan-300">{selectedPublicProfile.contributions || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-slate-400">Messaggi utili</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <b className="text-2xl text-lime-300">{selectedPublicProfile.calls_joined || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-slate-400">Call entrate</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <b className="text-2xl text-pink-300">{selectedPublicProfile.outcomes_helped || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-slate-400">Outcome</span>
                </div>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-slate-500">
                Profilo visibile perché avete un legame reciproco.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
