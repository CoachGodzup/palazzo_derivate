# Testing — Design

Decisione: **subset rapido in locale, suite completa su GitHub Actions**.

## Perché

I test E2E Playwright avviano Chromium, Vite e FastAPI e saturano la macchina di sviluppo per minuti. La suite completa resta necessaria come cancello autorevole, ma non serve a ogni iterazione locale. La verifica locale privilegia il ciclo di feedback breve; GitHub Actions esegue tutta la matrice senza consumare risorse del PC.

## Locale — subset smoke

```bash
npm run test:local
```

Esegue:

1. `npm run test:api` — tutti i test API/SymPy;
2. `npm run test:unit` — tutti i test unitari TypeScript;
3. `npm run test:e2e:smoke` — solo il progetto `desktop-chromium` con i test taggati `@smoke`.

I test API e unitari costano poco e restano completi anche in locale. Il sottoinsieme E2E copre i percorsi critici del feedback e del flusso:

- errore, sintassi e indizio senza blocco, con shake e stato `is-error`;
- completamento della corte con forme equivalenti, stato `is-correct`, apertura della porta.

Comandi utili:

```bash
npm run test:e2e:smoke   # solo E2E smoke (desktop)
npm run test:e2e         # suite E2E completa, desktop + portrait
npm test                 # suite completa, come in CI
```

## GitHub Actions — suite completa

`.github/workflows/ci.yml` gira su `push` verso `main`, su ogni pull request e manualmente. Su `ubuntu-latest`:

1. installa Node 20, Python 3.12 e dipendenze (`npm ci`, `uv sync`);
2. esegue `npm run lint` e `npm run build`;
3. esegue `npm run test:api` e `npm run test:unit`;
4. installa Chromium con dipendenze di sistema;
5. esegue `npm run test:e2e` su entrambi i progetti (`desktop-chromium`, `portrait-chromium`);
6. carica `playwright-report/` e `test-results/` come artifact, anche in caso di fallimento.

Il workflow di deploy Pages resta separato e non esegue i test.

## Regole di manutenzione

- Il subset locale deve restare piccolo: al massimo tre test E2E, con obiettivo sotto i 30 secondi.
- I test `@smoke` sono i percorsi che rompono il gioco se falliscono (feedback, verifica simbolica, avanzamento, porta), non i controlli puramente visivi.
- Quando si aggiunge una modifica critica al gameplay, si tagga un solo test rappresentativo come `@smoke`; la copertura completa resta in CI.
- Se un test smoke diventa lento o instabile, si sposta l'ambito in CI invece di duplicarlo in locale.
- La suite completa in CI è la fonte di verità: un test verde in locale non sostituisce il risultato del workflow.
