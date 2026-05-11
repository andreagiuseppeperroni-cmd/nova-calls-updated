# The Square — City Wall Update

Questa versione trasforma la Home in un social basato su città:

- `The Wall` locale per ogni città
- pubblicazione di testo, immagini e audio
- `Voice Wall`
- prime 50 città italiane precaricate in `lib/italian-cities.ts`
- pagine `/cities` e `/cities/[slug]`
- pagina `/my-square`
- schema Supabase per città, richieste città, ruoli, post e segnalazioni
- bucket Storage per immagini e audio

## Deploy

1. Carica questi file su GitHub.
2. Lancia il deploy Netlify.
3. In Supabase esegui:
   - `supabase/city-wall-schema.sql`
   - `supabase/storage-policies.sql`

## Nota

La Home salva i post pubblicati localmente in `localStorage` per anteprima immediata. Lo schema Supabase è già pronto per collegare il salvataggio reale dei post, immagini e audio.
