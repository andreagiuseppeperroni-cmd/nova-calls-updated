'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { makeSlug } from '@/lib/local-call';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const STORAGE_KEY = 'nova:calls';

const callTypes = [
  { value: 'decidere', label: '🧭 Decidere' },
  { value: 'capire', label: '🔍 Capire' },
  { value: 'feedback', label: '🎧 Feedback' },
  { value: 'trovare-persone', label: '🤝 Trovare persone' },
  { value: 'fare-ora', label: '📍 Fare ora' },
  { value: 'creare-insieme', label: '✨ Creare insieme' },
];

function getCallTypeLabel(value: string) {
  return callTypes.find((item) => item.value === value)?.label.replace(/^[^ ]+ /, '') || value;
}

function getUserName(user: any) {
  const metadata = user?.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || metadata.display_name;

  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  if (user?.email) return user.email.split('@')[0];

  return 'Host Nova';
}

function getUserAvatar(user: any) {
  const metadata = user?.user_metadata || {};
  const avatar = metadata.avatar_url || metadata.picture;

  return typeof avatar === 'string' && avatar.trim() ? avatar : null;
}

function saveLocalCall(call: {
  title: string;
  description: string;
  type: string;
  accessType: string;
  slug: string;
  pulse: number;
  participants: number;
  createdAt: string;
}) {
  if (typeof window === 'undefined') return;

  try {
    const current = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([call, ...current].slice(0, 12)));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([call]));
  }
}

export function NewCallForm({
  initialTitle,
  initialType,
}: {
  initialTitle: string;
  initialType: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [callType, setCallType] = useState(initialType || 'decidere');
  const [accessType, setAccessType] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createCall(event: React.FormEvent) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Scrivi la domanda della Call.');
      return;
    }

    setLoading(true);
    setError('');

    const slug = makeSlug(cleanTitle);
    const cleanDescription =
      description.trim() ||
      'Call aperta su NOVA. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.';

    const localCall = {
      title: cleanTitle,
      description: cleanDescription,
      type: getCallTypeLabel(callType),
      accessType,
      slug,
      pulse: 12,
      participants: 1,
      createdAt: new Date().toISOString(),
    };

    saveLocalCall(localCall);

    try {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.assign(`/login?next=${encodeURIComponent(`/calls/new?title=${encodeURIComponent(cleanTitle)}`)}`);
        return;
      }

      const { error: insertError } = await supabase.from('calls').upsert(
        {
          slug,
          title: cleanTitle,
          description: cleanDescription,
          call_type: callType,
          access_type: accessType,
          status: 'live',
          pulse_score: 12,
          participants: 1,
          host_id: user.id,
          host_name: getUserName(user),
          host_avatar: getUserAvatar(user),
        },
        { onConflict: 'slug' }
      );

      if (insertError) {
        setError(`La Call è stata salvata localmente, ma non su Supabase: ${insertError.message}`);
        setLoading(false);
        return;
      }

      window.location.assign(`/c/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione della Call.');
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 md:p-6">
      <form onSubmit={createCall} className="space-y-5">
        <div>
          <label htmlFor="call-title" className="text-sm font-black text-cyan-100">
            Domanda / titolo
          </label>
          <input
            id="call-title"
            name="call-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Mi trasferisco a Milano?"
            autoComplete="off"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35 focus:ring-4 focus:ring-cyan-300/10"
          />
        </div>

        <div>
          <label htmlFor="call-description" className="text-sm font-black text-cyan-100">
            Contesto
          </label>
          <textarea
            id="call-description"
            name="call-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Racconta cosa sta succedendo e che tipo di aiuto ti serve..."
            rows={5}
            autoComplete="off"
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold leading-7 text-white outline-none placeholder:text-white/35 focus:ring-4 focus:ring-cyan-300/10"
          />
        </div>

        <div>
          <p className="text-sm font-black text-cyan-100">Tipo di Call</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {callTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setCallType(type.value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                  callType === type.value
                    ? 'border-lime-300 bg-lime-300 text-slate-950'
                    : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-cyan-100">Visibilità</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccessType('public')}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                accessType === 'public'
                  ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                  : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              Pubblica
            </button>

            <button
              type="button"
              onClick={() => setAccessType('private')}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                accessType === 'private'
                  ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                  : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              Privata
            </button>
          </div>
        </div>

        {error && <p className="text-sm font-black text-pink-300">{error}</p>}

        <Button type="submit" disabled={loading} variant="lime" className="w-full">
          {loading ? 'Creo la Live...' : 'Apri la Call'}
        </Button>
      </form>
    </Card>
  );
}
