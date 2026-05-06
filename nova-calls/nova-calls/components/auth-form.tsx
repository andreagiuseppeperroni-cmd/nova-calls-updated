'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Mode = 'login' | 'signup';

function getSiteUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || '';
}

function getSafeNext(value: string | null) {
  if (!value) return '/';

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith('/')) return '/';
    if (decoded.startsWith('//')) return '/';

    return decoded;
  } catch {
    return '/';
  }
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = getSafeNext(searchParams.get('next'));

  async function goToNext() {
    /*
      Lasciamo a Supabase un istante per salvare la sessione nel browser.
      Senza questo piccolo passaggio, la Call può leggere "nessun utente"
      e rimandare subito a /login anche dopo un login corretto.
    */
    await supabase.auth.getSession();

    router.replace(next);
    router.refresh();

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = next;
      }
    }, 150);
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { full_name: fullName || email.split('@')[0] },
          },
        });

        if (error) throw error;

        /*
          Se Supabase non richiede conferma email, signUp restituisce già una sessione.
          In quel caso mandiamo subito l'utente alla pagina richiesta.
        */
        if (data.session) {
          await goToNext();
          return;
        }

        setMessage(
          'Registrazione avviata. Se Supabase richiede conferma email, controlla la posta e poi rientra da questo link.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await goToNext();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l’autenticazione.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) setError(error.message);
    else setMessage('Ti ho inviato il link di accesso via email.');

    setLoading(false);
  }

  return (
    <Card className="mx-auto w-full max-w-xl p-6 sm:p-8">
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[.28em] text-cyan-200/80">NOVA Auth</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
          {mode === 'login' ? 'Accedi a Nova' : 'Crea il tuo profilo'}
        </h1>
        <p className="mt-3 font-semibold leading-7 text-slate-300">
          Entra per partecipare alle Call, salvare gli Outcome e contribuire alla stanza.
        </p>
      </div>

      {next !== '/' && (
        <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-50">
          Dopo il login tornerai automaticamente alla Call.
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-full px-4 py-3 text-sm font-black transition ${
            mode === 'login' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-full px-4 py-3 text-sm font-black transition ${
            mode === 'signup' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
          }`}
        >
          Registrati
        </button>
      </div>

      <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <label className="block">
            <span className="text-sm font-black text-slate-300">Nome</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Giulia Rossi"
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 font-semibold text-white outline-none ring-cyan-300/0 transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-black text-slate-300">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="tu@email.com"
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 font-semibold text-white outline-none ring-cyan-300/0 transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-300">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={6}
            placeholder="Minimo 6 caratteri"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 font-semibold text-white outline-none ring-cyan-300/0 transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-lime-300/20 bg-lime-400/10 px-4 py-3 text-sm font-bold text-lime-100">
            {message}
          </div>
        )}

        <Button type="submit" variant="lime" className="w-full py-4 text-base" disabled={loading}>
          {loading ? 'Attendi…' : mode === 'login' ? 'Accedi' : 'Crea account'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-[.2em] text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        oppure
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="ghost" onClick={handleGoogleLogin} disabled={loading}>
          Continua con Google
        </Button>
        <Button type="button" variant="ghost" onClick={handleMagicLink} disabled={loading || !email}>
          Link via email
        </Button>
      </div>

      <p className="mt-5 text-center text-xs font-semibold leading-6 text-slate-400">
        Per Google e magic link devi configurare i Redirect URL in Supabase. Email e password usano la sessione del browser.
      </p>
    </Card>
  );
}
