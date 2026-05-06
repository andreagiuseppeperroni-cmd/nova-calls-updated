'use client';

import Link from 'next/link';
import { ChangeEvent, useState } from 'react';
import { Navbar, Button, Card } from '@/components/ui';
import { NovaScoreCard, ProfileOrb, useNovaProfile } from '@/components/profile-store';

function splitTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const { profile, save, uploadAvatar, loading, syncError } = useNovaProfile();

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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
              Qui vivi il tuo punteggio Nova, i contributi e le informazioni che gli altri possono solo visualizzare.
              Su NOVA non si aggiunge e non si segue nessuno.
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

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
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
              </div>
            </Card>
          </div>

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
                      {profile.city} · {profile.score} punti Nova
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
                      Solo visualizzazione · nessun follow · nessuna richiesta amicizia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
