'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { makeSlug } from '@/lib/local-call';

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

  function createCall(event: React.FormEvent) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Scrivi la domanda della Call.');
      return;
    }

    setLoading(true);
    setError('');

    const slug = makeSlug(cleanTitle);
    const localCall = {
      title: cleanTitle,
      description: description.trim() || 'Call aperta su NOVA. Aggiungi contesto, messaggi e genera Echo, Pulse e Outcome.',
      type: getCallTypeLabel(callType),
      accessType,
      slug,
      pulse: 12,
      participants: 1,
      createdAt: new Date().toISOString(),
    };

    saveLocalCall(localCall);

    /*
      Non aspettiamo più /api/calls prima del redirect.
      Prima il form restava bloccato su "Creo..." quando Supabase/API non rispondevano.
      Ora la Call si apre subito e il salvataggio remoto viene tentato in background.
    */
    fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        title: cleanTitle,
        description: localCall.description,
        call_type: callType,
        access_type: accessType,
      }),
    }).catch(() => {
      // Fallback locale già salvato: nessun blocco per l'utente.
    });

    window.location.assign(`/c/${slug}`);
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
          {loading ? 'Apro la Call...' : 'Apri la Call'}
        </Button>
      </form>
    </Card>
  );
}
