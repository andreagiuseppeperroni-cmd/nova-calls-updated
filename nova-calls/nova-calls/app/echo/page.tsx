import { Navbar, Button, Card } from '@/components/ui';

export default function Page() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Insight generati dalle Call</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Echo</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">Qui raccogli le sintesi AI, i pattern ricorrenti e il clima delle stanze a cui hai partecipato.</p>
          </div>
          <Button href="/calls/new" variant="lime">Apri una Call</Button>
        </div>

        <Card className="mt-8 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Insight economico: servono piani a 30/60/90 giorni</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Insight rete: chiedere aiuto a persone con esperienza diretta</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Insight energia: quando la stanza è alta, chiudere con un outcome concreto</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
