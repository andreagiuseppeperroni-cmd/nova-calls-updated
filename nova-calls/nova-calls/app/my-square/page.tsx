
import Link from 'next/link';

export const metadata = {
  title: 'La mia Piazza — The Square',
  description: 'La piazza personale dell’utente su The Square.',
};

export default function MySquarePage() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-5 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex text-sm font-black text-yellow-300">← Torna alla Home</Link>
        <section className="rounded-[26px] border border-yellow-300/20 bg-[radial-gradient(circle_at_85%_10%,rgba(250,204,21,.20),transparent_28%),linear-gradient(135deg,#121824,#0f172a)] p-8 shadow-[0_26px_90px_rgba(0,0,0,.36)] md:p-10">
          <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-yellow-300">My Square</p>
          <h1 className="text-5xl font-black tracking-[-.065em] md:text-7xl">Andrea’s Square</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-300">
            La tua piazza personale: pensieri, audio, immagini, post salvati dai Wall locali e persone che scelgono di seguirti.
          </p>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <Stat value="128" label="persone" />
            <Stat value="14" label="post" />
            <Stat value="6" label="audio" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-[20px] border border-white/10 bg-slate-950/60 p-5 text-center"><b className="block text-3xl font-black text-white">{value}</b><span className="mt-1 block text-xs font-black uppercase tracking-wide text-slate-400">{label}</span></div>;
}
