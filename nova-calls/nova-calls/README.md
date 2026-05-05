# NOVA Calls

App Next.js per NOVA: dashboard, apertura Call, stanza Call demo, Echo, Pulse, Outcome e login Supabase.

## Deploy

- Build command: `npm run build`
- Publish: gestito dal plugin Next.js Netlify
- Node: 20 consigliato

## Variabili ambiente su Netlify

In Netlify vai su **Site configuration → Environment variables** e aggiungi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://novacalls.netlify.app
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

La `SUPABASE_SERVICE_ROLE_KEY` è opzionale per il login, ma utile per API server protette. Non inserirla mai nel browser o in file pubblici.

## Supabase Auth

Nel progetto Supabase:

1. Vai su **Authentication → Providers**.
2. Abilita **Email**.
3. Se vuoi Google, abilita anche **Google** e configura Client ID / Secret.
4. Vai su **Authentication → URL Configuration**.
5. Imposta **Site URL**:

```text
https://novacalls.netlify.app
```

6. Aggiungi ai **Redirect URLs**:

```text
https://novacalls.netlify.app/auth/callback
http://localhost:3000/auth/callback
```

Se il sito Netlify ha un altro dominio, sostituisci `https://novacalls.netlify.app` con il tuo dominio reale.

## Flusso attuale

- `/login`: login, registrazione, Google OAuth, magic link.
- `/auth/callback`: callback Supabase per completare OAuth/magic link.
- `/dashboard`: mostra stato utente se autenticato.
- `/calls/new`: apertura Call con fallback locale.
- `/c/[slug]`: stanza Call demo con Echo, Pulse e Outcome.

## Aggiornamento profilo e navigazione

Questa versione sposta il punteggio Nova dentro la pagina personale `/profile`.

Funzioni aggiunte:

- pagina personale con immagine profilo, biografia, città, passioni e interessi;
- sfera profilo cliccabile in alto a destra con miniatura dell'immagine caricata;
- punteggio Nova personale che parte da zero e cresce con i contributi in Call;
- pagine funzionanti per Echo, Outcome, Persone, Spazi, Notifiche, Messaggi, Cerca e Salvati;
- nessuna funzione di follow o aggiunta persone: i profili sono solo visualizzabili;
- i pulsanti principali della Home portano a pagine coerenti o alla stanza Call.
