import { Navbar, Button, Card } from '@/components/ui';

export default function Page() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">Utenti con cui hai interagito</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">Persone</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-300">Non puoi seguire o aggiungere persone. Puoi solo visualizzare profili e contributi emersi nelle Call condivise.</p>
          </div>
          <Button href="/calls/new" variant="lime">Apri una Call</Button>
        </div>

        <Card className="mt-8 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Giulia R. · Designer · 2 Call insieme</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Marco L. · Finance · 1 Outcome insieme</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-black">Sara M. · Founder · 4 messaggi utili</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Contenuto demo pronto per essere collegato ai dati reali di Supabase.</p>
            </div>
          </div>
          <div className="mt-6 rounded-[2rem] border border-cyan-300/15 bg-cyan-300/5 p-5">
            <h2 className="text-2xl font-black">Regola prodotto</h2>
            <p className="mt-2 font-semibold leading-7 text-slate-300">Su NOVA non esistono follow, amicizie o richieste. Le persone emergono dai contributi nelle Call. Puoi aprire il profilo e leggere informazioni, punteggio e contributi, ma non “aggiungerle”.</p>
          </div>
        </Card>
      </main>
    </div>
  );
}
