import { Navbar, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function HostPage({ params }: { params: { username: string } }) {
  return (
    <div>
      <Navbar />

      <main className="mx-auto w-[min(980px,calc(100%-28px))] py-12">
        <Card className="overflow-hidden p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400 shadow-[0_0_40px_rgba(34,211,238,.22)]" />
            <div>
              <div className="mb-3 inline-flex rounded-full bg-nova-lime px-3 py-1 text-xs font-black text-slate-950">
                Host Nova
              </div>
              <h1 className="text-5xl font-black tracking-[-.06em]">@{params.username}</h1>
              <p className="mt-3 max-w-xl font-semibold leading-7 text-slate-300">
                Lo spazio Host racconterà non quanto sei famoso, ma quanti momenti hai aiutato a trasformare.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
