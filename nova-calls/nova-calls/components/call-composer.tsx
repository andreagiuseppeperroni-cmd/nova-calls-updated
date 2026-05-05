'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

const callTypes = [
  'Decidere',
  'Capire',
  'Feedback',
  'Trovare persone',
  'Fare ora',
  'Creare insieme',
];

export function CallComposer() {
  const [text, setText] = useState('');
  const [type, setType] = useState('Decidere');

  function goToNewCall() {
    const params = new URLSearchParams();
    if (text.trim()) params.set('title', text.trim());
    params.set('type', type.toLowerCase());
    window.location.href = `/calls/new?${params.toString()}`;
  }

  return (
    <div className="nova-glass overflow-hidden rounded-[2rem] p-4 shadow-nova md:p-5">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-cyan-200/30 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-4 md:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-400/40 via-violet-400/30 to-pink-400/30 blur-2xl" />

        <div className="relative z-10">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Racconta la tua Call..."
            rows={3}
            className="min-h-[110px] w-full resize-none rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-base font-bold text-white outline-none placeholder:text-white/40 focus:ring-4 focus:ring-cyan-300/10"
          />

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {callTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setType(item)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                    type === item
                      ? 'bg-nova-lime text-slate-950'
                      : 'border border-white/10 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <Button type="button" onClick={goToNewCall} variant="primary">
              Apri una Call →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
