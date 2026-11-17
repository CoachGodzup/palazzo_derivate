# Demo-03 — Una stanza, quattro meccanismi

## Esperienza

La demo 03 mette in pratica lo stile grafico descritto in [`docs/design/style.md`](./design/style.md): una singola stanza (**La Corte delle Meridiane**) con uno sfondo statico desaturato e quattro meccanismi in overlay. Non sostituisce la vertical slice `demo-1` né la campagna `demo-2`; isola e dimostra il nuovo linguaggio visivo in una scena compiuta.

URL previsto su GitHub Pages: `https://coachgodzup.github.io/palazzo_derivate/demo-3/`.

Flusso: benvenuto → osservazione → quattro meccanismi (in ordine libero) → completamento → lo sfondo si anima.

## Stile grafico

- **Palette Retro 82** (https://omarchy.gallery/themes/retro-82): sfondo `#05182e`, testo `#f6dcac`, accento arancione `#faa968`, successo `#028391`, errore `#f85525`. Definiti in `demo-3/theme.css` e riportati in `docs/design/style.md`.
- **Sfondo desaturato**: la scena (SVG procedurale, nessun asset esterno) è in scala di grigi finché la stanza non è risolta (`filter: grayscale(1)`), poi recupera i colori.
- **Quattro meccanismi in overlay**, da sinistra a destra: ciascuno è composto da un elemento visivo (meccanismo) e un bottone che apre l'esercizio.
- **Animazione per meccanismo**: quando un meccanismo è risolto, il suo elemento visivo si anima in base al tipo (`sigil` → pulsa, `gear` → ruota, `fountain` → onda, `gate` → si apre).
- **Completamento**: quando tutti e quattro i meccanismi sono risolti, i meccanismi scivolano verso il basso e lo sfondo si anima (la fontana scorre, gli ingranaggi girano, il sigillo splende, la porta si illumina). Un **lampo di luce** attraversa la scena e compare un **riepilogo di completamento** a modale (punteggio `/ 400`, tentativi, indizi, tempo attivo). Con `prefers-reduced-motion` le animazioni si riducono a cambi di stato; lampo e riepilogo restano presenti.

## Verifica mock

La demo è interamente statica: non chiama FastAPI e non usa SymPy.

- L'input usa MathLive e invia `getValue("ascii-math")` come nelle demo precedenti. Il dialogo enigma riusa il modello HTML della demo 1: funzione in un `<math-field>` in sola lettura, risposta libera nel secondo campo, tastiera delle derivate condivisa con la demo 2 e campi disattivati quando il meccanismo è risolto.
- `demo-3/verify.ts` è identico a quello della demo 2: normalizza la risposta, interpreta un sottoinsieme controllato di espressioni e confronta la risposta con la derivata attesa su punti campione.
- Sono accettate forme equivalenti non semplificate; il confronto non è una verifica simbolica robusta e va presentato come mock.
- Punteggio per meccanismo: 50 primo tentativo, 25 senza indizi, 15 senza errori, 10 entro il tempo indicativo (massimo 100 × 4 = 400).
- Progresso, punteggio, indizi e stato sono salvati in `localStorage` con la versione `demo-3.0`.
- Indizi progressivi (massimo tre per meccanismo) e nessun blocco dovuto a errori o punteggio.

## Contenuti

- Sorgente unica dei contenuti: `demo-3/rooms.json`.
- Campi per meccanismo: `id`, `name`, `kind` (`sigil` | `gear` | `fountain` | `gate`), `icon`, `functionDisplay`, `functionSympy`, `functionLatex`, `derivativeSympy`, `prompt`, `rule`, `difficulty`, `targetSeconds`, `hints`.
- I quattro meccanismi: il sigillo solare (`3x²−5x+4`), gli ingranaggi gemelli (`(3x²−2)(x+1)`), la fontana del tempo (`3√x+2x^(3/2)`), la porta delle meridiane (`2x⁵−4x⁻²+3`).
- I testi sono in italiano e vivono nel file dei contenuti perché questa demo è un prototipo separato dal catalogo i18n della demo 1.

## Build e pubblicazione

```bash
npm run build
```

Il comando esegue il type-check, il build della demo 1 in `dist/`, della demo 2 in `dist/demo-2/` e della demo 3 in `dist/demo-3/` tramite `vite.demo3.config.ts`. Il workflow `deploy-pages.yml` pubblica l'intera cartella `dist`, quindi la nuova pagina compare sotto `/demo-3/`.

In sviluppo: `npm run dev:demo3`, con pagina su `http://localhost:5175`.

## Fuori scope

Verifica SymPy reale, account e classi, dashboard docente, sessione di gioco con codice, statistiche online, audio procedurale, asset esterni, campagna completa e percorso applicativo I Segreti del Tempo.

## Revisione

1. Aprire la pagina su desktop e a 390×844 px.
2. Verificare che lo sfondo sia desaturato da fermo e che i quattro meccanismi siano in overlay da sinistra a destra (2×2 su portrait).
3. Risolvere un meccanismo e verificare che il suo elemento visivo si animi.
4. Risolvere i quattro meccanismi e verificare che scivolino verso il basso, che lo sfondo si animi (fontana, ingranaggi, sigillo, porta) e che il lampo di luce sia evidente.
5. Verificare che, dopo il completamento, compaia il riepilogo a modale con punteggio, tentativi, indizi e tempo attivo, e che «Ammira la corte» lo chiuda e «Ricomincia la stanza» riporti la corte allo stato iniziale.
6. Provare una risposta corretta in forma non semplificata, una errata e una sintassi incompleta.
7. Verificare indizi progressivi, punteggio, ripresa dopo reload e reset.
8. Verificare che con `prefers-reduced-motion` le animazioni si riducano a cambi di stato, mentre il riepilogo di completamento resti leggibile.
