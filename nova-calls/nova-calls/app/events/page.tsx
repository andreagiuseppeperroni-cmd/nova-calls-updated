'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type NovaEvent = {
  id: string;
  title: string;
  sourceUrl: string;
  imageUrl: string;
  startDate: string;
  startTime: string;
  dateTime: string;
  city: string;
  region: string;
  venueName: string;
  address: string;
  category: string;
};

const cities = [
  { label: 'Tutto Centro Italia', value: 'all' },
  { label: 'Roma', value: 'roma' },
  { label: 'Firenze', value: 'firenze' },
  { label: 'Perugia', value: 'perugia' },
  { label: 'Ancona', value: 'ancona' },
  { label: 'Pescara', value: 'pescara' },
  { label: "L'Aquila", value: 'aquila' },
  { label: 'Latina', value: 'latina' },
  { label: 'Terni', value: 'terni' },
  { label: 'Prato', value: 'prato' },
  { label: 'Livorno', value: 'livorno' },
  { label: 'Pisa', value: 'pisa' },
  { label: 'Siena', value: 'siena' },
  { label: 'Arezzo', value: 'arezzo' },
  { label: 'Viterbo', value: 'viterbo' },
  { label: 'Rieti', value: 'rieti' },
  { label: 'Ascoli Piceno', value: 'ascolipiceno' },
];

const categories = [
  { label: 'Tutto', value: 'all' },
  { label: 'Musica', value: 'music' },
  { label: 'Teatro', value: 'theatre' },
  { label: 'Sport', value: 'sport' },
  { label: 'Famiglia', value: 'family' },
  { label: 'Cultura', value: 'culture' },
  { label: 'Nightlife', value: 'nightlife' },
];

function formatDate(event: NovaEvent) {
  if (!event.startDate) return 'Data da confermare';

  try {
    const date = new Date(`${event.startDate}T${event.startTime || '00:00:00'}`);

    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: event.startTime ? '2-digit' : undefined,
      minute: event.startTime ? '2-digit' : undefined,
    }).format(date);
  } catch {
    return event.startDate;
  }
}

function buildEventSpuntoUrl(event: NovaEvent) {
  const title = `Chi vuole partecipare a ${event.title}?`;

  const context = [
    `C'è questo evento a ${event.city || 'Centro Italia'}${event.venueName ? ` presso ${event.venueName}` : ''}.`,
    event.startDate ? `Data: ${formatDate(event)}.` : 'Data da confermare.',
    event.address ? `Indirizzo: ${event.address}.` : '',
    '',
    'Usiamo questo Spunto per organizzarci, capire chi partecipa, come arrivare e magari creare un gruppo nella community.',
    '',
    'Chi è interessato?',
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    source: 'event',
    title,
    context,
    sourceTitle: event.title,
    sourceUrl: event.sourceUrl,
  });

  return `/calls/new?${params.toString()}`;
}

