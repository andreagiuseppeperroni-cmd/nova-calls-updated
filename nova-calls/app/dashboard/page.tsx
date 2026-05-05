import { Navbar, Button, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-[-.05em]">Dashboard Host</h1>
            <p className="mt-3 font-semibold text-slate-300">
              Qui vedrai Call aperte, Outcome generati, Echo e metriche utili.
            </p>
          </div>

          <Button href="/calls/new" variant="lime">Apri Call</Button>
        </div>

        <Card className="mt-8 p-8 text-center">
          <h2 className="text-2xl font-black">Pronta per il prossimo step</h2>
          <p className="mt-2 font-semibold text-slate-300">
            Collegheremo questa pagina all’utente Supabase e alle sue Call.
          </p>
        </Card>
      </main>
    </div>
  );
}
