# Demo-02 — Campagna ridotta mock

## Esperienza

La demo 02 apre un percorso ridotto del palazzo: sei capitoli e ventiquattro stanze principali. Non sostituisce la vertical slice `demo-1`; la affianca come esplorazione dei contenuti e della navigazione in una sessione più breve. Le sei stanze segrete restano nei contenuti ma sono disattivate dal docente (`teacher.secretRooms: false`): non compaiono, non contano nel punteggio e non bloccano la progressione. Il futuro pannello docente potrà riattivarle senza modificare il codice.

URL previsto su GitHub Pages: `https://coachgodzup.github.io/palazzo_derivate/demo-2/`.

- Cesura narrativa: la stanza del viaggiatore introduce il significato della derivata; seguono fontane, ingranaggi, biblioteca, specchi e Camera del Tempo. Bazar e osservatorio escono dal percorso per contenere la durata della demo; esponenziali, logaritmi e trigonometria restano presenti nelle stanze degli specchi e della Camera del Tempo.
- Navigazione per capitoli: il capitolo successivo si sblocca completando tutte le stanze principali del precedente.
- Le stanze principali di un capitolo si possono affrontare in ordine libero. Quando il docente riattiva le segrete, la stanza segreta si sblocca completando tutte le principali.
- Le stanze segrete non sono necessarie per proseguire né per il completamento della campagna.

## Verifica mock

La demo è interamente statica: non chiama FastAPI e non usa SymPy.

- L'input usa MathLive e invia `getValue("ascii-math")` come nella demo 1. Il dialogo enigma replica il modello HTML della demo 1: la funzione è un `<math-field id="function-field" read-only>` alimentato da `functionLatex` (non un testo semplice), la risposta è un secondo `<math-field>` libero e la tastiera virtuale è quella delle derivate (stesse funzioni e costanti della demo 1, condivisa con la demo 3). Quando la stanza è risolta, la risposta e il pulsante di verifica restano disattivati.
- `demo-2/verify.ts` normalizza la risposta, interpreta un sottoinsieme controllato di espressioni (`x`, numeri, `+ - * / ^`, parentesi, `sqrt`, `sin`, `cos`, `tan`, `ln`, `log`, `exp`, `e`, `pi`) e confronta la risposta con la derivata attesa su punti campione.
- Sono accettate forme equivalenti non semplificate; il confronto non è una verifica simbolica robusta come SymPy e va presentato come mock.
- Una sintassi incompleta produce `syntax_error`; funzioni o simboli fuori dal sottoinsieme producono `unsupported_expression`.
- Punteggio per stanza: 50 primo tentativo, 25 senza indizi, 15 senza errori, 10 entro il tempo indicativo.
- Progresso, punteggio, indizi e stato del capitolo sono salvati in `localStorage` con la versione `demo-2.1`; il cambio di versione azzera i progressi della campagna precedente.
- Indizi progressivi, massimo tre per stanza, e nessun blocco dovuto a errori o punteggio.

## Contenuti

- Sorgente unica dei contenuti: `demo-2/campaign.json`.
- Campi principali per stanza: `id`, `name`, `functionSympy`, `functionLatex`, `derivativeSympy`, `functionDisplay`, `prompt`, `rule`, `difficulty`, `targetSeconds`, `secret`, `hints`.
- Configurazione docente in `campaign.teacher`: `secretRooms` abilita le stanze segrete. In demo resta `false`.
- Tema colori: `demo-2/theme.css` applica la palette Retro 82 (`docs/design/style.md`) a interfaccia, selezione del testo e tastiera MathLive. È importabile da altre pagine.
- Le derivate attese sono state validate con SymPy in fase di redazione; la verifica a runtime resta quella mock descritta sopra.
- I testi sono in italiano e vivono nel file di campagna perché questa demo è un prototipo separato dal catalogo i18n della demo 1.

## Build e pubblicazione

```bash
npm run build
```

Il comando esegue il type-check, il build della demo 1 in `dist/` e il build della demo 2 in `dist/demo-2/` tramite `vite.demo2.config.ts`. Il workflow `deploy-pages.yml` pubblica l'intera cartella `dist`, quindi la nuova pagina compare sotto `/demo-2/` senza modificare l'indirizzo della demo 1.

In sviluppo: `npm run dev:demo2`, con pagina su `http://localhost:5174`.

## Fuori scope

Verifica SymPy reale, account e classi, dashboard docente, sessione di gioco con codice, statistiche online, audio procedurale, asset esterni, medaglie definitive e percorso applicativo I Segreti del Tempo.

## Revisione

1. Aprire la pagina su desktop e a 390×844 px.
2. Completare le quattro stanze del capitolo 0 e verificare il dialogo «Meccanismo riattivato», il punteggio e lo sblocco del capitolo 1.
3. Provare una risposta corretta in forma non semplificata, una errata e una sintassi incompleta.
4. Verificare indizi progressivi, punteggio e ripresa dopo reload.
5. Verificare che la sezione delle stanze segrete sia assente, che non incida sul punteggio e che il pannello di fine campagna compaia dopo le 24 stanze principali.
