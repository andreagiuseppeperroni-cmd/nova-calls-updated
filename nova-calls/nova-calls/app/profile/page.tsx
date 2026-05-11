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
      .toUpperCase() || 'SQ'
  );
}

export default function ProfilePage() {
  const { profile, save, uploadAvatar, loading, syncError } = useNovaProfile();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicProfile | null>(null);

  const linksCount = links.length;
  const displayName = profile.displayName || 'Andrea Perroni';
  const city = profile.city || 'Roma';
  const squareTitle = `${displayName.split(' ')[0] || 'La tua'}’s Square`;
  const allTags = [...splitTags(profile.passions), ...splitTags(profile.interests)].slice(0, 10);

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
    setIsEditing(false);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] text-[#15120d]">
      <Navbar />

      <main className="mx-auto w-[min(1540px,calc(100%-28px))] pb-14 pt-5">
        {(syncError || localError) && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
            {localError || syncError}
          </div>
        )}

        {saved && (
          <div className="fixed right-5 top-24 z-[120] rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 shadow-[0_18px_60px_rgba(22,163,74,.18)]">
            Profilo aggiornato
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="relative min-h-[360px] overflow-hidden rounded-[2.2rem] border border-amber-100 bg-[#f7dfae] shadow-[0_24px_80px_rgba(113,82,38,.14)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,255,255,.92),transparent_21%),radial-gradient(circle_at_83%_19%,rgba(56,189,248,.22),transparent_28%),linear-gradient(90deg,rgba(255,250,240,.96),rgba(255,250,240,.66)_42%,rgba(255,250,240,.08)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(180deg,transparent,rgba(248,181,73,.18))]" />
              <div className="absolute bottom-0 right-0 h-[260px] w-[58%] opacity-70">
                <div className="absolute bottom-0 left-[10%] h-20 w-20 rounded-t-full bg-[#ffd166]/70" />
                <div className="absolute bottom-0 left-[24%] h-28 w-40 rounded-t-[4rem] bg-[#f6c46a]/70" />
                <div className="absolute bottom-0 left-[46%] h-36 w-52 rounded-t-[5rem] bg-[#f1b35b]/60" />
                <div className="absolute bottom-0 right-[3%] h-44 w-64 rounded-t-[6rem] bg-[#df9f49]/50" />
                <div className="absolute bottom-0 left-[18%] h-[2px] w-[78%] bg-[#9b6b2c]/15" />
              </div>

              <div className="relative z-10 grid gap-6 p-7 md:p-9 lg:grid-cols-[minmax(0,1fr)_330px]">
                <div className="flex min-h-[300px] flex-col justify-between">
                  <div>
                    <div className="mb-4 inline-flex rounded-full bg-amber-300/70 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-amber-900">
                      Piazza permanente · {city}
                    </div>
                    <h1 className="max-w-2xl text-[clamp(3rem,6vw,5.9rem)] font-black leading-[.82] tracking-[-.075em] text-[#17120c]">
                      {squareTitle}
                      <span className="ml-3 inline-block text-amber-400">☼</span>
                    </h1>
                    <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-[#4f4636] md:text-lg">
                      {profile.bio ||
                        'Una piazza permanente dove i post del creator possono generare stanze temporanee di 24 ore per conversazioni, idee e collaborazioni.'}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/my-square"
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#17120c] px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(23,18,12,.18)]"
                    >
                      Entra nella Piazza
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 text-sm font-black text-[#17120c] shadow-[0_16px_35px_rgba(245,158,11,.18)]"
                    >
                      ✎ Modifica profilo
                    </button>
                    <Button href="/calls/new" variant="lime">
                      Apri stanza
                    </Button>
                  </div>
                </div>

                <aside className="rounded-[1.8rem] border border-white/70 bg-white/80 p-6 text-center shadow-[0_20px_70px_rgba(113,82,38,.14)] backdrop-blur-2xl">
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-[0_16px_40px_rgba(113,82,38,.16)]">
                    <ProfileOrb className="h-full w-full" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-black tracking-[-.04em]">{displayName}</h2>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-[10px] font-black text-white">✓</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#746653]">{profile.interests || 'Creator · Pensatore · Costruttore di comunità'}</p>
                  <p className="mx-auto mt-4 max-w-[260px] text-sm font-semibold leading-6 text-[#5e5344]">
                    Creo spazi di dialogo per trasformare idee in progetti che fanno bene alle persone e alla città.
                  </p>

                  <div className="mt-6 grid grid-cols-3 border-y border-[#eadcc5] py-4 text-center">
                    <div>
                      <b className="block text-xl font-black">{linksLoading ? '…' : linksCount}</b>
                      <span className="text-[11px] font-bold text-[#786b5a]">Membri</span>
                    </div>
                    <div>
                      <b className="block text-xl font-black">{profile.callsJoined}</b>
                      <span className="text-[11px] font-bold text-[#786b5a]">Stanze</span>
                    </div>
                    <div>
                      <b className="block text-xl font-black">{profile.score}</b>
                      <span className="text-[11px] font-bold text-[#786b5a]">Score</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-left">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>🔔 Nuove stanze</span>
                      <span className="h-5 w-9 rounded-full bg-emerald-400 p-1">
                        <span className="block h-3 w-3 translate-x-4 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>🧾 Post del creator</span>
                      <span className="h-5 w-9 rounded-full bg-emerald-400 p-1">
                        <span className="block h-3 w-3 translate-x-4 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>☼ Riepiloghi giornalieri</span>
                      <span className="h-5 w-9 rounded-full bg-stone-300 p-1">
                        <span className="block h-3 w-3 rounded-full bg-white" />
                      </span>
                    </div>
                  </div>

                  {loading && <p className="mt-4 text-xs font-black text-amber-700">Sincronizzo il profilo reale…</p>}
                </aside>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-[1.8rem] border border-[#eadcc5] bg-white p-6 shadow-[0_18px_58px_rgba(113,82,38,.10)]">
                <div className="mb-4 inline-flex rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-rose-700">
                  Post in evidenza
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-amber-200">
                    <ProfileOrb className="h-full w-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="font-black">{displayName}</b>
                      <span className="text-sky-500">✓</span>
                    </div>
                    <p className="text-xs font-bold text-[#786b5a]">2 ore fa · nella sua Piazza</p>
                  </div>
                </div>
                <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-.04em]">
                  Quale idea semplice può avere il massimo impatto nella tua città?
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#5e5344]">
                  Parliamone insieme: aprirò alcune stanze di 24h per approfondire le idee più interessanti e trasformarle in azioni concrete.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-black text-[#4f4636]">
                  <span>♥ 128</span>
                  <span>💬 42</span>
                  <span>↗ 23</span>
                  <Link href="/calls/new" className="ml-auto text-[#17120c]">
                    Vedi post completo →
                  </Link>
                </div>
              </article>

              <article className="rounded-[1.8rem] border border-[#eadcc5] bg-white p-6 shadow-[0_18px_58px_rgba(113,82,38,.10)]">
                <div className="mb-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-amber-800">
                  Stanze aperte da questo post
                </div>
                <div className="space-y-3">
                  {[
                    ['💡', 'Idee che migliorano la mobilità', '24 partecipanti'],
                    ['🌿', 'Spazi verdi: proposte concrete', '18 partecipanti'],
                    ['⚙️', 'Tecnologia civica al servizio di tutti', '31 partecipanti'],
                  ].map(([icon, title, meta]) => (
                    <Link
                      href="/calls/new"
                      key={title}
                      className="flex items-center gap-3 rounded-2xl border border-[#f0e4d1] bg-[#fffaf0] p-3 transition hover:-translate-y-1 hover:bg-white"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-lg">{icon}</span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm font-black">{title}</b>
                        <span className="text-xs font-bold text-[#857765]">{meta}</span>
                      </span>
                      <span className="text-sm font-black">→</span>
                    </Link>
                  ))}
                </div>
                <Link href="/calls/new" className="mt-5 inline-flex text-sm font-black text-[#17120c]">
                  Apri una stanza da un post →
                </Link>
              </article>
            </section>

            <section className="rounded-[1.8rem] border border-[#eadcc5] bg-white p-6 shadow-[0_18px_58px_rgba(113,82,38,.10)]">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-amber-700">Stanze temporanee</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">Stanze attive della Piazza</h2>
                </div>
                <Link href="/calls/new" className="text-sm font-black">
                  Vedi tutte →
                </Link>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ['23h 15m rimanenti', 'Idee che migliorano la mobilità', '24 partecipanti', 'bg-lime-100', 'text-lime-700'],
                  ['18h 42m rimanenti', 'Spazi verdi: proposte concrete', '18 partecipanti', 'bg-sky-100', 'text-sky-700'],
                  ['12h 05m rimanenti', 'Tecnologia civica al servizio di tutti', '31 partecipanti', 'bg-rose-100', 'text-rose-700'],
                ].map(([time, title, meta, bg, color]) => (
                  <article key={title} className="rounded-[1.5rem] border border-[#eadcc5] bg-[#fffdf8] p-5">
                    <span className={`inline-flex rounded-full ${bg} px-3 py-1 text-xs font-black ${color}`}>{time}</span>
                    <h3 className="mt-4 text-xl font-black leading-tight tracking-[-.035em]">{title}</h3>
                    <p className="mt-2 text-sm font-bold text-[#786b5a]">{meta}</p>
                    <Link
                      href="/calls/new"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#17120c] px-4 py-3 text-sm font-black text-white"
                    >
                      Entra nella stanza
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-[#eadcc5] bg-white p-6 shadow-[0_18px_58px_rgba(113,82,38,.10)]">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-amber-700">Relazioni reciproche</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">Membri e legami</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6d604f]">
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
                    <div key={item} className="h-32 animate-pulse rounded-[1.5rem] border border-[#eadcc5] bg-[#fffaf0]" />
                  ))}
                </div>
              )}

              {!linksLoading && links.length === 0 && (
                <div className="mt-6 rounded-[1.5rem] border border-[#eadcc5] bg-[#fffaf0] p-7 text-center">
                  <h3 className="text-2xl font-black">Nessun legame attivo</h3>
                  <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-[#6d604f]">
                    Entra nelle stanze, contribuisci e crea legami reciproci con le persone con cui nasce uno scambio utile.
                  </p>
                </div>
              )}

              {!linksLoading && links.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {links.map((item) => {
                    const publicProfile = item.profile;
                    const name = publicProfile?.full_name || 'Utente Square';
                    const avatar = publicProfile?.avatar_url || '';

                    return (
                      <article key={item.link.id} className="rounded-[1.5rem] border border-[#eadcc5] bg-[#fffaf0] p-5">
                        <div className="flex items-start gap-4">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 to-sky-400 text-sm font-black text-white">
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black">{name}</h3>
                            <p className="text-sm font-bold text-amber-700">
                              {publicProfile?.city || 'The Square'} · {publicProfile?.nova_points || 0} punti
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#6d604f]">
                              {publicProfile?.bio || 'Profilo non ancora completato.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPublicProfile(publicProfile)}
                            className="rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 text-sm font-black text-[#17120c] hover:bg-[#fffaf0]"
                          >
                            Visualizza profilo
                          </button>

                          <Link
                            href={`/messages?link=${item.link.id}`}
                            className="rounded-2xl bg-[#17120c] px-4 py-3 text-center text-sm font-black text-white"
                          >
                            Apri chat
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <Card className="border-0 bg-white p-6 text-[#17120c] shadow-[0_18px_58px_rgba(113,82,38,.10)]">
              <h3 className="text-xl font-black">Echo della Piazza</h3>
              <div className="mt-4 rounded-[1.4rem] bg-[#fff7e7] p-5">
                <p className="text-3xl text-amber-400">“</p>
                <p className="font-semibold leading-7 text-[#5e5344]">
                  Ogni conversazione qui dentro può essere l’inizio di qualcosa di grande.
                </p>
                <p className="mt-4 text-sm font-black">— {displayName.split(' ')[0] || 'Creator'}</p>
              </div>
            </Card>

            <Card className="border-0 bg-white p-6 text-[#17120c] shadow-[0_18px_58px_rgba(113,82,38,.10)]">
              <h3 className="text-xl font-black">Membri attivi</h3>
              <div className="mt-4 flex -space-x-3">
                {['G', 'M', 'A', 'S', 'L', 'F'].map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-sky-400 text-sm font-black text-white"
                  >
                    {item}
                  </span>
                ))}
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-[#f4ead9] text-xs font-black text-[#5e5344]">
                  +{linksLoading ? '…' : Math.max(linksCount, 24)}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#6d604f]">1.248 online ora nella rete di questa Piazza.</p>
            </Card>

            <NovaScoreCard />

            <Card className="border-0 bg-white p-6 text-[#17120c] shadow-[0_18px_58px_rgba(113,82,38,.10)]">
              <h3 className="text-xl font-black">Tag della Piazza</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(allTags.length ? allTags : ['community', 'città', 'idee', 'eventi', 'collaborazioni']).map((tag) => (
                  <span key={tag} className="rounded-full bg-[#fff3d6] px-3 py-2 text-xs font-black text-amber-800">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </aside>
        </section>

        {isEditing && (
          <div className="fixed inset-0 z-[130] overflow-y-auto bg-[#17120c]/55 px-4 py-8 backdrop-blur-xl">
            <div className="mx-auto w-[min(880px,100%)] overflow-hidden rounded-[2rem] border border-white/60 bg-[#fffaf0] shadow-[0_40px_130px_rgba(23,18,12,.35)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#eadcc5] p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-amber-700">Modifica informazioni personali</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">Modifica profilo</h2>
                  <p className="mt-2 text-sm font-semibold text-[#6d604f]">
                    Queste informazioni saranno usate per costruire la tua Piazza personale.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl font-black text-[#17120c]"
                  aria-label="Chiudi modifica profilo"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[260px_1fr]">
                <div>
                  <div className="rounded-[1.6rem] border border-[#eadcc5] bg-white p-5 text-center">
                    <div className="mx-auto h-32 w-32 overflow-hidden rounded-full">
                      <ProfileOrb className="h-full w-full" />
                    </div>

                    <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#eadcc5] bg-[#fffaf0] px-5 py-3 text-sm font-black hover:bg-white">
                      {uploading ? 'Carico immagine…' : 'Carica immagine'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>

                    <p className="mt-3 text-xs font-semibold text-[#786b5a]">
                      L’immagine viene caricata su Supabase Storage e usata nella sfera profilo.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-[#6d604f]">Nome visualizzato</span>
                    <input
                      value={profile.displayName}
                      onChange={(event) => update('displayName', event.target.value)}
                      autoComplete="name"
                      className="mt-2 w-full rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 font-bold text-[#17120c] outline-none focus:border-amber-300"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#6d604f]">Città / area</span>
                    <input
                      value={profile.city}
                      onChange={(event) => update('city', event.target.value)}
                      autoComplete="address-level2"
                      className="mt-2 w-full rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 font-bold text-[#17120c] outline-none focus:border-amber-300"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-sm font-black text-[#6d604f]">Biografia</span>
                    <textarea
                      value={profile.bio}
                      onChange={(event) => update('bio', event.target.value)}
                      rows={5}
                      className="mt-2 w-full resize-none rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 font-bold leading-7 text-[#17120c] outline-none focus:border-amber-300"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#6d604f]">Passioni</span>
                    <textarea
                      value={profile.passions}
                      onChange={(event) => update('passions', event.target.value)}
                      rows={4}
                      placeholder="Decisioni, crescita personale, idee, community"
                      className="mt-2 w-full resize-none rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 font-bold leading-7 text-[#17120c] outline-none focus:border-amber-300"
                    />
                    <span className="mt-2 block text-xs font-semibold text-[#786b5a]">Separale con una virgola.</span>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#6d604f]">Interessi per le stanze</span>
                    <textarea
                      value={profile.interests}
                      onChange={(event) => update('interests', event.target.value)}
                      rows={4}
                      placeholder="Roma, lavoro, startup, relazioni, creatività"
                      className="mt-2 w-full resize-none rounded-2xl border border-[#eadcc5] bg-white px-4 py-3 font-bold leading-7 text-[#17120c] outline-none focus:border-amber-300"
                    />
                    <span className="mt-2 block text-xs font-semibold text-[#786b5a]">
                      Questi interessi aiuteranno a suggerire Piazze, stanze e persone.
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-3 border-t border-[#eadcc5] pt-5 md:col-span-2">
                    <button
                      type="button"
                      onClick={onSave}
                      className="rounded-2xl bg-[#17120c] px-5 py-3 text-sm font-black text-white"
                    >
                      Salva profilo
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-2xl border border-[#eadcc5] bg-white px-5 py-3 text-sm font-black text-[#17120c]"
                    >
                      Annulla
                    </button>

                    {saved && <span className="text-sm font-black text-emerald-700">Profilo aggiornato</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPublicProfile && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-[#17120c]/70 px-4 backdrop-blur-xl">
            <div className="relative w-[min(560px,100%)] overflow-hidden rounded-[2rem] border border-white/40 bg-[#fffaf0] p-6 shadow-[0_0_60px_rgba(245,158,11,.18)]">
              <button
                type="button"
                onClick={() => setSelectedPublicProfile(null)}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-black hover:bg-[#fff7e7]"
                aria-label="Chiudi profilo"
              >
                ×
              </button>

              <div className="flex items-start gap-5 pr-12">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadcc5] bg-gradient-to-br from-amber-300 to-sky-400 text-xl font-black text-white">
                  {selectedPublicProfile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPublicProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(selectedPublicProfile.full_name || 'Utente Square')
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[.24em] text-amber-700">Profilo pubblico</p>
                  <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-.04em]">
                    {selectedPublicProfile.full_name || 'Utente Square'}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-amber-700">
                    {selectedPublicProfile.city || 'The Square'} · {selectedPublicProfile.nova_points || 0} punti
                  </p>
                </div>
              </div>

              <p className="mt-5 font-semibold leading-7 text-[#5e5344]">
                {selectedPublicProfile.bio || 'Questo utente non ha ancora completato la biografia del profilo.'}
              </p>

              {profileTags(selectedPublicProfile).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profileTags(selectedPublicProfile).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#fff3d6] px-3 py-1 text-xs font-black text-amber-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-[#eadcc5] bg-white p-4">
                  <b className="text-2xl text-sky-600">{selectedPublicProfile.contributions || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-[#786b5a]">Messaggi utili</span>
                </div>
                <div className="rounded-2xl border border-[#eadcc5] bg-white p-4">
                  <b className="text-2xl text-lime-600">{selectedPublicProfile.calls_joined || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-[#786b5a]">Stanze</span>
                </div>
                <div className="rounded-2xl border border-[#eadcc5] bg-white p-4">
                  <b className="text-2xl text-rose-500">{selectedPublicProfile.outcomes_helped || 0}</b>
                  <span className="mt-1 block text-[11px] font-bold text-[#786b5a]">Outcome</span>
                </div>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#9a8a73]">
                Profilo visibile perché avete un legame reciproco.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
