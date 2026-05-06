import { NextResponse } from 'next/server';

type WorldNewsItem = {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
};

export const dynamic = 'force-dynamic';

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function pickTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function extractGoogleNewsSource(item: string) {
  const source = pickTag(item, 'source');
  return source || 'Google News';
}

function parseRss(xml: string): WorldNewsItem[] {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];

  return items
    .map((match) => {
      const raw = match[0];

      const title = pickTag(raw, 'title');
      const description = pickTag(raw, 'description');
      const link = pickTag(raw, 'link');
      const pubDate = pickTag(raw, 'pubDate');
      const source = extractGoogleNewsSource(raw);

      return {
        title,
        description: description || 'Apri la notizia per leggere il contesto completo.',
        source,
        url: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 9);
}

export async function GET() {
  try {
    const rssUrl =
      'https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it';

    const response = await fetch(rssUrl, {
      next: { revalidate: 900 },
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          news: [],
          error: 'Feed RSS non disponibile in questo momento.',
        },
        { status: 200 }
      );
    }

    const xml = await response.text();
    const news = parseRss(xml);

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json(
      {
        news: [],
        error: 'Errore durante la lettura del feed RSS.',
      },
      { status: 200 }
    );
  }
}
