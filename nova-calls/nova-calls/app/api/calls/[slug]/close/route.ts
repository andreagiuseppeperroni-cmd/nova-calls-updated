import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase-server';

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const supabase = createRouteSupabase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
    }

    const { data: call, error: findError } = await supabase
      .from('calls')
      .select('id, slug, title, host_id, status')
      .eq('slug', params.slug)
      .maybeSingle();

    if (findError || !call) {
      return NextResponse.json({ error: 'Spunto non trovato.' }, { status: 404 });
    }

    if (call.host_id !== session.user.id) {
      return NextResponse.json({ error: 'Solo l’host può chiudere lo Spunto.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('calls')
      .update({ status: 'closed' })
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
  } catch {
    return NextResponse.json({ error: 'Errore durante la chiusura.' }, { status: 500 });
  }
}
