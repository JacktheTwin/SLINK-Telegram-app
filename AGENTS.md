# Istruzioni per gli agenti

Prima di modificare il progetto, leggere integralmente:

- `PROJECT_CONTEXT.md`;
- `AGENT_RULES.md`;
- `.env.example`.

## Regole operative

- Implementare una sola milestone alla volta e soltanto le funzionalità richieste.
- Preferire sempre la soluzione più semplice e leggibile, senza infrastruttura preventiva.
- Usare Next.js App Router, TypeScript strict, Tailwind CSS, npm ed ESLint.
- Non aggiungere dipendenze senza prima motivarne la necessità concreta.
- Non usare `any` né aggirare gli errori TypeScript.
- Non modificare il sito, il tema, Liquid o il checkout Shopify esistenti.
- Non introdurre database, backend Express, microservizi o sistemi alternativi per prodotti, ordini e checkout.
- Conservare Shopify come unica source of truth per prodotti, varianti, prezzi, disponibilità, carrello e checkout.
- Nelle milestone pertinenti, centralizzare Shopify in `lib/shopify` e Telegram in `lib/telegram`.
- Non inserire token o credenziali nel codice; mantenere `.env.example` privo di valori reali.
- Dopo ogni milestone eseguire `npm run lint` e `npm run build` e correggere ogni errore.
- Aggiornare `README.md` e riepilogare i file modificati e le verifiche eseguite.

## Ambito attuale

La Milestone 1 è soltanto lo scaffold minimale. Non aggiungere Shopify, Telegram, prodotti, carrello, autenticazione, database, checkout, component library o animazioni.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
