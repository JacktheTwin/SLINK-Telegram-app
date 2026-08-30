1. Implementa una sola milestone alla volta.
2. Non aggiungere funzionalità non richieste.
3. Non installare una nuova dipendenza senza spiegare perché serve.
4. Usa Next.js App Router, TypeScript e Tailwind.
5. Usa Shopify Storefront API 2026-07.
6. Per GraphQL usa fetch(), salvo una necessità concreta e documentata.
7. Non creare un backend Express separato.
8. Non introdurre database.
9. Non duplicare prodotti, prezzi o stock fuori da Shopify.
10. Mantieni le chiamate Shopify centralizzate in lib/shopify.
11. Mantieni l'integrazione Telegram centralizzata in lib/telegram.
12. Dopo ogni milestone esegui lint e build.
13. Non dichiarare completata una milestone se la build fallisce.
14. Correggi errori TypeScript invece di usare "any" per aggirarli.
15. Mantieni .env.example aggiornato senza valori reali.
16. Non inserire token o credenziali direttamente nel codice.
17. Fai modifiche piccole e facilmente reversibili.
18. Prima di modificare una parte già funzionante, spiega perché è necessario.
19. Mantieni README.md aggiornato con istruzioni per avviare il progetto.
20. Alla fine di ogni milestone riassumi file creati/modificati e come testarli.
21. Slinklab è un e-commerce Shopify già esistente.
22. Non modificare il tema Shopify o Liquid salvo richiesta esplicita.
23. Non creare un nuovo database prodotti.
24. Non creare un nuovo sistema ordini.
25. Non creare un pannello amministrativo per prodotti o ordini.
26. Non duplicare prezzi o stock.
27. Non costruire un checkout alternativo a Shopify.
28. I dati mock possono essere usati solo temporaneamente per UI, mai come completamento di una milestone.
29. Una milestone sui dati è completata solo quando usa dati reali di Slinklab da Shopify.
30. Non hardcodare product ID, variant ID, prezzi o checkout URL.