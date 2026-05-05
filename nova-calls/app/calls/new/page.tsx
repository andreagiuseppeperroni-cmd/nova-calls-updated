import { Navbar } from '@/components/ui';
import { NewCallForm } from './new-call-form';

export const dynamic = 'force-dynamic';

export default function NewCallPage({
  searchParams,
}: {
  searchParams: { title?: string; type?: string };
}) {
  return (
    <div>
      <Navbar />

      <main className="mx-auto grid w-[min(1180px,calc(100%-28px))] gap-10 py-12 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-gradient-to-r from-cyan-400/20 via-violet-500/20 to-pink-400/20 px-4 py-2 text-sm font-black text-cyan-100">
            ＋ Apri una Call
          </div>

          <h1 className="text-5xl font-black leading-[.95] tracking-[-.06em] md:text-7xl">
            Non postare il dubbio. <span className="nova-text">Trasformalo.</span>
          </h1>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
            Una Call è una richiesta viva: persone, Host e AI entrano nel momento
            per aiutarti a generare un Outcome concreto.
          </p>
        </div>

        <NewCallForm initialTitle={searchParams.title || ''} initialType={searchParams.type || 'decidere'} />
      </main>
    </div>
  );
}
