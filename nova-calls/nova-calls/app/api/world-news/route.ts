import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type NewsApiArticle = {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: {
    name?: string;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || 'general';
  const country = searchParams.get('country') || 'it';

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'NEWS_API_KEY non configurata su Netlify.',
        articles: [],
      },
      { status: 500 }
    );
  }

  const endpoint = new URL('https://newsapi.org/v2/top-headlines');

  endpoint.searchParams.set('country', country);
  endpoint.searchParams.set('category', category);
  endpoint.searchParams.set('pageSize', '20');
  endpoint.searchParams.set('apiKey', apiKey);

  try {
    const response = await fetch(endpoint.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          error: 'Errore nel recupero delle news.',
          details: errorText,
          articles: [],
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const articles = (data.articles || [])
      .filter((article: NewsApiArticle) => article.title && article.url)
      .map((article: NewsApiArticle, index: number) => ({
        id: `${Date.now()}-${index}`,
        title: article.title || 'Notizia senza titolo',
        description: article.description || 'Descrizione non disponibile.',
        sourceName: article.source?.name || 'Fonte non disponibile',
        sourceUrl: article.url || '#',
        imageUrl: article.urlToImage || '',
        publishedAt: article.publishedAt || '',
        category,
        country,
      }));

    return NextResponse.json({
      articles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Errore interno durante il recupero delle news.',
        details: error instanceof Error ? error.message : 'Errore sconosciuto',
        articles: [],
      },
      { status: 500 }
    );
  }
}
