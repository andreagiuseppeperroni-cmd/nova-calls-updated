import { Navbar, Button, Card } from '@/components/ui';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let userEmail: string | null = null;
  let userName = 'Host Nova';

  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
    userName =
      (data.user?.user_metadata?.full_name as string | undefined) ||
      data.user?.email?.split('@')[0] ||
      'Host Nova';
  } catch {
    userEmail = null;
  }

  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.24em] text-cyan-200/75">
              {userEmail ? `Connesso come ${userEmail}` : 'Modalità demo'}
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">
              Dashboard {userEmail ? userName : 'Host'}
            </h1>
            <p className="mt-3 font-semibold text-slate-300">
              Qui vedrai Call aperte, Outcome generati, Echo e metriche utili.
            </p>
          </div>

          <Button href="/calls/new" variant="lime">Apri Call</Button>
        </div>

        {!userEmail && (
          <Card className="mt-8 p-8">
            <h2 className="text-2xl font-black">Accedi per salvare tutto</h2>
            <p className="mt-2 font-semibold leading-7 text-slate-300">
              La demo funziona anche senza account, ma con il login Supabase potrai sincronizzare profilo, Call e Outcome.
            </p>
            <Button href="/login" variant="primary" className="mt-5">Vai al login</Button>
          </Card>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card className="p-6"><p className="text-sm font-black text-slate-400">Call aperte</p><b className="mt-3 block text-4xl">12</b></Card>
          <Card className="p-6"><p className="text-sm font-black text-slate-400">Outcome generati</p><b className="mt-3 block text-4xl">7</b></Card>
          <Card className="p-6"><p className="text-sm font-black text-slate-400">Pulse medio</p><b className="mt-3 block text-4xl">86</b></Card>
        </div>
      </main>
    </div>
  );
}
