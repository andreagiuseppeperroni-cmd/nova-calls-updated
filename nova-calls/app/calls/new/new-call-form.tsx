'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { makeSlug } from '@/lib/local-call';

const callTypes = [
  { value: 'decidere', label: '🧭 Decidere' },
  { value: 'capire', label: '🔍 Capire' },
  { value: 'feedback', label: '🎧 Feedback' },
  { value: 'trovare-persone', label: '🤝 Trovare persone' },
  { value: 'fare-ora', label: '📍 Fare ora' },
  { value: 'creare-insieme', label: '✨ Creare insieme' },
];

export function NewCallForm({
  initialTitle,
  initialType,
}: {
  initialTitle: string;
  initialType: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [callType, setCallType] = useState(initialType);
  const [accessType, setAccessType] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createCall(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Scrivi la domanda della Call.');
      return;
    }

    setLoading(true);
    setError('');

    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, call_type: callType, access_type: accessType }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      const slug = makeSlug(title);
      const localCall = {
        title,
        description,
        type: callTypes.find((item) => item.value === callType)?.label.replace(/^[^ ]+ /, '') || callType,
        accessType,
        slug,
        pulse: 12,
        participants: 1,
        createdAt: new Date().toISOString(),
      };
      const current = JSON.parse(window.localStorage.getItem('nova:calls') || '[]');
      window.localStorage.setItem('nova:calls', JSON.stringify([localCall, ...current]));
      window.location.href = `/c/${slug}`;
      return;
    }

    const call = data.call;
    const localCall = {
      title: call.title || title,
      description: call.description || description,
      type: callTypes.find((item) => item.value === callType)?.label.replace(/^[^ ]+ /, '') || callType,
      accessType,
      slug: call.slug,
      pulse: call.pulse_score || 12,
      participants: 1,
      createdAt: call.created_at || new Date().toISOString(),
    };
    const current = JSON.parse(window.localStorage.getItem('nova:calls') || '[]');
    window.localStorage.setItem('nova:calls', JSON.stringify([localCall, ...current]));

    window.location.href = `/c/${call.slug}`;
  }

  return (
    <Card className="p-5 md:p-6">
      <form onSubmit={createCall} className="space-y-5">
        <div>
          <label className="text-sm font-black text-cyan-100">Domanda / titolo</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Mi trasferisco a Milano?"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white outline-none placeholder:text-white/35 focus:ring-4 focus:ring-cyan-300/10"
          />
        </div>

        <div>
          <label className="text-sm font-black text-cyan-100">Contesto</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Racconta cosa sta succedendo e che tipo di aiuto ti serve..."
            rows={5}
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
          {loading ? 'Creo...' : 'Apri la Call'}
        </Button>
      </form>
    </Card>
  );
}
