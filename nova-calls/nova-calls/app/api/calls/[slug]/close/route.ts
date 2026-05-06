import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public environment variables.');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
    }

    const supabasePublic = getSupabasePublic();

    const {
      data: { user },
      error: userError,
    } = await supabasePublic.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Sessione non valida.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: call, error: findError } = await supabase
      .from('calls')
      .select('id, slug, title, host_id, status')
      .eq('slug', params.slug)
      .maybeSingle();

    if (findError || !call) {
      return NextResponse.json({ error: 'Spunto non trovato.' }, { status: 404 });
    }

    if (call.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo l’host può chiudere lo Spunto.' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'closed',
      })
      .eq('id', call.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: existingOutcome } = await supabase
      .from('outcomes')
      .select('id')
      .eq('call_id', call.id)
      .maybeSingle();

    if (!existingOutcome) {
      await supabase.from('outcomes').insert({
        call_id: call.id,
        title: `Outcome · ${call.title}`,
        summary:
          'Outcome generato dopo chiusura anticipata dello Spunto. Completa la sintesi sulla pagina Outcome.',
        status: 'completed',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore durante la chiusura.',
      },
      { status: 500 }
    );
  }
}
