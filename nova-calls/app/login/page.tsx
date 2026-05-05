import { Navbar, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(720px,calc(100%-28px))] py-16">
        <Card className="p-8 text-center">
          <h1 className="text-4xl font-black tracking-tight">Login Nova</h1>
          <p className="mt-3 font-semibold leading-7 text-slate-300">
            Nel prossimo blocco colleghiamo Supabase Auth. Per ora questa pagina
            serve a far partire il progetto pulito senza errori.
          </p>
        </Card>
      </main>
    </div>
  );
}
