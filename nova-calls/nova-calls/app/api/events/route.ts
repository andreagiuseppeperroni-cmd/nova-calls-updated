import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
    genre?: {
      name?: string;
    };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: {
        name?: string;
      };
      state?: {
        name?: string;
      };
      country?: {
        name?: string;
      };
      address?: {
        line1?: string;
      };
    }>;
  };
};

const centerItalyCities = {
  all: { label: 'Tutto Centro Italia', lat: '41.9028', lon: '12.4964', radius: '260' },
  roma: { label: 'Roma', lat: '41.9028', lon: '12.4964', radius: '60' },
  firenze: { label: 'Firenze', lat: '43.7696', lon: '11.2558', radius: '55' },
  perugia: { label: 'Perugia', lat: '43.1107', lon: '12.3908', radius: '55' },
  ancona: { label: 'Ancona', lat: '43.6158', lon: '13.5189', radius: '55' },
  pescara: { label: 'Pescara', lat: '42.4618', lon: '14.2161', radius: '55' },
  aquila: { label: "L'Aquila", lat: '42.3498', lon: '13.3995', radius: '55' },
  latina: { label: 'Latina', lat: '41.4676', lon: '12.9037', radius: '45' },
  terni: { label: 'Terni', lat: '42.5636', lon: '12.6427', radius: '45' },
  prato: { label: 'Prato', lat: '43.8777', lon: '11.1022', radius: '35' },
  livorno: { label: 'Livorno', lat: '43.5485', lon: '10.3106', radius: '45' },
  pisa: { label: 'Pisa', lat: '43.7228', lon: '10.4017', radius: '45' },
  siena: { label: 'Siena', lat: '43.3188', lon: '11.3308', radius: '45' },
  arezzo: { label: 'Arezzo', lat: '43.4633', lon: '11.8796', radius: '45' },
  viterbo: { label: 'Viterbo', lat: '42.4207', lon: '12.1077', radius: '45' },
  rieti: { label: 'Rieti', lat: '42.4045', lon: '12.8567', radius: '45' },
  ascolipiceno: { label: 'Ascoli Piceno', lat: '42.8536', lon: '13.5749', radius: '45' },
};

const categoryKeywords: Record<string, string> = {
  all: '',
  music: 'music musica concerto',
  theatre: 'teatro spettacolo theatre',
  sport: 'sport',
  family: 'family famiglia',
  culture: 'arte cultura mostra festival',
  nightlife: 'club dj nightlife',
};

function pickBestImage(images?: TicketmasterEvent['images']) {
  if (!images?.length) return '';

  const sorted = [...images].sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA;
  });

  return sorted[0]?.url || '';
}

function normalizeEvents(events: TicketmasterEvent[]) {
  return events
    .filter((event) => event.name && event.url)
    .map((event) => {
      const venue = event._embedded?.venues?.[0];
      const classification = event.classifications?.[0];

      const localDate = event.dates?.start?.localDate || '';
      const localTime = event.dates?.start?.localTime || '';

      return {
        id: event.id || `${event.name}-${localDate}`,
        title: event.name || 'Evento senza titolo',
        sourceUrl: event.url || '#',
        imageUrl: pickBestImage(event.images),
        startDate: localDate,
        startTime: localTime,
        dateTime: event.dates?.start?.dateTime || '',
        city: venue?.city?.name || '',
        region: venue?.state?.name || '',
        venueName: venue?.name || 'Luogo da confermare',
        address: venue?.address?.line1 || '',
        category: classification?.segment?.name || classification?.genre?.name || 'Evento',
      };
    });
}

async function fetchTicketmasterEvents({
  apiKey,
  cityKey,
  category,
  size = 24,
}: {
  apiKey: string;
  cityKey: keyof typeof centerItalyCities;
  category: string;
  size?: number;
}) {
  const city = centerItalyCities[cityKey] || centerItalyCities.roma;

  const endpoint = new URL('https://app.ticketmaster.com/discovery/v2/events.json');

  endpoint.searchParams.set('apikey', apiKey);
  endpoint.searchParams.set('countryCode', 'IT');
  endpoint.searchParams.set('latlong', `${city.lat},${city.lon}`);
  endpoint.searchParams.set('radius', city.radius);
  endpoint.searchParams.set('unit', 'km');
  endpoint.searchParams.set('size', String(size));
  endpoint.searchParams.set('sort', 'date,asc');
  endpoint.searchParams.set('locale', '*');

  const keyword = categoryKeywords[category] || '';

  if (keyword) {
    endpoint.searchParams.set('keyword', keyword);
  }

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data,
      events: [],
    };
  }

  return {
    ok: true,
    status: response.status,
    error: null,
    events: data?._embedded?.events || [],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const cityParam = searchParams.get('city') || 'all';
  const category = searchParams.get('category') || 'all';

  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'TICKETMASTER_API_KEY non configurata su Netlify.',
        events: [],
      },
      { status: 500 }
    );
  }

  try {
    const cityKey = Object.prototype.hasOwnProperty.call(centerItalyCities, cityParam)
      ? (cityParam as keyof typeof centerItalyCities)
      : 'all';

    if (cityKey === 'all') {
      const priorityCities: Array<keyof typeof centerItalyCities> = [
        'roma',
        'firenze',
        'perugia',
        'ancona',
        'pescara',
        'latina',
        'pisa',
        'siena',
      ];

      const results = await Promise.all(
        priorityCities.map((city) =>
          fetchTicketmasterEvents({
            apiKey,
            cityKey: city,
            category,
            size: 8,
          })
        )
      );

      const combined = results.flatMap((result) => result.events);
      const normalized = normalizeEvents(combined);

      const unique = Array.from(new Map(normalized.map((event) => [event.id, event])).values());

      const sorted = unique.sort((a, b) => {
        const dateA = new Date(a.dateTime || a.startDate || 0).getTime();
        const dateB = new Date(b.dateTime || b.startDate || 0).getTime();
        return dateA - dateB;
      });

      return NextResponse.json({
        events: sorted.slice(0, 36),
      });
    }

    const result = await fetchTicketmasterEvents({
      apiKey,
      cityKey,
      category,
      size: 30,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'Errore nel recupero degli eventi.',
          details: result.error,
          events: [],
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      events: normalizeEvents(result.events),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Errore interno durante il recupero degli eventi.',
        details: error instanceof Error ? error.message : 'Errore sconosciuto',
        events: [],
      },
      { status: 500 }
    );
  }
}
