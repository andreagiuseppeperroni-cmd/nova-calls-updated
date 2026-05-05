import { NextResponse } from 'next/server';
import { z } from 'zod';
import { slugify } from '@/lib/slug';
import { createRouteSupabase } from '@/lib/supabase-server';

const schema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(1200).optional().default(''),
  call_type: z.string().min(2).max(60).optional().default('capire'),
  access_type: z.enum(['public', 'private']).optional().default('public'),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
    }

    const slug = slugify(parsed.data.title);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        call: {
          title: parsed.data.title,
          description: parsed.data.description,
          slug,
          category: parsed.data.call_type,
          call_type: parsed.data.call_type,
          access_type: parsed.data.access_type,
          status: 'live',
          pulse_score: 12,
          created_at: new Date().toISOString(),
        },
      });
    }

    const supabase = createRouteSupabase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: call, error } = await (supabase as any)
      .from('rooms')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        slug,
        category: parsed.data.call_type,
        call_type: parsed.data.call_type,
        access_type: parsed.data.access_type,
        status: 'live',
        owner_id: session?.user?.id || null,
        outcome_status: 'open',
        pulse_score: 0,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ call });
  } catch {
    return NextResponse.json({ error: 'Errore creazione Call.' }, { status: 500 });
  }
}
