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

function getUserName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || metadata.display_name;

  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split('@')[0];

  return 'Utente Nova';
}

function getUserAvatar(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata || {};
  const avatar = metadata.avatar_url || metadata.picture;

  return typeof avatar === 'string' && avatar.trim() ? avatar : null;
}

function makeUniqueSlug(title: string) {
  const base = slugify(title);
  const suffix = Date.now().toString(36).slice(-5);

  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
    }

    const slug = makeUniqueSlug(parsed.data.title);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        call: {
          title: parsed.data.title,
          description: parsed.data.description,
          slug,
          call_type: parsed.data.call_type,
          access_type: parsed.data.access_type,
          status: 'live',
          pulse_score: 12,
          participants: 1,
          host_id: null,
          host_name: 'Utente Nova',
          host_avatar: null,
          created_at: new Date().toISOString(),
        },
      });
    }

    const supabase = createRouteSupabase();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Devi effettuare il login per aprire una Call.' }, { status: 401 });
    }

    const user = session.user;

    const { data: call, error } = await (supabase as any)
      .from('calls')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        slug,
        call_type: parsed.data.call_type,
        access_type: parsed.data.access_type,
        status: 'live',
        pulse_score: 12,
        participants: 1,
        host_id: user.id,
        host_name: getUserName(user),
        host_avatar: getUserAvatar(user),
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
