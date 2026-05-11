
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCityBySlug, officialItalianCities } from '@/lib/italian-cities';

export function generateStaticParams() {
  return officialItalianCities.map((city) => ({ slug: city.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  return {
    title: city ? `The Wall — ${city.name}` : 'Città non trovata',
    description: city ? `Wall locale, Voice Wall, news ed eventi di ${city.name}.` : '',
  };
}

export default function CityWallPage({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();

  return (
    <main className="min-h-screen bg-[#0d1117] px-5 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <Link href="/cities" className="mb-8 inline-flex text-sm font-black text-yellow-300">← Tutte le città</Link>

        <header className="mb-6 overflow-hidden rounded-[26px] border border-yellow-300/20 bg-[#121824] shadow-[0_26px_90px_rgba(0,0,0,.36)]">
          <div className="bg-[radial-gradient(circle_at_85%_10%,rgba(250,204,21,.20),transparent_28%),linear-gradient(135deg,#121824,#0f172a)] p-8 md:p-10">
            <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-yellow-300">Città ufficiale · #{city.populationRank}</p>
            <h1 className="text-5xl font-black tracking-[-.065em] md:text-7xl">The Wall — {city.name}</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
              {city.name} ha il suo Wall locale: post, audio, immagini, notizie, eventi ed Echo della città.
            </p>
          </div>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-4">
          <Stat value={city.wallStats.postsToday} label="post oggi" />
          <Stat value={city.wallStats.audioToday} label="audio oggi" />
          <Stat value={city.wallStats.localEvents} label="eventi locali" />
          <Stat value={city.wallStats.onlineNow} label="online ora" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#121824] p-5 shadow-[0_18px_54px_rgba(0,0,0,.30)]">
            <p className="mb-2 text-xs font-black uppercase tracking-[.16em] text-yellow-300">Composer</p>
            <h2 className="text-3xl font-black tracking-[-.05em]">Cosa vuoi dire a {city.name} oggi?</h2>
            <textarea className="mt-5 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Scrivi sul Wall locale..." />
            <div className="mt-4 flex flex-wrap gap-2">
              <Action>✍️ Testo</Action><Action>🖼️ Immagine</Action><Action>🎙️ Audio</Action><Action>◒ Anonimo</Action>
              <button className="ml-auto min-h-11 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 px-5 text-sm font-black text-slate-950">Pubblica →</button>
            </div>
          </div>

          <aside className="grid gap-5">
            <Card title={`🧠 Echo — ${city.name}`}>Oggi si parla soprattutto di eventi, mobilità, lavoro, quartieri e nuove conoscenze.</Card>
            <Card title="📰 News locali">Le notizie locali possono diventare discussioni pubbliche sul Wall.</Card>
            <Card title="🎟️ Eventi locali">Ogni evento può avere “Ci vado”, “Cerco compagnia” e “Ne parliamo sul Wall”.</Card>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-[20px] border border-white/10 bg-[#121824] p-5 text-center"><b className="block text-3xl font-black text-white">{value}</b><span className="mt-1 block text-xs font-black uppercase tracking-wide text-slate-400">{label}</span></div>;
}

function Action({ children }: { children: React.ReactNode }) {
  return <button className="min-h-10 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-xs font-black text-slate-200">{children}</button>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[22px] border border-white/10 bg-[#121824] p-5 shadow-[0_18px_54px_rgba(0,0,0,.30)]"><h3 className="text-xl font-black tracking-[-.035em] text-white">{title}</h3><p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{children}</p></section>;
}
