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

const categoryQueries: Record<string, string> = {
  general: 'Italia OR mondo OR politica OR economia',
  business: 'economia OR imprese OR lavoro OR mercati',
  technology: 'tecnologia OR intelligenza artificiale OR digitale',
  science: 'scienza OR ricerca OR spazio',
  health: 'salute OR sanità OR medicina',
  sports: 'sport OR calcio OR tennis',
  entertainment: 'cinema OR musica OR spettacolo OR cultura',
};

function normalizeArticles(
  articles: NewsApiArticle[],
  category: string,
  country: string
) {
  return articles
    .filter((article) => {
      if (!article.title || !article.url) return false;
      if (article.title.toLowerCase().includes('[removed]')) return false;
      if (article.description?.toLowerCase().includes('[removed]')) return false;
      return true;
    })
    .map((article, index) => ({
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
}

async function fetchTopHeadlines(apiKey: string, category: string, country: string) {
  const endpoint = new URL('https://newsapi.org/v2/top-headlines');

  endpoint.searchParams.set('country', country);
  endpoint.searchParams.set('pageSize', '20');
  endpoint.searchParams.set('apiKey', apiKey);

  if (category && category !== 'general') {
    endpoint.searchParams.set('category', category);
  }

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data,
      articles: [],
    };
  }

  return {
    ok: true,
    status: response.status,
    error: null,
    articles: data.articles || [],
  };
}

async function fetchEverything(apiKey: string, category: string) {
  const endpoint = new URL('https://newsapi.org/v2/everything');

  endpoint.searchParams.set('q', categoryQueries[category] || categoryQueries.general);
  endpoint.searchParams.set('language', 'it');
  endpoint.searchParams.set('sortBy', 'publishedAt');
  endpoint.searchParams.set('pageSize', '20');
  endpoint.searchParams.set('apiKey', apiKey);

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data,
      articles: [],
    };
  }

  return {
    ok: true,
    status: response.status,
    error: null,
    articles: data.articles || [],
  };
}

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

  try {
    const topHeadlines = await fetchTopHeadlines(apiKey, category, country);
    let articles = normalizeArticles(topHeadlines.articles, category, country);

    if (articles.length === 0) {
      const everything = await fetchEverything(apiKey, category);
      articles = normalizeArticles(everything.articles, category, country);
    }

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
