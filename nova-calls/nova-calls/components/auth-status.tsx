'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

export function AuthStatus() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      router.refresh();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!ready) {
    return <span className="text-sm font-black text-slate-500">…</span>;
  }

  if (!user) {
    return <Link href="/login" className="hover:text-white">Login</Link>;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
    router.refresh();
  }

  const label =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Profilo';

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="max-w-[150px] truncate text-cyan-100 hover:text-white">
        {label}
      </Link>
      <button type="button" onClick={signOut} className="text-slate-400 hover:text-white">
        Esci
      </button>
    </div>
  );
}
