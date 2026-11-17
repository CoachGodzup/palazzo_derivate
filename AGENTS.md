# Le Mille e Una Derivata — Istruzioni per agenti

## Obiettivo

Escape room didattica per studenti della scuola superiore. La matematica deve produrre conseguenze visibili nel mondo di gioco: non trasformare la stanza in un eserciziario con una cornice fantasy.

La milestone corrente è la **vertical slice demo-1**: ingresso, una stanza, tre derivate progressive, verifica simbolica, reazioni dei meccanismi, porta finale, indizi, punteggio e ripresa locale. Non ampliare il perimetro con account, classi, dashboard o campagna completa senza richiesta esplicita.

## Fonti e precedenza

1. `docs/DEMO_SCOPE.md`: perimetro operativo e criteri di accettazione correnti della demo 1.
2. `docs/DEMO_2_SCOPE.md`: perimetro della demo 2 statica (campagna ridotta mock, verifica locale, pubblicazione su `/demo-2/`).
3. `docs/DEMO_3_SCOPE.md`: perimetro della demo 3 statica (una stanza, quattro meccanismi, stile grafico Retro 82 e sfondo che si anima; pubblicazione su `/demo-3/`).
4. `transcript_architecture_requirements.md`: vincoli tecnici decisi (Phaser 3, MathLive sopra il canvas, FastAPI, SymPy, mobile portrait, contenuti configurabili).
5. `Il_Palazzo_delle_Derivate_GDD_v1.1.md`: design aggiornato.
6. `Il_Palazzo_delle_Derivate_GDD_v1-1.pdf`: GDD v1.0, riferimento storico in caso di divergenze.

Se modifichi architettura, struttura, comandi, workflow o perimetro descritti qui o in `docs/DEMO_SCOPE.md`, aggiorna contestualmente la documentazione.

## Struttura

- `client/main.ts`: composizione dell'applicazione e coordinamento UI/API/stato/scena.
- `demo-2/`: demo statica della campagna ridotta (6 capitoli, 24 stanze principali; 6 stanze segrete presenti nei contenuti ma disattivate dal docente), con input MathLive, verifica mock locale e tema Retro 82 in `demo-2/theme.css`; build separata in `dist/demo-2/` tramite `vite.demo2.config.ts`.
- `demo-3/`: demo statica di una singola stanza (La Corte delle Meridiane) con sfondo desaturato che si anima e quattro meccanismi in overlay, tema Retro 82 in `demo-3/theme.css` e scena SVG procedurale; build separata in `dist/demo-3/` tramite `vite.demo3.config.ts`.
- `client/game/`: scena Phaser, animazioni e interazioni del mondo.
- `client/ui/`: dialoghi e componenti HTML, incluso MathLive.
- `client/state/`: progresso e persistenza locale.
- `client/types.ts`: contratti condivisi lato client.
- `content/demo.json`: sorgente dei dati non testuali della demo (id, meccanismi, funzioni, derivate attese, tempi, difficoltà).
- `content/locales/it.json`: sorgente unica di tutte le scritte del gioco (interfaccia, dialoghi, scena, feedback e testi degli enigmi). Per ora esiste solo l'italiano; le altre lingue useranno lo stesso schema con un nuovo file nella stessa cartella.
- `server/app/`: API FastAPI, validazione dei contenuti e motore simbolico.
- `server/tests/`: test API e matematici.
- `tests/`: test unitari TypeScript ed end-to-end Playwright.
- `docs/`: scope e guida di revisione; `docs/design/` raccoglie le decisioni di design (`frontend.md` per input e tastiera, `gameplay.md` per il feedback, `style.md` per la palette Retro 82, gli sfondi e gli overlay, `backend.md` per parser, verifica simbolica ed equivalenza delle risposte, `audio.md` per la musica procedurale, `testing.md` per la strategia locale/CI, `teacher-sessions.md` per accesso docente e sessioni di gioco — requisiti futuri post demo-1, `level-design.md` per il linguaggio visivo arabo-moresco × steampunk e il workflow asset/skybox/pavimenti della demo-4 Godot).
- `.github/workflows/ci.yml`: suite completa (lint, build, API, unit, E2E desktop + portrait) su push e pull request; `deploy-pages.yml` resta dedicato al deploy.
- `scripts/deploy-online.sh`: pubblica su GitHub Pages partendo da `main` (test, build, commit, push, attesa del workflow e verifica di `/`, `/demo-2/`, `/demo-3/`, `/demo-4/`).
- `.opencode/skills/`: workflow specialistici OpenCode (`palazzo-demo` per gameplay e verifica, `deploy-online` per pubblicare su GitHub Pages).
- `.opencode/agent/`: subagenti specialistici:
  - `code-review.md`: code review (sola lettura, esegue lint e test);
  - `security.md`: revisione di sicurezza (sola lettura);
  - `css.md`: stile e responsive di `client/styles.css`;
  - `frontend.md`: TypeScript/Phaser/MathLive e test client;
  - `backend.md`: FastAPI/SymPy, parser con whitelist e test pytest;
  - `database.md`: guardiano del perimetro senza DB; supporto a un futuro Supabase di test;
  - `level-designer.md`: level design della demo-4 Godot 3D — commistione arabo-moresco × steampunk, import/abbinamento asset, skybox, pavimenti e gradini.

MCP in `opencode.json`: `playwright` e `chrome-devtools` per il browser, `context7` per le documentazioni, `github` per repository e avvisi di sicurezza, `godot` per avviare/eseguire il progetto demo-4 e leggerne l'output, `release` per creare release GitHub (usa il token di `gh`). Il server `supabase` è predisposto in sola lettura ma disabilitato finché non esiste un progetto di test (`project_ref`).

MathLive rimane un elemento HTML nel `dialog`, mai disegnato dentro il canvas Phaser. La UI HTML replica le azioni essenziali del canvas per consentire uso da tastiera e touch.

## Avvio e verifica

Prerequisiti: Node 20.20+, Python 3.12 e `uv`.

```bash
npm install
UV_PROJECT_ENVIRONMENT=.venv uv sync --project server
npm run dev
```

Aprire `http://localhost:5173`; API su `http://localhost:8000`, documentazione OpenAPI su `/docs`. Per la sola demo 2 statica: `npm run dev:demo2`, pagina su `http://localhost:5174`.

```bash
npm run build
npm run lint
npm run format:check
npm run test:api
npm run test:unit
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium
npm run test:local      # API + unit + E2E smoke desktop
npm run test:e2e        # suite E2E completa, desktop + portrait
scripts/deploy-online.sh -m "feat: descrizione"  # pubblica su GitHub Pages
```

In locale si usa `npm run test:local` (API e unit completi, E2E smoke desktop); la suite E2E completa gira in CI su ogni push e pull request. Dettagli in `docs/design/testing.md`.

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

## Documentazione del design

Ogni modifica di design va registrata nel design document dell'area interessata, in `docs/design/` (`frontend.md`, `gameplay.md`, `backend.md`, ...). Se il documento non esiste, crealo e aggiungilo alla sezione `docs/` di questo file. Non lasciare decisioni di design solo nel codice o nei messaggi di commit.

## Stile delle modifiche

TypeScript strict e Python tipizzato, moduli piccoli, dipendenze minime, copiare lo stile esistente. Non duplicare i dati degli enigmi nel client. Evitare framework UI e database finché non richiesti.

Dopo una modifica al gameplay verificare almeno: forma espansa, forma equivalente non semplificata, risposta errata, sintassi non valida, indizio registrato, ripresa dopo reload e apertura della porta. Eseguire build e test pertinenti prima della consegna.