export default function EventsPage() {
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [events, setEvents] = useState<NovaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCityLabel = useMemo(() => {
    return cities.find((item) => item.value === city)?.label || 'Centro Italia';
  }, [city]);

  const selectedCategoryLabel = useMemo(() => {
    return categories.find((item) => item.value === category)?.label || 'Tutto';
  }, [category]);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/events?city=${city}&category=${category}`, {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore nel caricamento degli eventi.');
        }

        setEvents(data.events || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto.');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [city, category]);

  return (
    <main className="min-h-screen bg-[#030712] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="mb-5 inline-flex text-sm font-bold text-cyan-300 hover:text-cyan-100">
              ← Torna alla Home
            </Link>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Eventi nel{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-400 bg-clip-text text-transparent">
                Centro Italia
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-slate-200">
              Scopri eventi nelle principali città del Centro Italia e trasformali in Spunti per organizzarti con la community NOVA.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,.18)]">
            Area: <span className="text-white">{selectedCityLabel}</span>
            <br />
            Categoria: <span className="text-white">{selectedCategoryLabel}</span>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[.18em] text-slate-400">Scegli città</h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {cities.map((item) => (
              <button
                key={item.value}
                onClick={() => setCity(item.value)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-black transition ${
                  city === item.value
                    ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.22)]'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[.18em] text-slate-400">Categoria evento</h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-black transition ${
                  category === item.value
                    ? 'border-violet-300/60 bg-violet-300/15 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,.22)]'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-[#081120] p-8 text-center text-slate-200 shadow-[0_18px_60px_rgba(0,0,0,.32)]">
            Caricamento eventi in corso...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
            <h2 className="text-xl font-black text-white">Non riesco a caricare gli eventi</h2>
            <p className="mt-2 text-sm text-red-100">{error}</p>
            <p className="mt-3 text-sm text-red-100/80">
              Controlla che su Netlify sia presente la variabile <strong>TICKETMASTER_API_KEY</strong> con scope attivo.
            </p>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-[#081120] p-8 text-center text-slate-200 shadow-[0_18px_60px_rgba(0,0,0,.32)]">
            Nessun evento trovato per questa selezione. Prova con “Tutto Centro Italia” o con un’altra categoria.
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-[28px] border border-cyan-200/10 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-xl"
                style={{
                  background: '#07101f',
                }}
              >
                <div className="relative h-52 overflow-hidden bg-slate-950">
                  {event.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover"
                        style={{
                          filter: 'brightness(.82) contrast(1.08)',
                        }}
                      />

                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(2,6,23,.08) 0%, rgba(2,6,23,.16) 35%, rgba(7,16,31,.78) 78%, rgba(7,16,31,1) 100%)',
                        }}
                      />
                    </>
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-cyan-500/25 via-violet-500/25 to-pink-500/25 text-4xl font-black text-white">
                      NOVA
                    </div>
                  )}
                </div>

                <div
                  className="flex min-h-[365px] flex-col p-6"
                  style={{
                    background:
                      'linear-gradient(180deg, #07101f 0%, #081426 55%, #07101f 100%)',
                  }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide">
                    <span
                      className="truncate"
                      style={{
                        color: '#ffffff',
                        textShadow: '0 2px 10px rgba(0,0,0,.95)',
                        opacity: 1,
                      }}
                    >
                      {event.city || 'Centro Italia'}
                    </span>

                    <span
                      className="shrink-0"
                      style={{
                        color: 'rgba(255,255,255,.86)',
                        textShadow: '0 2px 10px rgba(0,0,0,.95)',
                        opacity: 1,
                      }}
                    >
                      {event.category}
                    </span>
                  </div>

                  <h2
                    className="text-[24px] font-black leading-tight"
                    style={{
                      color: '#ffffff',
                      textShadow: '0 4px 18px rgba(0,0,0,.98), 0 1px 3px rgba(0,0,0,1)',
                      opacity: 1,
                    }}
                  >
                    {event.title}
                  </h2>

                  <div className="mt-4 space-y-2 text-[15px] font-semibold leading-7">
                    <p
                      style={{
                        color: 'rgba(255,255,255,.92)',
                        textShadow: '0 3px 12px rgba(0,0,0,.88)',
                        opacity: 1,
                      }}
                    >
                      📅 {formatDate(event)}
                    </p>

                    <p
                      style={{
                        color: 'rgba(255,255,255,.84)',
                        textShadow: '0 3px 12px rgba(0,0,0,.88)',
                        opacity: 1,
                      }}
                    >
                      📍 {event.venueName}
                    </p>

                    {event.address && (
                      <p
                        className="line-clamp-2"
                        style={{
                          color: 'rgba(255,255,255,.72)',
                          textShadow: '0 3px 12px rgba(0,0,0,.88)',
                          opacity: 1,
                        }}
                      >
                        {event.address}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-6">
                    <Link
                      href={buildEventSpuntoUrl(event)}
                      className="rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-300 px-5 py-3 text-center text-sm font-black text-white shadow-[0_0_26px_rgba(34,211,238,.28)] transition hover:scale-[1.01]"
                    >
                      Organizziamoci su NOVA →
                    </Link>

                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-black shadow-[0_8px_24px_rgba(0,0,0,.18)] transition hover:bg-white/20"
                      style={{
                        background: 'rgba(255,255,255,.14)',
                        color: '#ffffff',
                      }}
                    >
                      Vedi evento
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
