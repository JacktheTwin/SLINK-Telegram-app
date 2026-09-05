# SLINK Telegram App

Storefront mobile-first per SLINK, sviluppato come progetto separato dal sito Shopify esistente.

## Funzionalità corrente

Il progetto contiene:

- Next.js con App Router;
- TypeScript in modalità strict;
- Tailwind CSS;
- ESLint;
- Cloudflare Workers come target di deploy;
- una home mobile-first con una griglia di prodotti reali Shopify;
- immagini, disponibilità e prezzi Shopify con indicazione “Da” quando le
  varianti hanno prezzi diversi;
- prezzo barrato nel listing soltanto quando lo sconto riguarda tutte le
  varianti del prodotto;
- pagine prodotto dinamiche in `/products/[handle]`;
- selezione delle opzioni con risoluzione della variante Shopify corretta;
- disponibilità, prezzo e merchandise ID aggiornati in base alla variante scelta;
- carrello Shopify reale in `/cart` con aggiunta, aumento, diminuzione e rimozione;
- linee, quantità e totali sempre restituiti dalla Shopify Storefront Cart API;
- passaggio al checkout Shopify tramite il solo `cart.checkoutUrl` restituito
  dalla Storefront API;
- integrazione con l'API ufficiale Telegram WebApp, senza cambiare il
  comportamento nel browser normale.

La comunicazione Shopify è centralizzata in `lib/shopify` e usa GraphQL tramite
`fetch()`. L'accesso a Telegram WebApp è centralizzato in `lib/telegram.ts`.

## Carrello Shopify

Il carrello usa `cartCreate`, `cartLinesAdd`, `cartLinesUpdate` e
`cartLinesRemove`. Nel browser viene salvato in `localStorage` soltanto l'ID
completo del carrello; a ogni reload i contenuti vengono recuperati nuovamente
da Shopify. Un ID scaduto o non valido viene rimosso in modo sicuro.

## Checkout Shopify

Il pulsante Checkout verifica nuovamente il carrello tramite Shopify e apre
esclusivamente il suo `checkoutUrl`. Il frontend non ricostruisce né sostituisce
alcuna parte del checkout Shopify. Un carrello vuoto, un URL mancante o un errore
di rete vengono mostrati in modo leggibile; un lock condiviso impedisce invii
duplicati durante la preparazione asincrona del checkout.

## Telegram WebApp

Il client ufficiale `telegram-web-app.js` viene caricato dopo l'interfaccia tramite
`next/script`, così una risposta lenta di Telegram non blocca il browser normale.
Un initializer client chiama `Telegram.WebApp.ready()` soltanto
quando l'API identifica una piattaforma Telegram valida. Durante SSR, nei browser
normali o se l'API non è disponibile, il wrapper non esegue operazioni e
l'applicazione continua a funzionare normalmente. Il BackButton nativo rimane
nascosto nella home, è visibile nelle pagine prodotto e nel carrello e usa il
router Next.js per tornare indietro. Il relativo listener viene sempre rimosso
durante il cleanup. Il MainButton nativo mostra il totale Shopify e apre il
carrello dalla home oppure avvia il checkout dalla pagina carrello; rimane
nascosto con carrello vuoto e nelle pagine prodotto, dove resta disponibile il
normale pulsante “Aggiungi al carrello”. Durante le azioni asincrone viene
disabilitato e mostra lo stato di avanzamento. Nel browser normale viene mostrata
una CTA web equivalente. Registrazione, aggiornamento e cleanup dei pulsanti
Telegram rimangono centralizzati in `lib/telegram.ts`. Il layout usa le variabili
CSS ufficiali per safe area e content safe area su tutti i lati, con fallback alle
safe area del browser. Il MainButton usa il colore brand `#008892`.

## Esperienza e identità visiva

La Mini App mantiene l'identità SLINK attraverso palette teal, fotografia
Shopify, tipografia geometrica, card con raggi generosi e CTA compatte. La
navigazione evita header e footer da e-commerce tradizionale: usa top bar brevi,
gallery prodotto orizzontali con scroll snap, CTA al pollice e skeleton durante
le transizioni. I colori di testo, sfondo, superfici e separatori leggono le
variabili tema Telegram con fallback light/dark per il browser, mentre il teal
del brand rimane costante.

Gli asset ufficiali del marchio sono raccolti in `public/brand`: il logo
orizzontale è usato nelle top bar compatte e il simbolo dedicato come favicon.

Le URL `/products/[handle]` sono apribili direttamente. Dal bot Telegram si può
usare uno start parameter nel formato `product_<shopify-handle>`; la Mini App lo
converte nella route prodotto senza duplicare ID o dati Shopify. Collezioni e
campagne richiederanno route reali dedicate prima di poter ricevere deep link:
non vengono simulate con contenuti hardcoded.

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
npm run typecheck
npm run lint
npm run build
npm run build:vinext
```

La home mostra un messaggio leggibile se la configurazione manca, Shopify risponde
con un errore HTTP o la risposta contiene errori GraphQL.
