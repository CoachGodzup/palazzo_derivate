# Il Palazzo delle Derivate — Istruzioni per agenti

## Obiettivo

Escape room didattica per studenti della scuola superiore. La matematica deve produrre conseguenze visibili nel mondo di gioco: non trasformare la stanza in un eserciziario con una cornice fantasy.

La milestone corrente è la **vertical slice demo-1**: ingresso, una stanza, tre derivate progressive, verifica simbolica, reazioni dei meccanismi, porta finale, indizi, punteggio e ripresa locale. Non ampliare il perimetro con account, classi, dashboard o campagna completa senza richiesta esplicita.

## Fonti e precedenza

1. `docs/DEMO_SCOPE.md`: perimetro operativo e criteri di accettazione correnti.
2. `transcript_architecture_requirements.md`: vincoli tecnici decisi (Phaser 3, MathLive sopra il canvas, FastAPI, SymPy, mobile portrait, contenuti configurabili).
3. `Il_Palazzo_delle_Derivate_GDD_v1.1.md`: design aggiornato.
4. `Il_Palazzo_delle_Derivate_GDD_v1-1.pdf`: GDD v1.0, riferimento storico in caso di divergenze.

Se modifichi architettura, struttura, comandi, workflow o perimetro descritti qui o in `docs/DEMO_SCOPE.md`, aggiorna contestualmente la documentazione.

## Struttura

- `client/main.ts`: composizione dell'applicazione e coordinamento UI/API/stato/scena.
- `client/game/`: scena Phaser, animazioni e interazioni del mondo.
- `client/ui/`: dialoghi e componenti HTML, incluso MathLive.
- `client/state/`: progresso e persistenza locale.
- `client/types.ts`: contratti condivisi lato client.
- `content/demo.json`: unica sorgente dei contenuti della demo, comprese funzioni e indizi.
- `server/app/`: API FastAPI, validazione dei contenuti e motore simbolico.
- `server/tests/`: test API e matematici.
- `tests/`: test unitari TypeScript ed end-to-end Playwright.
- `docs/`: scope e guida di revisione.
- `.opencode/skills/`: workflow specialistici OpenCode.
- `.opencode/agent/`: subagenti specialistici:
  - `code-review.md`: code review (sola lettura, esegue lint e test);
  - `security.md`: revisione di sicurezza (sola lettura);
  - `css.md`: stile e responsive di `client/styles.css`;
  - `frontend.md`: TypeScript/Phaser/MathLive e test client;
  - `backend.md`: FastAPI/SymPy, parser con whitelist e test pytest;
  - `database.md`: guardiano del perimetro senza DB; supporto a un futuro Supabase di test.

MCP in `opencode.json`: `playwright` e `chrome-devtools` per il browser, `context7` per le documentazioni, `github` per repository e avvisi di sicurezza. Il server `supabase` è predisposto in sola lettura ma disabilitato finché non esiste un progetto di test (`project_ref`).

MathLive rimane un elemento HTML nel `dialog`, mai disegnato dentro il canvas Phaser. La UI HTML replica le azioni essenziali del canvas per consentire uso da tastiera e touch.

## Avvio e verifica

Prerequisiti: Node 20.20+, Python 3.12 e `uv`.

```bash
npm install
UV_PROJECT_ENVIRONMENT=.venv uv sync --project server
npm run dev
```

Aprire `http://localhost:5173`; API su `http://localhost:8000`, documentazione OpenAPI su `/docs`.

```bash
npm run build
npm run lint
npm run format:check
npm run test:api
npm run test:unit
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium
npm run test:e2e
```

I test E2E avviano automaticamente i servizi se non sono già attivi. Non usare risposte preconfezionate nel client per farli passare: devono verificare il backend SymPy reale.

## Regole matematiche e di sicurezza

- La risposta resta libera; niente scelta multipla né selezione preventiva della regola.
- Il client invia MathLive `getValue("ascii-math")`; il LaTeX serve solo alla visualizzazione.
- Solo SymPy deriva la funzione originale e valuta l'equivalenza simbolica. Non confrontare stringhe e non usare soltanto campionamenti numerici.
- Usare esclusivamente il parser con whitelist in `server/app/symbolic.py`; nessun `eval`, namespace implicito o esecuzione di codice utente.
- Conservare i limiti di lunghezza, complessità ed esponenti. Errori sintattici, espressioni non supportate e risposte errate devono avere stati distinti.
- Non inventare diagnosi didattiche: il feedback specifico è ammesso solo per errori riconosciuti in modo affidabile.
- Non esporre `function_sympy` o `derivative_sympy` tramite `/api/demo`.

## Progressione e accessibilità

- Nessun game over e nessun blocco dovuto a punteggio o aiuti.
- L'ordine demo-1 è sequenziale: sigillo → ingranaggi → fontana.
- Gli indizi sono progressivi, facoltativi e registrati localmente; il punteggio non è una misura diretta dell'apprendimento.
- Persistenza in `localStorage` con versione contenuto; nessun dato personale.
- Target touch di almeno 44 px, focus visibile, messaggi testuali oltre al colore, dialoghi con focus nativo e supporto `prefers-reduced-motion`.
- Layout desktop e smartphone verticale sono entrambi criteri di accettazione.
- Scene e illustrazioni demo sono procedurali; non introdurre asset esterni senza verificarne licenza e resa responsive.

## Stile delle modifiche

TypeScript strict e Python tipizzato, moduli piccoli, dipendenze minime, copiare lo stile esistente. Non duplicare i dati degli enigmi nel client. Evitare framework UI e database finché non richiesti.

Dopo una modifica al gameplay verificare almeno: forma espansa, forma equivalente non semplificata, risposta errata, sintassi non valida, indizio registrato, ripresa dopo reload e apertura della porta. Eseguire build e test pertinenti prima della consegna.
