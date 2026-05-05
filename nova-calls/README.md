# Nova Calls

Base aggiornata per Nova: Home stile preview + Call interattiva + Echo + Pulse + Outcome.

## Cosa include

- Homepage ridisegnata ispirata al file `nova_moment_network_preview.html`.
- Composer funzionante: crea una Call e apre la stanza.
- Fallback locale con `localStorage`: il sito funziona anche senza Supabase configurato.
- Pagina Call `/c/[slug]` con:
  - ingresso nella Call;
  - chat simulata/interattiva;
  - reazioni;
  - Pulse dinamico;
  - Echo che cambia in base ai messaggi;
  - generazione Outcome.
- API `/api/calls` compatibile con Supabase, ma con fallback se le variabili ambiente mancano.

## Deploy Netlify

- Build command: `npm run build`
- Publish directory: `.next`
- Plugin: `@netlify/plugin-nextjs`

## Variabili ambiente opzionali

Il sito parte anche senza Supabase. Per salvare le Call nel database configura:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=LA_TUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=LA_TUA_SERVICE_ROLE_KEY
```

Le variabili LiveKit e OpenAI restano pronte per i prossimi step.
