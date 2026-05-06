'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type NovaProfile = {
  displayName: string;
  bio: string;
  city: string;
  passions: string;
  interests: string;
  avatar: string;
  score: number;
  contributions: number;
  callsJoined: number;
  outcomesHelped: number;
};

type ProfileRow = {
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

export const defaultProfile: NovaProfile = {
  displayName: 'Profilo Nova',
  bio: 'Racconta chi sei, cosa sai fare e in quali momenti puoi aiutare gli altri.',
  city: 'Italia',
  passions: 'Decisioni, crescita personale, idee, community',
  interests: 'Milano, lavoro, startup, relazioni, creatività',
  avatar: '',
  score: 0,
  contributions: 0,
  callsJoined: 0,
  outcomesHelped: 0,
};

const PROFILE_KEY = 'nova:profile';

function rowToProfile(row: ProfileRow | null | undefined): NovaProfile {
  if (!row) return defaultProfile;

  return {
    displayName: row.full_name || defaultProfile.displayName,
    bio: row.bio || defaultProfile.bio,
    city: row.city || defaultProfile.city,
    passions: Array.isArray(row.passions) && row.passions.length ? row.passions.join(', ') : defaultProfile.passions,
    interests: row.role || defaultProfile.interests,
    avatar: row.avatar_url || '',
    score: row.nova_points || 0,
    contributions: row.contributions || 0,
    callsJoined: row.calls_joined || 0,
    outcomesHelped: row.outcomes_helped || 0,
  };
}

function profileToDbPatch(profile: Partial<NovaProfile>) {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (profile.displayName !== undefined) patch.full_name = profile.displayName;
  if (profile.bio !== undefined) patch.bio = profile.bio;
  if (profile.city !== undefined) patch.city = profile.city;
  if (profile.passions !== undefined) {
    patch.passions = profile.passions
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (profile.interests !== undefined) patch.role = profile.interests;
  if (profile.avatar !== undefined) patch.avatar_url = profile.avatar;
  if (profile.score !== undefined) patch.nova_points = profile.score;
  if (profile.contributions !== undefined) patch.contributions = profile.contributions;
  if (profile.callsJoined !== undefined) patch.calls_joined = profile.callsJoined;
  if (profile.outcomesHelped !== undefined) patch.outcomes_helped = profile.outcomesHelped;

  return patch;
}

function readProfile(): NovaProfile {
  if (typeof window === 'undefined') return defaultProfile;

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

function writeProfile(profile: NovaProfile) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('nova:profile-updated', { detail: profile }));
}

async function ensureRemoteProfile() {
  const supabase = createBrowserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata || {};
  const defaultName =
    metadata.full_name || metadata.name || metadata.display_name || user.email?.split('@')[0] || 'Profilo Nova';
  const defaultAvatar = metadata.avatar_url || metadata.picture || null;

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select(
      'id, full_name, username, avatar_url, bio, passions, city, role, nova_points, contributions, calls_joined, outcomes_helped'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as ProfileRow;

  const local = readProfile();

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: local.displayName === defaultProfile.displayName ? defaultName : local.displayName,
      avatar_url: local.avatar || defaultAvatar,
      bio: local.bio,
      city: local.city,
      passions: local.passions
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      role: local.interests,
      nova_points: local.score,
      contributions: local.contributions,
      calls_joined: local.callsJoined,
      outcomes_helped: local.outcomesHelped,
    })
    .select(
      'id, full_name, username, avatar_url, bio, passions, city, role, nova_points, contributions, calls_joined, outcomes_helped'
    )
    .single();

  if (insertError) throw insertError;

  return created as ProfileRow;
}

async function loadRemoteProfile() {
  const row = await ensureRemoteProfile();
  if (!row) return null;

  const profile = rowToProfile(row);
  writeProfile(profile);

  return profile;
}

