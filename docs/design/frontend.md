# Frontend — Design

Decisioni su composizione HTML/TypeScript, Phaser, MathLive e accessibilità. La verifica resta sul server; il client non conosce le soluzioni.

## Tastiera matematica

Stato: **implementato** in `client/ui/keyboard.ts`, configurato da `MathDialog`.

La tastiera virtuale MathLive è organizzata in due gruppi di tab:

1. **Derivate** (prima tab): layout essenziale dedicato agli enigmi demo-1. La prima riga raccoglie le funzioni `sin`, `cos`, `tan`, `ln`, `log`, `exp` e le costanti `e` e `π`, che inseriscono la funzione con parentesi e segnaposto già pronti. Il classico tastierino numerico resta raggruppato a destra (7–9, 4–6, 1–3, 0), mentre le operazioni formano un pannello a sinistra con `x`, potenza rapida `x^`, radice, parentesi, frazione, moltiplicazione, divisione, somma, sottrazione, frecce e backspace. Sono esclusi simboli non pertinenti alla derivazione dei polinomi e delle radici, come confronti, `n`, integrali e insiemi. Il pannello di modifica laterale di MathLive è disattivato per ridurre il rumore visivo.
2. **123** e le tab standard MathLive (simboli, lettere, greco): restano disponibili come tastiera completa di fallback, senza perdere funzioni già offerte.

Il tasto `x^` inserisce `x^{#?}`: l'esponente è già pronto e selezionato, quindi il giocatore deve digitare solo il valore. La tastiera fisica continua a funzionare e il valore inviato al server resta `getValue("ascii-math")`.

Il menu contestuale del campo MathLive è nascosto (`::part(menu-toggle)`): voci come «Insert Matrix» o «Change background» non servono agli enigmi e confondono l'inserimento. Restano disponibili la tastiera fisica e la tastiera matematica dedicata.

Vincoli invariati: MathLive resta un elemento HTML dentro il `dialog`, il focus resta nativo, i target touch non scendono sotto 44 px e il layout non introduce overflow sul portrait.

## Modello HTML degli input nelle demo statiche

Stato: **implementato** in demo-2 e demo-3, allineato alla demo 1.

- Il dialogo enigma mostra la funzione da derivare in un `<math-field id="function-field" read-only>`, alimentato con `functionLatex` dei contenuti: stessa resa tipografica della demo 1, nessun testo semplice.
- La risposta resta un secondo `<math-field id="answer-field">` con `virtual-keyboard-policy="auto"`; il valore inviato alla verifica locale è sempre `getValue("ascii-math")`.
- La tastiera delle derivate è una sola per le demo statiche (`demo-2/keyboard.ts`, importata da `demo-3/keyboard.ts`) e replica tasti e disposizione di `client/ui/keyboard.ts`: stesse funzioni (`sin`, `cos`, `tan`, `ln`, `log`, `exp`), costanti (`e`, `π`), potenza rapida e tastierino numerico. `tests/static-keyboard.test.ts` impedisce nuove divergenze.
- La tastiera è agganciata al `dialog` e il pulsante «Tastiera matematica» la mostra/nasconde riportando il focus sulla risposta.
- I campi secondari restano disattivati: la funzione è in sola lettura e, quando la stanza o il meccanismo è risolto, risposta e pulsante di verifica sono disabilitati.
- Lo stile Retro 82 copre anche gli input: bordo arancione sul focus, fondo `--r82-bg-darker`, selezione leggibile e tasti MathLive con la palette del tema (`demo-2/theme.css`, `demo-3/theme.css`).

## Internazionalizzazione

Stato: **implementato** per l'italiano, con altre lingue previste.

- Tutte le scritte del gioco vivono in `content/locales/it.json`: testi dell'interfaccia, dialoghi, etichette della scena, tastiera matematica, messaggi di verifica e testi degli enigmi. `content/demo.json` conserva soltanto id, meccanismi, funzioni, derivate attese, tempi e difficoltà.
- `client/i18n.ts` carica i cataloghi presenti in `content/locales/*.json`, espone `t(chiave, parametri)` e applica i testi agli elementi HTML annotati con `data-i18n`, `data-i18n-html` e `data-i18n-<attributo>` (per esempio `data-i18n-aria-label`).
- La lingua si sceglie nell'ordine `?lang=`, preferenza salvata in `localStorage` (`palazzo-lang`), lingua del browser, italiano. Una lingua senza catalogo ricade sull'italiano.
- Il backend riceve `lang` su `/api/demo` e sulla verifica, carica lo stesso catalogo e restituisce i messaggi già tradotti; le chiavi dei messaggi stanno nella sezione `feedback`. Il client invia `lang` insieme alla risposta matematica.
- Per aggiungere una lingua basta copiare `it.json`, tradurre i valori e salvarlo come `content/locales/<codice>.json`: client, server e build statica la riconoscono senza modifiche al codice. Finché una traduzione non esiste, resta attivo l'italiano.
- La build statica (`vite.config.ts`) compone `demo.json` pubblico unendo la struttura di `content/demo.json` e i testi del catalogo predefinito, senza esporre `function_sympy` o `derivative_sympy`.
- I testi italiani presenti in `index.html` sono solo un fallback di primo paint e senza JavaScript: a runtime il catalogo è la sorgente effettiva.

## Tema colori e leggibilità della selezione

Stato: **implementato** per la demo 2 in `demo-2/theme.css`.

- La demo 2 usa la palette **Retro 82** descritta in `docs/design/style.md`: sfondo `#05182e`, testo `#f6dcac`, accento arancione `#faa968`. Il file è autosufficiente e importabile da altre pagine: definisce i token `--r82-*`, rimappa le variabili storiche del progetto (`--gold`, `--teal`, `--muted`, `--line`) e configura MathLive.
- MathLive non distribuisce temi pronti: l'aspetto si controlla con le sue variabili CSS (`--keyboard-*`, `--keycap-*`, `--selection-*`, `--caret-color`). Il tema assegna alla tastiera virtuale fondo `mantle`, tasti `surface0`, tasto premuto blu con testo `crust`, così nessun tasto resta bianco su bianco.
- La selezione nel campo matematico usa il blu profondo Retro 82 (`#134e5a`) con testo crema; la selezione HTML condivisa segue la stessa regola. In precedenza il fondo di selezione predefinito era quasi bianco e il testo del campo chiaro, rendendo il testo evidenziato illeggibile.
- Le regole di contrasto valgono anche per hint, feedback, pulsanti e toast: verde/ciano Retro 82 per il successo, rosso per l'errore, arancio per i richiami.
