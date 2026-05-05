import { Navbar, Button, Card } from '@/components/ui';

export default function Page() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Decisioni e prossimi passi</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Outcome</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">Ogni Call deve chiudersi con una sintesi utile: decisione, motivazione e azioni successive.</p>
          </div>
          <Button href="/calls/new" variant="lime">Apri una Call</Button>
        </div>

        <Card className="mt-8 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Vai. È il momento — piano in 3 step</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Aspetta 14 giorni — serve una prova più piccola</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Crea insieme — apri una stanza follow-up</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