async function saveRemoteProfile(patch: Partial<NovaProfile>) {
  const supabase = createBrowserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await ensureRemoteProfile();

  const { data, error } = await supabase
    .from('profiles')
    .update(profileToDbPatch(patch))
    .eq('id', user.id)
    .select(
      'id, full_name, username, avatar_url, bio, passions, city, role, nova_points, contributions, calls_joined, outcomes_helped'
    )
    .single();

  if (error) throw error;

  const profile = rowToProfile(data as ProfileRow);
  writeProfile(profile);

  return profile;
}

async function uploadRemoteAvatar(file: File) {
  const supabase = createBrowserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Devi essere loggato per caricare un’immagine profilo.');

  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  await saveRemoteProfile({ avatar: publicUrl });

  return publicUrl;
}

export function addNovaContribution(points: number, field?: 'contributions' | 'callsJoined' | 'outcomesHelped') {
  const current = readProfile();
  const next = {
    ...current,
    score: Math.max(0, current.score + points),
    contributions: current.contributions + (field === 'contributions' ? 1 : 0),
    callsJoined: current.callsJoined + (field === 'callsJoined' ? 1 : 0),
    outcomesHelped: current.outcomesHelped + (field === 'outcomesHelped' ? 1 : 0),
  };

  writeProfile(next);

  saveRemoteProfile({
    score: next.score,
    contributions: next.contributions,
    callsJoined: next.callsJoined,
    outcomesHelped: next.outcomesHelped,
  }).catch((error) => {
    console.warn('NOVA profile score sync failed:', error);
  });

  return next;
}

export function useNovaProfile() {
  const [profile, setProfile] = useState<NovaProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setProfile(readProfile());

    loadRemoteProfile()
      .then((remoteProfile) => {
        if (!active) return;
        if (remoteProfile) setProfile(remoteProfile);
      })
      .catch((error) => {
        if (!active) return;
        setSyncError(error instanceof Error ? error.message : 'Impossibile caricare il profilo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handler = () => setProfile(readProfile());
    window.addEventListener('storage', handler);
    window.addEventListener('nova:profile-updated', handler as EventListener);

    return () => {
      active = false;
      window.removeEventListener('storage', handler);
      window.removeEventListener('nova:profile-updated', handler as EventListener);
    };
  }, []);

  const save = useCallback((patch: Partial<NovaProfile>) => {
    setProfile((current) => {
      const next = { ...current, ...patch };
      writeProfile(next);

      saveRemoteProfile(patch).catch((error) => {
        setSyncError(error instanceof Error ? error.message : 'Impossibile salvare il profilo.');
      });

      return next;
    });
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    setSyncError(null);
    const publicUrl = await uploadRemoteAvatar(file);
    setProfile((current) => ({ ...current, avatar: publicUrl }));
    return publicUrl;
  }, []);

  const level = useMemo(() => Math.max(1, Math.floor(profile.score / 500) + 1), [profile.score]);
  const progress = useMemo(() => Math.min(100, (profile.score % 500) / 5), [profile.score]);

  return { profile, save, uploadAvatar, level, progress, loading, syncError };
}

export function ProfileOrb({ className = '' }: { className?: string }) {
  const { profile } = useNovaProfile();

  return (
    <Link
      href="/profile"
      aria-label="Apri profilo"
      className={`grid overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_20%,#f8b4ff,#7c3aed_38%,#0f172a_70%)] shadow-[0_0_28px_rgba(139,92,246,.42)] ${className}`}
    >
      {profile.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar} alt="Immagine profilo" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-sm font-black text-white/80">ME</span>
      )}
    </Link>
  );
}

export function NovaScoreCard() {
  const { profile, level, progress, loading, syncError } = useNovaProfile();

  return (
    <div className="nova-glass rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.24em] text-cyan-200/70">Punteggio personale</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Livello Nova {level}</h2>
        </div>
        <b className="text-3xl text-lime-300">{profile.score}</b>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-300">
        Parti da zero. Ogni contributo utile in una Call aumenta il tuo punteggio Nova.
      </p>

      {loading && <p className="mt-3 text-xs font-bold text-cyan-200/70">Sincronizzo il profilo…</p>}

      {syncError && <p className="mt-3 text-xs font-bold text-pink-300">Sync profilo: {syncError}</p>}
    </div>
  );
}
