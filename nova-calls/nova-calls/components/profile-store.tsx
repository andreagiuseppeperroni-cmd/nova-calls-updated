'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  return next;
}

export function useNovaProfile() {
  const [profile, setProfile] = useState<NovaProfile>(defaultProfile);

  useEffect(() => {
    setProfile(readProfile());
    const handler = () => setProfile(readProfile());
    window.addEventListener('storage', handler);
    window.addEventListener('nova:profile-updated', handler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('nova:profile-updated', handler as EventListener);
    };
  }, []);

  const save = useCallback((patch: Partial<NovaProfile>) => {
    setProfile((current) => {
      const next = { ...current, ...patch };
      writeProfile(next);
      return next;
    });
  }, []);

  const level = useMemo(() => Math.max(1, Math.floor(profile.score / 500) + 1), [profile.score]);
  const progress = useMemo(() => Math.min(100, (profile.score % 500) / 5), [profile.score]);

  return { profile, save, level, progress };
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
  const { profile, level, progress } = useNovaProfile();
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
        <span className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-300">
        Parti da zero. Ogni contributo utile in una Call aumenta il tuo punteggio Nova.
      </p>
    </div>
  );
}
