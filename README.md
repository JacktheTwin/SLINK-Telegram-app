# SLINK Telegram App

Storefront mobile-first per Slinklab, sviluppato come progetto separato dal sito Shopify esistente.

## Funzionalità corrente

Il progetto contiene:

- Next.js con App Router;
- TypeScript in modalità strict;
- Tailwind CSS;
- ESLint;
- Cloudflare Workers come target di deploy;
- una home mobile-first con una griglia di prodotti reali Shopify;
- immagini, prezzi, prezzi di confronto e disponibilità dei prodotti;
- pagine prodotto dinamiche in `/products/[handle]`;
- selezione delle opzioni con risoluzione della variante Shopify corretta;
- disponibilità, prezzo e merchandise ID aggiornati in base alla variante scelta;
- carrello Shopify reale in `/cart` con aggiunta, aumento, diminuzione e rimozione;
- linee, quantità e totali sempre restituiti dalla Shopify Storefront Cart API;
- passaggio al checkout Shopify tramite il solo `cart.checkoutUrl` restituito
  dalla Storefront API.

La comunicazione Shopify è centralizzata in `lib/shopify` e usa GraphQL tramite
`fetch()`. Telegram non è ancora integrato.

## Carrello Shopify

Il carrello usa `cartCreate`, `cartLinesAdd`, `cartLinesUpdate` e
`cartLinesRemove`. Nel browser viene salvato in `localStorage` soltanto l'ID
completo del carrello; a ogni reload i contenuti vengono recuperati nuovamente
da Shopify. Un ID scaduto o non valido viene rimosso in modo sicuro.

## Checkout Shopify

Il pulsante Checkout verifica nuovamente il carrello tramite Shopify e apre
esclusivamente il suo `checkoutUrl`. Il frontend non ricostruisce né sostituisce
alcuna parte del checkout Shopify. Un carrello vuoto, un URL mancante o un errore
di rete vengono mostrati in modo leggibile; il pulsante impedisce invii duplicati.

## Configurazione Shopify

Crea o aggiorna `.env.local` nella root del progetto:

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=public_storefront_access_token_here
NEXT_PUBLIC_SHOPIFY_API_VERSION=2026-07
```

Il token deve essere un public Storefront access token. Non inserire valori reali
in `.env.example` o in altri file versionati.

## Cloudflare Workers

Il progetto è configurato per Cloudflare Workers tramite vinext. La configurazione
è centralizzata in `vite.config.ts` e `wrangler.jsonc`; non usa KV o Cloudflare
Images. Le credenziali locali sono documentate in `.env.example`:

```bash
CLOUDFLARE_ACCOUNT_ID=account_id_here
CLOUDFLARE_API_TOKEN=api_token_here
```

`CLOUDFLARE_API_TOKEN` è un segreto e deve rimanere soltanto in `.env.local`.
Il normale server Next.js continua a essere disponibile insieme al runtime
Cloudflare Workers.

Le dipendenze specifiche del deploy sono vinext, `@vinext/cloudflare`, Vite, il
plugin Vite di Cloudflare e Wrangler. Servono a trasformare l'applicazione
Next.js in un Worker eseguibile e a gestire preview e pubblicazione.

## Requisiti

- Node.js 22 o successivo;
- npm.

## Avvio locale

Installa le dipendenze:

```bash
npm install
```

Avvia il server di sviluppo:

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

Per usare il server vinext durante lo sviluppo:

```bash
npm run dev:vinext
```

Per verificare localmente l'output nel runtime Workers:

```bash
npm run build:vinext
npm run start:vinext
```

Il preview Workers è disponibile su [http://localhost:8787](http://localhost:8787).

## Deploy

Quando il progetto sarà pronto per la pubblicazione:

```bash
npm run deploy:vinext
```

Questo comando pubblica il Worker `slink-telegram-app`. L'applicazione è
attualmente disponibile su:

https://slink-telegram-app.delicate-brook-10e2.workers.dev

## Verifiche

```bash
npm run lint
npm run build
npm run build:vinext
```

La home mostra un messaggio leggibile se la configurazione manca, Shopify risponde
con un errore HTTP o la risposta contiene errori GraphQL.
