'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type NewsArticle = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  publishedAt: string;
  category: string;
  country: string;
};

const categories = [
  { label: 'Tutto', value: 'general' },
  { label: 'Business', value: 'business' },
  { label: 'Tecnologia', value: 'technology' },
  { label: 'Scienza', value: 'science' },
  { label: 'Salute', value: 'health' },
  { label: 'Sport', value: 'sports' },
  { label: 'Intrattenimento', value: 'entertainment' },
];

function buildSpuntoUrl(article: NewsArticle) {
  const title = `Parliamo di: ${article.title}`;

  const context = [
    `Questa notizia arriva da ${article.sourceName}.`,
    article.description,
    '',
    'Usiamo questo Spunto per capire cosa ne pensa la community, quali conseguenze può avere e quali punti di vista emergono.',
  ].join('\n');

  const params = new URLSearchParams({
    source: 'news',
    title,
    context,
    sourceTitle: article.title,
    sourceUrl: article.sourceUrl,
  });

  return `/calls/new?${params.toString()}`;
}

export default function NewsPage() {
  const [category, setCategory] = useState('general');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCategoryLabel = useMemo(() => {
    return categories.find((item) => item.value === category)?.label || 'Tutto';
  }, [category]);

  useEffect(() => {
    async function loadNews() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/world-news?country=it&category=${category}`, {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore nel caricamento delle news.');
        }

        setArticles(data.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto.');
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, [category]);

  return (
    <main className="min-h-screen bg-[#030712] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="mb-5 inline-flex text-sm font-bold text-cyan-300 hover:text-cyan-100">
              ← Torna alla Home
            </Link>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              News dal <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-400 bg-clip-text text-transparent">mondo</span>
            </h1>

            <p className="mt-3 max-w-2xl text-base font-semibold text-slate-300">
              Le notizie più importanti diventano conversazioni. Scegli una news e trasformala in uno Spunto per discuterne con la community.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300">
            Categoria attiva: <span className="text-white">{selectedCategoryLabel}</span>
          </div>
        </header>

        <section className="mb-7 flex gap-3 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item.value}
              onClick={() => setCategory(item.value)}
              className={`shrink-0 rounded-full border px-5 py-2 text-sm font-black transition ${
                category === item.value
                  ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.22)]'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            Caricamento news in corso...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
            <h2 className="text-xl font-black">Non riesco a caricare le news</h2>
            <p className="mt-2 text-sm">{error}</p>
            <p className="mt-3 text-sm text-red-100/70">
              Controlla che su Netlify sia presente la variabile <strong>NEWS_API_KEY</strong> con scope attivo.
            </p>
          </div>
        )}

        {!isLoading && !error && articles.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            Nessuna notizia disponibile per questa categoria.
          </div>
        )}

        {!isLoading && !error && articles.length > 0 && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
            <article
  key={article.id}
  className="overflow-hidden rounded-[28px] border border-cyan-200/10 bg-[#081120] shadow-[0_18px_60px_rgba(0,0,0,.42)] backdrop-blur-xl"
>
  <div className="relative h-52 overflow-hidden bg-slate-900">
    {article.imageUrl ? (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl}
          alt={article.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081120] via-[#081120]/25 to-transparent" />
      </>
    ) : (
      <div className="grid h-full place-items-center bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-pink-500/20 text-4xl font-black text-white">
        NOVA
      </div>
    )}
  </div>

  <div className="flex min-h-[320px] flex-col bg-[#081120] p-6">
    <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-300">
      <span className="truncate text-slate-200">{article.sourceName}</span>
      <span className="shrink-0 text-slate-400">
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString('it-IT')
          : 'Ora'}
      </span>
    </div>

    <h2 className="text-[22px] font-black leading-tight text-white">
      {article.title}
    </h2>

    <p className="mt-4 line-clamp-4 text-[15px] font-medium leading-7 text-slate-300">
      {article.description}
    </p>

    <div className="mt-auto flex flex-col gap-3 pt-6">
      <Link
        href={buildSpuntoUrl(article)}
        className="rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-300 px-5 py-3 text-center text-sm font-black text-white shadow-[0_0_26px_rgba(34,211,238,.24)]"
      >
        Apri uno Spunto →
      </Link>

      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black text-slate-100 hover:bg-white/10"
      >
        Leggi fonte
      </a>
    </div>
  </div>
</article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
