# SLINK Telegram App

Storefront mobile-first per Slinklab, sviluppato come progetto separato dal sito Shopify esistente.

## Milestone corrente

La Milestone 1 contiene soltanto:

- Next.js con App Router;
- TypeScript in modalità strict;
- Tailwind CSS;
- ESLint;
- una home page minimale con i testi “Slinklab” e “Mini Shop”.

Shopify e Telegram non sono ancora integrati.

## Requisiti

- Node.js 20.9 o successivo;
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

## Verifiche

```bash
npm run lint
npm run build
```

Le variabili disponibili per le milestone future sono documentate in `.env.example`. Non inserire credenziali reali nei file versionati.
