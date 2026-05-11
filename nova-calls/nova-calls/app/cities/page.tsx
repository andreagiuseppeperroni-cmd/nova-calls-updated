
import Link from 'next/link';
import { officialItalianCities } from '@/lib/italian-cities';

export const metadata = {
  title: 'Città ufficiali — The Square',
  description: 'Le prime 50 città italiane già attive su The Square.',
};

export default function CitiesPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-5 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="mb-8 inline-flex text-sm font-black text-yellow-300">← Torna alla Home</Link>

        <header className="mb-8 rounded-[24px] border border-white/10 bg-[#121824] p-8 shadow-[0_24px_80px_rgba(0,0,0,.35)]">
          <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-yellow-300">City Wall Network</p>
          <h1 className="max-w-4xl text-5xl font-black tracking-[-.06em] md:text-7xl">
            Le prime 50 città italiane sono già aperte.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-300">
            Ogni città ufficiale ha un Wall locale, Voice Wall, notizie, eventi ed Echo. Le altre città potranno essere richieste dagli utenti e approvate da Admin The Square.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {officialItalianCities.map((city) => (
            <Link
              href={`/cities/${city.slug}`}
              key={city.slug}
              className="rounded-[20px] border border-white/10 bg-[#121824] p-5 shadow-[0_18px_54px_rgba(0,0,0,.28)] transition hover:-translate-y-1 hover:border-yellow-300/30"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.12em] text-yellow-300">#{city.populationRank} · città ufficiale</div>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">{city.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{city.province}, {city.region}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 font-black text-slate-950">□</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                  <b className="block text-lg text-white">{city.wallStats.postsToday}</b>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">post</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                  <b className="block text-lg text-white">{city.wallStats.audioToday}</b>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">audio</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                  <b className="block text-lg text-white">{city.wallStats.localEvents}</b>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">eventi</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
